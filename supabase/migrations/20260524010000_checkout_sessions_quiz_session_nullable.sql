-- Rende quiz_session_id nullable in checkout_sessions.
-- Necessario per il prodotto sinastria (purchase_type='synastry') che usa
-- synastry_session_id al posto di quiz_session_id. Formalizza un vincolo
-- gia rilassato in produzione al momento del lancio sinastria (2026-05-22).

ALTER TABLE public.checkout_sessions
  ALTER COLUMN quiz_session_id DROP NOT NULL;
