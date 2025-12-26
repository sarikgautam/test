-- Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- Also try reloading config
NOTIFY pgrst, 'reload config';
