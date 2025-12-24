-- Create seasons table
CREATE TABLE public.seasons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  registration_open BOOLEAN NOT NULL DEFAULT false,
  auction_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on seasons
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

-- RLS policies for seasons
CREATE POLICY "Anyone can view seasons" ON public.seasons FOR SELECT USING (true);
CREATE POLICY "Admins can insert seasons" ON public.seasons FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update seasons" ON public.seasons FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete seasons" ON public.seasons FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Add season_id to players table
ALTER TABLE public.players ADD COLUMN season_id UUID REFERENCES public.seasons(id);

-- Add season_id to matches table  
ALTER TABLE public.matches ADD COLUMN season_id UUID REFERENCES public.seasons(id);

-- Add season_id to standings table
ALTER TABLE public.standings ADD COLUMN season_id UUID REFERENCES public.seasons(id);

-- Add season_id to player_stats table
ALTER TABLE public.player_stats ADD COLUMN season_id UUID REFERENCES public.seasons(id);

-- Create trigger for seasons updated_at
CREATE TRIGGER update_seasons_updated_at
  BEFORE UPDATE ON public.seasons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert Season 1 (completed) and set existing data to it
INSERT INTO public.seasons (id, name, year, is_active, registration_open)
VALUES ('00000000-0000-0000-0000-000000000001', 'Season 1', 2024, false, false);

-- Insert Season 2 (current active season)
INSERT INTO public.seasons (id, name, year, is_active, registration_open)
VALUES ('00000000-0000-0000-0000-000000000002', 'Season 2', 2025, true, true);

-- Migrate existing data to Season 1
UPDATE public.players SET season_id = '00000000-0000-0000-0000-000000000001' WHERE season_id IS NULL;
UPDATE public.matches SET season_id = '00000000-0000-0000-0000-000000000001' WHERE season_id IS NULL;
UPDATE public.standings SET season_id = '00000000-0000-0000-0000-000000000001' WHERE season_id IS NULL;
UPDATE public.player_stats SET season_id = '00000000-0000-0000-0000-000000000001' WHERE season_id IS NULL;

-- Remove registration_open and auction_date from tournament_settings (moved to seasons)
-- We'll keep tournament_settings for global settings like bank_details, tournament_name etc.