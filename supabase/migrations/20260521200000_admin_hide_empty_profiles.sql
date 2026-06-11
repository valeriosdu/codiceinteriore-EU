-- Aggiunge `p_hide_empty` alla RPC `admin_customers_search`.
--
-- Esiste un trigger `on_auth_user_created` (migration 20260411072722) che
-- crea automaticamente una `profiles` row per ogni auth.users — quindi un
-- magic link / OAuth / signup diretto produce un profilo anche senza
-- pagamento. Sono anomalie: il funnel passa SEMPRE per Stripe prima della
-- registrazione, quindi un profilo senza checkout indica un'entrata
-- "laterale" (recovery email, login social, signup pubblico Supabase non
-- disattivato, invito admin dalla dashboard).
--
-- Default `false`: NON le nascondiamo automaticamente perché vederle aiuta a
-- diagnosticare il problema. L'admin può attivare il toggle quando la lista
-- diventa troppo rumorosa.
--
-- "Profilo vuoto" = nessun pagamento (paid o orfano) AND nessun quiz_session
-- raggiungibile via `admin_quiz_sessions_for_email`.
--
-- Postgres non permette di aggiungere parametri DEFAULT a una funzione
-- esistente, quindi facciamo drop+create della signature.

DROP FUNCTION IF EXISTS public.admin_customers_search(text, text, text, integer, integer);
DROP FUNCTION IF EXISTS public.admin_customers_search(text, text, text, integer, integer, boolean);

CREATE OR REPLACE FUNCTION public.admin_customers_search(
  p_q          text    DEFAULT NULL,
  p_filter     text    DEFAULT 'all',
  p_sort       text    DEFAULT 'last_activity',
  p_page       integer DEFAULT 1,
  p_page_size  integer DEFAULT 50,
  p_hide_empty boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_page_size  integer := least(greatest(coalesce(p_page_size, 50), 1), 200);
  v_offset     integer := (greatest(coalesce(p_page, 1), 1) - 1) * v_page_size;
  v_q          text    := nullif(trim(lower(coalesce(p_q, ''))), '');
  v_filter     text    := coalesce(p_filter, 'all');
  v_sort       text    := coalesce(p_sort, 'last_activity');
  v_hide_empty boolean := coalesce(p_hide_empty, false);
  v_total      integer;
  v_items      jsonb;
BEGIN
  WITH
    filtered AS MATERIALIZED (
      SELECT aci.*
      FROM public.admin_customer_index aci
      WHERE
        (
          v_q IS NULL
          OR aci.email_key ILIKE '%' || v_q || '%'
          OR EXISTS (
            SELECT 1
            FROM public.quiz_sessions qs
            WHERE qs.id IN (SELECT public.admin_quiz_sessions_for_email(aci.email_key))
              AND (qs.user_name ILIKE '%' || v_q || '%' OR qs.birth_place ILIKE '%' || v_q || '%')
          )
        )
        AND (
          v_filter = 'all'
          OR (v_filter = 'orphan'     AND aci.has_orphan_checkout)
          OR (v_filter = 'subscriber' AND aci.profile_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.transit_subscriptions ts
                WHERE ts.profile_id = aci.profile_id
                  AND ts.status IN ('active', 'trialing')
             ))
          OR (v_filter = 'error' AND EXISTS (
                SELECT 1
                FROM public.quiz_sessions qs
                WHERE qs.processing_status = 'error'
                  AND qs.id IN (SELECT public.admin_quiz_sessions_for_email(aci.email_key))
             ))
          OR (v_filter = 'no_report' AND NOT EXISTS (
                SELECT 1
                FROM public.quiz_sessions qs
                WHERE qs.full_report IS NOT NULL
                  AND qs.id IN (SELECT public.admin_quiz_sessions_for_email(aci.email_key))
             ))
        )
        -- Nasconde i clienti senza attività di valore: nessun pagamento
        -- (paid o orfano) e nessun quiz_session raggiungibile. Tipico:
        -- registrazione via magic link / recovery che non ha mai pagato.
        AND (
          NOT v_hide_empty
          OR aci.checkouts_paid_count > 0
          OR aci.has_orphan_checkout
          OR EXISTS (
            SELECT 1 FROM public.admin_quiz_sessions_for_email(aci.email_key)
          )
        )
    ),
    paged AS (
      SELECT f.*
      FROM filtered f
      ORDER BY
        CASE WHEN v_sort = 'lifetime_spend' THEN f.lifetime_spend_cents END DESC NULLS LAST,
        CASE WHEN v_sort = 'last_activity'  THEN f.last_activity_at     END DESC NULLS LAST,
        f.email_key ASC
      OFFSET v_offset
      LIMIT  v_page_size
    ),
    enriched AS (
      SELECT
        p.*,
        qi.quiz_sessions_count,
        qi.has_error_report,
        qi.display_name,
        sub.is_subscriber
      FROM paged p
      LEFT JOIN LATERAL (
        SELECT
          count(*)                                                            AS quiz_sessions_count,
          bool_or(qs.processing_status = 'error')                             AS has_error_report,
          (array_agg(qs.user_name ORDER BY qs.created_at DESC)
             FILTER (WHERE qs.user_name IS NOT NULL))[1]                     AS display_name
        FROM public.quiz_sessions qs
        WHERE qs.id IN (SELECT public.admin_quiz_sessions_for_email(p.email_key))
      ) qi ON true
      LEFT JOIN LATERAL (
        SELECT EXISTS (
          SELECT 1 FROM public.transit_subscriptions ts
          WHERE p.profile_id IS NOT NULL
            AND ts.profile_id = p.profile_id
            AND ts.status IN ('active', 'trialing')
        ) AS is_subscriber
      ) sub ON true
    )
  SELECT
    (SELECT count(*) FROM filtered),
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'email',                e.email_key,
          'display_email',        e.display_email,
          'display_name',         e.display_name,
          'has_profile',          e.has_profile,
          'profile_id',           e.profile_id,
          'quiz_sessions_count',  coalesce(e.quiz_sessions_count, 0),
          'checkouts_paid_count', e.checkouts_paid_count,
          'has_orphan_checkout',  e.has_orphan_checkout,
          'has_error_report',     coalesce(e.has_error_report, false),
          'is_subscriber',        coalesce(e.is_subscriber, false),
          'last_activity_at',     e.last_activity_at,
          'lifetime_spend_cents', e.lifetime_spend_cents
        )
      ),
      '[]'::jsonb
    )
  INTO v_total, v_items
  FROM enriched e;

  RETURN jsonb_build_object(
    'total',     v_total,
    'page',      greatest(coalesce(p_page, 1), 1),
    'page_size', v_page_size,
    'customers', v_items
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_customers_search(text, text, text, integer, integer, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_customers_search(text, text, text, integer, integer, boolean) TO service_role;

COMMENT ON FUNCTION public.admin_customers_search IS
  'Pagina di clienti aggregati per email per /admin/clienti. p_hide_empty (default false) — quando true, nasconde i profili senza pagamenti né quiz (registrazioni anomale tipo OAuth, magic link, signup pubblico Supabase).';

-- Reload schema cache di PostgREST per la signature nuova.
NOTIFY pgrst, 'reload schema';
