-- Add countdown_description column to seasons table
ALTER TABLE public.seasons
ADD COLUMN countdown_description TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.seasons.countdown_description IS 'Custom countdown description for this season, displayed on the home page above the countdown timer';
