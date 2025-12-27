-- Create support_club table for footer sponsorship info
CREATE TABLE public.support_club (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  website_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_club ENABLE ROW LEVEL SECURITY;

-- RLS policies
-- Anyone can view active support clubs
CREATE POLICY "Anyone can view active support clubs" 
  ON public.support_club 
  FOR SELECT 
  USING (is_active = true);

-- Admins can manage support clubs
CREATE POLICY "Admins can insert support clubs" 
  ON public.support_club 
  FOR INSERT 
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update support clubs" 
  ON public.support_club 
  FOR UPDATE 
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete support clubs" 
  ON public.support_club 
  FOR DELETE 
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_support_club_updated_at 
  BEFORE UPDATE ON public.support_club 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default support club
INSERT INTO public.support_club (name, logo_url, website_url, is_active, display_order) 
VALUES (
  'Gold Coast Gorkhas Cricket Club',
  'https://via.placeholder.com/150',
  'https://goldcoastgorkhas.com.au',
  true,
  1
);
