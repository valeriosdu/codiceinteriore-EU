create or replace view public.customer_purchase_overview
with (security_invoker = true)
as
select
  cs.created_at as checkout_created_at,
  cs.payment_completed_at,
  qs.user_name,
  cs.customer_email,
  cs.purchase_type,
  cs.product_code,
  cs.payment_status,
  cs.includes_transits,
  cs.transit_months,
  cs.stripe_session_id,
  cs.quiz_session_id,
  cs.claimed_profile_id as profile_id,
  p.user_id,
  ue.id as entitlement_id,
  ue.entitlement_type,
  ue.status as entitlement_status,
  ue.starts_at as entitlement_starts_at,
  ue.ends_at as entitlement_ends_at,
  tc.id as transit_cycle_id,
  tc.period_start as transit_period_start,
  tc.period_end as transit_period_end,
  tc.status as transit_status,
  tc.fetch_status as transit_fetch_status,
  tc.interpretation_status as transit_interpretation_status,
  (tc.raw_transits is not null) as has_raw_transits,
  (tc.llm_input is not null) as has_llm_input,
  (tc.llm_input ? 'natal_input') as has_new_transit_llm_input,
  (tc.interpreted_transits is not null) as has_interpreted_transits,
  jsonb_array_length(coalesce(tc.interpreted_transits->'periods', '[]'::jsonb)) as transit_periods_count,
  tc.processing_error as transit_processing_error
from public.checkout_sessions cs
left join public.profiles p on p.id = cs.claimed_profile_id
left join public.quiz_sessions qs on qs.id = cs.quiz_session_id
left join public.user_entitlements ue
  on ue.stripe_session_id = cs.stripe_session_id
  and ue.entitlement_type = 'monthly_transits'
left join public.transit_cycles tc on tc.entitlement_id = ue.id;