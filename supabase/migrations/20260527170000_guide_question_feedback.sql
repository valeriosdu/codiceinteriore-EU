alter table public.astrology_guide_questions
  add column if not exists feedback text
  check (feedback in ('up', 'down'));

alter table public.astrology_guide_questions
  add column if not exists feedback_comment text;
