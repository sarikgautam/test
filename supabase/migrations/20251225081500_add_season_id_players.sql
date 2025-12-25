-- Add season_id to players (if missing) and backfill to Season 1
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'players' AND column_name = 'season_id'
  ) THEN
    ALTER TABLE public.players ADD COLUMN season_id UUID REFERENCES public.seasons(id);
  END IF;
END $$;

-- Ensure Season 1 exists
INSERT INTO public.seasons (id, name, year, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'Season 1', 2025, true)
ON CONFLICT (id) DO NOTHING;

-- Backfill existing players to Season 1
UPDATE public.players
SET season_id = '00000000-0000-0000-0000-000000000001'
WHERE season_id IS NULL;

-- Make NOT NULL
ALTER TABLE public.players ALTER COLUMN season_id SET NOT NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_players_season_id ON public.players(season_id);
