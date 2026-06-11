DO $$
DECLARE
  service_key TEXT;
  project_url TEXT := 'https://bphmrjuvhcziimuxohnc.supabase.co';
  function_url TEXT;
  request_id BIGINT;
BEGIN
  SELECT decrypted_secret INTO service_key
  FROM vault.decrypted_secrets
  WHERE name = 'email_queue_service_role_key'
  LIMIT 1;

  IF service_key IS NULL THEN
    RAISE WARNING 'Cannot trigger process-transit-cycle: service role key missing from vault';
    RETURN;
  END IF;

  function_url := project_url || '/functions/v1/process-transit-cycle';

  SELECT net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object('transitCycleId', '0b05c2ec-6858-442c-b57d-42cd5c61dba1'),
    timeout_milliseconds := 5000
  ) INTO request_id;

  RAISE NOTICE 'process-transit-cycle invoked, request_id=%', request_id;
END $$;