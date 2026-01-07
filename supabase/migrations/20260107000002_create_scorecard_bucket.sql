-- Create storage bucket for match scorecards
INSERT INTO storage.buckets (id, name, public)
VALUES ('scorecards', 'scorecards', true)
ON CONFLICT (id) DO NOTHING;

-- Enable public access to scorecard PDFs
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'scorecards');

-- Allow anyone to upload scorecards (since it's admin panel)
CREATE POLICY "Allow Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'scorecards');

-- Allow admins to delete scorecards
CREATE POLICY "Allow Delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'scorecards');
