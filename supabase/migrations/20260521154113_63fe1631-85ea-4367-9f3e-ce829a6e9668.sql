-- Indice clienti per la nuova area /admin/clienti (Fase 1 del redesign admin).

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_profiles_email_lower
  ON public.profiles (lower(email));

CREATE INDEX IF NOT EXISTS idx_profiles_email_trgm
  ON public.profiles USING gin (lower(email) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_email_trgm
  ON public.checkout_sessions USING gin (lower(customer_email) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_name_trgm
  ON public.quiz_sessions USING gin (lower(user_name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_birth_place_trgm
  ON public.quiz_sessions USING gin (lower(birth_place) gin_trgm_ops);

CREATE OR REPLACE FUNCTION public.admin_quiz_sessions_for_email(p_email_key text)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
PARALLEL SAFE
SET search_path = public, pg_catalog
AS $$
  SELECT cs.quiz_session_id
    FROM public.checkout_sessions cs
   WHERE lower(cs.customer_email) = p_email_key
     AND cs.quiz_session_id IS NOT NULL
  UNION
  SELECT p.quiz_session_id
    FROM public.profiles p
   WHERE lower(p.email) = p_email_key
     AND p.quiz_session_id IS NOT NULL
  UNION
  SELECT ur.quiz_session_id
    FROM public.user_reports ur
    JOIN public.profiles p ON p.id = ur.profile_id
   WHERE lower(p.email) = p_email_key;
$$;

REVOKE ALL ON FUNCTION public.admin_quiz_sessions_for_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_quiz_sessions_for_email(text) TO service_role;

DROP VIEW IF EXISTS public.admin_customer_index;

CREATE VIEW public.admin_customer_index
WITH (security_invoker = true) AS
WITH
  profile_rollup AS (
    SELECT
      lower(p.email)                                  AS email_key,
      max(p.email)                                    AS display_email_p,
      max(p.created_at)                               AS last_seen_p,
      (array_agg(p.id ORDER BY p.created_at DESC))[1] AS profile_id
    FROM public.profiles p
    WHERE p.email IS NOT NULL
    GROUP BY lower(p.email)
  ),
  checkout_rollup AS (
    SELECT
      lower(cs.customer_email)                                          AS email_key,
      max(cs.customer_email)                                            AS display_email_c,
      max(coalesce(cs.payment_completed_at, cs.created_at))             AS last_seen_c,
      count(*) FILTER (WHERE cs.payment_status = 'paid')                AS checkouts_paid_count,
      bool_or(cs.payment_status = 'paid' AND cs.claimed_profile_id IS NULL)
                                                                        AS has_orphan_checkout,
      coalesce(sum(cs.amount_total) FILTER (WHERE cs.payment_status = 'paid'), 0)
                                                                        AS lifetime_spend_cents
    FROM public.checkout_sessions cs
    WHERE cs.customer_email IS NOT NULL
    GROUP BY lower(cs.customer_email)
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
  'Rollup per email (profiles + checkout_sessions). Letta dalla RPC admin_customers_search.';

DROP FUNCTION IF EXISTS public.admin_customers_search(text, text, text, integer, integer);

CREATE OR REPLACE FUNCTION public.admin_customers_search(
  p_q         text    DEFAULT NULL,
  p_filter    text    DEFAULT 'all',
  p_sort      text    DEFAULT 'last_activity',
  p_page      integer DEFAULT 1,
  p_page_size integer DEFAULT 50
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_page_size integer := least(greatest(coalesce(p_page_size, 50), 1), 200);
  v_offset    integer := (greatest(coalesce(p_page, 1), 1) - 1) * v_page_size;
  v_q         text    := nullif(trim(lower(coalesce(p_q, ''))), '');
  v_filter    text    := coalesce(p_filter, 'all');
  v_sort      text    := coalesce(p_sort, 'last_activity');
  v_total     integer;
  v_items     jsonb;
BEGIN
  WITH
    filtered AS MATERIALIZED (
      SELECT aci.*
      FROM public.admin_customer_index aci
      WHERE
        (
          v_q IS NULL
          OR aci.email_key ILIKE '%' || v_q || '%'
          OR EXISTS (
            SELECT 1
            FROM public.quiz_sessions qs
            WHERE qs.id IN (SELECT public.admin_quiz_sessions_for_email(aci.email_key))
              AND (qs.user_name ILIKE '%' || v_q || '%' OR qs.birth_place ILIKE '%' || v_q || '%')
          )
        )
        AND (
          v_filter = 'all'
          OR (v_filter = 'orphan'     AND aci.has_orphan_checkout)
          OR (v_filter = 'subscriber' AND aci.profile_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.transit_subscriptions ts
                WHERE ts.profile_id = aci.profile_id
                  AND ts.status IN ('active', 'trialing')
             ))
          OR (v_filter = 'error' AND EXISTS (
                SELECT 1
                FROM public.quiz_sessions qs
                WHERE qs.processing_status = 'error'
                  AND qs.id IN (SELECT public.admin_quiz_sessions_for_email(aci.email_key))
             ))
          OR (v_filter = 'no_report' AND NOT EXISTS (
                SELECT 1
                FROM public.quiz_sessions qs
                WHERE qs.full_report IS NOT NULL
                  AND qs.id IN (SELECT public.admin_quiz_sessions_for_email(aci.email_key))
             ))
        )
    ),
    paged AS (
      SELECT f.*
      FROM filtered f
      ORDER BY
        CASE WHEN v_sort = 'lifetime_spend' THEN f.lifetime_spend_cents END DESC NULLS LAST,
        CASE WHEN v_sort = 'last_activity'  THEN f.last_activity_at     END DESC NULLS LAST,
        f.email_key ASC
      OFFSET v_offset
      LIMIT  v_page_size
    ),
    enriched AS (
      SELECT
        p.*,
        qi.quiz_sessions_count,
        qi.has_error_report,
        qi.display_name,
        sub.is_subscriber
      FROM paged p
      LEFT JOIN LATERAL (
        SELECT
          count(*)                                                            AS quiz_sessions_count,
          bool_or(qs.processing_status = 'error')                             AS has_error_report,
          (array_agg(qs.user_name ORDER BY qs.created_at DESC)
             FILTER (WHERE qs.user_name IS NOT NULL))[1]                     AS display_name
        FROM public.quiz_sessions qs
        WHERE qs.id IN (SELECT public.admin_quiz_sessions_for_email(p.email_key))
      ) qi ON true
      LEFT JOIN LATERAL (
        SELECT EXISTS (
          SELECT 1 FROM public.transit_subscriptions ts
          WHERE p.profile_id IS NOT NULL
            AND ts.profile_id = p.profile_id
            AND ts.status IN ('active', 'trialing')
        ) AS is_subscriber
      ) sub ON true
    )
  SELECT
    (SELECT count(*) FROM filtered),
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'email',                e.email_key,
          'display_email',        e.display_email,
          'display_name',         e.display_name,
          'has_profile',          e.has_profile,
          'profile_id',           e.profile_id,
          'quiz_sessions_count',  coalesce(e.quiz_sessions_count, 0),
          'checkouts_paid_count', e.checkouts_paid_count,
          'has_orphan_checkout',  e.has_orphan_checkout,
          'has_error_report',     coalesce(e.has_error_report, false),
          'is_subscriber',        coalesce(e.is_subscriber, false),
          'last_activity_at',     e.last_activity_at,
          'lifetime_spend_cents', e.lifetime_spend_cents
        )
      ),
      '[]'::jsonb
    )
  INTO v_total, v_items
  FROM enriched e;

  RETURN jsonb_build_object(
    'total',     v_total,
    'page',      greatest(coalesce(p_page, 1), 1),
    'page_size', v_page_size,
    'customers', v_items
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_customers_search(text, text, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_customers_search(text, text, text, integer, integer) TO service_role;

COMMENT ON FUNCTION public.admin_customers_search IS
  'Pagina di clienti aggregati per email per /admin/clienti.';

DROP FUNCTION IF EXISTS public.admin_customer_detail(text);

CREATE OR REPLACE FUNCTION public.admin_customer_detail(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_email_key text := nullif(trim(lower(coalesce(p_email, ''))), '');
  v_result    jsonb;
BEGIN
  IF v_email_key IS NULL THEN
    RAISE EXCEPTION 'Missing email' USING ERRCODE = '22023';
  END IF;

  SELECT jsonb_build_object(
    'email',         v_email_key,
    'display_email', coalesce(
      (SELECT email FROM public.profiles
        WHERE lower(email) = v_email_key
        ORDER BY created_at DESC LIMIT 1),
      (SELECT customer_email FROM public.checkout_sessions
        WHERE lower(customer_email) = v_email_key
        ORDER BY created_at DESC LIMIT 1)
    ),
    'profile', (
      SELECT to_jsonb(p)
      FROM (
        SELECT id, user_id, email, quiz_session_id, stripe_session_id,
               created_at, updated_at
        FROM public.profiles
        WHERE lower(email) = v_email_key
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
      WHERE qs.id IN (SELECT public.admin_quiz_sessions_for_email(v_email_key))
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
      WHERE lower(cs.customer_email) = v_email_key
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
        SELECT id FROM public.profiles WHERE lower(email) = v_email_key
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
          SELECT id FROM public.profiles WHERE lower(email) = v_email_key
        )
        ORDER BY
          CASE WHEN status IN ('active', 'trialing', 'past_due') THEN 0 ELSE 1 END,
          created_at DESC
        LIMIT 1
      ) s
    ),
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
        SELECT id FROM public.profiles WHERE lower(email) = v_email_key
      )
    ), '[]'::jsonb),
    'contacts_log', (
      SELECT jsonb_build_object(
        'count',     (SELECT count(*)     FROM public.contact_submissions WHERE lower(email) = v_email_key),
        'latest_at', (SELECT max(created_at) FROM public.contact_submissions WHERE lower(email) = v_email_key),
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
              WHERE lower(email) = v_email_key
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
  'Dettaglio singolo cliente per /admin/clienti/:email — sostituisce gli ~8 round-trip dell''edge function originale.';
