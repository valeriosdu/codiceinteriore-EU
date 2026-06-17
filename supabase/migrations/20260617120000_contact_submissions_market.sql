-- Persist the originating market on each contact form submission so that the
-- notification email is routed to the correct per-market inbox
-- (info@codiceinteriore.it for it, info@cartainterior.com for es) on BOTH the
-- client-side invoke path and the server-side trigger path
-- (notify-contact-submission reads the market from this row, never from the
-- request body — consistent with the rest of the multi-market architecture).
--
-- Default 'it' so any un-migrated/legacy insert keeps the previous behaviour.

ALTER TABLE public.contact_submissions
  ADD COLUMN IF NOT EXISTS market text NOT NULL DEFAULT 'it';
