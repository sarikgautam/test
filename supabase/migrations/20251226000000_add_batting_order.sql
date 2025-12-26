-- Add batting_order column to player_stats for scorecard ordering
ALTER TABLE public.player_stats ADD COLUMN batting_order INTEGER;

-- Create index for better query performance
CREATE INDEX idx_player_stats_batting_order ON public.player_stats(match_id, batting_order);
