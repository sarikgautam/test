-- Create a function to insert registration submissions
CREATE OR REPLACE FUNCTION public.submit_registration(
  p_season_id UUID,
  p_full_name VARCHAR,
  p_email VARCHAR,
  p_role VARCHAR,
  p_emergency_contact_name VARCHAR,
  p_emergency_contact_phone VARCHAR,
  p_phone VARCHAR DEFAULT NULL,
  p_date_of_birth DATE DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_batting_style VARCHAR DEFAULT NULL,
  p_bowling_style VARCHAR DEFAULT NULL,
  p_emergency_contact_email VARCHAR DEFAULT NULL,
  p_payment_receipt_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
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
    status
  ) VALUES (
    p_season_id,
    p_full_name,
    p_email,
    p_phone,
    p_date_of_birth,
    p_address,
    p_role,
    p_batting_style,
    p_bowling_style,
    p_emergency_contact_name,
    p_emergency_contact_phone,
    p_emergency_contact_email,
    p_payment_receipt_url,
    'pending'
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;
