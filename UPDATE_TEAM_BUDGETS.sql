-- Update all teams to have $1000 budget
-- This sets both the base budget and remaining budget to $1000

UPDATE public.teams
SET 
  budget = 1000,
  remaining_budget = 1000;

-- Update the default for future teams
ALTER TABLE public.teams 
  ALTER COLUMN budget SET DEFAULT 1000,
  ALTER COLUMN remaining_budget SET DEFAULT 1000;
