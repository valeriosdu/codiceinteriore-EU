-- Merge clienti: unire due email che appartengono alla stessa persona.
--
-- Capita che lo stesso cliente compri con due email diverse (es. una con Stripe
-- e una con PayPal, o cambio email). Nel CRM /admin/clienti appaiono come due
-- righe separate, con report e pagamenti spezzati. Questa migration aggiunge un
-- meccanismo di fusione *reversibile*:
--
--   1. Tabella admin_customer_merges: mappa una email "secondaria" alla sua
--      "principale" + un log (moved_rows) delle righe di proprietà spostate, per
--      poter annullare.
--   2. Helper admin_primary_email / admin_member_emails: risolvono una email al
--      gruppo unito. Sono il punto unico in cui passa tutto il CRM.
--   3. Il fold a sola lettura lato admin: l'helper admin_quiz_sessions_for_email,
--      la view admin_customer_index e la RPC admin_customer_detail vengono
--      ridefinite per aggregare su tutto il gruppo. admin_customers_search NON
--      cambia: legge già la view (foldata) e chiama l'helper (che espande).
--   4. Lato cliente (login unico): la RLS su user_reports lascia vedere solo i
--      link del proprio profilo auth, quindi per far vedere tutti i report con
--      un solo login spostiamo i link di proprietà (user_reports,
--      user_entitlements, transit_cycles, transit_subscriptions) dal profilo
--      secondario a quello principale. Contenuto report, pagamenti e auth
--      restano intatti. Tutto loggato in moved_rows per l'undo.
--
-- Le funzioni di merge/unmerge sono SECURITY DEFINER e girano come owner
-- (bypassano la RLS); accessibili solo a service_role tramite la edge function
-- admin-merge-customers (gated da ADMIN_SECRET).
--
-- Idempotente dove possibile (CREATE OR REPLACE / IF NOT EXISTS). Le ridefinizioni
-- di helper/view/detail ripartono dalle versioni più recenti:
--   - admin_quiz_sessions_for_email, admin_customer_index → 20260521190000
--   - admin_customer_detail → 20260527200000
--   - admin_customers_search → 20260527200000 (NON toccata qui)

-- ============================================================================
-- 1. Tabella admin_customer_merges
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_customer_merges (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_email_key   text NOT NULL,
  secondary_email_key text NOT NULL UNIQUE,
  note                text,
  merged_by           text,
  moved_rows          jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_customer_merges_distinct CHECK (secondary_email_key <> primary_email_key)
);

CREATE INDEX IF NOT EXISTS idx_admin_customer_merges_primary
  ON public.admin_customer_merges (primary_email_key);

ALTER TABLE public.admin_customer_merges ENABLE ROW LEVEL SECURITY;
-- Nessuna policy pubblica: accessibile solo a service_role e al definer-owner.
REVOKE ALL ON public.admin_customer_merges FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_customer_merges TO service_role;

COMMENT ON TABLE public.admin_customer_merges IS
  'Fusione reversibile di due email dello stesso cliente. secondary_email_key → primary_email_key; moved_rows logga i link di proprietà spostati per l''undo.';

-- ============================================================================
-- 2. Helper: risoluzione email → gruppo unito
-- ============================================================================
-- admin_primary_email(x): se x è una secondaria, ritorna la sua principale;
-- altrimenti ritorna x. NON segue catene (la merge le vieta).

CREATE OR REPLACE FUNCTION public.admin_primary_email(p_email_key text)
RETURNS text
LANGUAGE sql
STABLE
PARALLEL SAFE
SET search_path = public, pg_catalog
AS $$
  SELECT coalesce(
    (SELECT m.primary_email_key
       FROM public.admin_customer_merges m
      WHERE m.secondary_email_key = p_email_key
      LIMIT 1),
    p_email_key
  );
$$;

REVOKE ALL ON FUNCTION public.admin_primary_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_primary_email(text) TO service_role;

