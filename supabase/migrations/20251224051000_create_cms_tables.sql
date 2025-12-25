-- Create sponsors table
CREATE TABLE public.sponsors (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('platinum', 'gold', 'silver', 'bronze')),
    logo_url TEXT,
    website_url TEXT,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create gallery_images table
CREATE TABLE public.gallery_images (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    image_url TEXT NOT NULL,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contact_info table (for static contact details)
CREATE TABLE public.contact_info (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    location VARCHAR(255) NOT NULL DEFAULT 'Gold Coast, Queensland, Australia',
    email VARCHAR(255) NOT NULL DEFAULT 'info@gcnpl.com.au',
    phone VARCHAR(50) NOT NULL DEFAULT '+61 XXX XXX XXX',
    map_embed_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contact_submissions table (for user inquiries)
CREATE TABLE public.contact_submissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create registration_cta table (for CTA content)
CREATE TABLE public.registration_cta (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    badge_text VARCHAR(100) NOT NULL DEFAULT 'Registration Closing Soon',
    heading VARCHAR(255) NOT NULL DEFAULT 'Ready to Play in the Premier League?',
    highlight_text VARCHAR(100) NOT NULL DEFAULT 'Premier League',
    description TEXT NOT NULL,
    primary_button_text VARCHAR(50) NOT NULL DEFAULT 'Register Now',
    secondary_button_text VARCHAR(50) NOT NULL DEFAULT 'View Teams',
    is_active BOOLEAN NOT NULL DEFAULT true,
    season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_sponsors_season ON public.sponsors (season_id);
CREATE INDEX idx_sponsors_tier ON public.sponsors (tier);
CREATE INDEX idx_sponsors_active ON public.sponsors (is_active);
CREATE INDEX idx_sponsors_order ON public.sponsors (display_order);

CREATE INDEX idx_gallery_season ON public.gallery_images (season_id);
CREATE INDEX idx_gallery_category ON public.gallery_images (category);
CREATE INDEX idx_gallery_featured ON public.gallery_images (is_featured);
CREATE INDEX idx_gallery_order ON public.gallery_images (display_order);

CREATE INDEX idx_contact_submissions_status ON public.contact_submissions (status);
CREATE INDEX idx_contact_submissions_created ON public.contact_submissions (created_at DESC);

CREATE INDEX idx_registration_cta_active ON public.registration_cta (is_active);
CREATE INDEX idx_registration_cta_season ON public.registration_cta (season_id);

-- Enable RLS on all tables
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_cta ENABLE ROW LEVEL SECURITY;

-- RLS policies for sponsors
CREATE POLICY "Anyone can view active sponsors"
ON public.sponsors
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can view all sponsors"
ON public.sponsors
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert sponsors"
ON public.sponsors
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update sponsors"
ON public.sponsors
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete sponsors"
ON public.sponsors
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for gallery_images
CREATE POLICY "Anyone can view gallery images"
ON public.gallery_images
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert gallery images"
ON public.gallery_images
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update gallery images"
ON public.gallery_images
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete gallery images"
ON public.gallery_images
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for contact_info
CREATE POLICY "Anyone can view contact info"
ON public.contact_info
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert contact info"
ON public.contact_info
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update contact info"
ON public.contact_info
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete contact info"
ON public.contact_info
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for contact_submissions
CREATE POLICY "Anyone can submit contact form"
ON public.contact_submissions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all submissions"
ON public.contact_submissions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update submissions"
ON public.contact_submissions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete submissions"
ON public.contact_submissions
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for registration_cta
CREATE POLICY "Anyone can view active CTA"
ON public.registration_cta
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can view all CTAs"
ON public.registration_cta
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert CTAs"
ON public.registration_cta
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update CTAs"
ON public.registration_cta
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete CTAs"
ON public.registration_cta
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for updated_at columns
CREATE TRIGGER update_sponsors_updated_at
BEFORE UPDATE ON public.sponsors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gallery_images_updated_at
BEFORE UPDATE ON public.gallery_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contact_info_updated_at
BEFORE UPDATE ON public.contact_info
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contact_submissions_updated_at
BEFORE UPDATE ON public.contact_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_registration_cta_updated_at
BEFORE UPDATE ON public.registration_cta
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default contact info
INSERT INTO public.contact_info (location, email, phone)
VALUES (
    'Gold Coast, Queensland, Australia',
    'info@gcnpl.com.au',
    '+61 XXX XXX XXX'
);

-- Insert default registration CTA
INSERT INTO public.registration_cta (
    badge_text,
    heading,
    highlight_text,
    description,
    primary_button_text,
    secondary_button_text,
    is_active
)
VALUES (
    'Registration Closing Soon',
    'Ready to Play in the Premier League?',
    'Premier League',
    'Register now for the player auction and get a chance to represent one of the six franchises. Show your skills and become a part of the GCNPL family.',
    'Register Now',
    'View Teams',
    true
);
