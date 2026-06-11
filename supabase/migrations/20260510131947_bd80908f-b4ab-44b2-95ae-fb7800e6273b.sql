-- Follow-up to astrology guide migration: two-phase pipeline.

ALTER TABLE public.astrology_guide_questions
  DROP CONSTRAINT IF EXISTS astrology_guide_questions_status_check;

ALTER TABLE public.astrology_guide_questions
  ADD CONSTRAINT astrology_guide_questions_status_check
    CHECK (status IN ('pending', 'processing', 'ready', 'completed', 'failed'));

DROP INDEX IF EXISTS public.idx_astrology_guide_questions_pending;

CREATE INDEX idx_astrology_guide_questions_pending
  ON public.astrology_guide_questions (status, scheduled_for)
  WHERE status IN ('pending', 'processing', 'ready');

CREATE OR REPLACE FUNCTION public.grant_initial_astrology_credit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.profile_id IS NOT NULL AND NEW.quiz_session_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.astrology_guide_credits
      WHERE profile_id = NEW.profile_id
        AND quiz_session_id = NEW.quiz_session_id
    ) THEN
      PERFORM public.grant_astrology_credits(NEW.profile_id, NEW.quiz_session_id, 2);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  PERFORM cron.unschedule('process-astrology-questions');
EXCEPTION WHEN OTHERS THEN
  NULL;
END
$$;

SELECT cron.schedule(
  'process-astrology-questions',
  '*/5 * * * *',
  $cron$
  WITH candidates AS (
    SELECT id
    FROM public.astrology_guide_questions
    WHERE status = 'pending'
      AND created_at < now() - interval '1 minute'
      AND retry_count < 3
    UNION ALL
    SELECT id
    FROM public.astrology_guide_questions
    WHERE status = 'processing'
      AND updated_at < now() - interval '5 minutes'
      AND retry_count < 3
    UNION ALL
    SELECT id
    FROM public.astrology_guide_questions
    WHERE status = 'ready'
      AND scheduled_for <= now()
    ORDER BY 1
    LIMIT 20
  )
  SELECT net.http_post(
    url := 'https://bphmrjuvhcziimuxohnc.supabase.co/functions/v1/process-astrology-questions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name = 'email_queue_service_role_key'
      )
    ),
    body := jsonb_build_object('questionId', id),
    timeout_milliseconds := 5000
  )
  FROM candidates;
  $cron$
);