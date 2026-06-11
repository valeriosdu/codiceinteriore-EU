ALTER TABLE public.quiz_sessions
  ADD COLUMN IF NOT EXISTS birth_timezone_iana text;

COMMENT ON COLUMN public.quiz_sessions.birth_timezone_iana IS
  'IANA timezone identifier (es. "Europe/Rome"). Preferito su birth_timezone numeric quando presente. Nullable per backward compat con record pre-migrazione geo.';