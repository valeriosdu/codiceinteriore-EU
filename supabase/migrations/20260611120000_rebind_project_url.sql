-- Rebind di tutti i cron job e trigger pg_net al progetto Supabase corrente.
--
-- Contesto (migrazione da Lovable, 2026-06): le migration precedenti hanno
-- l'URL del vecchio progetto (bphmrjuvhcziimuxohnc.supabase.co) hardcoded nei
-- body dei cron e nelle funzioni trigger. Questa migration ricrea l'ULTIMA
-- versione di ciascun job/funzione leggendo l'URL dal Vault, così lo schema
-- è portabile su qualunque progetto.
--
-- BOOTSTRAP RICHIESTO (una volta sola, via SQL editor, PRIMA che i cron
-- producano effetti — la migration riesce comunque senza, ma i job falliranno
-- a runtime finché i secret non esistono):
--
--   SELECT vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
--   SELECT vault.create_secret('<service_role_key_JWT_legacy>', 'email_queue_service_role_key');
--   SELECT vault.create_secret('<ADMIN_SECRET>', 'admin_secret');
--
-- NB: usare la service role key in formato JWT legacy (eyJ…), non sb_secret_…:
-- process-email-queue verifica i claim del JWT (role=service_role).
--
-- Job ricreati qui (definizione = ultima versione in migration history):
--   process-email-queue          ogni 5 secondi  (mancava: era creato dal tooling Lovable)
--   retry-stuck-transit-cycles   * * * * *       (da 20260603120000)
--   invite-orphan-checkouts      0 * * * *       (da 20260514130000)
--   process-astrology-questions  */5 * * * *     (da 20260510131947)
--   recover-pending-reports      */10 * * * *    (da 20260514120000)
--   transit-renewal-reminder     0 9 * * *       (da 20260606173800)
-- I job cleanup-* (20260504100000) sono solo SQL locale e non vanno toccati.

-- ============================================================
-- Trigger functions con URL da vault
-- ============================================================

CREATE OR REPLACE FUNCTION public.trigger_contact_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  service_key TEXT;
  project_url TEXT;
  function_url TEXT;
BEGIN
  SELECT decrypted_secret INTO service_key
  FROM vault.decrypted_secrets
  WHERE name = 'email_queue_service_role_key'
  LIMIT 1;

  SELECT decrypted_secret INTO project_url
  FROM vault.decrypted_secrets
  WHERE name = 'project_url'
  LIMIT 1;

  IF service_key IS NULL OR project_url IS NULL THEN
    RAISE WARNING 'trigger_contact_notification: missing vault secret email_queue_service_role_key/project_url';
    RETURN NEW;
  END IF;

  function_url := project_url || '/functions/v1/notify-contact-submission';

  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object('submission_id', NEW.id),
    timeout_milliseconds := 5000
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never fail the user's submission if the notification dispatch fails.
  RAISE WARNING 'trigger_contact_notification failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_brevo_signup_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  service_key TEXT;
  project_url TEXT;
  function_url TEXT;
BEGIN
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RETURN NEW;
  END IF;

  SELECT decrypted_secret INTO service_key
  FROM vault.decrypted_secrets
  WHERE name = 'email_queue_service_role_key'
  LIMIT 1;

  SELECT decrypted_secret INTO project_url
  FROM vault.decrypted_secrets
  WHERE name = 'project_url'
  LIMIT 1;

  IF service_key IS NULL OR project_url IS NULL THEN
    RAISE WARNING 'trigger_brevo_signup_sync: missing vault secret email_queue_service_role_key/project_url';
    RETURN NEW;
  END IF;

  function_url := project_url || '/functions/v1/sync-brevo-contact';

  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object(
      'email', NEW.email,
      'eventType', 'signup',
      'attributes', jsonb_build_object()
    ),
    timeout_milliseconds := 5000
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'trigger_brevo_signup_sync failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- ============================================================
-- Cron jobs
-- ============================================================

DO $$
DECLARE
  v_job TEXT;
BEGIN
  FOREACH v_job IN ARRAY ARRAY[
    'process-email-queue',
    'retry-stuck-transit-cycles',
    'invite-orphan-checkouts',
    'process-astrology-questions',
    'recover-pending-reports',
    'transit-renewal-reminder'
  ] LOOP
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = v_job) THEN
      PERFORM cron.unschedule(v_job);
    END IF;
  END LOOP;
END $$;

-- Dispatcher della coda email (pgmq → process-email-queue). Era creato
-- dinamicamente dal tooling Lovable: ricreato qui in SQL statico.
-- Spara solo se non c'è cooldown rate-limit e c'è almeno un messaggio
-- visibile in una delle due code.
SELECT cron.schedule(
  'process-email-queue',
  '5 seconds',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/process-email-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name = 'email_queue_service_role_key'
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  )
  WHERE NOT EXISTS (
    SELECT 1 FROM public.email_send_state
    WHERE id = 1 AND retry_after_until IS NOT NULL AND retry_after_until > now()
  )
  AND (
    EXISTS (SELECT 1 FROM pgmq.q_auth_emails WHERE vt <= now() LIMIT 1)
    OR EXISTS (SELECT 1 FROM pgmq.q_transactional_emails WHERE vt <= now() LIMIT 1)
  );
  $$
);

