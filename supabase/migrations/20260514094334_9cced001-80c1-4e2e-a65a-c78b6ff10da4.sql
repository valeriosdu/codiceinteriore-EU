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
      ),
      'x-admin-secret', (
        SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name = 'admin_secret'
      )
    ),
    body := jsonb_build_object('source', 'cron'),
    timeout_milliseconds := 30000
  );
  $$
);