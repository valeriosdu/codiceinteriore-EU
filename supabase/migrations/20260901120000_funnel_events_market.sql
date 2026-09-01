-- Mercato sugli eventi di funnel.
--
-- funnel_events era l'unica tabella del percorso di acquisto senza `market`, e
-- page_path non basta a dedurlo: '/', '/quiz', '/teaser', '/success' sono
-- identici in tutti i mercati (solo '/koppel' e '/lp/klassiek' distinguono
-- l'olandese). Senza questa colonna la dashboard per mercato puo' separare
-- ordini e clienti ma non visite e abbandoni.
--
-- Nullable e SENZA default: NULL significa "evento precedente a questa
-- migration, mercato non attribuibile". Un default 'it' renderebbe italiani
-- 300+ eventi spagnoli, cioe' scriverebbe una cosa falsa nello storico.
ALTER TABLE public.funnel_events
  ADD COLUMN IF NOT EXISTS market text;

-- La dashboard interroga sempre per (mercato, evento, finestra temporale).
CREATE INDEX IF NOT EXISTS idx_funnel_events_market_event_created
  ON public.funnel_events (market, event_name, created_at DESC);

COMMENT ON COLUMN public.funnel_events.market IS
  'Mercato di provenienza (it|es|us|nl), scritto dal frontend. NULL = evento anteriore al 2026-09-01, non attribuibile.';
