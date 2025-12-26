-- Create registration_submissions table - SIMPLIFIED VERSION
DROP TABLE IF EXISTS public.registration_submissions CASCADE;

CREATE TABLE public.registration_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL,
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
    linked_player_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_registration_submissions_season ON public.registration_submissions (season_id);
CREATE INDEX idx_registration_submissions_status ON public.registration_submissions (status);
CREATE INDEX idx_registration_submissions_email ON public.registration_submissions (email);

-- NO RLS FOR NOW - just for testing
ALTER TABLE public.registration_submissions DISABLE ROW LEVEL SECURITY;
