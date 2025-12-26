-- Drop if exists
DROP TABLE IF EXISTS public.registration_submissions CASCADE;

-- Create table
CREATE TABLE public.registration_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    date_of_birth DATE,
    address TEXT,
    role VARCHAR(50),
    batting_style VARCHAR(50),
    bowling_style VARCHAR(50),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    emergency_contact_email VARCHAR(255),
    payment_receipt_url TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    admin_notes TEXT,
    linked_player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_registration_submissions_season ON public.registration_submissions (season_id);
CREATE INDEX idx_registration_submissions_status ON public.registration_submissions (status);
CREATE INDEX idx_registration_submissions_email ON public.registration_submissions (email);

-- Enable RLS
ALTER TABLE public.registration_submissions ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies
CREATE POLICY "registration_submissions_insert_policy" 
ON public.registration_submissions 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "registration_submissions_select_policy" 
ON public.registration_submissions 
FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "registration_submissions_update_policy" 
ON public.registration_submissions 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "registration_submissions_delete_policy" 
ON public.registration_submissions 
FOR DELETE 
TO authenticated 
USING (true);
