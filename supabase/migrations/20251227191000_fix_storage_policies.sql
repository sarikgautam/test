-- Fix storage bucket policies for authenticated users

-- Owners bucket
DROP POLICY IF EXISTS "Admins can upload owner images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update owner images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete owner images" ON storage.objects;

CREATE POLICY "Authenticated users can upload to owners"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'owners');

CREATE POLICY "Authenticated users can update owners"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'owners');

CREATE POLICY "Authenticated users can delete from owners"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'owners');

-- Sponsors bucket
CREATE POLICY "Authenticated users can upload to sponsors"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'sponsors');

CREATE POLICY "Authenticated users can update sponsors"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'sponsors');

CREATE POLICY "Authenticated users can delete from sponsors"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'sponsors');

-- Gallery bucket
CREATE POLICY "Authenticated users can upload to gallery"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'gallery');

CREATE POLICY "Authenticated users can update gallery"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'gallery');

CREATE POLICY "Authenticated users can delete from gallery"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'gallery');

-- News bucket
CREATE POLICY "Authenticated users can upload to news"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'news');

CREATE POLICY "Authenticated users can update news"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'news');

CREATE POLICY "Authenticated users can delete from news"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'news');

-- Player photos bucket
CREATE POLICY "Authenticated users can upload to player-photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'player-photos');

CREATE POLICY "Authenticated users can update player-photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'player-photos');

CREATE POLICY "Authenticated users can delete from player-photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'player-photos');

-- Payment receipts bucket
CREATE POLICY "Authenticated users can upload to payment-receipts"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'payment-receipts');

CREATE POLICY "Authenticated users can update payment-receipts"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'payment-receipts');

CREATE POLICY "Authenticated users can delete from payment-receipts"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'payment-receipts');

-- Allow authenticated users (admins) to view payment receipts
CREATE POLICY "Authenticated users can view payment-receipts"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'payment-receipts');
