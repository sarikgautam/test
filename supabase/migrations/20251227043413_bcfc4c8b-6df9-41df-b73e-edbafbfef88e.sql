-- Add registration_status to player_season_registrations
ALTER TABLE public.player_season_registrations 
ADD COLUMN IF NOT EXISTS registration_status VARCHAR(20) DEFAULT 'pending' CHECK (registration_status IN ('pending', 'approved', 'rejected'));

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_psr_registration_status ON public.player_season_registrations(registration_status);

-- Update existing registrations to approved (they were already in the system)
UPDATE public.player_season_registrations SET registration_status = 'approved' WHERE registration_status IS NULL OR registration_status = 'pending';