-- Da 20260603120000_faster_transit_retry_cadence.sql (solo URL cambiato).
SELECT cron.schedule(
  'retry-stuck-transit-cycles',
  '* * * * *',
  $$
  WITH candidates AS (
    SELECT tc.id, tc.retry_count, tc.updated_at
    FROM public.transit_cycles tc
    JOIN public.user_entitlements ue ON ue.id = tc.entitlement_id
    WHERE tc.status IN ('failed', 'pending', 'processing')
      AND COALESCE(tc.retry_count, 0) < 6
      AND tc.updated_at < now() - (interval '1 minute' * COALESCE(tc.retry_count, 0))
      AND ue.entitlement_type = 'monthly_transits'
      AND ue.status = 'active'
      AND (ue.ends_at IS NULL OR ue.ends_at > now())
    ORDER BY tc.updated_at ASC
    LIMIT 10
  )
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/process-transit-cycle',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name = 'email_queue_service_role_key'
      )
    ),
    body := jsonb_build_object('transitCycleId', id),
    timeout_milliseconds := 5000
  )
  FROM candidates;
  $$
);

-- Da 20260514130000_orphan_invite_two_rounds.sql (solo URL cambiato).
SELECT cron.schedule(
  'invite-orphan-checkouts',
  '0 * * * *',
  $$
  WITH candidates AS (
    SELECT cs.stripe_session_id
    FROM public.checkout_sessions cs
    WHERE cs.payment_status = 'paid'
      AND cs.claimed_profile_id IS NULL
      AND cs.customer_email IS NOT NULL
      AND cs.recovery_invite_count < 2
      AND cs.payment_completed_at > now() - interval '30 days'
      AND (
        (cs.recovery_invite_count = 0
          AND cs.payment_completed_at < now() - interval '2 hours')
        OR
        (cs.recovery_invite_count = 1
          AND cs.recovery_invited_at IS NOT NULL
          AND cs.recovery_invited_at < now() - interval '7 days')
      )
    ORDER BY cs.payment_completed_at ASC
    LIMIT 20
  )
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/admin-recover-orphan-checkout',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name = 'email_queue_service_role_key'
      )
    ),
    body := jsonb_build_object(
      'stripeSessionId', stripe_session_id,
      'sendInvite', true
    ),
    timeout_milliseconds := 30000
  )
  FROM candidates;
  $$
);

-- Da 20260510131947 (astrology guide, solo URL cambiato).
SELECT cron.schedule(
  'process-astrology-questions',
  '*/5 * * * *',
  $cron$
  WITH candidates AS (
    SELECT id
    FROM public.astrology_guide_questions
    WHERE status = 'pending'
      AND created_at < now() - interval '1 minute'
      AND retry_count < 3
    UNION ALL
    SELECT id
    FROM public.astrology_guide_questions
    WHERE status = 'processing'
      AND updated_at < now() - interval '5 minutes'
      AND retry_count < 3
    UNION ALL
    SELECT id
    FROM public.astrology_guide_questions
    WHERE status = 'ready'
      AND scheduled_for <= now()
    ORDER BY 1
    LIMIT 20
  )
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/process-astrology-questions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name = 'email_queue_service_role_key'
      )
    ),
    body := jsonb_build_object('questionId', id),
    timeout_milliseconds := 5000
  )
  FROM candidates;
  $cron$
);

-- Da 20260514120000_recover_pending_reports_cron.sql (solo URL cambiato).
SELECT cron.schedule(
  'recover-pending-reports',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/recover-pending-reports',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name = 'email_queue_service_role_key'
      )
    ),
    body := jsonb_build_object('source', 'cron'),
    timeout_milliseconds := 30000
  );
  $$
);

-- Da 20260606173800 (reminder rinnovo transiti, solo URL cambiato).
SELECT cron.schedule(
  'transit-renewal-reminder',
  '0 9 * * *',
  $$
  WITH due AS (
    SELECT ts.stripe_subscription_id, ts.current_period_end, p.email, qs.user_name
    FROM public.transit_subscriptions ts
    JOIN public.profiles p ON p.id = ts.profile_id
    LEFT JOIN public.quiz_sessions qs ON qs.id = ts.quiz_session_id
    WHERE ts.status IN ('active', 'trialing')
      AND ts.cancel_at_period_end = false
      AND p.email IS NOT NULL
      AND ts.current_period_end::date = (now() + interval '1 day')::date
    LIMIT 200
  )
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/send-transactional-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name = 'email_queue_service_role_key'
      )
    ),
    body := jsonb_build_object(
      'templateName', 'transits-renewal-reminder',
      'recipientEmail', email,
      'idempotencyKey', 'transit-renewal-reminder-' || stripe_subscription_id || '-' || current_period_end::date,
      'templateData', jsonb_build_object('name', user_name, 'renewalDate', current_period_end)
    ),
    timeout_milliseconds := 5000
  )
  FROM due;
  $$
);

-- Avviso a fine migration se i secret di bootstrap non sono ancora nel vault.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'project_url') THEN
    RAISE WARNING 'Vault secret ''project_url'' mancante: i cron falliranno finché non viene creato (vedi header di questa migration).';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key') THEN
    RAISE WARNING 'Vault secret ''email_queue_service_role_key'' mancante: i cron falliranno finché non viene creato.';
  END IF;
END $$;
