-- Partner Enrichment Schema
-- Created: January 8, 2026
-- Purpose: Rich content linking for JusticeHub partner organizations
-- Links: videos, stories, storytellers, photos, goals, missions

-- ============================================
-- 1. Partner Videos (YouTube, Vimeo, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS partner_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  node_id UUID REFERENCES justicehub_nodes(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL, -- Full YouTube/Vimeo URL
  video_id TEXT, -- YouTube video ID for embedding
  platform TEXT DEFAULT 'youtube' CHECK (platform IN ('youtube', 'vimeo', 'wistia', 'other')),
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  video_type TEXT DEFAULT 'documentary' CHECK (video_type IN ('documentary', 'interview', 'promotional', 'training', 'event', 'music_video')),
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  published_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. Partner Goals & Missions
-- ============================================
CREATE TABLE IF NOT EXISTS partner_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('mission', 'vision', 'goal', 'value', 'principle')),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Lucide icon name
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. Partner Contact Methods
-- ============================================
CREATE TABLE IF NOT EXISTS partner_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('email', 'phone', 'website', 'social', 'address', 'booking')),
  label TEXT NOT NULL, -- "General Inquiries", "Youth Support Line", etc.
  value TEXT NOT NULL, -- The actual contact info
  icon TEXT, -- Lucide icon name
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. Partner Photo Galleries
-- ============================================
CREATE TABLE IF NOT EXISTS partner_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  node_id UUID REFERENCES justicehub_nodes(id) ON DELETE SET NULL,
  title TEXT,
  description TEXT,
  photographer TEXT,
  photo_url TEXT NOT NULL, -- Supabase storage URL
  thumbnail_url TEXT,
  photo_type TEXT DEFAULT 'general' CHECK (photo_type IN ('hero', 'gallery', 'profile', 'event', 'site', 'general')),
  location_name TEXT,
  taken_at DATE,
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. Linked Storytellers from Empathy Ledger
-- ============================================
CREATE TABLE IF NOT EXISTS partner_storytellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  node_id UUID REFERENCES justicehub_nodes(id) ON DELETE SET NULL,
  empathy_ledger_profile_id UUID NOT NULL, -- References empathy_ledger.profiles
  display_name TEXT NOT NULL,
  role_at_org TEXT, -- "Youth Ambassador", "Elder", "Coordinator"
  bio_excerpt TEXT, -- Short bio for display
  avatar_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  consent_level TEXT DEFAULT 'public' CHECK (consent_level IN ('public', 'organization', 'private')),
  linked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, empathy_ledger_profile_id)
);

-- ============================================
-- 6. Linked Stories from Empathy Ledger
-- ============================================
CREATE TABLE IF NOT EXISTS partner_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  node_id UUID REFERENCES justicehub_nodes(id) ON DELETE SET NULL,
  empathy_ledger_story_id UUID NOT NULL, -- References empathy_ledger.stories
  title TEXT NOT NULL,
  excerpt TEXT, -- Preview text
  thumbnail_url TEXT,
  story_type TEXT, -- 'interview', 'documentary', 'photo_essay'
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  consent_level TEXT DEFAULT 'public' CHECK (consent_level IN ('public', 'organization', 'private')),
  linked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, empathy_ledger_story_id)
);

-- ============================================
-- 7. Partner Impact Metrics
-- ============================================
CREATE TABLE IF NOT EXISTS partner_impact_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL, -- "Young People Supported", "Programs Running"
  metric_value TEXT NOT NULL, -- "21", "90%", "3 Years"
  metric_context TEXT, -- "since 2021", "retention rate"
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. Partner Site Locations (for interactive maps)
-- ============================================
CREATE TABLE IF NOT EXISTS partner_site_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Yarning Circle", "Workshop Container"
  description TEXT,
  location_type TEXT, -- "building", "nature", "utility", "infrastructure"
  status TEXT DEFAULT 'planned' CHECK (status IN ('completed', 'in_progress', 'planned', 'concept')),
  x_percent DECIMAL(5,2), -- Position on site map (0-100)
  y_percent DECIMAL(5,2),
  icon TEXT,
  photo_url TEXT,
  interactive_map_url TEXT, -- Link to interactive site plan app
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_partner_videos_org ON partner_videos(organization_id);
CREATE INDEX IF NOT EXISTS idx_partner_videos_featured ON partner_videos(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_partner_goals_org ON partner_goals(organization_id);
CREATE INDEX IF NOT EXISTS idx_partner_contacts_org ON partner_contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_partner_photos_org ON partner_photos(organization_id);
CREATE INDEX IF NOT EXISTS idx_partner_photos_featured ON partner_photos(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_partner_storytellers_org ON partner_storytellers(organization_id);
CREATE INDEX IF NOT EXISTS idx_partner_stories_org ON partner_stories(organization_id);
CREATE INDEX IF NOT EXISTS idx_partner_impact_org ON partner_impact_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_partner_sites_org ON partner_site_locations(organization_id);

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE partner_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_storytellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_impact_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_site_locations ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public can view public videos" ON partner_videos
  FOR SELECT USING (is_public = true);

CREATE POLICY "Public can view goals" ON partner_goals
  FOR SELECT USING (true);

CREATE POLICY "Public can view contacts" ON partner_contacts
  FOR SELECT USING (true);

CREATE POLICY "Public can view public photos" ON partner_photos
  FOR SELECT USING (is_public = true);

CREATE POLICY "Public can view public storytellers" ON partner_storytellers
  FOR SELECT USING (is_public = true AND consent_level = 'public');

CREATE POLICY "Public can view public stories" ON partner_stories
  FOR SELECT USING (is_public = true AND consent_level = 'public');

CREATE POLICY "Public can view impact metrics" ON partner_impact_metrics
  FOR SELECT USING (is_featured = true);

CREATE POLICY "Public can view site locations" ON partner_site_locations
  FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Service role full access videos" ON partner_videos
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access goals" ON partner_goals
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access contacts" ON partner_contacts
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access photos" ON partner_photos
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access storytellers" ON partner_storytellers
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access stories" ON partner_stories
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access impact" ON partner_impact_metrics
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access sites" ON partner_site_locations
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- Update trigger
-- ============================================
CREATE TRIGGER update_partner_videos_updated_at
  BEFORE UPDATE ON partner_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_partner_impact_updated_at
  BEFORE UPDATE ON partner_impact_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
