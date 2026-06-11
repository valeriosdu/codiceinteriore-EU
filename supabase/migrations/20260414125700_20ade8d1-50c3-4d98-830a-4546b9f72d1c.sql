
CREATE TABLE public.contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  reason text,
  CONSTRAINT name_length CHECK (char_length(name) <= 255),
  CONSTRAINT email_length CHECK (char_length(email) <= 255),
  CONSTRAINT message_length CHECK (char_length(message) <= 5000)
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert contact submissions"
  ON public.contact_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Service role can read contact submissions"
  ON public.contact_submissions
  FOR SELECT
  TO authenticated
  USING (auth.role() = 'service_role');
