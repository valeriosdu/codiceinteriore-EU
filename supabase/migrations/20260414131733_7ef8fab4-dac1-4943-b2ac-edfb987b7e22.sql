
-- Create private storage bucket for report PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-pdfs', 'report-pdfs', false);

-- Users can download their own PDFs
CREATE POLICY "Users can read own report PDFs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'report-pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);
