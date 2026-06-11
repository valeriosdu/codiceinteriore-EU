-- Tabella di log per le sincronizzazioni verso Brevo
CREATE TABLE public.brevo_sync_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL,
  brevo_contact_id BIGINT,
  error_message TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_brevo_sync_log_email_created ON public.brevo_sync_log (email, created_at DESC);
CREATE INDEX idx_brevo_sync_log_status ON public.brevo_sync_log (status, created_at DESC) WHERE status = 'failed';

ALTER TABLE public.brevo_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage brevo sync log"
ON public.brevo_sync_log
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Trigger su profiles: chiama sync-brevo-contact in background quando viene creato un nuovo profilo
CREATE OR REPLACE FUNCTION public.trigger_brevo_signup_sync()
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
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RETURN NEW;
  END IF;

  SELECT decrypted_secret INTO service_key
  FROM vault.decrypted_secrets
  WHERE name = 'email_queue_service_role_key'
  LIMIT 1;

  IF service_key IS NULL THEN
    RAISE WARNING 'trigger_brevo_signup_sync: missing vault secret email_queue_service_role_key';
    RETURN NEW;
  END IF;

  function_url := project_url || '/functions/v1/sync-brevo-contact';

  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object(
      'email', NEW.email,
      'eventType', 'signup',
      'attributes', jsonb_build_object()
    ),
    timeout_milliseconds := 5000
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'trigger_brevo_signup_sync failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_sync_brevo
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.trigger_brevo_signup_sync();