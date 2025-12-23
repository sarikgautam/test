-- Add new columns to players table for comprehensive registration
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS current_team TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_email TEXT,
ADD COLUMN IF NOT EXISTS payment_receipt_url TEXT;

-- Add bank details column to tournament_settings (stored encrypted/securely)
ALTER TABLE public.tournament_settings
ADD COLUMN IF NOT EXISTS bank_details TEXT;

-- Create storage bucket for player profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('player-photos', 'player-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for payment receipts (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for player-photos bucket (public read, anyone can upload)
CREATE POLICY "Anyone can view player photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'player-photos');

CREATE POLICY "Anyone can upload player photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'player-photos');

-- RLS policies for payment-receipts bucket (admin only view, anyone can upload)
CREATE POLICY "Anyone can upload payment receipts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-receipts');

CREATE POLICY "Admins can view payment receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-receipts' AND public.has_role(auth.uid(), 'admin'));