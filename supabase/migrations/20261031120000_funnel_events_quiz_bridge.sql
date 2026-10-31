-- Ammette i due eventi della schermata "ponte" dopo la domanda 1 del funnel
-- attivazione: 'quiz_bridge_viewed' (la schermata e' stata mostrata, con la
-- variante nelle proprieta') e 'quiz_bridge_continue' (ha premuto Continua).
--
-- Senza questa riga Postgres respinge ogni insert e trackEvent inghiotte
-- l'errore (e' best-effort): la schermata andrebbe online senza nessuna misura.
-- Stesso schema di 20260902100000_funnel_events_landing_names.sql: puro
-- allargamento, nessuna riga esistente puo' violare il vincolo nuovo.
ALTER TABLE public.funnel_events
  DROP CONSTRAINT IF EXISTS funnel_events_event_name_check;

ALTER TABLE public.funnel_events
  ADD CONSTRAINT funnel_events_event_name_check CHECK (event_name IN (
    'landing_viewed',
    'landing_classica_viewed',
    'landing_attivazione_viewed',
    'quiz_started',
    'quiz_intent_selected',
    'quiz_bridge_viewed',
    'quiz_bridge_continue',
    'quiz_completed',
    'paywall_viewed',
    'checkout_started',
    'purchase_completed',
    'report_generation_completed',
    'report_generation_failed'
  ));
