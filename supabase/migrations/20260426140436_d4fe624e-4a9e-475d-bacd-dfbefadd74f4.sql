-- Reconcile Katia Zorzenone's PayPal premium purchase (PayPal order 5VD04112ST5509636, capture 9GY33862JA861924X, 29 EUR).
-- All operations are idempotent and scoped to her records.

DO $$
DECLARE
  v_profile_id   uuid := '3d626b1d-5ecd-45f9-b94b-06177186c59e';
  v_quiz_id      uuid := '8fabc037-9206-4491-9519-9866f02e6741';
  v_pp_session   text := 'pp_5VD04112ST5509636';
  v_capture_id   text := '9GY33862JA861924X';
  v_completed_at timestamptz := '2026-04-26T13:47:40Z';
  v_email        text := 'katia.zorzenone@gmail.com';
  v_entitlement_id uuid;
  v_period_start date;
  v_period_end   date;
BEGIN
  -- 1. Reconcile checkout_sessions row.
  UPDATE public.checkout_sessions
  SET
    payment_status = 'paid',
    payment_completed_at = v_completed_at,
    payment_provider = 'paypal',
    provider_payment_id = v_capture_id,
    amount_total = 2900,
    currency = 'EUR',
    customer_email = v_email,
    purchase_type = 'premium',
    product_code = 'natal_report_plus_transits',
    includes_transits = true,
    transit_months = 1,
    quiz_session_id = v_quiz_id,
    claimed_profile_id = v_profile_id,
    claimed_at = COALESCE(claimed_at, now()),
    provider_metadata = jsonb_build_object(
      'environment', 'live',
      'paypal_order_id', '5VD04112ST5509636',
      'capture_id', v_capture_id,
      'capture_status', 'COMPLETED',
      'capture_create_time', '2026-04-26T13:47:40Z',
      'payer_email', v_email,
      'payer_name', 'Katia ZORZENONE',
      'payer_id', 'MRKRKWM8HU62A',
      'stage', 'reconciled_manual',
      'reconciliation_note', 'Backfilled from PayPal Orders API after buyer did not return to /success'
    ),
    updated_at = now()
  WHERE stripe_session_id = v_pp_session;

  -- 2. Link the profile to the paid PayPal session and quiz session.
  UPDATE public.profiles
  SET
    stripe_session_id = v_pp_session,
    quiz_session_id   = v_quiz_id,
    updated_at        = now()
  WHERE id = v_profile_id;

  -- 3. user_reports — active link for Katia's profile + her quiz session.
  INSERT INTO public.user_reports (
    profile_id, quiz_session_id, stripe_session_id, purchase_type, label, is_active
  ) VALUES (
    v_profile_id, v_quiz_id, v_pp_session, 'premium', 'Katia · Monza', true
  )
  ON CONFLICT (profile_id, quiz_session_id) DO UPDATE
  SET stripe_session_id = EXCLUDED.stripe_session_id,
      purchase_type     = EXCLUDED.purchase_type,
      label             = COALESCE(public.user_reports.label, EXCLUDED.label),
      is_active         = true,
      updated_at        = now();

  -- 4. user_entitlements — natal_report.
  INSERT INTO public.user_entitlements (
    profile_id, quiz_session_id, stripe_session_id,
    entitlement_type, status, starts_at, ends_at, source
  ) VALUES (
    v_profile_id, v_quiz_id, v_pp_session,
    'natal_report', 'active', v_completed_at, NULL, 'premium_purchase'
  )
  ON CONFLICT (profile_id, stripe_session_id, entitlement_type) DO UPDATE
  SET status     = 'active',
      starts_at  = LEAST(public.user_entitlements.starts_at, EXCLUDED.starts_at),
      source     = EXCLUDED.source,
      updated_at = now();

  -- 5. user_entitlements — monthly_transits (1 month).
  INSERT INTO public.user_entitlements (
    profile_id, quiz_session_id, stripe_session_id,
    entitlement_type, status, starts_at, ends_at, source
  ) VALUES (
    v_profile_id, v_quiz_id, v_pp_session,
    'monthly_transits', 'active', v_completed_at, v_completed_at + interval '1 month', 'premium_purchase'
  )
  ON CONFLICT (profile_id, stripe_session_id, entitlement_type) DO UPDATE
  SET status     = 'active',
      starts_at  = EXCLUDED.starts_at,
      ends_at    = EXCLUDED.ends_at,
      source     = EXCLUDED.source,
      updated_at = now()
  RETURNING id INTO v_entitlement_id;

  -- 6. Transit cycle row (used by process-transit-cycle).
  v_period_start := (v_completed_at AT TIME ZONE 'UTC')::date;
  v_period_end   := v_period_start + interval '1 month';

  INSERT INTO public.transit_cycles (
    profile_id, quiz_session_id, entitlement_id, stripe_session_id,
    period_start, period_end,
    premium_purchase_at, premium_purchase_local_datetime, premium_purchase_timezone,
    snapshot_count, snapshot_step_days,
    status, fetch_status, interpretation_status, processing_error
  ) VALUES (
    v_profile_id, v_quiz_id, v_entitlement_id, v_pp_session,
    v_period_start, v_period_end,
    v_completed_at, to_char(v_completed_at AT TIME ZONE 'UTC' + interval '1 hour', 'YYYY-MM-DD"T"HH24:MI'), '+01:00',
    9, 3,
    'pending', 'pending', 'pending', NULL
  )
  ON CONFLICT (entitlement_id, period_start, period_end) DO NOTHING;
END $$;