-- ============================================================
-- RESTORE INITIATIVES & PROFILE RELATIONSHIPS
-- ============================================================
-- This migration restores missing initiative tables and creates
-- the relationship tables to link them to the consolidated `profiles` table.

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure Supabase Auth roles exist (for local dev environments)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN NOINHERIT;
  END IF;
END
$$;

-- Grant usage on schema public were needed
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

-- ============================================================
-- 1. ART & INNOVATION PROJECTS
-- ============================================

CREATE TABLE IF NOT EXISTS art_innovation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Basic Information
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('art', 'campaign', 'innovation', 'technology', 'design', 'multimedia')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),

  -- Content
  tagline TEXT,
  description TEXT NOT NULL,
  story TEXT,
  impact TEXT,

  -- Media
  featured_image_url TEXT,
  video_url TEXT,
  gallery_images JSONB DEFAULT '[]'::jsonb,

  -- Creators/Artists (Legacy JSON - preferred to use relationship table)
  creators JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  year INTEGER,
  location TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Links
  website_url TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,

  -- Related Content
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  
  -- Engagement
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,

  -- Search
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(tagline, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(story, '')), 'D')
  ) STORED
);

CREATE INDEX IF NOT EXISTS idx_art_innovation_slug ON art_innovation(slug);
CREATE INDEX IF NOT EXISTS idx_art_innovation_type ON art_innovation(type);
CREATE INDEX IF NOT EXISTS idx_art_innovation_status ON art_innovation(status);
CREATE INDEX IF NOT EXISTS idx_art_innovation_featured ON art_innovation(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_art_innovation_search ON art_innovation USING GIN(search_vector);

-- ============================================================
-- 2. COMMUNITY PROGRAMS
-- ============================================

CREATE TABLE IF NOT EXISTS community_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Information
  name TEXT NOT NULL,
  organization TEXT NOT NULL,
  location TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT')),

  -- Categorization
  approach TEXT NOT NULL CHECK (approach IN ('Indigenous-led', 'Community-based', 'Grassroots', 'Culturally-responsive')),
  indigenous_knowledge BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,

  -- Description
  description TEXT NOT NULL,
  impact_summary TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',

  -- Metrics
  success_rate INTEGER CHECK (success_rate >= 0 AND success_rate <= 100),
  participants_served INTEGER,
  years_operating INTEGER,
  founded_year INTEGER,
  community_connection_score INTEGER CHECK (community_connection_score >= 0 AND community_connection_score <= 100),

  -- Contact Information
  contact_phone TEXT,
  contact_email TEXT,
  website TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,

  -- Search
  search_vector TSVECTOR
);

CREATE INDEX IF NOT EXISTS idx_community_programs_state ON community_programs(state);
CREATE INDEX IF NOT EXISTS idx_community_programs_featured ON community_programs(is_featured);
CREATE INDEX IF NOT EXISTS idx_community_programs_search ON community_programs USING GIN(search_vector);

-- Trigger for community_programs search vector (Using DO block to avoid error if function exists)
DO $$
BEGIN
  CREATE OR REPLACE FUNCTION update_community_programs_search_vector()
  RETURNS TRIGGER AS $func$
  BEGIN
    NEW.search_vector :=
      setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
      setweight(to_tsvector('english', COALESCE(NEW.organization, '')), 'A') ||
      setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
      setweight(to_tsvector('english', COALESCE(NEW.impact_summary, '')), 'B') ||
      setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
    RETURN NEW;
  END;
  $func$ LANGUAGE plpgsql;
END
$$;

DROP TRIGGER IF EXISTS trigger_update_community_programs_search_vector ON community_programs;
CREATE TRIGGER trigger_update_community_programs_search_vector
  BEFORE INSERT OR UPDATE ON community_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_community_programs_search_vector();

-- ============================================================
-- 3. SERVICES
-- ============================================

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Core Information
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  program_type TEXT,
  service_category TEXT[] DEFAULT '{}',
  target_age_min INTEGER,
  target_age_max INTEGER,
  delivery_method TEXT[] DEFAULT '{}',
  
  -- Service Details (Youth Justice Enhanced)
  youth_specific BOOLEAN DEFAULT false,
  indigenous_specific BOOLEAN DEFAULT false,
  languages_supported TEXT[] DEFAULT '{}',
  accessibility_features TEXT[] DEFAULT '{}',
  
  -- Status & Capacity
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_accepting_referrals BOOLEAN DEFAULT true,
  capacity_total INTEGER,
  capacity_current INTEGER DEFAULT 0,
  waitlist_time_weeks INTEGER,
  
  -- Contact & Location
  location_address TEXT,
  location_city TEXT,
  location_state TEXT,
  location_postcode TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  contact_phone TEXT,
  contact_email TEXT,
  website_url TEXT,
  online_booking_url TEXT,
  operating_hours JSONB DEFAULT '{}',
  
  -- Verification & Source
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('verified', 'unverified', 'needs_review', 'rejected')),
  data_source TEXT,
  data_source_url TEXT,
  scrape_confidence_score DECIMAL(3,2),
  last_verified_at TIMESTAMP WITH TIME ZONE,
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_services_slug ON services(slug);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_org ON services(organization_id);
CREATE INDEX IF NOT EXISTS idx_services_youth ON services(youth_specific);

