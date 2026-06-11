create or replace view public.customer_report_purchase_overview
with (security_invoker = true)
as
select
  qs.user_name,
  p.email as profile_email,
  cs.customer_email as checkout_customer_email,
  p.id as profile_id,
  p.user_id,
  ur.id as user_report_id,
  ur.quiz_session_id,
  ur.label as report_label,
  ur.is_active as is_active_report,
  ur.purchase_type as report_purchase_type,
  cs.purchase_type as checkout_purchase_type,
  cs.product_code as checkout_product_code,
  cs.payment_status,
  cs.includes_transits,
  cs.transit_months,
  ur.stripe_session_id,
  natal_ue.status as natal_entitlement_status,
  mt_ue.id as monthly_transits_entitlement_id,
  mt_ue.status as monthly_transits_status,
  mt_ue.starts_at as monthly_transits_starts_at,
  mt_ue.ends_at as monthly_transits_ends_at,
  tc.id as transit_cycle_id,
  tc.status as transit_status,
  tc.fetch_status as transit_fetch_status,
  tc.interpretation_status as transit_interpretation_status,
  (tc.raw_transits is not null) as has_raw_transits,
  (tc.llm_input is not null) as has_llm_input,
  (tc.interpreted_transits is not null) as has_interpreted_transits,
  jsonb_array_length(coalesce(tc.interpreted_transits->'periods', '[]'::jsonb)) as transit_periods_count,
  tc.processing_error as transit_processing_error,
  qs.birth_place,
  (qs.natal_chart is not null) as has_natal_chart,
  (qs.full_report is not null) as has_full_report,
  ur.created_at
from public.user_reports ur
join public.profiles p on p.id = ur.profile_id
join public.quiz_sessions qs on qs.id = ur.quiz_session_id
left join public.checkout_sessions cs on cs.stripe_session_id = ur.stripe_session_id
left join public.user_entitlements natal_ue
  on natal_ue.profile_id = ur.profile_id
  and natal_ue.quiz_session_id = ur.quiz_session_id
  and natal_ue.entitlement_type = 'natal_report'
left join public.user_entitlements mt_ue
  on mt_ue.profile_id = ur.profile_id
  and mt_ue.quiz_session_id = ur.quiz_session_id
  and mt_ue.entitlement_type = 'monthly_transits'
left join public.transit_cycles tc on tc.entitlement_id = mt_ue.id;