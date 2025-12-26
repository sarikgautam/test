-- Create trigger to automatically create registration submissions when players are added
CREATE OR REPLACE FUNCTION public.create_registration_submission()
RETURNS TRIGGER AS $$
DECLARE
  v_season_id UUID;
BEGIN
  -- Get the current active season
  SELECT id INTO v_season_id FROM public.seasons WHERE is_active = true LIMIT 1;
  
  IF v_season_id IS NOT NULL THEN
    INSERT INTO public.registration_submissions (
      season_id,
      full_name,
      email,
      phone,
      date_of_birth,
      address,
      role,
      batting_style,
      bowling_style,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_email,
      payment_receipt_url,
      status,
      linked_player_id
    ) VALUES (
      v_season_id,
      NEW.full_name,
      NEW.email,
      NEW.phone,
      NEW.date_of_birth,
      NEW.address,
      NEW.role,
      NEW.batting_style,
      NEW.bowling_style,
      NEW.emergency_contact_name,
      NEW.emergency_contact_phone,
      NEW.emergency_contact_email,
      NEW.payment_receipt_url,
      'pending',
      NEW.id
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_create_registration_submission ON public.players;

-- Create trigger
CREATE TRIGGER trigger_create_registration_submission
AFTER INSERT ON public.players
FOR EACH ROW
EXECUTE FUNCTION public.create_registration_submission();
