-- Filtro per mercato sulla lista clienti CRM.
--
-- Serve alla dashboard per paese: /admin/clienti deve poter mostrare i soli
-- clienti olandesi, spagnoli e cosi' via.
--
-- Un cliente appartiene a un mercato se ha un checkout con quel market OPPURE
-- una quiz session con quel market. Servono entrambe le rotte: il checkout da
-- solo perde chi ha fatto il funnel senza comprare, la sessione da sola perde
-- l'orfano che ha pagato senza che la sessione sia legata. La seconda passa da
-- admin_quiz_sessions_for_email, che risolve gia' il caso email-di-registrazione
-- diversa da email-di-pagamento (PayPal), quindi non si reintroduce il match su
-- profiles.email grezzo.
--
-- Chi compra in due mercati compare in entrambi: e' un cliente solo, ma e'
-- cliente di tutti e due, e nasconderlo in uno dei due sarebbe peggio.
--
-- p_market e' in coda e nullable: NULL = tutti i mercati, cioe' il
-- comportamento attuale. Va droppata la firma a 6 argomenti, altrimenti
-- resterebbero due overload e le chiamate diventerebbero ambigue.
DROP FUNCTION IF EXISTS public.admin_customers_search(text, text, text, integer, integer, boolean);

CREATE OR REPLACE FUNCTION public.admin_customers_search(p_q text DEFAULT NULL::text, p_filter text DEFAULT 'all'::text, p_sort text DEFAULT 'last_activity'::text, p_page integer DEFAULT 1, p_page_size integer DEFAULT 50, p_hide_empty boolean DEFAULT false, p_market text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_page_size  integer := least(greatest(coalesce(p_page_size, 50), 1), 200);
  v_offset     integer := (greatest(coalesce(p_page, 1), 1) - 1) * v_page_size;
  v_q          text    := nullif(trim(lower(coalesce(p_q, ''))), '');
  v_filter     text    := coalesce(p_filter, 'all');
  v_sort       text    := coalesce(p_sort, 'last_activity');
  v_hide_empty boolean := coalesce(p_hide_empty, false);
  v_market     text    := nullif(trim(lower(coalesce(p_market, ''))), '');
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
          -- >>> NUOVO: cerca anche per email di pagamento (PayPal, etc.)
          OR EXISTS (
            SELECT 1 FROM public.checkout_sessions cs
            WHERE lower(cs.customer_email) ILIKE '%' || v_q || '%'
              AND cs.claimed_profile_id = aci.profile_id
              AND cs.claimed_profile_id IS NOT NULL
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
          OR (v_filter = 'has_transits' AND EXISTS (
                SELECT 1
                FROM public.checkout_sessions cs
                WHERE lower(cs.customer_email) = aci.email_key
                  AND cs.payment_status = 'paid'
                  AND cs.includes_transits = true
             ))
          OR (v_filter = 'has_synastry' AND EXISTS (
                SELECT 1
                FROM public.checkout_sessions cs
                WHERE lower(cs.customer_email) = aci.email_key
                  AND cs.payment_status = 'paid'
                  AND cs.product_code LIKE 'synastry_%'
             ))
          OR (v_filter = 'has_guide' AND EXISTS (
                SELECT 1
                FROM public.checkout_sessions cs
                WHERE lower(cs.customer_email) = aci.email_key
                  AND cs.payment_status = 'paid'
                  AND cs.product_code = 'astrology_guide_pack_10'
             ))
        )
        AND (
          NOT v_hide_empty
          OR aci.checkouts_paid_count > 0
          OR aci.has_orphan_checkout
          OR EXISTS (
            SELECT 1 FROM public.admin_quiz_sessions_for_email(aci.email_key)
          )
        )
    
        AND (
          v_market IS NULL
          OR EXISTS (
            SELECT 1
            FROM public.checkout_sessions cs
            WHERE lower(cs.customer_email) = aci.email_key
              AND cs.market = v_market
          )
          OR EXISTS (
            SELECT 1
            FROM public.quiz_sessions qs
            WHERE qs.market = v_market
              AND qs.id IN (SELECT public.admin_quiz_sessions_for_email(aci.email_key))
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
$function$;


REVOKE ALL ON FUNCTION public.admin_customers_search(text, text, text, integer, integer, boolean, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_customers_search(text, text, text, integer, integer, boolean, text) TO service_role;
