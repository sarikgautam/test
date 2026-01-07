-- Add scorecard PDF URL to matches
ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS scorecard_pdf_url TEXT;