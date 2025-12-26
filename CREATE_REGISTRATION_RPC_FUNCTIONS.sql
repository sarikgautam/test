-- Create function to get registration submissions
CREATE OR REPLACE FUNCTION public.get_registration_submissions(
  p_season_id UUID,
  p_status VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  season_id UUID,
  full_name VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  date_of_birth DATE,
  address TEXT,
  role VARCHAR,
  batting_style VARCHAR,
  bowling_style VARCHAR,
  emergency_contact_name VARCHAR,
  emergency_contact_phone VARCHAR,
  emergency_contact_email VARCHAR,
  payment_receipt_url TEXT,
  status VARCHAR,
  admin_notes TEXT,
  linked_player_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rs.id,
    rs.season_id,
    rs.full_name,
    rs.email,
    rs.phone,
    rs.date_of_birth,
    rs.address,
    rs.role,
    rs.batting_style,
    rs.bowling_style,
    rs.emergency_contact_name,
    rs.emergency_contact_phone,
    rs.emergency_contact_email,
    rs.payment_receipt_url,
    rs.status,
    rs.admin_notes,
    rs.linked_player_id,
    rs.created_at,
    rs.reviewed_at,
    rs.reviewed_by
  FROM public.registration_submissions rs
  WHERE rs.season_id = p_season_id
    AND (p_status IS NULL OR rs.status = p_status)
  ORDER BY rs.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to approve registration
CREATE OR REPLACE FUNCTION public.approve_registration(
  p_submission_id UUID,
  p_player_id UUID,
  p_admin_notes VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.registration_submissions
  SET 
    status = 'approved',
    linked_player_id = p_player_id,
    admin_notes = p_admin_notes,
    reviewed_at = now(),
    reviewed_by = auth.uid()
  WHERE id = p_submission_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create function to reject registration
CREATE OR REPLACE FUNCTION public.reject_registration(
  p_submission_id UUID,
  p_admin_notes VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.registration_submissions
  SET 
    status = 'rejected',
    admin_notes = p_admin_notes,
    reviewed_at = now(),
    reviewed_by = auth.uid()
  WHERE id = p_submission_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
