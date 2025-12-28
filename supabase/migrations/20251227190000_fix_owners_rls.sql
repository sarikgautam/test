-- Fix RLS policies for all admin tables
-- This allows authenticated users to manage admin content

-- OWNERS TABLE
DROP POLICY IF EXISTS "Admins can insert owners" ON public.owners;
DROP POLICY IF EXISTS "Admins can update owners" ON public.owners;
DROP POLICY IF EXISTS "Admins can delete owners" ON public.owners;

CREATE POLICY "Authenticated users can insert owners" ON public.owners FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update owners" ON public.owners FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete owners" ON public.owners FOR DELETE TO authenticated USING (true);

-- TEAMS TABLE
DROP POLICY IF EXISTS "Admins can insert teams" ON public.teams;
DROP POLICY IF EXISTS "Admins can update teams" ON public.teams;
DROP POLICY IF EXISTS "Admins can delete teams" ON public.teams;

CREATE POLICY "Authenticated users can insert teams" ON public.teams FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update teams" ON public.teams FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete teams" ON public.teams FOR DELETE TO authenticated USING (true);

-- SPONSORS TABLE
DROP POLICY IF EXISTS "Admins can insert sponsors" ON public.sponsors;
DROP POLICY IF EXISTS "Admins can update sponsors" ON public.sponsors;
DROP POLICY IF EXISTS "Admins can delete sponsors" ON public.sponsors;

CREATE POLICY "Authenticated users can insert sponsors" ON public.sponsors FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update sponsors" ON public.sponsors FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete sponsors" ON public.sponsors FOR DELETE TO authenticated USING (true);

-- GALLERY TABLE
DROP POLICY IF EXISTS "Admins can insert gallery" ON public.gallery;
DROP POLICY IF EXISTS "Admins can update gallery" ON public.gallery;
DROP POLICY IF EXISTS "Admins can delete gallery" ON public.gallery;

CREATE POLICY "Authenticated users can insert gallery" ON public.gallery FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update gallery" ON public.gallery FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete gallery" ON public.gallery FOR DELETE TO authenticated USING (true);

-- HOMEPAGE_SETTINGS TABLE
DROP POLICY IF EXISTS "Admins can update homepage settings" ON public.homepage_settings;
DROP POLICY IF EXISTS "Admins can insert homepage settings" ON public.homepage_settings;

CREATE POLICY "Authenticated users can insert homepage settings" ON public.homepage_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update homepage settings" ON public.homepage_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- AWARD_TYPES TABLE
DROP POLICY IF EXISTS "Admins can insert award types" ON public.award_types;
DROP POLICY IF EXISTS "Admins can update award types" ON public.award_types;
DROP POLICY IF EXISTS "Admins can delete award types" ON public.award_types;

CREATE POLICY "Authenticated users can insert award types" ON public.award_types FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update award types" ON public.award_types FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete award types" ON public.award_types FOR DELETE TO authenticated USING (true);

-- CONTACT_MESSAGES TABLE
DROP POLICY IF EXISTS "Admins can view all messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can update messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can delete messages" ON public.contact_messages;

CREATE POLICY "Authenticated users can view all messages" ON public.contact_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can update messages" ON public.contact_messages FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete messages" ON public.contact_messages FOR DELETE TO authenticated USING (true);

-- SUPPORT_CLUB TABLE
DROP POLICY IF EXISTS "Admins can insert support clubs" ON public.support_club;
DROP POLICY IF EXISTS "Admins can update support clubs" ON public.support_club;
DROP POLICY IF EXISTS "Admins can delete support clubs" ON public.support_club;

CREATE POLICY "Authenticated users can insert support clubs" ON public.support_club FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update support clubs" ON public.support_club FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete support clubs" ON public.support_club FOR DELETE TO authenticated USING (true);
