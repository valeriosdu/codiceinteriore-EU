
CREATE TABLE public.quiz_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT,
  birth_date JSONB,
  birth_time JSONB,
  birth_place TEXT,
  birth_lat DOUBLE PRECISION,
  birth_lng DOUBLE PRECISION,
  birth_timezone DOUBLE PRECISION,
  attachment_response TEXT,
  focus_area TEXT,
  natal_chart JSONB,
  llm_input JSONB,
  llm_output JSONB,
  teaser_insights JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert" ON public.quiz_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select" ON public.quiz_sessions FOR SELECT USING (true);
CREATE POLICY "Allow public update" ON public.quiz_sessions FOR UPDATE USING (true);