-- ============================================================
-- 4. PROFILE RELATIONSHIP TABLES (Linking to `profiles`)
-- ============================================================

-- Link profiles to art/innovation projects
CREATE TABLE IF NOT EXISTS art_innovation_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  art_innovation_id UUID REFERENCES art_innovation(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Role Information
  role TEXT NOT NULL, -- "creator", "contributor", "collaborator", "co-founder"
  role_description TEXT,

  -- Display
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(art_innovation_id, profile_id)
);

-- Link profiles to community programs
CREATE TABLE IF NOT EXISTS community_programs_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES community_programs(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Role Information
  role TEXT NOT NULL,
  role_description TEXT,

  -- Display
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(program_id, profile_id)
);

-- Link profiles to services
CREATE TABLE IF NOT EXISTS services_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Role Information
  role TEXT NOT NULL,
  role_description TEXT,

  -- Display
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(service_id, profile_id)
);

-- Indexes for relationship tables
CREATE INDEX IF NOT EXISTS idx_art_inn_profiles_profile ON art_innovation_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_art_inn_profiles_art ON art_innovation_profiles(art_innovation_id);
CREATE INDEX IF NOT EXISTS idx_comm_prog_profiles_profile ON community_programs_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_comm_prog_profiles_prog ON community_programs_profiles(program_id);
CREATE INDEX IF NOT EXISTS idx_services_profiles_profile ON services_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_services_profiles_service ON services_profiles(service_id);

-- ============================================================
-- 5. UPDATE TIMESTAMPS TRIGGER
-- ============================================================

-- Ensure the update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS tr_art_innovation_updated_at ON art_innovation;
DROP TRIGGER IF EXISTS tr_community_programs_updated_at ON community_programs;
DROP TRIGGER IF EXISTS tr_services_updated_at ON services;

CREATE TRIGGER tr_art_innovation_updated_at BEFORE UPDATE ON art_innovation FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_community_programs_updated_at BEFORE UPDATE ON community_programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE art_innovation ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE art_innovation_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_programs_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services_profiles ENABLE ROW LEVEL SECURITY;

-- Drop exist policies to avoid errors on rerun
DROP POLICY IF EXISTS "Public read art_innovation" ON art_innovation;
DROP POLICY IF EXISTS "Public read community_programs" ON community_programs;
DROP POLICY IF EXISTS "Public read services" ON services;
DROP POLICY IF EXISTS "Public read art_inn_profiles" ON art_innovation_profiles;
DROP POLICY IF EXISTS "Public read comm_prog_profiles" ON community_programs_profiles;
DROP POLICY IF EXISTS "Public read services_profiles" ON services_profiles;

DROP POLICY IF EXISTS "Auth read all art_innovation" ON art_innovation;
DROP POLICY IF EXISTS "Service manage art_innovation" ON art_innovation;
DROP POLICY IF EXISTS "Service manage community_programs" ON community_programs;
DROP POLICY IF EXISTS "Service manage services" ON services;
DROP POLICY IF EXISTS "Service manage art_inn_profiles" ON art_innovation_profiles;
DROP POLICY IF EXISTS "Service manage comm_prog_profiles" ON community_programs_profiles;
DROP POLICY IF EXISTS "Service manage services_profiles" ON services_profiles;


-- Public read access
CREATE POLICY "Public read art_innovation" ON art_innovation FOR SELECT USING (status = 'published');
CREATE POLICY "Public read community_programs" ON community_programs FOR SELECT USING (true);
CREATE POLICY "Public read services" ON services FOR SELECT USING (is_active = true);
CREATE POLICY "Public read art_inn_profiles" ON art_innovation_profiles FOR SELECT USING (true);
CREATE POLICY "Public read comm_prog_profiles" ON community_programs_profiles FOR SELECT USING (true);
CREATE POLICY "Public read services_profiles" ON services_profiles FOR SELECT USING (true);

-- Authenticated users can see all (for admin/browsing)
CREATE POLICY "Auth read all art_innovation" ON art_innovation FOR SELECT TO authenticated USING (true);

-- Service role has full access
CREATE POLICY "Service manage art_innovation" ON art_innovation FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service manage community_programs" ON community_programs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service manage services" ON services FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service manage art_inn_profiles" ON art_innovation_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service manage comm_prog_profiles" ON community_programs_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service manage services_profiles" ON services_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
