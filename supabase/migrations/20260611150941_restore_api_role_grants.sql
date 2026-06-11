-- Il nuovo progetto Supabase (giugno 2026) ha default privileges piu' restrittive
-- del progetto originale: i ruoli API (anon, authenticated, service_role) non
-- ricevono piu' SELECT/INSERT/UPDATE/DELETE sulle tabelle create da `postgres`
-- in `public` (solo TRUNCATE/REFERENCES/TRIGGER/MAINTAIN). Le migration storiche
-- non contengono GRANT espliciti perche' sul vecchio progetto i grant arrivavano
-- dai default. Questo ripristina il modello su cui e' costruita l'app:
-- grant ampi + RLS come livello di protezione (RLS e' attiva su tutte le
-- tabelle public; le funzioni hanno gia' GRANT/REVOKE espliciti corretti).

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public
  TO anon, authenticated, service_role;

-- Ri-applica i lockdown espliciti delle migration: questi oggetti restano
-- riservati a service_role (admin_customer_index e admin_customer_merges da
-- 20260605*, customer_report_purchase_overview da 20260610120000).
REVOKE ALL ON public.admin_customer_index FROM anon, authenticated;
REVOKE ALL ON public.customer_report_purchase_overview FROM anon, authenticated;
REVOKE ALL ON public.admin_customer_merges FROM anon, authenticated;

-- Le tabelle/sequenze create da migration future ricevono gli stessi grant,
-- come accadeva sul vecchio progetto.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated, service_role;
