DO $$
DECLARE
  v_email text := 'moscaiovanca07@gmail.com';
  v_stripe text := 'cs_live_a1P2SNIDenLKeT5RMWC5ht3uMyO4Y8h8NhTJrCXe81WAUHdBqZxvLZdGq8';
  v_quiz uuid := '8e538b8d-0a6a-47b4-9fb0-408a57d4954f';
  v_paid timestamptz := '2026-04-27 07:13:25+00';
  v_user_id uuid;
  v_profile_id uuid;
  v_natal_ent uuid;
  v_transit_ent uuid;
  v_cycle_id uuid;
  v_service_key text;
  v_label text;
BEGIN
  -- 1. Auth user (idempotente)
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = v_email LIMIT 1;
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      v_email, crypt(gen_random_uuid()::text, gen_salt('bf')),
      now(), now(), now(),
      jsonb_build_object('provider','email','providers',ARRAY['email']),
      '{}'::jsonb, '', '', '', ''
    );
  END IF;

  -- 2. Profile (il trigger handle_new_user dovrebbe averlo creato; fallback)
  SELECT id INTO v_profile_id FROM public.profiles WHERE user_id = v_user_id LIMIT 1;
  IF v_profile_id IS NULL THEN
    INSERT INTO public.profiles (user_id, email) VALUES (v_user_id, v_email)
    RETURNING id INTO v_profile_id;
  END IF;

  -- 3. Aggancia il checkout
  UPDATE public.checkout_sessions
  SET claimed_profile_id = v_profile_id,
      claimed_at = COALESCE(claimed_at, now())
  WHERE stripe_session_id = v_stripe;

  UPDATE public.profiles
  SET stripe_session_id = v_stripe, quiz_session_id = v_quiz
  WHERE id = v_profile_id;

  -- Label per user_reports
  SELECT COALESCE(NULLIF(trim(coalesce(user_name,'') || ' · ' || coalesce(birth_place,'')), '·'), 'Lettura personale')
    INTO v_label
  FROM public.quiz_sessions WHERE id = v_quiz;

  -- 4. user_reports
  INSERT INTO public.user_reports (profile_id, quiz_session_id, stripe_session_id, purchase_type, label, is_active)
  VALUES (v_profile_id, v_quiz, v_stripe, 'premium', v_label, true)
  ON CONFLICT (profile_id, quiz_session_id) DO UPDATE
    SET stripe_session_id = EXCLUDED.stripe_session_id,
        purchase_type = EXCLUDED.purchase_type,
        is_active = true,
        updated_at = now();

  -- 5. Entitlement natal_report
  INSERT INTO public.user_entitlements
    (profile_id, quiz_session_id, stripe_session_id, entitlement_type, status, starts_at, ends_at, source)
  VALUES (v_profile_id, v_quiz, v_stripe, 'natal_report', 'active', v_paid, NULL, 'premium_purchase')
  ON CONFLICT (profile_id, stripe_session_id, entitlement_type) DO UPDATE
    SET status = 'active', starts_at = EXCLUDED.starts_at, updated_at = now()
  RETURNING id INTO v_natal_ent;

  -- 6. Entitlement monthly_transits (1 mese)
  INSERT INTO public.user_entitlements
    (profile_id, quiz_session_id, stripe_session_id, entitlement_type, status, starts_at, ends_at, source)
  VALUES (v_profile_id, v_quiz, v_stripe, 'monthly_transits', 'active', v_paid, v_paid + INTERVAL '1 month', 'premium_purchase')
  ON CONFLICT (profile_id, stripe_session_id, entitlement_type) DO UPDATE
    SET status = 'active', starts_at = EXCLUDED.starts_at, ends_at = EXCLUDED.ends_at, updated_at = now()
  RETURNING id INTO v_transit_ent;

  -- 7. Transit cycle
  INSERT INTO public.transit_cycles (
    profile_id, quiz_session_id, entitlement_id, stripe_session_id,
    period_start, period_end,
    premium_purchase_at, premium_purchase_local_datetime, premium_purchase_timezone,
    snapshot_count, snapshot_step_days,
    status, fetch_status, interpretation_status, processing_error
  )
  SELECT v_profile_id, v_quiz, v_transit_ent, v_stripe,
         (v_paid AT TIME ZONE 'UTC' + INTERVAL '1 hour')::date,
         ((v_paid AT TIME ZONE 'UTC' + INTERVAL '1 hour') + INTERVAL '1 month')::date,
         v_paid,
         to_char(v_paid AT TIME ZONE 'UTC' + INTERVAL '1 hour', 'YYYY-MM-DD"T"HH24:MI'),
         '+01:00',
         9, 3,
         'pending', 'pending', 'pending', NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM public.transit_cycles WHERE entitlement_id = v_transit_ent
  )
  RETURNING id INTO v_cycle_id;

  IF v_cycle_id IS NULL THEN
    SELECT id INTO v_cycle_id FROM public.transit_cycles WHERE entitlement_id = v_transit_ent LIMIT 1;
  END IF;

  -- 8. Invoca generate-report e process-transit-cycle in background via pg_net
  SELECT decrypted_secret INTO v_service_key
  FROM vault.decrypted_secrets
  WHERE name = 'email_queue_service_role_key' LIMIT 1;

  IF v_service_key IS NOT NULL THEN
    PERFORM net.http_post(
      url := 'https://bphmrjuvhcziimuxohnc.supabase.co/functions/v1/generate-report',
      headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_service_key),
      body := jsonb_build_object('quizSessionId', v_quiz, 'email', v_email),
      timeout_milliseconds := 8000
    );
    IF v_cycle_id IS NOT NULL THEN
      PERFORM net.http_post(
        url := 'https://bphmrjuvhcziimuxohnc.supabase.co/functions/v1/process-transit-cycle',
        headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_service_key),
        body := jsonb_build_object('transitCycleId', v_cycle_id),
        timeout_milliseconds := 8000
      );
    END IF;
  ELSE
    RAISE WARNING 'recovery: missing vault secret email_queue_service_role_key — invoke generate-report & process-transit-cycle manually';
  END IF;

  RAISE NOTICE 'Recovered moscaiovanca07: profile=% natal_ent=% transit_ent=% cycle=%', v_profile_id, v_natal_ent, v_transit_ent, v_cycle_id;
END $$;