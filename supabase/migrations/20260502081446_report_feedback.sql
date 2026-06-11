CREATE TABLE IF NOT EXISTS public.report_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_session_id UUID NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  rating TEXT NOT NULL CHECK (rating IN ('positive', 'mixed', 'negative')),
  reasons TEXT[] NOT NULL DEFAULT '{}',
  comment TEXT,
  source TEXT NOT NULL DEFAULT 'web' CHECK (source IN ('web', 'pdf')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (profile_id, quiz_session_id)
);

CREATE INDEX IF NOT EXISTS idx_report_feedback_profile
ON public.report_feedback (profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_report_feedback_session
ON public.report_feedback (quiz_session_id);

CREATE INDEX IF NOT EXISTS idx_report_feedback_rating
ON public.report_feedback (rating, created_at DESC);

ALTER TABLE public.report_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feedback"
ON public.report_feedback
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = report_feedback.profile_id
      AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own feedback"
ON public.report_feedback
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = report_feedback.profile_id
      AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own feedback"
ON public.report_feedback
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = report_feedback.profile_id
      AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = report_feedback.profile_id
      AND p.user_id = auth.uid()
  )
);

DROP TRIGGER IF EXISTS update_report_feedback_updated_at ON public.report_feedback;
CREATE TRIGGER update_report_feedback_updated_at
BEFORE UPDATE ON public.report_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
