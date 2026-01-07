-- ⚠️ WARNING: This will DELETE ALL DATA! 

-- Drop tables in correct order 

DROP TABLE IF EXISTS public.player_stats CASCADE; 

DROP TABLE IF EXISTS public.match_awards CASCADE; 

DROP TABLE IF EXISTS public.live_auction CASCADE; 

DROP TABLE IF EXISTS public.player_season_registrations CASCADE; 

DROP TABLE IF EXISTS public.standings CASCADE; 

DROP TABLE IF EXISTS public.matches CASCADE; 

DROP TABLE IF EXISTS public.gallery CASCADE; 

DROP TABLE IF EXISTS public.news CASCADE; 

DROP TABLE IF EXISTS public.sponsors CASCADE; 

DROP TABLE IF EXISTS public.players CASCADE; 

DROP TABLE IF EXISTS public.teams CASCADE; 

DROP TABLE IF EXISTS public.owners CASCADE; 

DROP TABLE IF EXISTS public.seasons CASCADE; 

DROP TABLE IF EXISTS public.award_types CASCADE; 

DROP TABLE IF EXISTS public.contact_info CASCADE; 

DROP TABLE IF EXISTS public.contact_messages CASCADE; 

DROP TABLE IF EXISTS public.tournament_settings CASCADE; 

DROP TABLE IF EXISTS public.user_roles CASCADE; 

  

-- Drop existing types and functions 

DROP FUNCTION IF EXISTS public.has_role CASCADE; 

DROP FUNCTION IF EXISTS public.recalculate_standings CASCADE; 

DROP TYPE IF EXISTS public.app_role CASCADE; 

DROP TYPE IF EXISTS public.player_role CASCADE; 

DROP TYPE IF EXISTS public.match_status CASCADE; 

DROP TYPE IF EXISTS public.match_type CASCADE; 

  

-- ===================== 

-- 1. CREATE ENUMS 

-- ===================== 

CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user'); 

CREATE TYPE public.player_role AS ENUM ('batsman', 'bowler', 'all_rounder', 'wicket_keeper'); 

CREATE TYPE public.match_status AS ENUM ('upcoming', 'live', 'completed', 'cancelled'); 

CREATE TYPE public.match_type AS ENUM ('group', 'semifinal', 'final', 'qualifier'); 

  

-- ===================== 

-- 2. CREATE ALL TABLES FIRST 

-- ===================== 

  

-- User Roles (MUST be first for has_role function) 

CREATE TABLE public.user_roles ( 

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 

  user_id UUID NOT NULL, 

  role app_role NOT NULL, 

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), 

  UNIQUE (user_id, role) 

); 

  

-- Seasons 

CREATE TABLE public.seasons ( 

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 

  name TEXT NOT NULL, 

  year INTEGER NOT NULL, 

  start_date DATE, 

  end_date DATE, 

  auction_date TIMESTAMPTZ, 

  is_active BOOLEAN NOT NULL DEFAULT false, 

  registration_open BOOLEAN NOT NULL DEFAULT false, 

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), 

  updated_at TIMESTAMPTZ NOT NULL DEFAULT now() 

); 

  

-- Owners 

CREATE TABLE public.owners ( 

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 

  name TEXT NOT NULL, 

  description TEXT, 

  photo_url TEXT, 

  phone TEXT, 

  email TEXT, 

  business_name TEXT, 

  business_description TEXT, 

  business_logo_url TEXT, 

  business_website TEXT, 

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), 

  updated_at TIMESTAMPTZ NOT NULL DEFAULT now() 

); 

  

-- Teams 

CREATE TABLE public.teams ( 

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 

  name TEXT NOT NULL, 

  short_name TEXT NOT NULL, 

  logo_url TEXT, 

  primary_color TEXT NOT NULL DEFAULT '#1e3a8a', 

  secondary_color TEXT NOT NULL DEFAULT '#fbbf24', 

  owner_id UUID REFERENCES public.owners(id), 

  owner_name TEXT, 

  manager_name TEXT, 

  captain_id UUID, 

  description TEXT, 

  budget NUMERIC NOT NULL DEFAULT 1000000, 

  remaining_budget NUMERIC NOT NULL DEFAULT 1000000, 

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), 

  updated_at TIMESTAMPTZ NOT NULL DEFAULT now() 

); 

  

