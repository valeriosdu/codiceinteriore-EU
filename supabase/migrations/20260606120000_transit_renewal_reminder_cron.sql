-- Promemoria "soft" 1 giorno prima del rinnovo dell'abbonamento transiti.
--
-- Why: oggi non parte alcuna comunicazione prima dell'addebito ricorrente, e con
-- il trial di Phase 2 il primo addebito post-trial arriverebbe senza preavviso.
-- Questo job giornaliero seleziona gli abbonamenti che si rinnovano "domani" e
-- invia il template `transits-renewal-reminder` via send-transactional-email.
--
-- Note:
--   * Chiama send-transactional-email con la chiave vault `email_queue_service_role_key`
--     (== SERVICE_ROLE_KEY): send-transactional-email autorizza solo `Bearer === SERVICE_ROLE_KEY`.
--   * Idempotenza: idempotencyKey per (subscription, data) + dedup interno della funzione
--     => nessun doppione anche con run extra (sicuro aumentare la frequenza).
--   * Copre anche il trial: per una sub `trialing`, current_period_end = fine trial = primo addebito.
--   * Esclude le disdette: cancel_at_period_end = false (niente addebito in arrivo).

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'transit-renewal-reminder') THEN
    PERFORM cron.unschedule('transit-renewal-reminder');
  END IF;
END $$;

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
    url := 'https://bphmrjuvhcziimuxohnc.supabase.co/functions/v1/send-transactional-email',
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
