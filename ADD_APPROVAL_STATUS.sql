-- Add approval status to player_season_registrations
ALTER TABLE public.player_season_registrations 
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'need_more_info'));

ALTER TABLE public.player_season_registrations 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

ALTER TABLE public.player_season_registrations 
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.player_season_registrations 
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);

-- Create index for approval status
CREATE INDEX IF NOT EXISTS idx_player_season_registrations_approval_status 
ON public.player_season_registrations (approval_status);