-- Players 

CREATE TABLE public.players ( 

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 

  full_name TEXT NOT NULL, 

  email TEXT NOT NULL, 

  phone TEXT, 

  role player_role NOT NULL DEFAULT 'batsman', 

  date_of_birth DATE, 

  batting_style TEXT, 

  bowling_style TEXT, 

  photo_url TEXT, 

  address TEXT, 

  current_team TEXT, 

  team_id UUID REFERENCES public.teams(id), 

  base_price NUMERIC NOT NULL DEFAULT 10000, 

  original_season_id UUID REFERENCES public.seasons(id), 

  emergency_contact_name TEXT, 

  emergency_contact_phone TEXT, 

  emergency_contact_email TEXT, 

  payment_receipt_url TEXT, 

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), 

  updated_at TIMESTAMPTZ NOT NULL DEFAULT now() 

); 

  

-- Player Season Registrations 

CREATE TABLE public.player_season_registrations ( 

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 

  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE, 

  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE, 

  team_id UUID REFERENCES public.teams(id), 

  base_price NUMERIC NOT NULL DEFAULT 10000, 

  sold_price NUMERIC, 

  auction_status VARCHAR NOT NULL DEFAULT 'registered', 

  jersey_number INTEGER, 

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), 

  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), 

  UNIQUE (player_id, season_id) 

); 

  

-- Matches 

CREATE TABLE public.matches ( 

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 

  match_number INTEGER NOT NULL, 

  season_id UUID REFERENCES public.seasons(id), 

  home_team_id UUID NOT NULL REFERENCES public.teams(id), 

  away_team_id UUID NOT NULL REFERENCES public.teams(id), 

  match_date TIMESTAMPTZ NOT NULL, 

  venue TEXT NOT NULL DEFAULT 'Gold Coast Cricket Ground', 

  status match_status NOT NULL DEFAULT 'upcoming', 

  match_stage match_type DEFAULT 'group', 

  overs_per_side INTEGER DEFAULT 20, 

  home_team_runs INTEGER DEFAULT 0, 

  home_team_wickets INTEGER DEFAULT 0, 

  home_team_overs TEXT, 

  home_team_score TEXT, 

  away_team_runs INTEGER DEFAULT 0, 

  away_team_wickets INTEGER DEFAULT 0, 

  away_team_overs TEXT, 

  away_team_score TEXT, 

  toss_winner_id UUID REFERENCES public.teams(id), 

  toss_decision TEXT, 

  winner_team_id UUID REFERENCES public.teams(id), 

  man_of_match_id UUID REFERENCES public.players(id), 

  match_summary TEXT, 

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), 

  updated_at TIMESTAMPTZ NOT NULL DEFAULT now() 

); 

  

-- Player Stats 

CREATE TABLE public.player_stats ( 

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 

  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE, 

  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE, 

  season_id UUID REFERENCES public.seasons(id), 

  runs_scored INTEGER NOT NULL DEFAULT 0, 

  balls_faced INTEGER NOT NULL DEFAULT 0, 

  fours INTEGER NOT NULL DEFAULT 0, 

  sixes INTEGER NOT NULL DEFAULT 0, 

  wickets INTEGER NOT NULL DEFAULT 0, 

  overs_bowled NUMERIC NOT NULL DEFAULT 0, 

  runs_conceded INTEGER NOT NULL DEFAULT 0, 

  maidens INTEGER NOT NULL DEFAULT 0, 

  catches INTEGER NOT NULL DEFAULT 0, 

  stumpings INTEGER NOT NULL DEFAULT 0, 

  run_outs INTEGER NOT NULL DEFAULT 0, 

  batting_order INTEGER, 

  dismissal_type TEXT, 

  dismissal_other_text TEXT, 

  bowler_id UUID REFERENCES public.players(id), 

  fielder_id UUID REFERENCES public.players(id), 

  runout_by_id UUID REFERENCES public.players(id), 

  created_at TIMESTAMPTZ NOT NULL DEFAULT now() 

); 

  

