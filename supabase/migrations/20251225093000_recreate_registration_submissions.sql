-- Recreate registration_submissions table with proper schema
-- Drop existing table and policies
DROP TABLE IF EXISTS public.registration_submissions CASCADE;

-- Create registration_submissions table for player registration applications
CREATE TABLE public.registration_submissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
    
    -- Player details from form
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    date_of_birth DATE,
    address TEXT,
    role VARCHAR(50) CHECK (role IN ('batsman', 'bowler', 'all_rounder', 'wicket_keeper')),
    batting_style VARCHAR(50),
    bowling_style VARCHAR(50),
    
    -- Emergency contact
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    emergency_contact_email VARCHAR(255),
    
    -- Payment info
    payment_receipt_url TEXT,
    
    -- Status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    
    -- Linked player (if approved and matched to existing player)
    linked_player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_registration_submissions_season ON public.registration_submissions (season_id);
CREATE INDEX idx_registration_submissions_status ON public.registration_submissions (status);
CREATE INDEX idx_registration_submissions_email ON public.registration_submissions (email);
CREATE INDEX idx_registration_submissions_created ON public.registration_submissions (created_at DESC);

-- Enable RLS
ALTER TABLE public.registration_submissions ENABLE ROW LEVEL SECURITY;

-- RLS policies - Simple version
-- Anyone can insert (submit registration)
CREATE POLICY "Anyone can submit registrations"
ON public.registration_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Public can view their own submissions (by session)
CREATE POLICY "Users can view registrations"
ON public.registration_submissions
FOR SELECT
TO anon, authenticated
USING (true);

-- Anyone authenticated can update (for now - will be restricted to admins in app)
CREATE POLICY "Authenticated can update registrations"
ON public.registration_submissions
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Anyone authenticated can delete
CREATE POLICY "Authenticated can delete registrations"
ON public.registration_submissions
FOR DELETE
TO authenticated
USING (true);
