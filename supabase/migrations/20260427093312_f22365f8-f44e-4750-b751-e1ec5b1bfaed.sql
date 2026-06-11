-- Re-trigger generate-report for Iovanca's session (8e538b8d-...) since
-- the previous run left full_report = NULL.
DO $$
DECLARE
  service_key TEXT;
  proj_url TEXT := 'https://bphmrjuvhcziimuxohnc.supabase.co';
BEGIN
  SELECT decrypted_secret INTO service_key
  FROM vault.decrypted_secrets
  WHERE name = 'email_queue_service_role_key'
  LIMIT 1;

  IF service_key IS NULL THEN
    RAISE NOTICE 'Missing service role key in vault';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := proj_url || '/functions/v1/generate-report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object('session_id', '8e538b8d-0a6a-47b4-9fb0-408a57d4954f'),
    timeout_milliseconds := 60000
  );
END $$;