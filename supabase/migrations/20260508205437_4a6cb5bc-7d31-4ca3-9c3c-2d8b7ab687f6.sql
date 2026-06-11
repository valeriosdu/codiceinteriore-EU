ALTER TABLE public.quiz_sessions
  ADD COLUMN IF NOT EXISTS funnel_slug TEXT NOT NULL DEFAULT 'classica',
  ADD COLUMN IF NOT EXISTS quiz_answers JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.quiz_sessions.funnel_slug IS
  'Marketing-angle slug (classica, attivazione, ...). Drives teaser prompt and report config.';

COMMENT ON COLUMN public.quiz_sessions.quiz_answers IS
  'Angle-specific quiz answers as JSONB. Classica stays on attachment_response/focus_area for back-compat; new angles write here.';