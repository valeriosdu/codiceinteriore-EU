-- =====================================================================
-- Tabella synastry_sessions per il prodotto sinastria di coppia.
-- Funnel separato dal natale (/coppia/*), 2 set di birth-data + payload
-- di calcolo + full_report Gemini.
--
-- Plan: C:\Users\frenk\.claude\plans\lazy-wishing-kay.md sez. A
-- =====================================================================

CREATE TABLE public.synastry_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funnel_slug TEXT NOT NULL DEFAULT 'coppia',

  -- Persona A
  person_a_name TEXT,
  person_a_birth_date JSONB,
  person_a_birth_time JSONB,
  person_a_time_known BOOLEAN NOT NULL DEFAULT true,
  person_a_birth_place TEXT,
  person_a_birth_lat DOUBLE PRECISION,
  person_a_birth_lng DOUBLE PRECISION,
  person_a_birth_timezone DOUBLE PRECISION,
  person_a_birth_timezone_iana TEXT,

  -- Persona B
  person_b_name TEXT,
  person_b_birth_date JSONB,
  person_b_birth_time JSONB,
  person_b_time_known BOOLEAN NOT NULL DEFAULT true,
  person_b_birth_place TEXT,
  person_b_birth_lat DOUBLE PRECISION,
  person_b_birth_lng DOUBLE PRECISION,
  person_b_birth_timezone DOUBLE PRECISION,
  person_b_birth_timezone_iana TEXT,

  -- Pipeline payload (raw API)
  chart_a JSONB,
  chart_b JSONB,
  chart_a_svg TEXT,
  chart_b_svg TEXT,
  synastry_data JSONB,
  bi_wheel_svg TEXT,

  -- Brief italiano preprocessato (persistito per debug/replay)
  brief JSONB,

  -- Output strutturato estratto (per render rapido)
  archetype TEXT,
  archetype_label TEXT,
  score_overall NUMERIC(4,1),
  scores JSONB,
  teaser_highlight JSONB,

  -- Full report Gemini
  full_report JSONB,
  report_pdf_url TEXT,

  -- Tracking AI
  llm_input JSONB,
  llm_output JSONB,

  -- Stato pipeline
  processing_status TEXT,
  processing_error TEXT,

  -- Contesto coppia (opzionale dal quiz)
  relationship_duration TEXT,
  client_name TEXT,
  focus_relational TEXT,
  quiz_answers JSONB,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX synastry_sessions_funnel_created_idx
  ON public.synastry_sessions (funnel_slug, created_at DESC);
CREATE INDEX synastry_sessions_status_idx
  ON public.synastry_sessions (processing_status);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.synastry_sessions_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER synastry_sessions_updated_at
  BEFORE UPDATE ON public.synastry_sessions
  FOR EACH ROW EXECUTE FUNCTION public.synastry_sessions_set_updated_at();

-- RLS allineata a quiz_sessions (broad SELECT/INSERT, UPDATE solo service_role)
ALTER TABLE public.synastry_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert synastry" ON public.synastry_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select synastry" ON public.synastry_sessions
  FOR SELECT USING (true);

CREATE POLICY "Service role update synastry" ON public.synastry_sessions
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);

-- =====================================================================
-- Estensione checkout_sessions per linkare synastry_session_id
-- =====================================================================

ALTER TABLE public.checkout_sessions
  ADD COLUMN IF NOT EXISTS synastry_session_id UUID
    REFERENCES public.synastry_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_synastry_session_id
  ON public.checkout_sessions (synastry_session_id);

COMMENT ON COLUMN public.checkout_sessions.synastry_session_id IS
  'FK a synastry_sessions per acquisti con purchase_type=synastry. Nullable: la riga puo essere legata a quiz_session_id (natale) o a synastry_session_id, non entrambi.';
