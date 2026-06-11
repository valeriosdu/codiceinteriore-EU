-- Schedule `recover-pending-reports` every 10 minutes as a watchdog.
--
-- Why: today, a quiz_session can get stuck in processing_status = 'report_processing'
-- if the background generate-report task dies (Deno EdgeRuntime.waitUntil terminates
-- silently when the parent worker shuts down — happened on 2026-05-14 to Giacomo
-- ce5c07af-...). recover-pending-reports already does a retry sweep, but used to
-- skip rows in report_processing. The handler was updated to include rows whose
-- entitlement is older than 10 min, reset them to 'failed', and re-invoke
-- generate-report (which can then re-claim the row via the CAS lock).
--
-- The cron just needs to fire the function periodically. 10 min cadence matches
-- the stuck threshold inside the handler and keeps fan-out modest.
--
-- The function grants admin mode either via `x-admin-secret` OR by passing
-- the service-role JWT as Bearer. The latter is what we use here: the vault
-- already stores `email_queue_service_role_key` (used by all the other admin
-- crons), so we don't need a duplicate admin_secret entry in the vault.
--
-- To revert:
--   SELECT cron.unschedule('recover-pending-reports');

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'recover-pending-reports') THEN
    PERFORM cron.unschedule('recover-pending-reports');
  END IF;
END $$;

SELECT cron.schedule(
  'recover-pending-reports',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://bphmrjuvhcziimuxohnc.supabase.co/functions/v1/recover-pending-reports',
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
