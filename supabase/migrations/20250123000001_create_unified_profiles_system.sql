-- ============================================================
-- UNIFIED PROFILES & CONNECTED CONTENT SYSTEM
-- ============================================================
-- This migration creates a central profile registry and relationship
-- tables that connect people to all content types (art, programs,
-- services, articles). It builds on existing systems without breaking them.
--
-- Key Components:
-- 1. public_profiles - Central registry for public-facing people
-- 2. Relationship tables - Link profiles to content
-- 3. Content-to-content links - Connect stories to projects/programs/services
-- ============================================================

-- ============================================================
-- 1. PUBLIC PROFILES TABLE (Central Registry)
-- ============================================================

CREATE TABLE IF NOT EXISTS public_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  full_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  preferred_name TEXT,
  pronouns TEXT,

  -- Profile Information
  bio TEXT,
  tagline TEXT, -- One-line description (e.g., "Co-founder, A Curious Tractor")
  role_tags TEXT[] DEFAULT '{}', -- ["artist", "advocate", "researcher", "lived-experience"]

  -- Media
  photo_url TEXT,
  photo_credit TEXT,

  -- Contact & Links (optional, privacy-aware)
  website_url TEXT,
  email TEXT, -- Only shown if they opt-in
  social_links JSONB DEFAULT '{}', -- {linkedin: "...", twitter: "...", etc}

  -- System Connections
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- If also a platform user
  empathy_ledger_profile_id UUID, -- If from Empathy Ledger

  -- Metadata
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true, -- Can hide profile for privacy
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_public_profiles_slug ON public_profiles(slug);
CREATE INDEX idx_public_profiles_user_id ON public_profiles(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_public_profiles_featured ON public_profiles(is_featured) WHERE is_featured = true;
CREATE INDEX idx_public_profiles_public ON public_profiles(is_public) WHERE is_public = true;
CREATE INDEX idx_public_profiles_empathy_ledger ON public_profiles(empathy_ledger_profile_id) WHERE empathy_ledger_profile_id IS NOT NULL;
CREATE INDEX idx_public_profiles_search ON public_profiles USING gin(to_tsvector('english', full_name || ' ' || COALESCE(bio, '')));

-- ============================================================
-- 2. EXTEND AUTHORS TABLE (Link to Public Profiles)
-- ============================================================

-- Add reference to public_profiles
ALTER TABLE authors ADD COLUMN IF NOT EXISTS public_profile_id UUID REFERENCES public_profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_authors_public_profile ON authors(public_profile_id);

-- ============================================================
-- 3. EXTEND PROFILE APPEARANCES (Link to Public Profiles)
-- ============================================================

-- Add reference to public_profiles
ALTER TABLE profile_appearances ADD COLUMN IF NOT EXISTS public_profile_id UUID REFERENCES public_profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_profile_appearances_public_profile ON profile_appearances(public_profile_id);

-- ============================================================
-- 4. ART & INNOVATION RELATIONSHIPS
-- ============================================================

-- Link profiles to art/innovation projects
CREATE TABLE IF NOT EXISTS art_innovation_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  art_innovation_id UUID REFERENCES art_innovation(id) ON DELETE CASCADE,
  public_profile_id UUID REFERENCES public_profiles(id) ON DELETE CASCADE,

  -- Role Information
  role TEXT NOT NULL, -- "creator", "contributor", "collaborator", "co-founder"
  role_description TEXT, -- Custom description like "Co-founder - The Insomniac Calculator"

  -- Display
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(art_innovation_id, public_profile_id)
);

CREATE INDEX idx_art_innovation_profiles_art ON art_innovation_profiles(art_innovation_id);
CREATE INDEX idx_art_innovation_profiles_profile ON art_innovation_profiles(public_profile_id);
CREATE INDEX idx_art_innovation_profiles_order ON art_innovation_profiles(art_innovation_id, display_order);

-- ============================================================
-- 5. COMMUNITY PROGRAMS RELATIONSHIPS
-- ============================================================

-- Link profiles to community programs
CREATE TABLE IF NOT EXISTS community_programs_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES community_programs(id) ON DELETE CASCADE,
  public_profile_id UUID REFERENCES public_profiles(id) ON DELETE CASCADE,

  -- Role Information
  role TEXT NOT NULL, -- "founder", "coordinator", "participant-voice", "staff"
  role_description TEXT,

  -- Display
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(program_id, public_profile_id)
);

