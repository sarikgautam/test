-- Create award_types table for admin-defined awards
CREATE TABLE public.award_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'trophy',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create match_awards table for linking awards to players in matches
CREATE TABLE public.match_awards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  award_type_id UUID NOT NULL REFERENCES public.award_types(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(match_id, award_type_id)
);

-- Add overs_per_side column to matches for game format
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS overs_per_side INTEGER DEFAULT 20;

-- Enable RLS
ALTER TABLE public.award_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_awards ENABLE ROW LEVEL SECURITY;

-- RLS policies for award_types
CREATE POLICY "Anyone can view award types" ON public.award_types FOR SELECT USING (true);
CREATE POLICY "Admins can insert award types" ON public.award_types FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update award types" ON public.award_types FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete award types" ON public.award_types FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for match_awards
CREATE POLICY "Anyone can view match awards" ON public.match_awards FOR SELECT USING (true);
CREATE POLICY "Admins can insert match awards" ON public.match_awards FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update match awards" ON public.match_awards FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete match awards" ON public.match_awards FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_award_types_updated_at
BEFORE UPDATE ON public.award_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default award types
INSERT INTO public.award_types (name, description, icon) VALUES
  ('Moment of the Match', 'Best moment in the match', 'star'),
  ('Catch of the Day', 'Best catch in the match', 'target'),
  ('Best Fielder', 'Outstanding fielding performance', 'shield');