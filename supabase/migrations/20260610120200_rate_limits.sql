-- =====================================================================
-- Per-IP rate limiting for unauthenticated, cost-bearing edge functions
-- (FreeAstro + Gemini proxies, Meta conversions, account recovery).
--
-- Fixed-window counter keyed by (bucket, identifier, window_start).
-- The edge functions call rate_limit_check() with the service role;
-- the table is service-role-only (RLS enabled, no policies = deny all
-- to anon/authenticated, service_role bypasses).
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.rate_limits (
  bucket       TEXT NOT NULL,
  identifier   TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  hits         INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, identifier, window_start)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Index to make opportunistic cleanup of stale windows cheap.
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start
  ON public.rate_limits (window_start);

-- Atomic check-and-increment. Returns TRUE when the request is allowed
-- (i.e. the count within the current fixed window is <= p_max).
CREATE OR REPLACE FUNCTION public.rate_limit_check(
  p_bucket         text,
  p_identifier     text,
  p_max            integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_window timestamptz;
  v_hits   integer;
BEGIN
  -- Bucket "now" into a fixed window of p_window_seconds.
  v_window := to_timestamp(
    floor(extract(epoch FROM clock_timestamp()) / p_window_seconds) * p_window_seconds
  );

  INSERT INTO public.rate_limits (bucket, identifier, window_start, hits)
  VALUES (p_bucket, p_identifier, v_window, 1)
  ON CONFLICT (bucket, identifier, window_start)
  DO UPDATE SET hits = public.rate_limits.hits + 1
  RETURNING hits INTO v_hits;

  -- Opportunistic cleanup (~1% of calls) of windows older than 1 day so
  -- the table does not grow unbounded without a separate cron job.
  IF random() < 0.01 THEN
    DELETE FROM public.rate_limits
    WHERE window_start < clock_timestamp() - interval '1 day';
  END IF;

  RETURN v_hits <= p_max;
END;
$$;

REVOKE ALL ON FUNCTION public.rate_limit_check(text, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rate_limit_check(text, text, integer, integer) TO service_role;
