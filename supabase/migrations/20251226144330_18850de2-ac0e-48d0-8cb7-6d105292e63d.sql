-- Create function to recalculate all standings for a season
CREATE OR REPLACE FUNCTION public.recalculate_standings(p_season_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  team_record RECORD;
  match_record RECORD;
  v_wins integer;
  v_losses integer;
  v_ties integer;
  v_matches_played integer;
  v_runs_scored integer;
  v_runs_conceded integer;
  v_overs_faced numeric;
  v_overs_bowled numeric;
  v_nrr numeric;
BEGIN
  -- Loop through all teams that have standings for this season
  FOR team_record IN 
    SELECT DISTINCT team_id FROM standings WHERE season_id = p_season_id
  LOOP
    -- Reset counters
    v_wins := 0;
    v_losses := 0;
    v_ties := 0;
    v_matches_played := 0;
    v_runs_scored := 0;
    v_runs_conceded := 0;
    v_overs_faced := 0;
    v_overs_bowled := 0;

    -- Loop through all completed GROUP STAGE matches for this team
    FOR match_record IN 
      SELECT * FROM matches 
      WHERE season_id = p_season_id 
        AND status = 'completed'
        AND match_stage = 'group'
        AND (home_team_id = team_record.team_id OR away_team_id = team_record.team_id)
    LOOP
      v_matches_played := v_matches_played + 1;
      
      -- Check if this team won, lost, or tied
      IF match_record.winner_team_id = team_record.team_id THEN
        v_wins := v_wins + 1;
      ELSIF match_record.winner_team_id IS NOT NULL THEN
        v_losses := v_losses + 1;
      ELSE
        v_ties := v_ties + 1;
      END IF;

      -- Calculate runs and overs based on whether team was home or away
      IF match_record.home_team_id = team_record.team_id THEN
        -- Team batted as home team
        v_runs_scored := v_runs_scored + COALESCE(match_record.home_team_runs, 0);
        v_runs_conceded := v_runs_conceded + COALESCE(match_record.away_team_runs, 0);
        -- Overs faced = overs per side (assuming full innings unless all out)
        v_overs_faced := v_overs_faced + COALESCE(match_record.overs_per_side, 10);
        v_overs_bowled := v_overs_bowled + COALESCE(match_record.overs_per_side, 10);
      ELSE
        -- Team batted as away team
        v_runs_scored := v_runs_scored + COALESCE(match_record.away_team_runs, 0);
        v_runs_conceded := v_runs_conceded + COALESCE(match_record.home_team_runs, 0);
        v_overs_faced := v_overs_faced + COALESCE(match_record.overs_per_side, 10);
        v_overs_bowled := v_overs_bowled + COALESCE(match_record.overs_per_side, 10);
      END IF;
    END LOOP;

    -- Calculate NRR: (runs scored / overs faced) - (runs conceded / overs bowled)
    IF v_overs_faced > 0 AND v_overs_bowled > 0 THEN
      v_nrr := ROUND(((v_runs_scored::numeric / v_overs_faced) - (v_runs_conceded::numeric / v_overs_bowled))::numeric, 3);
    ELSE
      v_nrr := 0;
    END IF;

    -- Update standings for this team
    UPDATE standings
    SET 
      wins = v_wins,
      losses = v_losses,
      ties = v_ties,
      matches_played = v_matches_played,
      points = (v_wins * 2) + v_ties,  -- 2 points for win, 1 for tie
      runs_scored = v_runs_scored,
      runs_conceded = v_runs_conceded,
      overs_faced = v_overs_faced,
      overs_bowled = v_overs_bowled,
      net_run_rate = v_nrr,
      updated_at = now()
    WHERE team_id = team_record.team_id AND season_id = p_season_id;
  END LOOP;
END;
$$;

-- Create trigger function to auto-recalculate on match update
CREATE OR REPLACE FUNCTION public.trigger_recalculate_standings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Recalculate standings when a match is completed or updated
  IF NEW.status = 'completed' AND NEW.season_id IS NOT NULL THEN
    PERFORM recalculate_standings(NEW.season_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on matches table
DROP TRIGGER IF EXISTS recalculate_standings_trigger ON matches;
CREATE TRIGGER recalculate_standings_trigger
  AFTER INSERT OR UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalculate_standings();