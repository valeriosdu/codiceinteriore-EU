-- Server-side trigger that guarantees a notification email is dispatched
-- to info@codiceinteriore.it for every new contact form submission, even
-- when the user's browser fails to call send-transactional-email after
-- the insert (network blip, page closed, ad-blocker, etc.).
--
-- The trigger calls the notify-contact-submission edge function via pg_net.
-- The send-transactional-email function deduplicates by idempotency_key
-- (contact-<submission_id>), so this is safe even if the client also fires
-- the invoke successfully (we just get one email).

CREATE OR REPLACE FUNCTION public.trigger_contact_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  service_key TEXT;
  project_url TEXT := 'https://bphmrjuvhcziimuxohnc.supabase.co';
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

DROP TRIGGER IF EXISTS contact_submissions_notify_trigger ON public.contact_submissions;

CREATE TRIGGER contact_submissions_notify_trigger
AFTER INSERT ON public.contact_submissions
FOR EACH ROW
EXECUTE FUNCTION public.trigger_contact_notification();