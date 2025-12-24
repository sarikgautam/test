-- Create player_season_registrations table for per-season auction data
CREATE TABLE public.player_season_registrations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    auction_status VARCHAR(20) NOT NULL DEFAULT 'registered' CHECK (auction_status IN ('registered', 'sold', 'unsold')),
    base_price NUMERIC NOT NULL DEFAULT 10000,
    sold_price NUMERIC,
    jersey_number INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(player_id, season_id)
);

-- Enable RLS
ALTER TABLE public.player_season_registrations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view registrations" 
ON public.player_season_registrations 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert registrations" 
ON public.player_season_registrations 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update registrations" 
ON public.player_season_registrations 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete registrations" 
ON public.player_season_registrations 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow players to register themselves for a season
CREATE POLICY "Anyone can register for season" 
ON public.player_season_registrations 
FOR INSERT 
WITH CHECK (true);

-- Migrate existing player data to player_season_registrations
INSERT INTO public.player_season_registrations (player_id, season_id, team_id, auction_status, base_price, sold_price, jersey_number)
SELECT 
    id as player_id,
    COALESCE(season_id, '00000000-0000-0000-0000-000000000002') as season_id,
    team_id,
    auction_status::varchar,
    base_price,
    sold_price,
    jersey_number
FROM public.players
WHERE season_id IS NOT NULL;

-- Now we can remove season-specific columns from players table
-- But first, let's keep season_id as "registration_season" for historical reference
-- We'll drop the columns that are now in player_season_registrations
ALTER TABLE public.players DROP COLUMN IF EXISTS auction_status;
ALTER TABLE public.players DROP COLUMN IF EXISTS sold_price;
ALTER TABLE public.players DROP COLUMN IF EXISTS jersey_number;

-- Rename season_id to original_season_id to keep track of when they first registered
ALTER TABLE public.players RENAME COLUMN season_id TO original_season_id;

-- Add trigger for updated_at on player_season_registrations
CREATE TRIGGER update_player_season_registrations_updated_at
BEFORE UPDATE ON public.player_season_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();