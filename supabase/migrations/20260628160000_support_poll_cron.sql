-- Schedule the support autoresponder poll every minute.
--
-- Calls support-poll with the service-role bearer from vault (same pattern as
-- recover-pending-reports). support-poll reads each market's Zoho inbox, ingests
-- new mail, and fire-and-forget invokes support-draft. Markets without Zoho
-- secrets (currently `it`, handled by external software) are skipped cleanly.
--
-- 1/min is well under Zoho's ~30 req/min/account; support-poll caps content
-- fetches per run. Sending stays disabled until SUPPORT_SEND_ENABLED='true'.
--
-- To pause: SELECT cron.unschedule('support-poll');

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'support-poll') THEN
    PERFORM cron.unschedule('support-poll');
  END IF;
END $$;

SELECT cron.schedule(
  'support-poll',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/support-poll',
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
