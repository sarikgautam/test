-- Clean up approval-related database objects

-- 1. Drop the registration_submissions table (if it exists)
DROP TABLE IF EXISTS public.registration_submissions CASCADE;

-- 2. Remove approval columns from player_season_registrations
ALTER TABLE public.player_season_registrations 
DROP COLUMN IF EXISTS approval_status CASCADE;

ALTER TABLE public.player_season_registrations 
DROP COLUMN IF EXISTS admin_notes CASCADE;

ALTER TABLE public.player_season_registrations 
DROP COLUMN IF EXISTS reviewed_at CASCADE;

ALTER TABLE public.player_season_registrations 
DROP COLUMN IF EXISTS reviewed_by CASCADE;

-- 3. Drop any related indexes
DROP INDEX IF EXISTS public.idx_player_season_registrations_approval_status;
DROP INDEX IF EXISTS public.idx_registration_submissions_season;
DROP INDEX IF EXISTS public.idx_registration_submissions_status;
DROP INDEX IF EXISTS public.idx_registration_submissions_email;
DROP INDEX IF EXISTS public.idx_registration_submissions_created;

-- 4. Drop any related functions
DROP FUNCTION IF EXISTS public.insert_registration_submission(jsonb);
DROP FUNCTION IF EXISTS public.submit_registration;
DROP FUNCTION IF EXISTS public.get_registration_submissions;
DROP FUNCTION IF EXISTS public.approve_registration;
DROP FUNCTION IF EXISTS public.reject_registration;
DROP FUNCTION IF EXISTS public.create_registration_submission CASCADE;

-- Done! Registration approval feature has been completely removed.