-- admin_member_emails(x): tutte le email del gruppo a cui x appartiene
-- (principale + tutte le secondarie). Per una email non unita ritorna solo x.

CREATE OR REPLACE FUNCTION public.admin_member_emails(p_email_key text)
RETURNS SETOF text
LANGUAGE sql
STABLE
PARALLEL SAFE
SET search_path = public, pg_catalog
AS $$
  WITH pk AS (SELECT public.admin_primary_email(p_email_key) AS k)
  SELECT k FROM pk
  UNION
  SELECT m.secondary_email_key
    FROM public.admin_customer_merges m, pk
   WHERE m.primary_email_key = pk.k;
$$;

REVOKE ALL ON FUNCTION public.admin_member_emails(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_member_emails(text) TO service_role;

-- ============================================================================
-- 3. admin_quiz_sessions_for_email — espande sul gruppo unito
-- ============================================================================
-- Corpo a 4 rami della 20260521190000, con i predicati estesi da "= p_email_key"
-- a "= ANY(membri del gruppo)". Per email non unite il comportamento è identico.

CREATE OR REPLACE FUNCTION public.admin_quiz_sessions_for_email(p_email_key text)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
PARALLEL SAFE
SET search_path = public, pg_catalog
AS $$
  WITH members AS (SELECT array(SELECT public.admin_member_emails(p_email_key)) AS emails)
  SELECT cs.quiz_session_id
    FROM public.checkout_sessions cs, members
   WHERE lower(cs.customer_email) = ANY(members.emails)
     AND cs.quiz_session_id IS NOT NULL
  UNION
  SELECT cs.quiz_session_id
    FROM public.checkout_sessions cs
    JOIN public.profiles p ON p.id = cs.claimed_profile_id, members
   WHERE lower(p.email) = ANY(members.emails)
     AND cs.quiz_session_id IS NOT NULL
  UNION
  SELECT p.quiz_session_id
    FROM public.profiles p, members
   WHERE lower(p.email) = ANY(members.emails)
     AND p.quiz_session_id IS NOT NULL
  UNION
  SELECT ur.quiz_session_id
    FROM public.user_reports ur
    JOIN public.profiles p ON p.id = ur.profile_id, members
   WHERE lower(p.email) = ANY(members.emails);
$$;

-- ============================================================================
-- 4. View admin_customer_index — raggruppa sull'email principale
-- ============================================================================
-- Corpo della 20260521190000, con la sola differenza che la chiave di
-- raggruppamento è admin_primary_email(...): le email secondarie vengono
-- assorbite nella principale e non compaiono più come riga separata.

DROP VIEW IF EXISTS public.admin_customer_index;

CREATE VIEW public.admin_customer_index
WITH (security_invoker = true) AS
WITH
  profile_rollup AS (
    SELECT
      public.admin_primary_email(lower(p.email))      AS email_key,
      max(p.email)                                    AS display_email_p,
      max(p.created_at)                               AS last_seen_p,
      (array_agg(p.id ORDER BY
        (public.admin_primary_email(lower(p.email)) = lower(p.email)) DESC,
        p.created_at DESC))[1]                        AS profile_id
    FROM public.profiles p
    WHERE p.email IS NOT NULL
    GROUP BY public.admin_primary_email(lower(p.email))
  ),
  -- Email canonica del checkout: quella del profilo claimato (se presente),
  -- altrimenti la customer_email; poi risolta alla principale del gruppo.
  checkout_with_email AS (
    SELECT
      cs.*,
      public.admin_primary_email(coalesce(lower(p.email), lower(cs.customer_email))) AS email_key,
      coalesce(p.email, cs.customer_email)                                            AS display_email
    FROM public.checkout_sessions cs
    LEFT JOIN public.profiles p ON p.id = cs.claimed_profile_id
    WHERE coalesce(p.email, cs.customer_email) IS NOT NULL
  ),
  checkout_rollup AS (
    SELECT
      cwe.email_key,
      max(cwe.display_email)                                          AS display_email_c,
      max(coalesce(cwe.payment_completed_at, cwe.created_at))         AS last_seen_c,
      count(*) FILTER (WHERE cwe.payment_status = 'paid')             AS checkouts_paid_count,
      bool_or(cwe.payment_status = 'paid' AND cwe.claimed_profile_id IS NULL)
                                                                       AS has_orphan_checkout,
      coalesce(sum(cwe.amount_total) FILTER (WHERE cwe.payment_status = 'paid'), 0)
                                                                       AS lifetime_spend_cents
    FROM checkout_with_email cwe
    GROUP BY cwe.email_key
  )
SELECT
  coalesce(pr.email_key, cr.email_key)                            AS email_key,
  coalesce(pr.display_email_p, cr.display_email_c)                AS display_email,
  greatest(
    coalesce(pr.last_seen_p, '-infinity'::timestamptz),
    coalesce(cr.last_seen_c, '-infinity'::timestamptz)
  )                                                                AS last_activity_at,
  (pr.profile_id IS NOT NULL)                                      AS has_profile,
  pr.profile_id                                                    AS profile_id,
  coalesce(cr.checkouts_paid_count, 0)                             AS checkouts_paid_count,
  coalesce(cr.has_orphan_checkout, false)                          AS has_orphan_checkout,
  coalesce(cr.lifetime_spend_cents, 0)                             AS lifetime_spend_cents
FROM profile_rollup pr
FULL OUTER JOIN checkout_rollup cr USING (email_key);

REVOKE ALL ON public.admin_customer_index FROM PUBLIC;
GRANT SELECT ON public.admin_customer_index TO service_role;

COMMENT ON VIEW public.admin_customer_index IS
  'Rollup per email (profiles + checkout_sessions), raggruppato sull''email principale del gruppo unito (admin_customer_merges).';

-- ============================================================================
-- 5. admin_customer_detail — aggrega su tutto il gruppo unito
-- ============================================================================
-- Corpo della 20260527200000 (synastry + subscription revenue), con i predicati
-- "= v_email_key" estesi a "= ANY(v_members)" e aggiunta del campo merged_emails.

CREATE OR REPLACE FUNCTION public.admin_customer_detail(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_email_key   text   := nullif(trim(lower(coalesce(p_email, ''))), '');
  v_primary_key text;
  v_members     text[];
  v_result      jsonb;
BEGIN
  IF v_email_key IS NULL THEN
    RAISE EXCEPTION 'Missing email' USING ERRCODE = '22023';
  END IF;

  -- Risolvi prima l'email di pagamento (PayPal etc.) al profilo, poi il gruppo.
  v_email_key   := public.resolve_email_key(v_email_key);
  v_primary_key := public.admin_primary_email(v_email_key);
  v_members     := array(SELECT public.admin_member_emails(v_email_key));

  SELECT jsonb_build_object(
    'email',         v_primary_key,
    'merged_emails', to_jsonb(array(
      SELECT m.secondary_email_key
        FROM public.admin_customer_merges m
       WHERE m.primary_email_key = v_primary_key
       ORDER BY m.secondary_email_key
    )),
    'display_email', coalesce(
      (SELECT email FROM public.profiles
        WHERE lower(email) = v_primary_key
        ORDER BY created_at DESC LIMIT 1),
      (SELECT customer_email FROM public.checkout_sessions
        WHERE lower(customer_email) = ANY(v_members)
        ORDER BY created_at DESC LIMIT 1)
    ),
    'profile', (
      SELECT to_jsonb(p)
      FROM (
        SELECT id, user_id, email, quiz_session_id, stripe_session_id,
               created_at, updated_at
        FROM public.profiles
        WHERE lower(email) = v_primary_key
        ORDER BY created_at DESC
        LIMIT 1
      ) p
    ),
    'quiz_sessions', coalesce((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id',                qs.id,
          'user_name',         qs.user_name,
          'birth_place',       qs.birth_place,
          'birth_date',        qs.birth_date,
          'birth_time',        qs.birth_time,
          'birth_lat',         qs.birth_lat,
          'birth_lng',         qs.birth_lng,
          'focus_area',        qs.focus_area,
          'funnel_slug',       qs.funnel_slug,
          'processing_status', qs.processing_status,
          'processing_error',  qs.processing_error,
          'report_attempts',   qs.report_attempts,
          'has_full_report',   qs.full_report IS NOT NULL,
          'has_natal_chart',   qs.natal_chart IS NOT NULL,
          'created_at',        qs.created_at
        )
        ORDER BY qs.created_at DESC
      )
      FROM public.quiz_sessions qs
      WHERE qs.id IN (SELECT public.admin_quiz_sessions_for_email(v_primary_key))
    ), '[]'::jsonb),
    'synastry_sessions', coalesce((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id',                ss.id,
          'person_a_name',     ss.person_a_name,
          'person_b_name',     ss.person_b_name,
          'archetype',         ss.archetype,
          'archetype_label',   ss.archetype_label,
          'score_overall',     ss.score_overall,
          'scores',            ss.scores,
          'processing_status', ss.processing_status,
          'processing_error',  ss.processing_error,
          'has_full_report',   ss.full_report IS NOT NULL,
          'has_synastry_data', ss.synastry_data IS NOT NULL,
          'created_at',        ss.created_at
        )
        ORDER BY ss.created_at DESC
      )
      FROM public.synastry_sessions ss
      WHERE ss.id IN (
        SELECT DISTINCT cs.synastry_session_id
        FROM public.checkout_sessions cs
        WHERE lower(cs.customer_email) = ANY(v_members)
          AND cs.synastry_session_id IS NOT NULL
      )
    ), '[]'::jsonb),
    'checkouts', coalesce((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id',                     cs.id,
          'stripe_session_id',      cs.stripe_session_id,
          'customer_email',         cs.customer_email,
          'payment_provider',       cs.payment_provider,
          'payment_status',         cs.payment_status,
          'payment_completed_at',   cs.payment_completed_at,
          'amount_total',           cs.amount_total,
          'currency',               cs.currency,
          'product_code',           cs.product_code,
          'purchase_type',          cs.purchase_type,
          'includes_transits',      cs.includes_transits,
          'transit_months',         cs.transit_months,
          'quiz_session_id',        cs.quiz_session_id,
          'synastry_session_id',    cs.synastry_session_id,
          'claimed_profile_id',     cs.claimed_profile_id,
          'claimed_at',             cs.claimed_at,
          'recovery_invited_at',    cs.recovery_invited_at,
          'recovery_invite_count',  cs.recovery_invite_count,
          'created_at',             cs.created_at,
          'is_orphan',              cs.payment_status = 'paid' AND cs.claimed_profile_id IS NULL
        )
        ORDER BY cs.created_at DESC
      )
      FROM public.checkout_sessions cs
      LEFT JOIN public.profiles p_claim ON p_claim.id = cs.claimed_profile_id
      WHERE lower(cs.customer_email) = ANY(v_members)
         OR lower(p_claim.email)     = ANY(v_members)
    ), '[]'::jsonb),
    'transit_cycles', coalesce((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id',                     tc.id,
          'profile_id',             tc.profile_id,
          'quiz_session_id',        tc.quiz_session_id,
          'entitlement_id',         tc.entitlement_id,
          'period_start',           tc.period_start,
          'period_end',             tc.period_end,
          'status',                 tc.status,
          'fetch_status',           tc.fetch_status,
          'interpretation_status',  tc.interpretation_status,
          'processing_error',       tc.processing_error,
          'retry_count',            tc.retry_count,
          'snapshot_count',         tc.snapshot_count,
          'created_at',             tc.created_at,
          'updated_at',             tc.updated_at
        )
        ORDER BY tc.period_start DESC NULLS LAST
      )
      FROM public.transit_cycles tc
      WHERE tc.profile_id IN (
        SELECT id FROM public.profiles WHERE lower(email) = ANY(v_members)
      )
    ), '[]'::jsonb),
    'transit_subscription', (
      SELECT to_jsonb(s)
      FROM (
        SELECT id, profile_id, quiz_session_id, status, stripe_customer_id,
               stripe_subscription_id, stripe_price_id, current_period_start,
               current_period_end, cancel_at_period_end, canceled_at,
               created_at, updated_at
        FROM public.transit_subscriptions
        WHERE profile_id IN (
          SELECT id FROM public.profiles WHERE lower(email) = ANY(v_members)
        )
        ORDER BY
          CASE WHEN status IN ('active', 'trialing', 'past_due') THEN 0 ELSE 1 END,
          created_at DESC
        LIMIT 1
      ) s
    ),
    'subscription_cycles_count', coalesce((
      SELECT count(*)
      FROM public.transit_cycles tc
      WHERE tc.profile_id IN (
        SELECT id FROM public.profiles WHERE lower(email) = ANY(v_members)
      )
        AND tc.stripe_session_id LIKE 'sub\_%' ESCAPE '\'
    ), 0),
    'subscription_revenue_cents', coalesce((
      SELECT sum(
        CASE ts.stripe_price_id
          WHEN 'price_1TWsVHGZqTxkp1nxYCC6Gt0Y' THEN 990
          ELSE 0
        END
      )
      FROM public.transit_cycles tc
      LEFT JOIN public.transit_subscriptions ts
        ON ts.stripe_subscription_id = split_part(substring(tc.stripe_session_id from 5), '__', 1)
      WHERE tc.profile_id IN (
        SELECT id FROM public.profiles WHERE lower(email) = ANY(v_members)
      )
        AND tc.stripe_session_id LIKE 'sub\_%' ESCAPE '\'
    ), 0),
    'feedback', coalesce((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id',              rf.id,
          'profile_id',      rf.profile_id,
          'quiz_session_id', rf.quiz_session_id,
          'rating',          rf.rating,
          'reasons',         rf.reasons,
          'comment',         rf.comment,
          'source',          rf.source,
          'created_at',      rf.created_at,
          'updated_at',      rf.updated_at
        )
        ORDER BY rf.created_at DESC
      )
      FROM public.report_feedback rf
      WHERE rf.profile_id IN (
        SELECT id FROM public.profiles WHERE lower(email) = ANY(v_members)
      )
    ), '[]'::jsonb),
    'contacts_log', (
      SELECT jsonb_build_object(
        'count',     (SELECT count(*)        FROM public.contact_submissions WHERE lower(email) = ANY(v_members)),
        'latest_at', (SELECT max(created_at) FROM public.contact_submissions WHERE lower(email) = ANY(v_members)),
        'items',     coalesce(
          (SELECT jsonb_agg(
              jsonb_build_object(
                'id',         id,
                'email',      email,
                'name',       name,
                'reason',     reason,
                'message',    message,
                'created_at', created_at
              )
              ORDER BY created_at DESC
            )
            FROM (
              SELECT id, email, name, reason, message, created_at
              FROM public.contact_submissions
              WHERE lower(email) = ANY(v_members)
              ORDER BY created_at DESC
              LIMIT 10
            ) latest
          ),
          '[]'::jsonb
        )
      )
    )
  )
  INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_customer_detail(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_customer_detail(text) TO service_role;

COMMENT ON FUNCTION public.admin_customer_detail IS
  'Dettaglio cliente, aggregato su tutto il gruppo di email unite (admin_customer_merges). Aggiunge merged_emails.';

-- ============================================================================
-- 6. admin_merge_customers — fonde secondary in primary (reversibile)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_merge_customers(
  p_primary   text,
  p_secondary text,
  p_note      text DEFAULT NULL,
  p_merged_by text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_primary   text := nullif(trim(lower(coalesce(p_primary, ''))), '');
  v_secondary text := nullif(trim(lower(coalesce(p_secondary, ''))), '');
  v_primary_profile_id uuid;
  v_sec_ids   uuid[];
  v_moved     jsonb := '{}'::jsonb;
  v_merge_id  uuid;
BEGIN
  IF v_primary IS NULL OR v_secondary IS NULL THEN
    RAISE EXCEPTION 'Email principale e secondaria obbligatorie' USING ERRCODE = '22023';
  END IF;
  IF v_primary = v_secondary THEN
    RAISE EXCEPTION 'Le due email coincidono' USING ERRCODE = '22023';
  END IF;

  -- Niente catene: la secondaria non deve essere già unita, né essere a sua
  -- volta una principale; la principale non deve essere una secondaria altrove.
  IF EXISTS (SELECT 1 FROM public.admin_customer_merges WHERE secondary_email_key = v_secondary) THEN
    RAISE EXCEPTION 'L''email % è già unita ad un altro cliente', v_secondary USING ERRCODE = '23505';
  END IF;
  IF EXISTS (SELECT 1 FROM public.admin_customer_merges WHERE primary_email_key = v_secondary) THEN
    RAISE EXCEPTION 'L''email % è già principale di un gruppo: scegliela come principale', v_secondary USING ERRCODE = '23505';
  END IF;
  IF EXISTS (SELECT 1 FROM public.admin_customer_merges WHERE secondary_email_key = v_primary) THEN
    RAISE EXCEPTION 'L''email principale % è già secondaria di un altro cliente', v_primary USING ERRCODE = '23505';
  END IF;

  SELECT id INTO v_primary_profile_id
  FROM public.profiles WHERE lower(email) = v_primary
  ORDER BY created_at DESC LIMIT 1;

  SELECT array_agg(id) INTO v_sec_ids
  FROM public.profiles WHERE lower(email) = v_secondary;

  -- Repoint dei link di proprietà solo se esistono sia un profilo principale sia
  -- profili secondari. Senza profilo principale (es. secondaria che è solo
  -- orfano) restiamo all'alias a sola lettura.
  IF v_primary_profile_id IS NOT NULL AND v_sec_ids IS NOT NULL THEN
    -- user_reports: salta quelli in conflitto sull'unique (profile_id, quiz_session_id).
    WITH movable AS (
      SELECT ur.id, ur.profile_id AS original_profile_id, ur.is_active AS original_is_active
      FROM public.user_reports ur
      WHERE ur.profile_id = ANY(v_sec_ids)
        AND ur.quiz_session_id NOT IN (
          SELECT quiz_session_id FROM public.user_reports WHERE profile_id = v_primary_profile_id
        )
    )
    SELECT jsonb_set(v_moved, '{user_reports}', coalesce(jsonb_agg(
             jsonb_build_object('id', id,
                                'original_profile_id', original_profile_id,
                                'original_is_active', original_is_active)), '[]'::jsonb))
    INTO v_moved FROM movable;

    UPDATE public.user_reports ur
    SET profile_id = v_primary_profile_id, is_active = false
    WHERE ur.id IN (
      SELECT (e->>'id')::uuid FROM jsonb_array_elements(v_moved->'user_reports') e
    );

    -- user_entitlements
    SELECT jsonb_set(v_moved, '{user_entitlements}', coalesce((
      SELECT jsonb_agg(jsonb_build_object('id', id, 'original_profile_id', profile_id))
      FROM public.user_entitlements WHERE profile_id = ANY(v_sec_ids)
    ), '[]'::jsonb)) INTO v_moved;
    UPDATE public.user_entitlements SET profile_id = v_primary_profile_id
    WHERE profile_id = ANY(v_sec_ids);

    -- transit_cycles
    SELECT jsonb_set(v_moved, '{transit_cycles}', coalesce((
      SELECT jsonb_agg(jsonb_build_object('id', id, 'original_profile_id', profile_id))
      FROM public.transit_cycles WHERE profile_id = ANY(v_sec_ids)
    ), '[]'::jsonb)) INTO v_moved;
    UPDATE public.transit_cycles SET profile_id = v_primary_profile_id
    WHERE profile_id = ANY(v_sec_ids);

    -- transit_subscriptions
    SELECT jsonb_set(v_moved, '{transit_subscriptions}', coalesce((
      SELECT jsonb_agg(jsonb_build_object('id', id, 'original_profile_id', profile_id))
      FROM public.transit_subscriptions WHERE profile_id = ANY(v_sec_ids)
    ), '[]'::jsonb)) INTO v_moved;
    UPDATE public.transit_subscriptions SET profile_id = v_primary_profile_id
    WHERE profile_id = ANY(v_sec_ids);
  END IF;

  INSERT INTO public.admin_customer_merges
    (primary_email_key, secondary_email_key, note, merged_by, moved_rows)
  VALUES (v_primary, v_secondary, p_note, p_merged_by, v_moved)
  RETURNING id INTO v_merge_id;

  RETURN jsonb_build_object(
    'ok', true,
    'merge_id', v_merge_id,
    'primary_email', v_primary,
    'secondary_email', v_secondary,
    'moved_rows', v_moved
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_merge_customers(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_merge_customers(text, text, text, text) TO service_role;

-- ============================================================================
-- 7. admin_unmerge_customer — annulla la fusione, ripristina i link
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_unmerge_customer(p_secondary text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_secondary text := nullif(trim(lower(coalesce(p_secondary, ''))), '');
  v_merge     public.admin_customer_merges%ROWTYPE;
BEGIN
  IF v_secondary IS NULL THEN
    RAISE EXCEPTION 'Email secondaria obbligatoria' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_merge FROM public.admin_customer_merges
  WHERE secondary_email_key = v_secondary;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nessuna fusione trovata per %', v_secondary USING ERRCODE = 'P0002';
  END IF;

  -- Ripristina ogni riga al suo profilo originale.
  UPDATE public.user_reports ur
  SET profile_id = (e->>'original_profile_id')::uuid,
      is_active  = (e->>'original_is_active')::boolean
  FROM jsonb_array_elements(coalesce(v_merge.moved_rows->'user_reports', '[]'::jsonb)) e
  WHERE ur.id = (e->>'id')::uuid;

  UPDATE public.user_entitlements ue
  SET profile_id = (e->>'original_profile_id')::uuid
  FROM jsonb_array_elements(coalesce(v_merge.moved_rows->'user_entitlements', '[]'::jsonb)) e
  WHERE ue.id = (e->>'id')::uuid;

  UPDATE public.transit_cycles tc
  SET profile_id = (e->>'original_profile_id')::uuid
  FROM jsonb_array_elements(coalesce(v_merge.moved_rows->'transit_cycles', '[]'::jsonb)) e
  WHERE tc.id = (e->>'id')::uuid;

  UPDATE public.transit_subscriptions ts
  SET profile_id = (e->>'original_profile_id')::uuid
  FROM jsonb_array_elements(coalesce(v_merge.moved_rows->'transit_subscriptions', '[]'::jsonb)) e
  WHERE ts.id = (e->>'id')::uuid;

  DELETE FROM public.admin_customer_merges WHERE id = v_merge.id;

  RETURN jsonb_build_object(
    'ok', true,
    'primary_email', v_merge.primary_email_key,
    'secondary_email', v_secondary
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_unmerge_customer(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_unmerge_customer(text) TO service_role;

-- ============================================================================
-- 8. Reload schema cache di PostgREST
-- ============================================================================

NOTIFY pgrst, 'reload schema';
