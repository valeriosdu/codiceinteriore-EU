DROP VIEW IF EXISTS public.customer_report_purchase_overview;

ALTER TABLE public.transit_cycles
  ALTER COLUMN snapshot_step_days TYPE NUMERIC(4,2) USING snapshot_step_days::numeric,
  ALTER COLUMN snapshot_step_days SET DEFAULT 3.3;

UPDATE public.transit_cycles
SET snapshot_step_days = 3.3
WHERE fetch_status = 'pending';

CREATE VIEW public.customer_report_purchase_overview AS
SELECT qs.user_name,
    p.email AS profile_email,
    cs.customer_email AS checkout_customer_email,
    p.id AS profile_id,
    p.user_id,
    ur.id AS user_report_id,
    ur.quiz_session_id,
    ur.label AS report_label,
    ur.is_active AS is_active_report,
    ur.purchase_type AS report_purchase_type,
    cs.purchase_type AS checkout_purchase_type,
    cs.product_code AS checkout_product_code,
    cs.payment_status,
    cs.includes_transits,
    cs.transit_months,
    ur.stripe_session_id,
    natal_ue.status AS natal_entitlement_status,
    mt_ue.id AS monthly_transits_entitlement_id,
    mt_ue.status AS monthly_transits_status,
    mt_ue.starts_at AS monthly_transits_starts_at,
    mt_ue.ends_at AS monthly_transits_ends_at,
    tc.id AS transit_cycle_id,
    tc.status AS transit_status,
    tc.fetch_status AS transit_fetch_status,
    tc.interpretation_status AS transit_interpretation_status,
    tc.raw_transits IS NOT NULL AS has_raw_transits,
    tc.llm_input IS NOT NULL AS has_llm_input,
    tc.interpreted_transits IS NOT NULL AS has_interpreted_transits,
    jsonb_array_length(COALESCE(tc.interpreted_transits -> 'periods'::text, '[]'::jsonb)) AS transit_periods_count,
    tc.processing_error AS transit_processing_error,
    qs.birth_place,
    qs.natal_chart IS NOT NULL AS has_natal_chart,
    qs.full_report IS NOT NULL AS has_full_report,
    ur.created_at
   FROM public.user_reports ur
     JOIN public.profiles p ON p.id = ur.profile_id
     JOIN public.quiz_sessions qs ON qs.id = ur.quiz_session_id
     LEFT JOIN public.checkout_sessions cs ON cs.stripe_session_id = ur.stripe_session_id
     LEFT JOIN public.user_entitlements natal_ue ON natal_ue.profile_id = ur.profile_id AND natal_ue.quiz_session_id = ur.quiz_session_id AND natal_ue.entitlement_type = 'natal_report'::text
     LEFT JOIN LATERAL ( SELECT user_entitlements.id,
            user_entitlements.profile_id,
            user_entitlements.quiz_session_id,
            user_entitlements.stripe_session_id,
            user_entitlements.entitlement_type,
            user_entitlements.status,
            user_entitlements.starts_at,
            user_entitlements.ends_at,
            user_entitlements.source,
            user_entitlements.created_at,
            user_entitlements.updated_at
           FROM public.user_entitlements
          WHERE user_entitlements.profile_id = ur.profile_id AND user_entitlements.quiz_session_id = ur.quiz_session_id AND user_entitlements.entitlement_type = 'monthly_transits'::text
          ORDER BY user_entitlements.ends_at DESC NULLS LAST, user_entitlements.created_at DESC
         LIMIT 1) mt_ue ON true
     LEFT JOIN LATERAL ( SELECT transit_cycles.id,
            transit_cycles.profile_id,
            transit_cycles.quiz_session_id,
            transit_cycles.entitlement_id,
            transit_cycles.stripe_session_id,
            transit_cycles.period_start,
            transit_cycles.period_end,
            transit_cycles.status,
            transit_cycles.fetch_status,
            transit_cycles.interpretation_status,
            transit_cycles.raw_transits,
            transit_cycles.interpreted_transits,
            transit_cycles.processing_error,
            transit_cycles.retry_count,
            transit_cycles.created_at,
            transit_cycles.updated_at,
            transit_cycles.premium_purchase_at,
            transit_cycles.premium_purchase_local_datetime,
            transit_cycles.premium_purchase_timezone,
            transit_cycles.snapshot_count,
            transit_cycles.snapshot_step_days,
            transit_cycles.llm_input,
            transit_cycles.failure_history
           FROM public.transit_cycles
          WHERE transit_cycles.entitlement_id = mt_ue.id
          ORDER BY transit_cycles.period_start DESC NULLS LAST
         LIMIT 1) tc ON true;