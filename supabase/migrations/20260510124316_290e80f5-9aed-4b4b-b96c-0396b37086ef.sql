-- Astrology Guide: paid Q&A on top of the user's natal report.

CREATE TABLE public.astrology_guide_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_session_id UUID NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  total_granted INTEGER NOT NULL DEFAULT 0,
  total_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT astrology_guide_credits_balance_nonneg CHECK (balance >= 0),
  CONSTRAINT astrology_guide_credits_unique UNIQUE (profile_id, quiz_session_id)
);

CREATE INDEX idx_astrology_guide_credits_profile ON public.astrology_guide_credits (profile_id);

ALTER TABLE public.astrology_guide_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "astrology_credits_owner_select"
  ON public.astrology_guide_credits
  FOR SELECT
  USING (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE TABLE public.astrology_guide_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_session_id UUID NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  section_id TEXT,
  question TEXT NOT NULL,
  answer TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  model_used TEXT,
  is_free BOOLEAN NOT NULL DEFAULT FALSE,
  retry_count INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT astrology_guide_questions_status_check
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  CONSTRAINT astrology_guide_questions_question_length
    CHECK (char_length(question) BETWEEN 1 AND 1000)
);

CREATE INDEX idx_astrology_guide_questions_session_created
  ON public.astrology_guide_questions (quiz_session_id, created_at DESC);

CREATE INDEX idx_astrology_guide_questions_pending
  ON public.astrology_guide_questions (status, scheduled_for)
  WHERE status IN ('pending', 'processing');

ALTER TABLE public.astrology_guide_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "astrology_questions_owner_select"
  ON public.astrology_guide_questions
  FOR SELECT
  USING (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.astrology_guide_questions;

CREATE OR REPLACE FUNCTION public.grant_astrology_credits(
  p_profile_id UUID,
  p_quiz_session_id UUID,
  p_amount INTEGER
)
RETURNS public.astrology_guide_credits
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.astrology_guide_credits;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'amount must be positive (got %)', p_amount;
  END IF;

  INSERT INTO public.astrology_guide_credits AS c (
    profile_id, quiz_session_id, balance, total_granted
  )
  VALUES (p_profile_id, p_quiz_session_id, p_amount, p_amount)
  ON CONFLICT (profile_id, quiz_session_id) DO UPDATE
    SET balance = c.balance + EXCLUDED.balance,
        total_granted = c.total_granted + EXCLUDED.total_granted,
        updated_at = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_astrology_credits(UUID, UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_astrology_credits(UUID, UUID, INTEGER) TO service_role;

CREATE OR REPLACE FUNCTION public.consume_astrology_credit(
  p_profile_id UUID,
  p_quiz_session_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE public.astrology_guide_credits
  SET balance = balance - 1,
      total_used = total_used + 1,
      updated_at = now()
  WHERE profile_id = p_profile_id
    AND quiz_session_id = p_quiz_session_id
    AND balance > 0;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_astrology_credit(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_astrology_credit(UUID, UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.restore_astrology_credit(
  p_profile_id UUID,
  p_quiz_session_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.astrology_guide_credits
  SET balance = balance + 1,
      total_used = GREATEST(0, total_used - 1),
      updated_at = now()
  WHERE profile_id = p_profile_id
    AND quiz_session_id = p_quiz_session_id;

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.restore_astrology_credit(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.restore_astrology_credit(UUID, UUID) TO service_role;

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

CREATE TRIGGER user_reports_grant_initial_astrology_credit
  AFTER INSERT ON public.user_reports
  FOR EACH ROW EXECUTE FUNCTION public.grant_initial_astrology_credit();

INSERT INTO public.astrology_guide_credits (profile_id, quiz_session_id, balance, total_granted)
SELECT DISTINCT ur.profile_id, ur.quiz_session_id, 2, 2
FROM public.user_reports ur
LEFT JOIN public.astrology_guide_credits c
  ON c.profile_id = ur.profile_id AND c.quiz_session_id = ur.quiz_session_id
WHERE c.id IS NULL;

CREATE OR REPLACE FUNCTION public.touch_astrology_guide_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER astrology_guide_credits_touch_updated_at
  BEFORE UPDATE ON public.astrology_guide_credits
  FOR EACH ROW EXECUTE FUNCTION public.touch_astrology_guide_updated_at();

CREATE TRIGGER astrology_guide_questions_touch_updated_at
  BEFORE UPDATE ON public.astrology_guide_questions
  FOR EACH ROW EXECUTE FUNCTION public.touch_astrology_guide_updated_at();

SELECT cron.schedule(
  'process-astrology-questions',
  '*/2 * * * *',
  $$
  WITH candidates AS (
    SELECT id
    FROM public.astrology_guide_questions
    WHERE status = 'pending'
      AND scheduled_for <= now()
      AND retry_count < 3
    UNION ALL
    SELECT id
    FROM public.astrology_guide_questions
    WHERE status = 'processing'
      AND updated_at < now() - interval '5 minutes'
      AND retry_count < 3
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
  $$
);