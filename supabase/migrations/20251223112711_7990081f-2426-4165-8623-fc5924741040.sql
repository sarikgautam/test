-- Create enum for player roles
CREATE TYPE public.player_role AS ENUM ('batsman', 'bowler', 'all_rounder', 'wicket_keeper');

-- Create enum for match status
CREATE TYPE public.match_status AS ENUM ('upcoming', 'live', 'completed', 'cancelled');

-- Create enum for player auction status
CREATE TYPE public.player_auction_status AS ENUM ('registered', 'sold', 'unsold');

-- Create teams table
CREATE TABLE public.teams (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    short_name TEXT NOT NULL,
    logo_url TEXT,
    primary_color TEXT NOT NULL DEFAULT '#1e3a8a',
    secondary_color TEXT NOT NULL DEFAULT '#fbbf24',
    owner_name TEXT,
    budget DECIMAL(12,2) NOT NULL DEFAULT 1000000,
    remaining_budget DECIMAL(12,2) NOT NULL DEFAULT 1000000,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create players table
CREATE TABLE public.players (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    date_of_birth DATE,
    role player_role NOT NULL DEFAULT 'batsman',
    batting_style TEXT,
    bowling_style TEXT,
    base_price DECIMAL(12,2) NOT NULL DEFAULT 10000,
    sold_price DECIMAL(12,2),
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    auction_status player_auction_status NOT NULL DEFAULT 'registered',
    photo_url TEXT,
    jersey_number INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create matches/fixtures table
CREATE TABLE public.matches (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    match_number INTEGER NOT NULL,
    home_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    away_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    venue TEXT NOT NULL DEFAULT 'Gold Coast Cricket Ground',
    match_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status match_status NOT NULL DEFAULT 'upcoming',
    home_team_score TEXT,
    away_team_score TEXT,
    home_team_overs TEXT,
    away_team_overs TEXT,
    winner_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    man_of_match_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
    toss_winner_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    toss_decision TEXT,
    match_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create player statistics table
CREATE TABLE public.player_stats (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
    runs_scored INTEGER NOT NULL DEFAULT 0,
    balls_faced INTEGER NOT NULL DEFAULT 0,
    fours INTEGER NOT NULL DEFAULT 0,
    sixes INTEGER NOT NULL DEFAULT 0,
    overs_bowled DECIMAL(4,1) NOT NULL DEFAULT 0,
    runs_conceded INTEGER NOT NULL DEFAULT 0,
    wickets INTEGER NOT NULL DEFAULT 0,
    maidens INTEGER NOT NULL DEFAULT 0,
    catches INTEGER NOT NULL DEFAULT 0,
    stumpings INTEGER NOT NULL DEFAULT 0,
    run_outs INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(player_id, match_id)
);

-- Create standings table (auto-calculated from matches)
CREATE TABLE public.standings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL UNIQUE,
    matches_played INTEGER NOT NULL DEFAULT 0,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    ties INTEGER NOT NULL DEFAULT 0,
    no_results INTEGER NOT NULL DEFAULT 0,
    points INTEGER NOT NULL DEFAULT 0,
    net_run_rate DECIMAL(6,3) NOT NULL DEFAULT 0,
    runs_scored INTEGER NOT NULL DEFAULT 0,
    overs_faced DECIMAL(6,1) NOT NULL DEFAULT 0,
    runs_conceded INTEGER NOT NULL DEFAULT 0,
    overs_bowled DECIMAL(6,1) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tournament settings table
CREATE TABLE public.tournament_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_name TEXT NOT NULL DEFAULT 'Gold Coast Nepalese Premier League',
    season TEXT NOT NULL DEFAULT '2025',
    start_date DATE,
    end_date DATE,
    registration_open BOOLEAN NOT NULL DEFAULT true,
    auction_date TIMESTAMP WITH TIME ZONE,
    max_players_per_team INTEGER NOT NULL DEFAULT 15,
    min_players_per_team INTEGER NOT NULL DEFAULT 11,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_settings ENABLE ROW LEVEL SECURITY;

-- Create public read policies (everyone can view)
CREATE POLICY "Anyone can view teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Anyone can view players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Anyone can view matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Anyone can view player stats" ON public.player_stats FOR SELECT USING (true);
CREATE POLICY "Anyone can view standings" ON public.standings FOR SELECT USING (true);
CREATE POLICY "Anyone can view tournament settings" ON public.tournament_settings FOR SELECT USING (true);

-- Allow public player registration (insert only for players table)
CREATE POLICY "Anyone can register as player" ON public.players FOR INSERT WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for timestamp updates
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON public.players FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_standings_updated_at BEFORE UPDATE ON public.standings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tournament_settings_updated_at BEFORE UPDATE ON public.tournament_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default tournament settings
INSERT INTO public.tournament_settings (tournament_name, season, registration_open) VALUES ('Gold Coast Nepalese Premier League', '2025', true);

-- Enable realtime for matches (for live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.standings;