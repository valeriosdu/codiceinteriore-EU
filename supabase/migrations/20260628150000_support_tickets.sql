-- AI customer-support autoresponder: ingest of Zoho support mail + AI draft state.
--
-- One row = one inbound customer email (a "ticket"). The poller (support-poll)
-- inserts rows from the Zoho support folder; the drafter (support-draft) triages
-- and writes an AI draft; the admin reviews/edits at /admin/support and sends the
-- reply back through Zoho (support-send). The full conversation thread lives in
-- Zoho — this table only tracks the latest inbound message + its draft + send
-- state. Multi-turn AI memory (keyed on zoho_thread_id) is a deferred enhancement.
--
-- RLS mirrors contact_submissions: service-role only, no anon/authenticated read.
-- Rows are created exclusively by the service-role poller. `market` defaults to
-- 'it' so any un-migrated path stays Italian (multi-market convention).

CREATE TABLE public.support_tickets (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),

  market               text NOT NULL DEFAULT 'it',

  -- Zoho identity (dedupe + threading)
  zoho_account_id      text NOT NULL,
  zoho_folder_id       text,
  zoho_message_id      text NOT NULL,
  zoho_thread_id       text,
  zoho_sent_message_id text,

  -- Inbound email
  from_email           text NOT NULL,
  from_name            text,
  subject              text,
  body_plain           text,
  attachment_count     integer NOT NULL DEFAULT 0,
  received_at          timestamptz,

  -- Triage (set by support-draft, or by the poll-level denylist for automated mail)
  category             text,
  triage_reason        text,

  -- Resolved customer identity (cross-email via resolve-profile.ts); nullable
  -- when the sender can't be matched to a customer.
  resolved_email       text,
  resolved_profile_id  uuid,

  -- Admin overrides (set from /admin/support). manually_linked: the admin pinned
  -- a customer, so the drafter must use resolved_email instead of auto-resolving.
  -- force_support: the admin overrode triage ("treat as a ticket"), so the
  -- drafter must not file it as spam/automated.
  manually_linked      boolean NOT NULL DEFAULT false,
  force_support        boolean NOT NULL DEFAULT false,

  -- Fallback candidate matches shown to the admin when the sender doesn't resolve.
  -- Shape: [{ "email": "...", "name": "...", "score": 1 }]
  candidate_matches    jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- AI draft
  draft_body           text,
  reply_language       text,          -- language the model detected / replied in
  data_summary         jsonb,         -- compacted account facts fed to the model (panel)
  ai_note              text,          -- model's 1-2 sentence summary to the human
  ai_confidence        text,          -- 'high' | 'medium' | 'low'
  flag_for_human       boolean NOT NULL DEFAULT false,
  model_used           text,

  -- Send
  sent_body            text,          -- final text actually sent (may be admin-edited)
  answered_at          timestamptz,
  answered_by          text DEFAULT 'admin',

  -- State machine (mirrors astrology_guide_questions). 'stale-drafting' is a
  -- derived condition (status='drafting' + old updated_at), not a status.
  status               text NOT NULL DEFAULT 'received',
  retry_count          integer NOT NULL DEFAULT 0,
  error                text,

  CONSTRAINT support_tickets_status_chk CHECK (status IN
    ('received','drafting','drafted','draft_failed','answered','ignored')),
  CONSTRAINT support_tickets_category_chk CHECK (category IS NULL OR category IN
    ('support','spam','automated','other')),
  CONSTRAINT support_tickets_subject_len CHECK (subject IS NULL OR char_length(subject) <= 1000),
  CONSTRAINT support_tickets_body_len CHECK (body_plain IS NULL OR char_length(body_plain) <= 100000)
);

-- One inbound Zoho message → one ticket, scoped per market (two markets = two
-- Zoho accounts whose message ids could in principle collide). The poller relies
-- on this for `insert ... on conflict do nothing`.
CREATE UNIQUE INDEX support_tickets_market_msg_uniq
  ON public.support_tickets (market, zoho_message_id);

CREATE INDEX support_tickets_status_created_idx
  ON public.support_tickets (status, created_at DESC);
CREATE INDEX support_tickets_category_created_idx
  ON public.support_tickets (category, created_at DESC);
CREATE INDEX support_tickets_resolved_email_idx
  ON public.support_tickets (resolved_email);

-- updated_at maintenance — reuse the project-wide trigger function.
CREATE TRIGGER support_tickets_set_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: service-role only (mirror contact_submissions). No anon/authenticated
-- policies → normal users cannot read tickets. The service-role poller/drafter
-- bypass RLS; this policy only matters for a JWT whose role is service_role.
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can read support tickets"
  ON public.support_tickets
  FOR SELECT
  TO authenticated
  USING (auth.role() = 'service_role');
