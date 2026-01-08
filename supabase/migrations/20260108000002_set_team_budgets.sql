-- Update all teams budget to 2500 for Season 2
UPDATE teams
SET budget = 2500, remaining_budget = 2500;

-- Verify the update
SELECT id, name, budget, remaining_budget FROM teams;
