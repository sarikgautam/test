-- Update base_price default to match the code
ALTER TABLE public.player_season_registrations 
ALTER COLUMN base_price SET DEFAULT 20;
