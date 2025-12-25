-- Create owners table with business information
CREATE TABLE public.owners (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    business_name TEXT,
    business_description TEXT,
    business_logo_url TEXT,
    business_website TEXT,
    photo_url TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for owners table
CREATE POLICY "Anyone can view owners" 
ON public.owners 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert owners" 
ON public.owners 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update owners" 
ON public.owners 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete owners" 
ON public.owners 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add owner_id foreign key to teams table
ALTER TABLE public.teams ADD COLUMN owner_id UUID REFERENCES public.owners(id);

-- Create trigger for automatic timestamp updates on owners
CREATE TRIGGER update_owners_updated_at
BEFORE UPDATE ON public.owners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for owner/business logos
INSERT INTO storage.buckets (id, name, public) VALUES ('owners', 'owners', true) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for owner uploads
CREATE POLICY "Owner images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'owners');

CREATE POLICY "Admins can upload owner images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'owners' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update owner images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'owners' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete owner images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'owners' AND has_role(auth.uid(), 'admin'::app_role));