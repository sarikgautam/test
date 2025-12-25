-- Add season scoping to content tables (teams, sponsors, news, gallery) and seed Season 1 (2025) as active

-- Ensure Season 1 exists and is active, Season 2 exists as upcoming
INSERT INTO public.seasons (id, name, year, is_active, registration_open)
VALUES ('00000000-0000-0000-0000-000000000001', 'Season 1', 2025, true, true)
ON CONFLICT (id) DO UPDATE SET is_active = EXCLUDED.is_active, year = EXCLUDED.year, name = EXCLUDED.name;

INSERT INTO public.seasons (id, name, year, is_active, registration_open)
VALUES ('00000000-0000-0000-0000-000000000002', 'Season 2', 2026, false, false)
ON CONFLICT (id) DO NOTHING;

-- Add season_id to teams
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teams' AND column_name = 'season_id'
  ) THEN
    ALTER TABLE public.teams ADD COLUMN season_id UUID REFERENCES public.seasons(id);
  END IF;
END $$;

-- Add season_id to sponsors
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sponsors' AND column_name = 'season_id'
  ) THEN
    ALTER TABLE public.sponsors ADD COLUMN season_id UUID REFERENCES public.seasons(id);
  END IF;
END $$;

-- Add season_id to news
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'news' AND column_name = 'season_id'
  ) THEN
    ALTER TABLE public.news ADD COLUMN season_id UUID REFERENCES public.seasons(id);
  END IF;
END $$;

-- Add season_id to gallery (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gallery') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'gallery' AND column_name = 'season_id'
    ) THEN
      ALTER TABLE public.gallery ADD COLUMN season_id UUID REFERENCES public.seasons(id);
    END IF;
  END IF;
END $$;

-- Backfill existing rows to Season 1
UPDATE public.teams SET season_id = '00000000-0000-0000-0000-000000000001' WHERE season_id IS NULL;
UPDATE public.sponsors SET season_id = '00000000-0000-0000-0000-000000000001' WHERE season_id IS NULL;
UPDATE public.news SET season_id = '00000000-0000-0000-0000-000000000001' WHERE season_id IS NULL;
UPDATE public.gallery SET season_id = '00000000-0000-0000-0000-000000000001' WHERE season_id IS NULL;

-- Make season_id NOT NULL where possible
ALTER TABLE public.teams ALTER COLUMN season_id SET NOT NULL;
ALTER TABLE public.sponsors ALTER COLUMN season_id SET NOT NULL;
ALTER TABLE public.news ALTER COLUMN season_id SET NOT NULL;
ALTER TABLE public.gallery ALTER COLUMN season_id SET NOT NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_teams_season_id ON public.teams(season_id);
CREATE INDEX IF NOT EXISTS idx_sponsors_season_id ON public.sponsors(season_id);
CREATE INDEX IF NOT EXISTS idx_news_season_id ON public.news(season_id);
CREATE INDEX IF NOT EXISTS idx_gallery_season_id ON public.gallery(season_id);
