-- =====================================================================
-- Promemoria di rinnovo transiti nella lingua e col brand del cliente
--
-- Il job pg_cron 'transit-renewal-reminder' (ultima definizione in
-- 20260611130000_rebind_project_url_apply.sql) passava a
-- send-transactional-email solo name e renewalDate. Senza lang e market il
-- template ricade su it: ogni abbonato es/nl riceveva il promemoria in
-- italiano, firmato Codice Interiore da info@codiceinteriore.it.
--
-- Stesso job, stesso orario, stessa idempotencyKey e stessa autenticazione
-- dal vault: cambiano solo le due colonne lette da transit_subscriptions
-- (presenti dalla 20260611170000) e i due campi in piu' in templateData.
-- cron.schedule con un nome gia' esistente aggiorna il job sul posto.
-- =====================================================================
SELECT cron.schedule(
  'transit-renewal-reminder',
  '0 9 * * *',
  $cron$
  WITH due AS (
    SELECT ts.stripe_subscription_id, ts.current_period_end, p.email, qs.user_name,
           COALESCE(ts.language, 'it') AS language, COALESCE(ts.market, 'it') AS market
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
      'templateData', jsonb_build_object(
        'name', user_name,
        'renewalDate', current_period_end,
        'lang', language,
        'market', market
      )
    ),
    timeout_milliseconds := 5000
  )
  FROM due;
  $cron$
);
