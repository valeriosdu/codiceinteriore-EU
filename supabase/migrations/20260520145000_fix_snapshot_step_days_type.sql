-- 20260520140000 (snapshot_step_days INTEGER→NUMERIC) failed on the new DB
-- because customer_report_purchase_overview depends on the column.
-- Drop the view here so the ALTER can proceed; 20260520173657 recreates it.
DROP VIEW IF EXISTS public.customer_report_purchase_overview;

ALTER TABLE public.transit_cycles
  ALTER COLUMN snapshot_step_days TYPE NUMERIC(4,2) USING snapshot_step_days::numeric,
  ALTER COLUMN snapshot_step_days SET DEFAULT 3.3;
