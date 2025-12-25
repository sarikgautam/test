-- Create sponsors table
CREATE TABLE public.sponsors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  website TEXT,
  tier TEXT NOT NULL DEFAULT 'bronze',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  season_id UUID REFERENCES public.seasons(id),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create gallery table
CREATE TABLE public.gallery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  event_name TEXT,
  event_date DATE,
  season_id UUID REFERENCES public.seasons(id),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contact_info table (single row settings)
CREATE TABLE public.contact_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT,
  phone TEXT,
  address TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  youtube_url TEXT,
  tiktok_url TEXT,
  office_hours TEXT,
  map_embed_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_info ENABLE ROW LEVEL SECURITY;

-- Sponsors RLS policies
CREATE POLICY "Anyone can view active sponsors" ON public.sponsors FOR SELECT USING (true);
CREATE POLICY "Admins can insert sponsors" ON public.sponsors FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update sponsors" ON public.sponsors FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete sponsors" ON public.sponsors FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Gallery RLS policies
CREATE POLICY "Anyone can view gallery" ON public.gallery FOR SELECT USING (true);
CREATE POLICY "Admins can insert gallery" ON public.gallery FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update gallery" ON public.gallery FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete gallery" ON public.gallery FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Contact info RLS policies
CREATE POLICY "Anyone can view contact info" ON public.contact_info FOR SELECT USING (true);
CREATE POLICY "Admins can insert contact info" ON public.contact_info FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update contact info" ON public.contact_info FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete contact info" ON public.contact_info FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for sponsor logos and gallery images
INSERT INTO storage.buckets (id, name, public) VALUES ('sponsors', 'sponsors', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true);

-- Storage policies for sponsors bucket
CREATE POLICY "Anyone can view sponsor logos" ON storage.objects FOR SELECT USING (bucket_id = 'sponsors');
CREATE POLICY "Admins can upload sponsor logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'sponsors' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update sponsor logos" ON storage.objects FOR UPDATE USING (bucket_id = 'sponsors' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete sponsor logos" ON storage.objects FOR DELETE USING (bucket_id = 'sponsors' AND has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for gallery bucket
CREATE POLICY "Anyone can view gallery images" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "Admins can upload gallery images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gallery' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update gallery images" ON storage.objects FOR UPDATE USING (bucket_id = 'gallery' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete gallery images" ON storage.objects FOR DELETE USING (bucket_id = 'gallery' AND has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_sponsors_updated_at BEFORE UPDATE ON public.sponsors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_gallery_updated_at BEFORE UPDATE ON public.gallery FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contact_info_updated_at BEFORE UPDATE ON public.contact_info FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();