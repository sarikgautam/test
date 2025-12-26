-- Add missing columns to player_stats table for dismissal tracking
ALTER TABLE public.player_stats 
ADD COLUMN IF NOT EXISTS dismissal_type text,
ADD COLUMN IF NOT EXISTS bowler_id uuid REFERENCES public.players(id),
ADD COLUMN IF NOT EXISTS fielder_id uuid REFERENCES public.players(id),
ADD COLUMN IF NOT EXISTS runout_by_id uuid REFERENCES public.players(id),
ADD COLUMN IF NOT EXISTS batting_order integer;

-- Add indexes for the new foreign key columns
CREATE INDEX IF NOT EXISTS idx_player_stats_bowler_id ON public.player_stats(bowler_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_fielder_id ON public.player_stats(fielder_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_runout_by_id ON public.player_stats(runout_by_id);