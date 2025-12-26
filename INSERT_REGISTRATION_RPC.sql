-- Simple RPC function to insert registration submission
CREATE OR REPLACE FUNCTION public.insert_registration_submission(submission_data jsonb)
RETURNS uuid AS $$
DECLARE
  new_id uuid;
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
    (submission_data->>'season_id')::uuid,
    submission_data->>'full_name',
    submission_data->>'email',
    submission_data->>'phone',
    (submission_data->>'date_of_birth')::date,
    submission_data->>'address',
    submission_data->>'role',
    submission_data->>'batting_style',
    submission_data->>'bowling_style',
    submission_data->>'emergency_contact_name',
    submission_data->>'emergency_contact_phone',
    submission_data->>'emergency_contact_email',
    submission_data->>'payment_receipt_url',
    'pending'
  ) RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
