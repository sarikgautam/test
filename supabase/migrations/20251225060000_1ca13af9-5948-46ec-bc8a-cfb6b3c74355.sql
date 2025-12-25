-- Create news table
CREATE TABLE public.news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  top_content TEXT,
  body_content TEXT,
  bottom_content TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  season_id UUID REFERENCES public.seasons(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view published news" 
ON public.news 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Admins can view all news" 
ON public.news 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert news" 
ON public.news 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update news" 
ON public.news 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete news" 
ON public.news 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_news_updated_at
BEFORE UPDATE ON public.news
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for news images
INSERT INTO storage.buckets (id, name, public) VALUES ('news', 'news', true);

-- Storage policies for news bucket
CREATE POLICY "Anyone can view news images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'news');

CREATE POLICY "Admins can upload news images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'news' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update news images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'news' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete news images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'news' AND has_role(auth.uid(), 'admin'::app_role));