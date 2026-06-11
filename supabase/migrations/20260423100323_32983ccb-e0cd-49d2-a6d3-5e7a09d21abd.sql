ALTER TABLE public.transit_cycles
ADD COLUMN IF NOT EXISTS llm_input jsonb;