-- Add countdown_description column to tournament_settings
ALTER TABLE public.tournament_settings 
ADD COLUMN countdown_description text DEFAULT 'Get ready for the most exciting cricket tournament!';