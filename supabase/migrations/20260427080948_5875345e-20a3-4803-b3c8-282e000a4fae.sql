-- Recover missing transit_cycles row for caterinabalzani@libero.it
-- Premium PayPal purchase 2026-04-26, monthly_transits entitlement exists but no cycle was created.
INSERT INTO public.transit_cycles (
  profile_id,
  quiz_session_id,
  entitlement_id,
  stripe_session_id,
  period_start,
  period_end,
  premium_purchase_at,
  premium_purchase_local_datetime,
  premium_purchase_timezone,
  snapshot_count,
  snapshot_step_days,
  status,
  fetch_status,
  interpretation_status
)
SELECT
  '558b1039-68ab-4aca-af43-4076407ae8e5'::uuid,
  'd2cc5f10-2a95-47be-99ff-434d92aeb8ac'::uuid,
  '78fc1d79-7a07-4d7e-a8b8-85c9cc920b59'::uuid,
  'pp_0DJ25517PP217245R',
  DATE '2026-04-26',
  DATE '2026-05-26',
  TIMESTAMPTZ '2026-04-26 20:48:17+00',
  '2026-04-26T21:48',
  '+01:00',
  9,
  3,
  'pending',
  'pending',
  'pending'
WHERE NOT EXISTS (
  SELECT 1 FROM public.transit_cycles
  WHERE entitlement_id = '78fc1d79-7a07-4d7e-a8b8-85c9cc920b59'::uuid
);