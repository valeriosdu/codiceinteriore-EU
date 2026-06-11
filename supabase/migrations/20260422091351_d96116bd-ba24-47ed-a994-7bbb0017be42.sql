CREATE TABLE IF NOT EXISTS public.user_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_session_id UUID NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  stripe_session_id TEXT,
  purchase_type TEXT,
  label TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (profile_id, quiz_session_id)
);

CREATE INDEX IF NOT EXISTS idx_user_reports_profile_active
ON public.user_reports (profile_id, is_active DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_reports_quiz_session
ON public.user_reports (quiz_session_id);

ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own report links"
ON public.user_reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = user_reports.profile_id
      AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own report links"
ON public.user_reports
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = user_reports.profile_id
      AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own report links"
ON public.user_reports
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = user_reports.profile_id
      AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = user_reports.profile_id
      AND p.user_id = auth.uid()
  )
);

CREATE OR REPLACE FUNCTION public.ensure_single_active_user_report()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active THEN
    UPDATE public.user_reports
    SET is_active = false, updated_at = now()
    WHERE profile_id = NEW.profile_id
      AND id <> NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS ensure_single_active_user_report_trigger ON public.user_reports;
CREATE TRIGGER ensure_single_active_user_report_trigger
AFTER INSERT OR UPDATE OF is_active ON public.user_reports
FOR EACH ROW
WHEN (NEW.is_active = true)
EXECUTE FUNCTION public.ensure_single_active_user_report();

DROP TRIGGER IF EXISTS update_user_reports_updated_at ON public.user_reports;
CREATE TRIGGER update_user_reports_updated_at
BEFORE UPDATE ON public.user_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.user_reports (profile_id, quiz_session_id, stripe_session_id, label, is_active)
SELECT
  p.id,
  p.quiz_session_id,
  p.stripe_session_id,
  COALESCE(q.user_name, 'Lettura personale'),
  true
FROM public.profiles p
JOIN public.quiz_sessions q ON q.id = p.quiz_session_id
WHERE p.quiz_session_id IS NOT NULL
ON CONFLICT (profile_id, quiz_session_id) DO UPDATE SET
  stripe_session_id = COALESCE(EXCLUDED.stripe_session_id, public.user_reports.stripe_session_id),
  label = COALESCE(public.user_reports.label, EXCLUDED.label),
  is_active = true,
  updated_at = now();