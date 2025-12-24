-- Add captain, manager, and description fields to teams table
ALTER TABLE public.teams 
ADD COLUMN captain_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
ADD COLUMN manager_name text,
ADD COLUMN description text;