-- Add missing dismissal_other_text column
ALTER TABLE public.player_stats 
ADD COLUMN IF NOT EXISTS dismissal_other_text text;