CREATE INDEX idx_community_programs_profiles_program ON community_programs_profiles(program_id);
CREATE INDEX idx_community_programs_profiles_profile ON community_programs_profiles(public_profile_id);
CREATE INDEX idx_community_programs_profiles_order ON community_programs_profiles(program_id, display_order);

-- ============================================================
-- 6. SERVICES RELATIONSHIPS
-- ============================================================

-- Link profiles to services
CREATE TABLE IF NOT EXISTS services_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  public_profile_id UUID REFERENCES public_profiles(id) ON DELETE CASCADE,

  -- Role Information
  role TEXT NOT NULL, -- "staff", "board-member", "testimonial", "volunteer"
  role_description TEXT,

  -- Display
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(service_id, public_profile_id)
);

CREATE INDEX idx_services_profiles_service ON services_profiles(service_id);
CREATE INDEX idx_services_profiles_profile ON services_profiles(public_profile_id);
CREATE INDEX idx_services_profiles_order ON services_profiles(service_id, display_order);

-- ============================================================
-- 7. ARTICLE/STORY CROSS-CONTENT RELATIONSHIPS
-- ============================================================

-- Articles related to art/innovation projects
CREATE TABLE IF NOT EXISTS article_related_art (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  art_innovation_id UUID REFERENCES art_innovation(id) ON DELETE CASCADE,
  relevance_note TEXT, -- Why they're linked
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(article_id, art_innovation_id)
);

CREATE INDEX idx_article_related_art_article ON article_related_art(article_id);
CREATE INDEX idx_article_related_art_art ON article_related_art(art_innovation_id);

-- Articles related to community programs
CREATE TABLE IF NOT EXISTS article_related_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  program_id UUID REFERENCES community_programs(id) ON DELETE CASCADE,
  relevance_note TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(article_id, program_id)
);

CREATE INDEX idx_article_related_programs_article ON article_related_programs(article_id);
CREATE INDEX idx_article_related_programs_program ON article_related_programs(program_id);

-- Articles related to services
CREATE TABLE IF NOT EXISTS article_related_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  relevance_note TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(article_id, service_id)
);

CREATE INDEX idx_article_related_services_article ON article_related_services(article_id);
CREATE INDEX idx_article_related_services_service ON article_related_services(service_id);

-- Related reading (article to article)
CREATE TABLE IF NOT EXISTS article_related_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  related_article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  relationship_type TEXT DEFAULT 'related', -- "series", "related-topic", "follow-up", "related"
  relevance_note TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(article_id, related_article_id),
  CHECK (article_id != related_article_id)
);

CREATE INDEX idx_article_related_articles_article ON article_related_articles(article_id);
CREATE INDEX idx_article_related_articles_related ON article_related_articles(related_article_id);

-- ============================================================
-- 8. STORIES CROSS-CONTENT RELATIONSHIPS (Platform Stories)
-- ============================================================

-- Platform stories related to art/innovation projects
CREATE TABLE IF NOT EXISTS story_related_art (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  art_innovation_id UUID REFERENCES art_innovation(id) ON DELETE CASCADE,
  relevance_note TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(story_id, art_innovation_id)
);

CREATE INDEX idx_story_related_art_story ON story_related_art(story_id);
CREATE INDEX idx_story_related_art_art ON story_related_art(art_innovation_id);

-- Platform stories related to community programs
CREATE TABLE IF NOT EXISTS story_related_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  program_id UUID REFERENCES community_programs(id) ON DELETE CASCADE,
  relevance_note TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(story_id, program_id)
);

CREATE INDEX idx_story_related_programs_story ON story_related_programs(story_id);
CREATE INDEX idx_story_related_programs_program ON story_related_programs(program_id);

-- Platform stories related to services
CREATE TABLE IF NOT EXISTS story_related_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  relevance_note TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(story_id, service_id)
);

CREATE INDEX idx_story_related_services_story ON story_related_services(story_id);
CREATE INDEX idx_story_related_services_service ON story_related_services(service_id);

-- ============================================================
-- 9. FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at for public_profiles
CREATE OR REPLACE FUNCTION update_public_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_public_profiles_updated_at
  BEFORE UPDATE ON public_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_public_profiles_updated_at();

