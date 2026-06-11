-- =====================================================================
-- SECURITY FIX: lock down quiz_sessions + synastry_sessions RLS
--
-- Before this migration both tables had `USING (true)` SELECT (and
-- quiz_sessions also `USING (true)` UPDATE), so any client holding the
-- public anon key could read EVERY row (names, birth data, psychological
-- answers, natal charts, full LLM reports) and overwrite any quiz row.
--
-- The funnel before /activate is fully anonymous: there is no auth.uid()
-- yet, and these rows have no owner column at creation time. The browser's
-- only capability is the unguessable random UUID `id` it gets back when it
-- creates the session (kept in localStorage). We turn that UUID into an
-- *enforced* capability:
--
--   * Anonymous funnel create/read now goes through SECURITY DEFINER RPCs
--     that REQUIRE the session UUID and return only the funnel-needed
--     columns (no llm_input/llm_output, no raw birth answers, and for
--     quiz no full_report). An attacker can no longer dump the table —
--     they would need each row's exact UUID.
--   * Authenticated owners (post-/activate) keep direct table reads via
--     owner-scoped policies, so the report / admin-adjacent pages and the
--     PostgREST embedded joins (user_reports -> quiz_sessions, etc.) keep
--     working unchanged.
--   * Edge functions use the service role, which bypasses RLS — the report
--     pipeline writes are unaffected.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Supporting indexes for the ownership checks below
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_quiz_session_id
  ON public.profiles (quiz_session_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_quiz_session_id
  ON public.user_reports (quiz_session_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_synastry_session_id
  ON public.checkout_sessions (synastry_session_id);

-- =====================================================================
-- QUIZ SESSIONS
-- =====================================================================

-- Ownership helper. SECURITY DEFINER so the nested reads of profiles /
-- user_reports are not themselves re-filtered by RLS; auth.uid() still
-- resolves to the calling user inside a SECURITY DEFINER function.
CREATE OR REPLACE FUNCTION public.user_owns_quiz_session(p_session_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.quiz_session_id = p_session_id
  ) OR EXISTS (
    SELECT 1 FROM public.user_reports ur
    JOIN public.profiles p ON p.id = ur.profile_id
    WHERE ur.quiz_session_id = p_session_id
      AND p.user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.user_owns_quiz_session(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_owns_quiz_session(uuid) TO authenticated;

-- Anonymous capability read: requires the session UUID, returns only the
-- columns the funnel actually needs (no full_report, no llm_*, no raw
-- birth answers).
CREATE OR REPLACE FUNCTION public.get_quiz_session_public(p_session_id uuid)
RETURNS TABLE (
  id uuid,
  user_name text,
  processing_status text,
  teaser_insights jsonb,
  natal_chart jsonb,
  natal_chart_svg text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT qs.id, qs.user_name, qs.processing_status,
         qs.teaser_insights, qs.natal_chart, qs.natal_chart_svg
  FROM public.quiz_sessions qs
  WHERE qs.id = p_session_id;
$$;

REVOKE ALL ON FUNCTION public.get_quiz_session_public(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_quiz_session_public(uuid) TO anon, authenticated;

-- Anonymous capability create: inserts a whitelisted set of columns and
-- returns the new id. Replaces the old anon INSERT + .select('id').
CREATE OR REPLACE FUNCTION public.create_quiz_session(p_payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.quiz_sessions (
    user_name,
    birth_date,
    birth_time,
    birth_place,
    birth_lat,
    birth_lng,
    birth_timezone,
    birth_timezone_iana,
    processing_status,
    funnel_slug,
    quiz_answers,
    attachment_response,
    focus_area
  ) VALUES (
    p_payload->>'user_name',
    p_payload->'birth_date',
    p_payload->'birth_time',
    p_payload->>'birth_place',
    (p_payload->>'birth_lat')::double precision,
    (p_payload->>'birth_lng')::double precision,
    (p_payload->>'birth_timezone')::double precision,
    p_payload->>'birth_timezone_iana',
    COALESCE(p_payload->>'processing_status', 'pending'),
    COALESCE(p_payload->>'funnel_slug', 'classica'),
    COALESCE(p_payload->'quiz_answers', '{}'::jsonb),
    p_payload->>'attachment_response',
    p_payload->>'focus_area'
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_quiz_session(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_quiz_session(jsonb) TO anon, authenticated;

-- Replace the broad policies.
DROP POLICY IF EXISTS "Allow public insert" ON public.quiz_sessions;
DROP POLICY IF EXISTS "Allow public select" ON public.quiz_sessions;
DROP POLICY IF EXISTS "Allow public update" ON public.quiz_sessions;

CREATE POLICY "Owners can read their quiz session"
  ON public.quiz_sessions
  FOR SELECT
  TO authenticated
  USING (public.user_owns_quiz_session(id));

CREATE POLICY "Owners can update their quiz session"
  ON public.quiz_sessions
  FOR UPDATE
  TO authenticated
  USING (public.user_owns_quiz_session(id))
  WITH CHECK (public.user_owns_quiz_session(id));

-- =====================================================================
-- SYNASTRY SESSIONS
-- =====================================================================

-- Ownership for synastry runs through a paid checkout row that links the
-- synastry session to the buyer's profile (by claimed_profile_id) or to
-- their email (PayPal cross-email case), mirroring checkout_sessions RLS.
CREATE OR REPLACE FUNCTION public.user_owns_synastry_session(p_session_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.checkout_sessions cs
    JOIN public.profiles p
      ON (p.id = cs.claimed_profile_id
          OR lower(p.email) = lower(cs.customer_email))
    WHERE cs.synastry_session_id = p_session_id
      AND cs.payment_status = 'paid'
      AND p.user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.user_owns_synastry_session(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_owns_synastry_session(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_synastry_session_public(p_session_id uuid)
RETURNS TABLE (
  id uuid,
  processing_status text,
  processing_error text,
  archetype text,
  archetype_label text,
  score_overall numeric,
  scores jsonb,
  teaser_highlight jsonb,
  bi_wheel_svg text,
  full_report jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT ss.id, ss.processing_status, ss.processing_error,
         ss.archetype, ss.archetype_label, ss.score_overall,
         ss.scores, ss.teaser_highlight, ss.bi_wheel_svg, ss.full_report
  FROM public.synastry_sessions ss
  WHERE ss.id = p_session_id;
$$;

REVOKE ALL ON FUNCTION public.get_synastry_session_public(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_synastry_session_public(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_synastry_session(p_payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.synastry_sessions (
    funnel_slug,
    processing_status,
    client_name,
    focus_relational,
    relationship_duration,
    person_a_name,
    person_a_birth_date,
    person_a_birth_time,
    person_a_time_known,
    person_a_birth_place,
    person_a_birth_lat,
    person_a_birth_lng,
    person_a_birth_timezone,
    person_a_birth_timezone_iana,
    person_b_name,
    person_b_birth_date,
    person_b_birth_time,
    person_b_time_known,
    person_b_birth_place,
    person_b_birth_lat,
    person_b_birth_lng,
    person_b_birth_timezone,
    person_b_birth_timezone_iana
  ) VALUES (
    COALESCE(p_payload->>'funnel_slug', 'coppia'),
    COALESCE(p_payload->>'processing_status', 'pending'),
    p_payload->>'client_name',
    p_payload->>'focus_relational',
    p_payload->>'relationship_duration',
    p_payload->>'person_a_name',
    p_payload->'person_a_birth_date',
    p_payload->'person_a_birth_time',
    COALESCE((p_payload->>'person_a_time_known')::boolean, true),
    p_payload->>'person_a_birth_place',
    (p_payload->>'person_a_birth_lat')::double precision,
    (p_payload->>'person_a_birth_lng')::double precision,
    (p_payload->>'person_a_birth_timezone')::double precision,
    p_payload->>'person_a_birth_timezone_iana',
    p_payload->>'person_b_name',
    p_payload->'person_b_birth_date',
    p_payload->'person_b_birth_time',
    COALESCE((p_payload->>'person_b_time_known')::boolean, true),
    p_payload->>'person_b_birth_place',
    (p_payload->>'person_b_birth_lat')::double precision,
    (p_payload->>'person_b_birth_lng')::double precision,
    (p_payload->>'person_b_birth_timezone')::double precision,
    p_payload->>'person_b_birth_timezone_iana'
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_synastry_session(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_synastry_session(jsonb) TO anon, authenticated;

-- Replace the broad SELECT/INSERT policies. The service_role UPDATE policy
-- ("Service role update synastry") is left untouched.
DROP POLICY IF EXISTS "Allow public insert synastry" ON public.synastry_sessions;
DROP POLICY IF EXISTS "Allow public select synastry" ON public.synastry_sessions;

CREATE POLICY "Owners can read their synastry session"
  ON public.synastry_sessions
  FOR SELECT
  TO authenticated
  USING (public.user_owns_synastry_session(id));
