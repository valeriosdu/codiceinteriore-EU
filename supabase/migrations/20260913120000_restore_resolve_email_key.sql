-- Ripristina resolve_email_key, assente dal database.
--
-- La funzione nasce in 20260527200000_admin_resolve_email.sql ed e' l'unico
-- posto che la crea: le migration di giugno la usano soltanto. Quel file non
-- e' mai stato applicato, mentre quelle successive si, quindi da allora ogni
-- funzione che la chiama fallisce a runtime con
-- "function resolve_email_key(text) does not exist" — Postgres non risolve i
-- riferimenti dentro il corpo di una funzione al momento della creazione, solo
-- alla chiamata.
--
-- Qui c'e' SOLO la funzione. Rieseguire per intero 20260527200000 rimetterebbe
-- admin_customer_detail e admin_customers_search alle versioni del 27 maggio,
-- buttando via tutto quello che e' arrivato dopo (merge clienti, punteggi
-- sinastria, ricavi da abbonamento indipendenti dall'account Stripe).
--
-- Corpo identico all'originale, per non introdurre differenze fra i due file.

CREATE OR REPLACE FUNCTION public.resolve_email_key(p_email text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT coalesce(
    (SELECT lower(p.email) FROM public.profiles p
     WHERE lower(p.email) = p_email LIMIT 1),
    (SELECT lower(pr.email)
     FROM public.checkout_sessions cs
     JOIN public.profiles pr ON pr.id = cs.claimed_profile_id
     WHERE lower(cs.customer_email) = p_email
       AND cs.claimed_profile_id IS NOT NULL
     ORDER BY cs.created_at DESC LIMIT 1),
    p_email
  );
$$;

REVOKE ALL ON FUNCTION public.resolve_email_key(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_email_key(text) TO service_role;
