-- Create storage bucket for match scorecards
INSERT INTO storage.buckets (id, name, public)
VALUES ('scorecards', 'scorecards', true)
ON CONFLICT (id) DO NOTHING;

-- Enable public access to scorecard PDFs
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'scorecards');

-- Allow authenticated admins to upload scorecards
CREATE POLICY "Admin Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'scorecards' 
  AND auth.role() = 'authenticated'
  AND (auth.jwt() ->> 'user_role' = 'admin' OR auth.uid() IN (SELECT id FROM auth.users WHERE email LIKE '%@admin%'))
);

-- Allow admins to delete scorecards
CREATE POLICY "Admin Delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'scorecards'
  AND auth.role() = 'authenticated'
  AND (auth.jwt() ->> 'user_role' = 'admin' OR auth.uid() IN (SELECT id FROM auth.users WHERE email LIKE '%@admin%'))
);