-- Standings 

CREATE TABLE public.standings ( 

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 

  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE, 

  season_id UUID REFERENCES public.seasons(id), 

  matches_played INTEGER NOT NULL DEFAULT 0, 

  wins INTEGER NOT NULL DEFAULT 0, 

  losses INTEGER NOT NULL DEFAULT 0, 

  ties INTEGER NOT NULL DEFAULT 0, 

  no_results INTEGER NOT NULL DEFAULT 0, 

  points INTEGER NOT NULL DEFAULT 0, 

  runs_scored INTEGER NOT NULL DEFAULT 0, 

  runs_conceded INTEGER NOT NULL DEFAULT 0, 

  overs_faced NUMERIC NOT NULL DEFAULT 0, 

  overs_bowled NUMERIC NOT NULL DEFAULT 0, 

  net_run_rate NUMERIC NOT NULL DEFAULT 0, 

  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), 

  UNIQUE (team_id, season_id) 

); 

  

-- Award Types 

CREATE TABLE public.award_types ( 

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 

  name TEXT NOT NULL, 

  description TEXT, 

  icon TEXT DEFAULT 'trophy', 

  is_active BOOLEAN NOT NULL DEFAULT true, 

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), 

  updated_at TIMESTAMPTZ NOT NULL DEFAULT now() 

); 

  

-- Match Awards 

CREATE TABLE public.match_awards ( 

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 

  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE, 

  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE, 

  award_type_id UUID NOT NULL REFERENCES public.award_types(id) ON DELETE CASCADE, 

  notes TEXT, 

  created_at TIMESTAMPTZ NOT NULL DEFAULT now() 

); 

  

-- Live Auction 

CREATE TABLE public.live_auction ( 

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 

  season_id UUID REFERENCES public.seasons(id), 

  current_player_id UUID REFERENCES public.players(id), 

  current_bidding_team_id UUID REFERENCES public.teams(id), 

  current_bid NUMERIC NOT NULL DEFAULT 0, 

  base_price NUMERIC NOT NULL DEFAULT 10000, 

  increment_amount NUMERIC NOT NULL DEFAULT 5000, 

  is_live BOOLEAN NOT NULL DEFAULT false, 

  bid_history JSONB DEFAULT '[]', 

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), 

  updated_at TIMESTAMPTZ NOT NULL DEFAULT now() 

); 

  

-- News 

CREATE TABLE public.news ( 

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 

  title TEXT NOT NULL, 

  subtitle TEXT, 

  image_url TEXT, 

  top_content TEXT, 

  body_content TEXT, 

  bottom_content TEXT, 

  is_published BOOLEAN NOT NULL DEFAULT false, 

  published_at TIMESTAMPTZ, 

  season_id UUID REFERENCES public.seasons(id), 

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), 

  updated_at TIMESTAMPTZ NOT NULL DEFAULT now() 

); 

  

-- Gallery 

CREATE TABLE public.gallery ( 

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 

  title TEXT NOT NULL, 

  description TEXT, 

  image_url TEXT NOT NULL, 

  event_name TEXT, 

  event_date DATE, 

  season_id UUID REFERENCES public.seasons(id), 

  is_featured BOOLEAN NOT NULL DEFAULT false, 

  display_order INTEGER DEFAULT 0, 

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), 

  updated_at TIMESTAMPTZ NOT NULL DEFAULT now() 

); 

  

-- Sponsors 

CREATE TABLE public.sponsors ( 

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 

  name TEXT NOT NULL, 

  description TEXT, 

  logo_url TEXT, 

  website TEXT, 

  tier TEXT NOT NULL DEFAULT 'bronze', 

  season_id UUID REFERENCES public.seasons(id), 

  is_active BOOLEAN NOT NULL DEFAULT true, 

  display_order INTEGER DEFAULT 0, 

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), 

  updated_at TIMESTAMPTZ NOT NULL DEFAULT now() 

); 

  

