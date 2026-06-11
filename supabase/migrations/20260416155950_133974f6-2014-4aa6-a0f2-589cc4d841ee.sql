CREATE POLICY "Service role can read all report PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'report-pdfs' AND auth.role() = 'service_role');