-- Generate slug from full_name if not provided
CREATE OR REPLACE FUNCTION generate_public_profile_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug = lower(regexp_replace(regexp_replace(NEW.full_name, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_public_profile_slug
  BEFORE INSERT OR UPDATE OF full_name ON public_profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_public_profile_slug();

-- ============================================================
-- 10. ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all new tables
ALTER TABLE public_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE art_innovation_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_programs_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_related_art ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_related_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_related_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_related_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_related_art ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_related_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_related_services ENABLE ROW LEVEL SECURITY;

-- Public read access to public profiles
CREATE POLICY "public_profiles_public_read" ON public_profiles
  FOR SELECT
  USING (is_public = true);

-- Authenticated users can see all profiles
CREATE POLICY "public_profiles_authenticated_read" ON public_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Service role can manage all profiles
CREATE POLICY "public_profiles_service_manage" ON public_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Public read access to all relationship tables
CREATE POLICY "art_innovation_profiles_public_read" ON art_innovation_profiles
  FOR SELECT USING (true);

CREATE POLICY "community_programs_profiles_public_read" ON community_programs_profiles
  FOR SELECT USING (true);

CREATE POLICY "services_profiles_public_read" ON services_profiles
  FOR SELECT USING (true);

CREATE POLICY "article_related_art_public_read" ON article_related_art
  FOR SELECT USING (true);

CREATE POLICY "article_related_programs_public_read" ON article_related_programs
  FOR SELECT USING (true);

CREATE POLICY "article_related_services_public_read" ON article_related_services
  FOR SELECT USING (true);

CREATE POLICY "article_related_articles_public_read" ON article_related_articles
  FOR SELECT USING (true);

CREATE POLICY "story_related_art_public_read" ON story_related_art
  FOR SELECT USING (true);

CREATE POLICY "story_related_programs_public_read" ON story_related_programs
  FOR SELECT USING (true);

CREATE POLICY "story_related_services_public_read" ON story_related_services
  FOR SELECT USING (true);

-- Service role can manage all relationships
CREATE POLICY "art_innovation_profiles_service_manage" ON art_innovation_profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "community_programs_profiles_service_manage" ON community_programs_profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "services_profiles_service_manage" ON services_profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "article_related_art_service_manage" ON article_related_art
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "article_related_programs_service_manage" ON article_related_programs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "article_related_services_service_manage" ON article_related_services
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "article_related_articles_service_manage" ON article_related_articles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "story_related_art_service_manage" ON story_related_art
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "story_related_programs_service_manage" ON story_related_programs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "story_related_services_service_manage" ON story_related_services
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- 11. HELPFUL COMMENTS
-- ============================================================

COMMENT ON TABLE public_profiles IS 'Central registry for public-facing people across all content types';
COMMENT ON COLUMN public_profiles.user_id IS 'Links to users table if person is also a platform user';
COMMENT ON COLUMN public_profiles.empathy_ledger_profile_id IS 'Links to Empathy Ledger profile if applicable';
COMMENT ON COLUMN public_profiles.is_public IS 'Privacy control - false hides profile from public view';

COMMENT ON TABLE art_innovation_profiles IS 'Links people to art & innovation projects';
COMMENT ON TABLE community_programs_profiles IS 'Links people to community programs';
COMMENT ON TABLE services_profiles IS 'Links people to services';

COMMENT ON TABLE article_related_art IS 'Links articles to art/innovation projects they discuss';
COMMENT ON TABLE article_related_programs IS 'Links articles to community programs they discuss';
COMMENT ON TABLE article_related_services IS 'Links articles to services they discuss';
COMMENT ON TABLE article_related_articles IS 'Links related articles for "related reading" sections';

-- ============================================================
-- 12. VERIFICATION MESSAGE
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Unified Profiles & Connected Content System Created!';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables Created:';
  RAISE NOTICE '  - public_profiles (central profile registry)';
  RAISE NOTICE '  - art_innovation_profiles';
  RAISE NOTICE '  - community_programs_profiles';
  RAISE NOTICE '  - services_profiles';
  RAISE NOTICE '  - article_related_art';
  RAISE NOTICE '  - article_related_programs';
  RAISE NOTICE '  - article_related_services';
  RAISE NOTICE '  - article_related_articles';
  RAISE NOTICE '  - story_related_art';
  RAISE NOTICE '  - story_related_programs';
  RAISE NOTICE '  - story_related_services';
  RAISE NOTICE '';
  RAISE NOTICE 'Extended Tables:';
  RAISE NOTICE '  - authors (added public_profile_id column)';
  RAISE NOTICE '  - profile_appearances (added public_profile_id column)';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next Steps:';
  RAISE NOTICE '  1. Run migration script to create profiles for Benjamin & Nicholas';
  RAISE NOTICE '  2. Link profiles to CONTAINED project';
  RAISE NOTICE '  3. Update frontend to display linked profiles';
  RAISE NOTICE '';
END $$;
