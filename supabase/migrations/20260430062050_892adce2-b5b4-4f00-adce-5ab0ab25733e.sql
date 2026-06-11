DO $$
DECLARE
  v_profile_id   uuid := 'c11abaf0-be31-41bb-b435-e8716240081b';
  v_quiz_session uuid := '085eed3c-e324-4975-bc58-d626eb685688';
  v_stripe_id    text := 'cs_live_a1GQd76mFaAkRu35xBmjtO5XaZ48Uex3dUYUpvV3gj9NAA7OV08pr9eCKS';
  v_paid_at      timestamptz := '2026-04-29 22:54:34+00';
  v_period_start date := '2026-04-29';
  v_period_end   date := '2026-05-29';
  v_local_dt     text := '2026-04-29T23:54';
  v_tz           text := '+01:00';
  v_entitlement_id uuid;
BEGIN
  INSERT INTO public.user_entitlements (
    profile_id, quiz_session_id, stripe_session_id,
    entitlement_type, status, starts_at, ends_at, source
  )
  VALUES (
    v_profile_id, v_quiz_session, v_stripe_id,
    'monthly_transits', 'active', v_paid_at, v_paid_at + interval '30 days',
    'transit_renewal'
  )
  ON CONFLICT (profile_id, stripe_session_id, entitlement_type)
  DO UPDATE SET
    quiz_session_id = EXCLUDED.quiz_session_id,
    status          = EXCLUDED.status,
    starts_at       = EXCLUDED.starts_at,
    ends_at         = EXCLUDED.ends_at,
    source          = EXCLUDED.source,
    updated_at      = now()
  RETURNING id INTO v_entitlement_id;

  INSERT INTO public.transit_cycles (
    profile_id, quiz_session_id, entitlement_id, stripe_session_id,
    period_start, period_end,
    premium_purchase_at, premium_purchase_local_datetime, premium_purchase_timezone,
    snapshot_count, snapshot_step_days,
    status, fetch_status, interpretation_status, processing_error
  )
  VALUES (
    v_profile_id, v_quiz_session, v_entitlement_id, v_stripe_id,
    v_period_start, v_period_end,
    v_paid_at, v_local_dt, v_tz,
    9, 3,
    'pending', 'pending', 'pending', NULL
  )
  ON CONFLICT (entitlement_id, period_start, period_end)
  DO NOTHING;

  UPDATE public.checkout_sessions
  SET claimed_profile_id = v_profile_id,
      claimed_at = COALESCE(claimed_at, now()),
      updated_at = now()
  WHERE stripe_session_id = v_stripe_id
    AND claimed_profile_id IS NULL;
END $$;
