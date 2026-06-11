-- =====================================================================
-- Aggiunge birth_timezone_iana (IANA string, DST-aware) a quiz_sessions
-- accanto al birth_timezone DOUBLE PRECISION esistente (offset numerico
-- approssimato lng/15, mantenuto per backward compat).
--
-- Motivazione: la migrazione da Nominatim a freeastroapi V2 /api/v2/geo/search
-- fornisce timezone IANA reale (es. "Europe/Rome"). Codice nuovo preferisce
-- IANA quando presente, fallback al numeric. Nessun backfill: record vecchi
-- restano con birth_timezone_iana = NULL.
-- =====================================================================

ALTER TABLE public.quiz_sessions
  ADD COLUMN IF NOT EXISTS birth_timezone_iana text;

COMMENT ON COLUMN public.quiz_sessions.birth_timezone_iana IS
  'IANA timezone identifier (es. "Europe/Rome"). Preferito su birth_timezone numeric quando presente. Nullable per backward compat con record pre-migrazione geo.';