-- Contact Info 

CREATE TABLE public.contact_info ( 

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 

  email TEXT, 

  phone TEXT, 

  address TEXT, 

  office_hours TEXT, 

  map_embed_url TEXT, 

  facebook_url TEXT, 

  instagram_url TEXT, 

  youtube_url TEXT, 

  tiktok_url TEXT, 

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), 

  updated_at TIMESTAMPTZ NOT NULL DEFAULT now() 

); 

  

-- Contact Messages 

CREATE TABLE public.contact_messages ( 

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 

  first_name TEXT NOT NULL, 

  last_name TEXT NOT NULL, 

  email TEXT NOT NULL, 

  phone TEXT, 

  subject TEXT NOT NULL, 

  message TEXT NOT NULL, 

  status TEXT NOT NULL DEFAULT 'unread', 

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), 

  updated_at TIMESTAMPTZ NOT NULL DEFAULT now() 

); 

  

-- Tournament Settings 

CREATE TABLE public.tournament_settings ( 

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 

  tournament_name TEXT NOT NULL DEFAULT 'Gold Coast Nepalese Premier League', 

  season TEXT NOT NULL DEFAULT '2025', 

  start_date DATE, 

  end_date DATE, 

  auction_date TIMESTAMPTZ, 

  registration_open BOOLEAN NOT NULL DEFAULT true, 

  min_players_per_team INTEGER NOT NULL DEFAULT 11, 

  max_players_per_team INTEGER NOT NULL DEFAULT 15, 

  bank_details TEXT, 

  countdown_description TEXT DEFAULT 'Get ready for the most exciting cricket tournament!', 

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), 

  updated_at TIMESTAMPTZ NOT NULL DEFAULT now() 

); 

  

-- ===================== 

-- 3. CREATE FUNCTIONS (after tables exist) 

-- ===================== 

  

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role) 

RETURNS boolean 

LANGUAGE sql 

STABLE 

SECURITY DEFINER 

SET search_path = public 

AS $$ 

  SELECT EXISTS ( 

    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role 

  ) 

$$; 

  

CREATE OR REPLACE FUNCTION public.update_updated_at_column() 

RETURNS TRIGGER AS $$ 

BEGIN 

    NEW.updated_at = now(); 

    RETURN NEW; 

END; 

$$ LANGUAGE plpgsql SET search_path = public; 

  

-- ===================== 

-- 4. ENABLE RLS 

-- ===================== 

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY; 

ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY; 

ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY; 

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY; 

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY; 

ALTER TABLE public.player_season_registrations ENABLE ROW LEVEL SECURITY; 

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY; 

ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY; 

ALTER TABLE public.standings ENABLE ROW LEVEL SECURITY; 

ALTER TABLE public.award_types ENABLE ROW LEVEL SECURITY; 

ALTER TABLE public.match_awards ENABLE ROW LEVEL SECURITY; 

ALTER TABLE public.live_auction ENABLE ROW LEVEL SECURITY; 

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY; 

ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY; 

ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY; 

ALTER TABLE public.contact_info ENABLE ROW LEVEL SECURITY; 

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY; 

ALTER TABLE public.tournament_settings ENABLE ROW LEVEL SECURITY; 

  

-- ===================== 

-- 5. RLS POLICIES (after has_role function exists) 

-- ===================== 

  

-- User Roles 

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid()); 

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'admin')); 

CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin')); 

CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (has_role(auth.uid(), 'admin')); 

  

-- Seasons 

CREATE POLICY "Anyone can view seasons" ON public.seasons FOR SELECT USING (true); 

CREATE POLICY "Admins can insert seasons" ON public.seasons FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin')); 

CREATE POLICY "Admins can update seasons" ON public.seasons FOR UPDATE USING (has_role(auth.uid(), 'admin')); 

CREATE POLICY "Admins can delete seasons" ON public.seasons FOR DELETE USING (has_role(auth.uid(), 'admin')); 

  

