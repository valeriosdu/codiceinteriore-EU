DROP INDEX IF EXISTS public.user_entitlements_natal_upsert_unique;

ALTER TABLE public.user_entitlements
  DROP CONSTRAINT user_entitlements_source_check;

ALTER TABLE public.user_entitlements
  ADD CONSTRAINT user_entitlements_source_check
    CHECK (source IN (
      'base_purchase',
      'premium_purchase',
      'transit_renewal',
      'transit_subscription',
      'manual_admin'
    ));

DROP VIEW IF EXISTS public.customer_report_purchase_overview;

CREATE VIEW public.customer_report_purchase_overview
WITH (security_invoker = true)
AS
SELECT
  qs.user_name,
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
  (tc.raw_transits IS NOT NULL) AS has_raw_transits,
  (tc.llm_input IS NOT NULL) AS has_llm_input,
  (tc.interpreted_transits IS NOT NULL) AS has_interpreted_transits,
  jsonb_array_length(coalesce(tc.interpreted_transits->'periods', '[]'::jsonb)) AS transit_periods_count,
  tc.processing_error AS transit_processing_error,
  qs.birth_place,
  (qs.natal_chart IS NOT NULL) AS has_natal_chart,
  (qs.full_report IS NOT NULL) AS has_full_report,
  ur.created_at
FROM public.user_reports ur
JOIN public.profiles p ON p.id = ur.profile_id
JOIN public.quiz_sessions qs ON qs.id = ur.quiz_session_id
LEFT JOIN public.checkout_sessions cs ON cs.stripe_session_id = ur.stripe_session_id
LEFT JOIN public.user_entitlements natal_ue
  ON natal_ue.profile_id = ur.profile_id
  AND natal_ue.quiz_session_id = ur.quiz_session_id
  AND natal_ue.entitlement_type = 'natal_report'
LEFT JOIN LATERAL (
  SELECT *
  FROM public.user_entitlements
  WHERE profile_id = ur.profile_id
    AND quiz_session_id = ur.quiz_session_id
    AND entitlement_type = 'monthly_transits'
  ORDER BY ends_at DESC NULLS LAST, created_at DESC
  LIMIT 1
) mt_ue ON TRUE
LEFT JOIN LATERAL (
  SELECT *
  FROM public.transit_cycles
  WHERE entitlement_id = mt_ue.id
  ORDER BY period_start DESC NULLS LAST
  LIMIT 1
) tc ON TRUE;