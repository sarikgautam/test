-- Delete duplicate player_stats, keeping only the most recent one
DELETE FROM public.player_stats a
USING public.player_stats b
WHERE a.id < b.id
  AND a.player_id = b.player_id
  AND a.match_id = b.match_id;
