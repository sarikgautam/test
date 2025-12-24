-- Create match type enum
CREATE TYPE public.match_type AS ENUM ('group', 'eliminator', 'qualifier', 'final');

-- Add new columns for separate runs/wickets and match type
ALTER TABLE public.matches
ADD COLUMN match_stage match_type DEFAULT 'group',
ADD COLUMN home_team_runs integer DEFAULT 0,
ADD COLUMN home_team_wickets integer DEFAULT 0,
ADD COLUMN away_team_runs integer DEFAULT 0,
ADD COLUMN away_team_wickets integer DEFAULT 0;