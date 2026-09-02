-- Ammette i tre nomi di evento che il frontend emetteva ma il database rifiutava.
--
-- Il vincolo elencava 8 nomi. IndexClassica emette 'landing_classica_viewed',
-- IndexAttivazione 'landing_attivazione_viewed' e Quiz 'quiz_intent_selected':
-- nessuno dei tre era ammesso, quindi ogni insert veniva respinto da Postgres e
-- trackEvent inghiottiva l'errore (e' scritto come best-effort per non bloccare
-- l'esperienza sull'analytics).
--
-- Effetto pratico: in 30 giorni ZERO visite registrate sulle landing a
-- pagamento, mentre 'landing_viewed' partiva solo dalla homepage (117 su 139).
-- La conversione "Landing -> Acquisto" aveva quindi come denominatore i soli
-- visitatori di '/', e ignorava tutto il traffico degli annunci, che entra da
-- /lp/klassiek e /lp/classica. Da qui il 100% che non tornava.
--
-- Puro allargamento: nessuna riga esistente puo' violare il vincolo nuovo,
-- perche' contiene tutti i valori precedenti.
ALTER TABLE public.funnel_events
  DROP CONSTRAINT IF EXISTS funnel_events_event_name_check;

ALTER TABLE public.funnel_events
  ADD CONSTRAINT funnel_events_event_name_check CHECK (event_name IN (
    'landing_viewed',
    'landing_classica_viewed',
    'landing_attivazione_viewed',
    'quiz_started',
    'quiz_intent_selected',
    'quiz_completed',
    'paywall_viewed',
    'checkout_started',
    'purchase_completed',
    'report_generation_completed',
    'report_generation_failed'
  ));
