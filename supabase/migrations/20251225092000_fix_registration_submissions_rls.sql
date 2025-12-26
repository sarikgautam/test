-- Fix RLS policies for registration_submissions
-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can submit registrations" ON public.registration_submissions;
DROP POLICY IF EXISTS "Admins can view all submissions" ON public.registration_submissions;
DROP POLICY IF EXISTS "Admins can update submissions" ON public.registration_submissions;
DROP POLICY IF EXISTS "Admins can delete submissions" ON public.registration_submissions;

-- Create new policies with correct admin check
CREATE POLICY "Anyone can submit registrations"
ON public.registration_submissions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all submissions"
ON public.registration_submissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admins can update submissions"
ON public.registration_submissions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admins can delete submissions"
ON public.registration_submissions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
);
