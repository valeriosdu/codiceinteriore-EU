-- Promote snapshot_step_days from INTEGER to NUMERIC so fractional steps
-- (3.3, 3.33, etc.) survive the round-trip through the DB. With INTEGER,
-- the previous default value silently truncated fractional intent — the
-- snapshot generator already accumulates in minutes (see
-- buildTransitSnapshotDates in process-transit-cycle), so once the DB stops
-- truncating, the transit_date timestamps will spread across day-fractions
-- and cover the tail of the cycle that was previously left out.
--
-- Existing completed cycles keep their stored value (3) as historical
-- record — those interpretations were generated against that sampling,
-- and we don't rewrite history. Pending cycles get bumped to 3.3 so
-- subscription renewals already scheduled pick up the new sampling at
-- their first run.
ALTER TABLE public.transit_cycles
  ALTER COLUMN snapshot_step_days TYPE NUMERIC(4,2) USING snapshot_step_days::numeric,
  ALTER COLUMN snapshot_step_days SET DEFAULT 3.3;

UPDATE public.transit_cycles
SET snapshot_step_days = 3.3
WHERE fetch_status = 'pending';
