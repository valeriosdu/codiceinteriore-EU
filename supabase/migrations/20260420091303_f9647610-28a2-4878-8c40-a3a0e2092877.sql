-- Add durable processing status tracking to quiz_sessions
ALTER TABLE public.quiz_sessions
  ADD COLUMN IF NOT EXISTS processing_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS processing_error TEXT,
  ADD COLUMN IF NOT EXISTS insights_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS insights_completed_at TIMESTAMPTZ;

-- Backfill existing rows
UPDATE public.quiz_sessions
SET processing_status = CASE
  WHEN teaser_insights IS NOT NULL THEN 'insights_ready'
  WHEN natal_chart IS NOT NULL THEN 'chart_ready'
  ELSE 'pending'
END
WHERE processing_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_processing_status
  ON public.quiz_sessions(processing_status)
  WHERE processing_status IN ('pending', 'chart_ready', 'insights_processing');