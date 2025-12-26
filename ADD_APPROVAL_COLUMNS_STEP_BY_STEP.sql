-- Add approval columns to player_season_registrations (one at a time)
ALTER TABLE public.player_season_registrations 
ADD COLUMN approval_status VARCHAR(20) DEFAULT 'approved';

ALTER TABLE public.player_season_registrations 
ADD COLUMN admin_notes TEXT;

ALTER TABLE public.player_season_registrations 
ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.player_season_registrations 
ADD COLUMN reviewed_by UUID;

-- Add check constraint
ALTER TABLE public.player_season_registrations 
ADD CONSTRAINT player_season_registrations_approval_status_check 
CHECK (approval_status IN ('pending', 'approved', 'rejected', 'need_more_info'));

-- Create index
CREATE INDEX idx_player_season_registrations_approval_status 
ON public.player_season_registrations (approval_status);
