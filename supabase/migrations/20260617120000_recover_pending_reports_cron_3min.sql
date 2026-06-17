-- Speed up the report-recovery watchdog: 10 min -> 3 min.
--
-- Why: on 2026-06-17 a single quiz_session (daf41d09, Marta) hit a ~1h window
-- of Google 503 "model overloaded" on gemini-3.5-flash. Each 503 left the
-- session in processing_status = 'failed', and recovery depended on this cron,
-- which fired only every 10 min -> 7 retries spread across an hour before it
-- finally succeeded. generate-report's in-function retry was hardened in the
-- same change to absorb fast 503s, and the handler's STUCK_THRESHOLD_MS was
-- lowered to 4 min; a 3-min cron cadence matches that so a 'failed' session is
-- re-claimed within a few minutes instead of up to ten.
--
-- Safe to fire more often: generate-report claims each session with an atomic
-- compare-and-swap (UPDATE ... WHERE processing_status <> 'report_processing'
-- AND full_report IS NULL), so a more frequent cron cannot pile onto a healthy
-- in-flight generation. The function's Stripe reconciliation sweep is gated
-- internally to ~every 9 min, so the higher cadence does not multiply Stripe load.
--
-- We reproduce the command actually registered in cron.job (project URL resolved
-- from vault), NOT the stale hardcoded host in the original
-- 20260514120000_recover_pending_reports_cron.sql migration.
--
-- To revert: re-run with '*/10 * * * *'.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'recover-pending-reports') THEN
    PERFORM cron.unschedule('recover-pending-reports');
  END IF;
END $$;

SELECT cron.schedule(
  'recover-pending-reports',
  '*/3 * * * *',
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
