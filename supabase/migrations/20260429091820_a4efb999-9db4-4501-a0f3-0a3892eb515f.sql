-- One-off: fix Donata's quiz session that was geocoded to the wrong "Vicenza"
-- (US Virgin Islands instead of Vicenza, Italy). Reset coords + clear derived data
-- so the chart and report can be regenerated cleanly.
UPDATE public.quiz_sessions
SET
  birth_place = 'Vicenza, Italia',
  birth_lat = 45.5488306,
  birth_lng = 11.5478825,
  birth_timezone = 1,
  natal_chart = NULL,
  natal_chart_svg = NULL,
  natal_chart_png = NULL,
  full_report = NULL,
  teaser_insights = NULL,
  llm_input = NULL,
  llm_output = NULL,
  insights_started_at = NULL,
  insights_completed_at = NULL,
  processing_status = 'pending',
  processing_error = NULL
WHERE id = '31321db7-5f05-431a-84d7-c16b498ea3e3';