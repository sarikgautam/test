-- Cricket Scoring System - Full International Standard
-- Ball-by-ball tracking with all ICC features

-- Match Innings Table
CREATE TABLE IF NOT EXISTS public.match_innings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  innings_number INTEGER NOT NULL, -- 1, 2, 3, 4
  batting_team_id UUID NOT NULL REFERENCES public.teams(id),
  bowling_team_id UUID NOT NULL REFERENCES public.teams(id),
  total_runs INTEGER DEFAULT 0,
  total_wickets INTEGER DEFAULT 0,
  total_overs NUMERIC(4,1) DEFAULT 0.0,
  extras_total INTEGER DEFAULT 0,
  extras_wides INTEGER DEFAULT 0,
  extras_noballs INTEGER DEFAULT 0,
  extras_byes INTEGER DEFAULT 0,
  extras_legbyes INTEGER DEFAULT 0,
  extras_penalty INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  target_runs INTEGER NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, innings_number)
);

-- Balls Table - Every ball bowled
CREATE TABLE IF NOT EXISTS public.balls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  innings_id UUID NOT NULL REFERENCES public.match_innings(id) ON DELETE CASCADE,
  over_number INTEGER NOT NULL,
  ball_number INTEGER NOT NULL, -- 1-6 for normal, 7+ for extras
  striker_id UUID NOT NULL REFERENCES public.players(id),
  non_striker_id UUID NOT NULL REFERENCES public.players(id),
  bowler_id UUID NOT NULL REFERENCES public.players(id),
  
  -- Ball outcome
  runs_off_bat INTEGER DEFAULT 0,
  extras_type VARCHAR(20) NULL, -- 'wide', 'noball', 'bye', 'legbye', 'penalty'
  extras_runs INTEGER DEFAULT 0,
  total_runs INTEGER DEFAULT 0, -- runs_off_bat + extras_runs
  
  -- Wicket details
  is_wicket BOOLEAN DEFAULT FALSE,
  dismissal_type VARCHAR(30) NULL, -- 'bowled', 'caught', 'lbw', 'run_out', 'stumped', 'hit_wicket', 'obstructing', 'timed_out', 'retired_out', 'retired_hurt'
  dismissed_player_id UUID NULL REFERENCES public.players(id),
  fielder_id UUID NULL REFERENCES public.players(id),
  fielder2_id UUID NULL REFERENCES public.players(id), -- For run outs
  
  -- Ball characteristics
  is_legal_delivery BOOLEAN DEFAULT TRUE, -- false for wides/noballs
  is_boundary BOOLEAN DEFAULT FALSE,
  boundary_type VARCHAR(10) NULL, -- 'four', 'six'
  
  -- Commentary
  commentary TEXT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ball_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Partnerships Table
CREATE TABLE IF NOT EXISTS public.partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  innings_id UUID NOT NULL REFERENCES public.match_innings(id) ON DELETE CASCADE,
  batsman1_id UUID NOT NULL REFERENCES public.players(id),
  batsman2_id UUID NOT NULL REFERENCES public.players(id),
  wicket_number INTEGER NOT NULL, -- 1st wicket, 2nd wicket, etc.
  runs INTEGER DEFAULT 0,
  balls INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  ended_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fall of Wickets Table
CREATE TABLE IF NOT EXISTS public.fall_of_wickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  innings_id UUID NOT NULL REFERENCES public.match_innings(id) ON DELETE CASCADE,
  wicket_number INTEGER NOT NULL,
  runs_at_fall INTEGER NOT NULL,
  overs_at_fall NUMERIC(4,1) NOT NULL,
  batsman_out_id UUID NOT NULL REFERENCES public.players(id),
  dismissal_type VARCHAR(30) NOT NULL,
  bowler_id UUID NULL REFERENCES public.players(id),
  fielder_id UUID NULL REFERENCES public.players(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Batting Performance Table (cached stats)
CREATE TABLE IF NOT EXISTS public.batting_innings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  innings_id UUID NOT NULL REFERENCES public.match_innings(id) ON DELETE CASCADE,
  batsman_id UUID NOT NULL REFERENCES public.players(id),
  runs_scored INTEGER DEFAULT 0,
  balls_faced INTEGER DEFAULT 0,
  fours INTEGER DEFAULT 0,
  sixes INTEGER DEFAULT 0,
  strike_rate NUMERIC(5,2) DEFAULT 0,
  is_out BOOLEAN DEFAULT FALSE,
  dismissal_type VARCHAR(30) NULL,
  position INTEGER NOT NULL, -- batting order
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(innings_id, batsman_id)
);

-- Bowling Performance Table (cached stats)
CREATE TABLE IF NOT EXISTS public.bowling_innings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  innings_id UUID NOT NULL REFERENCES public.match_innings(id) ON DELETE CASCADE,
  bowler_id UUID NOT NULL REFERENCES public.players(id),
  overs_bowled NUMERIC(4,1) DEFAULT 0,
  maidens INTEGER DEFAULT 0,
  runs_conceded INTEGER DEFAULT 0,
  wickets INTEGER DEFAULT 0,
  wides INTEGER DEFAULT 0,
  noballs INTEGER DEFAULT 0,
  economy_rate NUMERIC(4,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(innings_id, bowler_id)
);

