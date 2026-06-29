-- AI-suggested report attachments for a support ticket. Shape:
--   [{ "kind": "natal", "session_id": "uuid", "label": "Carta natal" }]
-- The drafter pre-fills this when a matched customer asks for / can't access
-- their report; the operator edits the selection in /admin/support before Send.
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;
