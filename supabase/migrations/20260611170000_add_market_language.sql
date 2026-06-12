-- =====================================================================
-- MULTI-MARKET: language + market columns
--
-- `market` (unità business: dominio, azienda, account pagamenti) e
-- `language` (catalogo contenuti: prompt, email, PDF) sono concetti
-- separati: un futuro mercato es-MX riuserebbe la lingua `es`.
--
-- Default 'it': ogni code path non ancora market-aware produce contenuto
-- italiano, quindi il default garantisce che il tag corrisponda sempre al
-- contenuto generato. Il frontend passa il valore esplicito.
--
-- Le due RPC SECURITY DEFINER di creazione sessione (whitelist di colonne,
-- vedi 20260610120100_lockdown_session_rls.sql) vengono ri-dichiarate per
-- accettare i nuovi campi. I valori sono validati contro un'allowlist
-- DENTRO la funzione (selezionano prompt e config pagamenti a valle: mai
-- fidarsi del payload raw); un valore sconosciuto degrada a 'it'.
-- =====================================================================

ALTER TABLE public.quiz_sessions
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'it',
  ADD COLUMN IF NOT EXISTS market text NOT NULL DEFAULT 'it';

ALTER TABLE public.synastry_sessions
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'it',
  ADD COLUMN IF NOT EXISTS market text NOT NULL DEFAULT 'it';

ALTER TABLE public.checkout_sessions
  ADD COLUMN IF NOT EXISTS market text NOT NULL DEFAULT 'it';

ALTER TABLE public.transit_subscriptions
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'it',
  ADD COLUMN IF NOT EXISTS market text NOT NULL DEFAULT 'it';

-- ---------------------------------------------------------------------
-- create_quiz_session: identica alla versione in 20260610120100, con in
-- più language/market validati.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_quiz_session(p_payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_id uuid;
  v_language text := CASE
    WHEN p_payload->>'language' IN ('it', 'es') THEN p_payload->>'language'
    ELSE 'it'
  END;
  v_market text := CASE
    WHEN p_payload->>'market' IN ('it', 'es') THEN p_payload->>'market'
    ELSE 'it'
  END;
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
    focus_area,
    language,
    market
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
    p_payload->>'focus_area',
    v_language,
    v_market
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_quiz_session(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_quiz_session(jsonb) TO anon, authenticated;

-- ---------------------------------------------------------------------
-- create_synastry_session: identica alla versione in 20260610120100, con
-- in più language/market validati.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_synastry_session(p_payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_id uuid;
  v_language text := CASE
    WHEN p_payload->>'language' IN ('it', 'es') THEN p_payload->>'language'
    ELSE 'it'
  END;
  v_market text := CASE
    WHEN p_payload->>'market' IN ('it', 'es') THEN p_payload->>'market'
    ELSE 'it'
  END;
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
    person_b_birth_timezone_iana,
    language,
    market
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
    p_payload->>'person_b_birth_timezone_iana',
    v_language,
    v_market
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_synastry_session(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_synastry_session(jsonb) TO anon, authenticated;
