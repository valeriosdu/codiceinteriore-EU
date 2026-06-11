DO $$
DECLARE
  service_key TEXT;
BEGIN
  SELECT decrypted_secret INTO service_key FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key' LIMIT 1;

  PERFORM net.http_post(
    url := 'https://bphmrjuvhcziimuxohnc.supabase.co/functions/v1/generate-report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object('quizSessionId', '8e538b8d-0a6a-47b4-9fb0-408a57d4954f'),
    timeout_milliseconds := 120000
  );
END $$;