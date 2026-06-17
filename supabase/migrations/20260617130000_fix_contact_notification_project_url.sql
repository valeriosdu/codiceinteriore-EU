-- Fix the contact-form notification trigger: it posted to the OLD project
-- (bphmrjuvhcziimuxohnc) while the live project is sefjuhxxbiehqjewoqpp, so the
-- server-side backup path (used when the browser fails to invoke
-- send-transactional-email after the insert) was misrouted cross-project and
-- effectively dead. Only the hardcoded project_url changes; the vault service
-- key (email_queue_service_role_key) is already a legacy JWT for the current
-- project, which the gateway accepts on notify-contact-submission
-- (verify_jwt = true).

CREATE OR REPLACE FUNCTION public.trigger_contact_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  service_key TEXT;
  project_url TEXT := 'https://sefjuhxxbiehqjewoqpp.supabase.co';
  function_url TEXT;
BEGIN
  -- Reuse the service role key already stored in vault by the email infra setup.
  SELECT decrypted_secret INTO service_key
  FROM vault.decrypted_secrets
  WHERE name = 'email_queue_service_role_key'
  LIMIT 1;

  IF service_key IS NULL THEN
    RAISE WARNING 'trigger_contact_notification: missing vault secret email_queue_service_role_key';
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