-- Owners 

CREATE POLICY "Anyone can view owners" ON public.owners FOR SELECT USING (true); 

CREATE POLICY "Admins can insert owners" ON public.owners FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin')); 

CREATE POLICY "Admins can update owners" ON public.owners FOR UPDATE USING (has_role(auth.uid(), 'admin')); 

CREATE POLICY "Admins can delete owners" ON public.owners FOR DELETE USING (has_role(auth.uid(), 'admin')); 

  

-- Teams 

CREATE POLICY "Anyone can view teams" ON public.teams FOR SELECT USING (true); 

CREATE POLICY "Admins can insert teams" ON public.teams FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin')); 

CREATE POLICY "Admins can update teams" ON public.teams FOR UPDATE USING (has_role(auth.uid(), 'admin')); 

CREATE POLICY "Admins can delete teams" ON public.teams FOR DELETE USING (has_role(auth.uid(), 'admin')); 

  

-- Players 

CREATE POLICY "Anyone can view players" ON public.players FOR SELECT USING (true); 

CREATE POLICY "Anyone can register as player" ON public.players FOR INSERT WITH CHECK (true); 

CREATE POLICY "Admins can update players" ON public.players FOR UPDATE USING (has_role(auth.uid(), 'admin')); 

CREATE POLICY "Admins can delete players" ON public.players FOR DELETE USING (has_role(auth.uid(), 'admin')); 

  

-- Player Season Registrations 

CREATE POLICY "Anyone can view registrations" ON public.player_season_registrations FOR SELECT USING (true); 

CREATE POLICY "Anyone can register for season" ON public.player_season_registrations FOR INSERT WITH CHECK (true); 

CREATE POLICY "Admins can update registrations" ON public.player_season_registrations FOR UPDATE USING (has_role(auth.uid(), 'admin')); 

CREATE POLICY "Admins can delete registrations" ON public.player_season_registrations FOR DELETE USING (has_role(auth.uid(), 'admin')); 

  

-- Matches 

CREATE POLICY "Anyone can view matches" ON public.matches FOR SELECT USING (true); 

CREATE POLICY "Admins can insert matches" ON public.matches FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin')); 

CREATE POLICY "Admins can update matches" ON public.matches FOR UPDATE USING (has_role(auth.uid(), 'admin')); 

CREATE POLICY "Admins can delete matches" ON public.matches FOR DELETE USING (has_role(auth.uid(), 'admin')); 

  

-- Player Stats 

CREATE POLICY "Anyone can view player stats" ON public.player_stats FOR SELECT USING (true); 

CREATE POLICY "Admins can insert player stats" ON public.player_stats FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin')); 

CREATE POLICY "Admins can update player stats" ON public.player_stats FOR UPDATE USING (has_role(auth.uid(), 'admin')); 

CREATE POLICY "Admins can delete player stats" ON public.player_stats FOR DELETE USING (has_role(auth.uid(), 'admin')); 

  

-- Standings 

CREATE POLICY "Anyone can view standings" ON public.standings FOR SELECT USING (true); 

CREATE POLICY "Admins can insert standings" ON public.standings FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin')); 

CREATE POLICY "Admins can update standings" ON public.standings FOR UPDATE USING (has_role(auth.uid(), 'admin')); 

CREATE POLICY "Admins can delete standings" ON public.standings FOR DELETE USING (has_role(auth.uid(), 'admin')); 

  

-- Award Types 

CREATE POLICY "Anyone can view award types" ON public.award_types FOR SELECT USING (true); 

CREATE POLICY "Admins can insert award types" ON public.award_types FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin')); 

CREATE POLICY "Admins can update award types" ON public.award_types FOR UPDATE USING (has_role(auth.uid(), 'admin')); 

CREATE POLICY "Admins can delete award types" ON public.award_types FOR DELETE USING (has_role(auth.uid(), 'admin')); 

  

-- Match Awards 

CREATE POLICY "Anyone can view match awards" ON public.match_awards FOR SELECT USING (true); 

