CREATE OR REPLACE FUNCTION public.admin_quiz_sessions_for_email(p_email_key text)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
PARALLEL SAFE
SET search_path = public, pg_catalog
AS $$
  SELECT s.qs
  FROM public.admin_member_emails(p_email_key) AS m(email)
  CROSS JOIN LATERAL (
    SELECT cs.quiz_session_id AS qs
      FROM public.checkout_sessions cs
     WHERE lower(cs.customer_email) = m.email
       AND cs.quiz_session_id IS NOT NULL
    UNION
    SELECT cs.quiz_session_id
      FROM public.checkout_sessions cs
      JOIN public.profiles p ON p.id = cs.claimed_profile_id
     WHERE lower(p.email) = m.email
       AND cs.quiz_session_id IS NOT NULL
    UNION
    SELECT p.quiz_session_id
      FROM public.profiles p
     WHERE lower(p.email) = m.email
       AND p.quiz_session_id IS NOT NULL
    UNION
    SELECT ur.quiz_session_id
      FROM public.user_reports ur
      JOIN public.profiles p ON p.id = ur.profile_id
     WHERE lower(p.email) = m.email
  ) s;
$$;

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
  checkout_with_email AS (
    SELECT
      cs.*,
      coalesce(lower(p.email), lower(cs.customer_email)) AS email_key,
      coalesce(p.email, cs.customer_email)               AS display_email
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
  ),
  base AS (
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
    FULL OUTER JOIN checkout_rollup cr USING (email_key)
  )
SELECT
  coalesce(m.primary_email_key, b.email_key)                          AS email_key,
  (array_agg(b.display_email ORDER BY (m.primary_email_key IS NULL) DESC)
     FILTER (WHERE b.display_email IS NOT NULL))[1]                   AS display_email,
  max(b.last_activity_at)                                             AS last_activity_at,
  bool_or(b.has_profile)                                              AS has_profile,
  (array_agg(b.profile_id ORDER BY (m.primary_email_key IS NULL) DESC, b.profile_id)
     FILTER (WHERE b.profile_id IS NOT NULL))[1]                      AS profile_id,
  sum(b.checkouts_paid_count)::bigint                                 AS checkouts_paid_count,
  bool_or(b.has_orphan_checkout)                                      AS has_orphan_checkout,
  sum(b.lifetime_spend_cents)::bigint                                 AS lifetime_spend_cents
FROM base b
LEFT JOIN public.admin_customer_merges m ON m.secondary_email_key = b.email_key
GROUP BY coalesce(m.primary_email_key, b.email_key);

REVOKE ALL ON public.admin_customer_index FROM PUBLIC;
GRANT SELECT ON public.admin_customer_index TO service_role;

COMMENT ON VIEW public.admin_customer_index IS
  'Rollup per email (profiles + checkout_sessions); le email unite (admin_customer_merges) sono fuse nella principale via LEFT JOIN set-based. Nessuna chiamata di funzione per-riga.';

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
  'Dettaglio cliente, aggregato sul gruppo di email unite (admin_customer_merges). Niente dipendenza da resolve_email_key.';

NOTIFY pgrst, 'reload schema';