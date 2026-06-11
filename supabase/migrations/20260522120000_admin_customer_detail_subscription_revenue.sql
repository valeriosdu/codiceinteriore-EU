-- Estende admin_customer_detail con due nuovi campi per gli incassi ricorrenti
-- da subscription Transiti:
--   - subscription_cycles_count: numero di cicli fatturati (= invoice pagate).
--   - subscription_revenue_cents: somma dei centesimi addebitati, derivata dal
--     prezzo della subscription associata a ciascun ciclo.
--
-- Filtro cicli subscription: transit_cycles.stripe_session_id segue il pattern
-- `sub_<subscription_id>__<epoch>` quando il ciclo nasce dal webhook subscription
-- (stripe-subscription-webhook), mentre i cicli da transits_addon usano la vera
-- session id Stripe (`cs_live_...` / `cs_test_...`). Filtro `LIKE 'sub\_%'`.
--
-- Mapping prezzo: split_part(substring(...)) estrae lo stripe_subscription_id
-- dal pattern e JOINa transit_subscriptions per leggere stripe_price_id, poi
-- CASE → centesimi. Il price ID e l'importo sono allineati a
-- supabase/functions/_shared/transit-products.ts. Se aggiungiamo un piano
-- annuale o un nuovo prezzo, aggiungere una WHEN qui.

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
    'subscription_cycles_count', coalesce((
      SELECT count(*)
      FROM public.transit_cycles tc
      WHERE tc.profile_id IN (
        SELECT id FROM public.profiles WHERE lower(email) = v_email_key
      )
        AND tc.stripe_session_id LIKE 'sub\_%' ESCAPE '\'
    ), 0),
    'subscription_revenue_cents', coalesce((
      SELECT sum(
        CASE ts.stripe_price_id
          WHEN 'price_1TWsVHGZqTxkp1nxYCC6Gt0Y' THEN 990   -- TRANSIT_SUBSCRIPTION_AMOUNT_CENTS
          ELSE 0
        END
      )
      FROM public.transit_cycles tc
      LEFT JOIN public.transit_subscriptions ts
        ON ts.stripe_subscription_id = split_part(substring(tc.stripe_session_id from 5), '__', 1)
      WHERE tc.profile_id IN (
        SELECT id FROM public.profiles WHERE lower(email) = v_email_key
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
  'Dettaglio singolo cliente per /admin/clienti/:email — include incassi ricorrenti subscription (subscription_cycles_count, subscription_revenue_cents) basati su transit_cycles con stripe_session_id LIKE sub_%.';
