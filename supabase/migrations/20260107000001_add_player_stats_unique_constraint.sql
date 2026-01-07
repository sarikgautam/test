-- Add unique constraint on (player_id, match_id) for proper upsert operations
ALTER TABLE public.player_stats
ADD CONSTRAINT player_stats_player_id_match_id_unique UNIQUE (player_id, match_id);
