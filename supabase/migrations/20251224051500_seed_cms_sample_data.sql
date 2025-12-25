-- Seed sample data for CMS tables if empty
DO $$
DECLARE
  active_season UUID;
BEGIN
  -- Find active season if available
  SELECT id INTO active_season FROM public.seasons WHERE is_active = true LIMIT 1;

  -- Seed sponsors
  IF (SELECT COUNT(*) FROM public.sponsors) = 0 THEN
    INSERT INTO public.sponsors (name, tier, logo_url, website_url, description, display_order, is_active, season_id)
    VALUES
      ('Sponsor 1', 'platinum', 'https://placehold.co/200x100?text=Platinum+1', 'https://example.com', 'Top tier sponsor', 1, true, active_season),
      ('Sponsor 2', 'gold', 'https://placehold.co/200x100?text=Gold+1', 'https://example.com', NULL, 2, true, active_season),
      ('Sponsor 3', 'silver', 'https://placehold.co/200x100?text=Silver+1', NULL, NULL, 3, true, active_season),
      ('Sponsor 4', 'bronze', 'https://placehold.co/200x100?text=Bronze+1', NULL, NULL, 4, true, active_season);
  END IF;

  -- Seed gallery images
  IF (SELECT COUNT(*) FROM public.gallery_images) = 0 THEN
    INSERT INTO public.gallery_images (title, category, image_url, description, display_order, is_featured, season_id)
    VALUES
      ('Opening Ceremony', 'Events', 'https://placehold.co/800x600?text=Opening+Ceremony', NULL, 1, true, active_season),
      ('Match Highlights', 'Matches', 'https://placehold.co/800x600?text=Match+Highlights', NULL, 2, false, active_season),
      ('Team Photos', 'Teams', 'https://placehold.co/800x600?text=Team+Photos', NULL, 3, false, active_season),
      ('Award Ceremony', 'Awards', 'https://placehold.co/800x600?text=Award+Ceremony', NULL, 4, false, active_season), 
      ('Practice Sessions', 'Practice', 'https://placehold.co/800x600?text=Practice+Sessions', NULL, 5, false, active_season),
      ('Fan Moments', 'Fans', 'https://placehold.co/800x600?text=Fan+Moments', NULL, 6, false, active_season);
  END IF;

  -- Ensure at least one active registration CTA
  IF (SELECT COUNT(*) FROM public.registration_cta WHERE is_active = true) = 0 THEN
    INSERT INTO public.registration_cta (
      badge_text, heading, highlight_text, description, primary_button_text, secondary_button_text, is_active, season_id
    ) VALUES (
      'Registration Closing Soon',
      'Ready to Play in the',
      'Premier League?',
      'Register now for the player auction and get a chance to represent one of the six franchises. Show your skills and become a part of the GCNPL family.',
      'Register Now',
      'View Teams',
      true,
      active_season
    );
  END IF;

  -- Ensure contact info exists
  IF (SELECT COUNT(*) FROM public.contact_info) = 0 THEN
    INSERT INTO public.contact_info (location, email, phone)
    VALUES ('Gold Coast, Queensland, Australia', 'info@gcnpl.com.au', '+61 XXX XXX XXX');
  END IF;
END $$;