-- Add bowling_order column to player_stats for sorting bowlers
ALTER TABLE public.player_stats
ADD COLUMN IF NOT EXISTS bowling_order INTEGER;
