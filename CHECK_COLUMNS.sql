-- Check existing columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'player_season_registrations' 
AND table_schema = 'public'
ORDER BY ordinal_position;