CREATE POLICY "Admins can insert match awards" ON public.match_awards FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin')); 

CREATE POLICY "Admins can update match awards" ON public.match_awards FOR UPDATE USING (has_role(auth.uid(), 'admin')); 

CREATE POLICY "Admins can delete match awards" ON public.match_awards FOR DELETE USING (has_role(auth.uid(), 'admin')); 

  

-- Live Auction 

CREATE POLICY "Anyone can view live auction" ON public.live_auction FOR SELECT USING (true); 

CREATE POLICY "Admins can insert live auction" ON public.live_auction FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin')); 

CREATE POLICY "Admins can update live auction" ON public.live_auction FOR UPDATE USING (has_role(auth.uid(), 'admin')); 

CREATE POLICY "Admins can delete live auction" ON public.live_auction FOR DELETE USING (has_role(auth.uid(), 'admin')); 

  

-- News 

CREATE POLICY "Anyone can view published news" ON public.news FOR SELECT USING (is_published = true); 

CREATE POLICY "Admins can view all news" ON public.news FOR SELECT USING (has_role(auth.uid(), 'admin')); 

CREATE POLICY "Admins can insert news" ON public.news FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin')); 

CREATE POLICY "Admins can update news" ON public.news FOR UPDATE USING (has_role(auth.uid(), 'admin')); 

CREATE POLICY "Admins can delete news" ON public.news FOR DELETE USING (has_role(auth.uid(), 'admin')); 

  

-- Gallery 

CREATE POLICY "Anyone can view gallery" ON public.gallery FOR SELECT USING (true); 

CREATE POLICY "Admins can insert gallery" ON public.gallery FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin')); 

CREATE POLICY "Admins can update gallery" ON public.gallery FOR UPDATE USING (has_role(auth.uid(), 'admin')); 

CREATE POLICY "Admins can delete gallery" ON public.gallery FOR DELETE USING (has_role(auth.uid(), 'admin')); 

  

-- Sponsors 

CREATE POLICY "Anyone can view active sponsors" ON public.sponsors FOR SELECT USING (true); 

CREATE POLICY "Admins can insert sponsors" ON public.sponsors FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin')); 

CREATE POLICY "Admins can update sponsors" ON public.sponsors FOR UPDATE USING (has_role(auth.uid(), 'admin')); 

CREATE POLICY "Admins can delete sponsors" ON public.sponsors FOR DELETE USING (has_role(auth.uid(), 'admin')); 

  

-- Contact Info 

CREATE POLICY "Anyone can view contact info" ON public.contact_info FOR SELECT USING (true); 

CREATE POLICY "Admins can insert contact info" ON public.contact_info FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin')); 

CREATE POLICY "Admins can update contact info" ON public.contact_info FOR UPDATE USING (has_role(auth.uid(), 'admin')); 

CREATE POLICY "Admins can delete contact info" ON public.contact_info FOR DELETE USING (has_role(auth.uid(), 'admin')); 

  

-- Contact Messages 

CREATE POLICY "Admins can view contact messages" ON public.contact_messages FOR SELECT USING (has_role(auth.uid(), 'admin')); 

CREATE POLICY "Anyone can submit contact messages" ON public.contact_messages FOR INSERT WITH CHECK (true); 

CREATE POLICY "Admins can update contact messages" ON public.contact_messages FOR UPDATE USING (has_role(auth.uid(), 'admin')); 

CREATE POLICY "Admins can delete contact messages" ON public.contact_messages FOR DELETE USING (has_role(auth.uid(), 'admin')); 

  

-- Tournament Settings 

CREATE POLICY "Anyone can view tournament settings" ON public.tournament_settings FOR SELECT USING (true); 

CREATE POLICY "Admins can insert tournament settings" ON public.tournament_settings FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin')); 

CREATE POLICY "Admins can update tournament settings" ON public.tournament_settings FOR UPDATE USING (has_role(auth.uid(), 'admin')); 

CREATE POLICY "Admins can delete tournament settings" ON public.tournament_settings FOR DELETE USING (has_role(auth.uid(), 'admin')); 

 