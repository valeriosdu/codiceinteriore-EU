ALTER TABLE public.quiz_sessions
  ADD COLUMN IF NOT EXISTS natal_chart_svg text,
  ADD COLUMN IF NOT EXISTS natal_chart_png text;