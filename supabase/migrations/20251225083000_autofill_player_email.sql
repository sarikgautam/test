-- Auto-generate placeholder emails for players when email is missing
-- Ensures bulk-imports can insert names only while keeping email UNIQUE/NOT NULL

CREATE OR REPLACE FUNCTION public.autofill_player_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NULL OR NEW.email = '' THEN
    -- slugify full_name to base, append UUID fragment to ensure uniqueness
    NEW.email := lower(regexp_replace(coalesce(NEW.full_name, 'player'), '[^a-z0-9]+', '-', 'g'))
                  || '.' || substr(gen_random_uuid()::text, 1, 8) || '@gcnpl.local';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'players_autofill_email'
  ) THEN
    CREATE TRIGGER players_autofill_email
    BEFORE INSERT ON public.players
    FOR EACH ROW
    EXECUTE FUNCTION public.autofill_player_email();
  END IF;
END $$;
