-- Telemetry for every LLM call we make through the Lovable AI gateway.
-- One row per attempt (we already retry up to MAX_ATTEMPTS=2 in each
-- caller), so a single user-visible generation can produce 1-2 rows.
--
-- Written fire-and-forget from the edge functions: a failure to insert
-- here MUST NOT break report generation, so the callers swallow errors.
-- That means this table is best-effort observability, not an audit log.

CREATE TABLE IF NOT EXISTS public.ai_generation_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  function_name TEXT NOT NULL,
  model TEXT,
  quiz_session_id UUID REFERENCES public.quiz_sessions(id) ON DELETE SET NULL,
  transit_cycle_id UUID,
  attempt SMALLINT NOT NULL DEFAULT 1,
  duration_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  http_status INTEGER,
  error_code TEXT,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER
);

CREATE INDEX IF NOT EXISTS idx_ai_generation_metrics_created_at
ON public.ai_generation_metrics (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_generation_metrics_function
ON public.ai_generation_metrics (function_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_generation_metrics_session
ON public.ai_generation_metrics (quiz_session_id)
WHERE quiz_session_id IS NOT NULL;

ALTER TABLE public.ai_generation_metrics ENABLE ROW LEVEL SECURITY;

-- No policies: only service_role bypasses RLS, which is exactly what we
-- want. The admin-ai-metrics edge function reads with service_role; the
-- three writer edge functions also write with service_role.