-- Toss Table
CREATE TABLE IF NOT EXISTS public.match_toss (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE UNIQUE,
  toss_won_by UUID NOT NULL REFERENCES public.teams(id),
  elected_to VARCHAR(10) NOT NULL, -- 'bat' or 'field'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_balls_innings ON public.balls(innings_id);
CREATE INDEX IF NOT EXISTS idx_balls_over ON public.balls(innings_id, over_number);
CREATE INDEX IF NOT EXISTS idx_partnerships_innings ON public.partnerships(innings_id);
CREATE INDEX IF NOT EXISTS idx_batting_innings ON public.batting_innings(innings_id);
CREATE INDEX IF NOT EXISTS idx_bowling_innings ON public.bowling_innings(innings_id);

-- Function to update batting stats
CREATE OR REPLACE FUNCTION update_batting_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert batting stats
  INSERT INTO public.batting_innings (innings_id, batsman_id, runs_scored, balls_faced, fours, sixes, position)
  VALUES (
    NEW.innings_id,
    NEW.striker_id,
    NEW.runs_off_bat,
    CASE WHEN NEW.is_legal_delivery THEN 1 ELSE 0 END,
    CASE WHEN NEW.boundary_type = 'four' THEN 1 ELSE 0 END,
    CASE WHEN NEW.boundary_type = 'six' THEN 1 ELSE 0 END,
    1
  )
  ON CONFLICT (innings_id, batsman_id)
  DO UPDATE SET
    runs_scored = batting_innings.runs_scored + NEW.runs_off_bat,
    balls_faced = batting_innings.balls_faced + CASE WHEN NEW.is_legal_delivery THEN 1 ELSE 0 END,
    fours = batting_innings.fours + CASE WHEN NEW.boundary_type = 'four' THEN 1 ELSE 0 END,
    sixes = batting_innings.sixes + CASE WHEN NEW.boundary_type = 'six' THEN 1 ELSE 0 END,
    strike_rate = CASE 
      WHEN batting_innings.balls_faced + CASE WHEN NEW.is_legal_delivery THEN 1 ELSE 0 END > 0 
      THEN ((batting_innings.runs_scored + NEW.runs_off_bat)::NUMERIC / 
            (batting_innings.balls_faced + CASE WHEN NEW.is_legal_delivery THEN 1 ELSE 0 END)) * 100
      ELSE 0 
    END;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update bowling stats
CREATE OR REPLACE FUNCTION update_bowling_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.bowling_innings (innings_id, bowler_id)
  VALUES (NEW.innings_id, NEW.bowler_id)
  ON CONFLICT (innings_id, bowler_id)
  DO UPDATE SET
    runs_conceded = bowling_innings.runs_conceded + NEW.total_runs,
    wickets = bowling_innings.wickets + CASE WHEN NEW.is_wicket THEN 1 ELSE 0 END,
    wides = bowling_innings.wides + CASE WHEN NEW.extras_type = 'wide' THEN 1 ELSE 0 END,
    noballs = bowling_innings.noballs + CASE WHEN NEW.extras_type = 'noball' THEN 1 ELSE 0 END,
    overs_bowled = (
      SELECT COUNT(*) FILTER (WHERE is_legal_delivery = TRUE) / 6.0 +
             (COUNT(*) FILTER (WHERE is_legal_delivery = TRUE) % 6) / 10.0
      FROM balls
      WHERE innings_id = NEW.innings_id AND bowler_id = NEW.bowler_id
    ),
    economy_rate = CASE
      WHEN (
        SELECT COUNT(*) FILTER (WHERE is_legal_delivery = TRUE) 
        FROM balls 
        WHERE innings_id = NEW.innings_id AND bowler_id = NEW.bowler_id
      ) >= 6
      THEN (
        (bowling_innings.runs_conceded + NEW.total_runs)::NUMERIC /
        ((SELECT COUNT(*) FILTER (WHERE is_legal_delivery = TRUE) 
          FROM balls 
          WHERE innings_id = NEW.innings_id AND bowler_id = NEW.bowler_id) / 6.0)
      )
      ELSE 0
    END;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS trigger_update_batting_stats ON public.balls;
CREATE TRIGGER trigger_update_batting_stats
  AFTER INSERT ON public.balls
  FOR EACH ROW
  EXECUTE FUNCTION update_batting_stats();

DROP TRIGGER IF EXISTS trigger_update_bowling_stats ON public.balls;
CREATE TRIGGER trigger_update_bowling_stats
  AFTER INSERT ON public.balls
  FOR EACH ROW
  EXECUTE FUNCTION update_bowling_stats();

-- Update match_innings stats trigger
CREATE OR REPLACE FUNCTION update_innings_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.match_innings
  SET
    total_runs = total_runs + NEW.total_runs,
    total_wickets = total_wickets + CASE WHEN NEW.is_wicket THEN 1 ELSE 0 END,
    extras_total = extras_total + NEW.extras_runs,
    extras_wides = extras_wides + CASE WHEN NEW.extras_type = 'wide' THEN NEW.extras_runs ELSE 0 END,
    extras_noballs = extras_noballs + CASE WHEN NEW.extras_type = 'noball' THEN 1 ELSE 0 END,
    extras_byes = extras_byes + CASE WHEN NEW.extras_type = 'bye' THEN NEW.extras_runs ELSE 0 END,
    extras_legbyes = extras_legbyes + CASE WHEN NEW.extras_type = 'legbye' THEN NEW.extras_runs ELSE 0 END,
    updated_at = NOW()
  WHERE id = NEW.innings_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_innings_totals ON public.balls;
CREATE TRIGGER trigger_update_innings_totals
  AFTER INSERT ON public.balls
  FOR EACH ROW
  EXECUTE FUNCTION update_innings_totals();
