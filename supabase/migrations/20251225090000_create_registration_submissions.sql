-- Create registration_submissions table for player registration applications
CREATE TABLE IF NOT EXISTS public.registration_submissions (
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

-- RLS policies
CREATE POLICY "Anyone can submit registrations"
ON public.registration_submissions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all submissions"
ON public.registration_submissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admins can update submissions"
ON public.registration_submissions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admins can delete submissions"
ON public.registration_submissions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- Trigger for updated_at (if the function exists)
-- Uncomment if update_updated_at_column function is available
-- CREATE TRIGGER update_registration_submissions_updated_at
-- BEFORE UPDATE ON public.registration_submissions
-- FOR EACH ROW
-- EXECUTE FUNCTION public.update_updated_at_column();
