CREATE TABLE public.funnel_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  anonymous_id text NOT NULL,
  user_id uuid NULL,
  event_name text NOT NULL,
  event_properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  page_path text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT funnel_events_event_name_check CHECK (event_name IN (
    'landing_viewed',
    'quiz_started',
    'quiz_completed',
    'paywall_viewed',
    'checkout_started',
    'purchase_completed',
    'report_generation_completed',
    'report_generation_failed'
  ))
);

CREATE INDEX idx_funnel_events_event_created ON public.funnel_events (event_name, created_at DESC);
CREATE INDEX idx_funnel_events_anon ON public.funnel_events (anonymous_id);
CREATE INDEX idx_funnel_events_created ON public.funnel_events (created_at DESC);

ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert funnel events"
ON public.funnel_events
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Service role can read funnel events"
ON public.funnel_events
FOR SELECT
TO public
USING (auth.role() = 'service_role');