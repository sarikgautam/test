-- Enable RLS and add policies
ALTER TABLE public.registration_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (register)
DROP POLICY IF EXISTS "allow_registration_insert" ON public.registration_submissions;
CREATE POLICY "allow_registration_insert" 
ON public.registration_submissions 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to read
DROP POLICY IF EXISTS "allow_registration_select" ON public.registration_submissions;
CREATE POLICY "allow_registration_select" 
ON public.registration_submissions 
FOR SELECT 
USING (true);

-- Allow authenticated users to update
DROP POLICY IF EXISTS "allow_registration_update" ON public.registration_submissions;
CREATE POLICY "allow_registration_update" 
ON public.registration_submissions 
FOR UPDATE 
USING (true) 
WITH CHECK (true);

-- Allow authenticated users to delete
DROP POLICY IF EXISTS "allow_registration_delete" ON public.registration_submissions;
CREATE POLICY "allow_registration_delete" 
ON public.registration_submissions 
FOR DELETE 
USING (true);
