-- ═══════════════════════════════════════════════════════════════════════════
-- JusticeHub Entity Relationships Migration
-- Adds missing foreign keys and junction tables for entity relationships
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ORGANIZATION ↔ PEOPLE (Team Members)
-- ─────────────────────────────────────────────────────────────────────────────

-- Create junction table if not exists
CREATE TABLE IF NOT EXISTS organization_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public_profiles(id) ON DELETE CASCADE,
  role VARCHAR(100), -- 'founder', 'staff', 'advisor', 'volunteer'
  title VARCHAR(200), -- Job title
  is_primary BOOLEAN DEFAULT false, -- Primary contact
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, profile_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_org_profile_org ON organization_profile(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_profile_profile ON organization_profile(profile_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. PROGRAMS ↔ ORGANIZATIONS (Operating Org)
-- ─────────────────────────────────────────────────────────────────────────────

-- Add FK column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'community_programs' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE community_programs ADD COLUMN organization_id UUID REFERENCES organizations(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_community_programs_org ON community_programs(organization_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. SERVICES ↔ ORGANIZATIONS
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE services ADD COLUMN organization_id UUID REFERENCES organizations(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_services_org ON services(organization_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ALMA INTERVENTION ↔ EVIDENCE (Junction)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS alma_intervention_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intervention_id UUID NOT NULL REFERENCES alma_interventions(id) ON DELETE CASCADE,
  evidence_id UUID NOT NULL REFERENCES alma_evidence(id) ON DELETE CASCADE,
  relevance_score DECIMAL(3,2) DEFAULT 1.0, -- 0-1 relevance
  relationship_type VARCHAR(50) DEFAULT 'supports', -- 'supports', 'contradicts', 'informs'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(intervention_id, evidence_id)
);

CREATE INDEX IF NOT EXISTS idx_int_ev_intervention ON alma_intervention_evidence(intervention_id);
CREATE INDEX IF NOT EXISTS idx_int_ev_evidence ON alma_intervention_evidence(evidence_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. ALMA INTERVENTION ↔ OUTCOMES (Junction)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS alma_intervention_outcome (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intervention_id UUID NOT NULL REFERENCES alma_interventions(id) ON DELETE CASCADE,
  outcome_id UUID NOT NULL REFERENCES alma_outcomes(id) ON DELETE CASCADE,
  impact_level VARCHAR(50), -- 'high', 'moderate', 'low'
  measurement_approach TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(intervention_id, outcome_id)
);

CREATE INDEX IF NOT EXISTS idx_int_out_intervention ON alma_intervention_outcome(intervention_id);
CREATE INDEX IF NOT EXISTS idx_int_out_outcome ON alma_intervention_outcome(outcome_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. CONTENT ↔ ENTITY RELATIONSHIPS
-- ─────────────────────────────────────────────────────────────────────────────

-- Blog posts can relate to programs
CREATE TABLE IF NOT EXISTS blog_program (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES community_programs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(blog_post_id, program_id)
);

-- Blog posts can relate to interventions
CREATE TABLE IF NOT EXISTS blog_intervention (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  intervention_id UUID NOT NULL REFERENCES alma_interventions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(blog_post_id, intervention_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. HISTORICAL INQUIRIES TABLE (if not exists)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS historical_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  inquiry_type VARCHAR(50) NOT NULL, -- 'royal_commission', 'parliamentary', 'government_review', 'coronial'
  jurisdiction VARCHAR(10) NOT NULL, -- State code
  year_started INTEGER,
  year_published INTEGER,
  summary TEXT,
  recommendations_count INTEGER,
  implementation_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'partial', 'implemented', 'rejected'
  source_url TEXT,
  key_findings TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inquiries_jurisdiction ON historical_inquiries(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_inquiries_type ON historical_inquiries(inquiry_type);
CREATE INDEX IF NOT EXISTS idx_inquiries_year ON historical_inquiries(year_published);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. MEDIA ITEMS TABLE (if not exists)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS media_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  media_type VARCHAR(50) NOT NULL, -- 'photo', 'video', 'artwork', 'audio', 'document'
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  creator_name VARCHAR(200),
  creator_profile_id UUID REFERENCES public_profiles(id),
  organization_id UUID REFERENCES organizations(id),
  program_id UUID REFERENCES community_programs(id),
  views INTEGER DEFAULT 0,
  duration VARCHAR(20), -- For video/audio
  file_size_bytes BIGINT,
  mime_type VARCHAR(100),
  tags TEXT[],
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  consent_level VARCHAR(50) DEFAULT 'Public',
  attribution_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_type ON media_item(media_type);
CREATE INDEX IF NOT EXISTS idx_media_creator ON media_item(creator_profile_id);
CREATE INDEX IF NOT EXISTS idx_media_org ON media_item(organization_id);
CREATE INDEX IF NOT EXISTS idx_media_featured ON media_item(is_featured) WHERE is_featured = true;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. CONTENT COMPLETENESS TRACKING
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS content_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(100) NOT NULL,
  total_count INTEGER DEFAULT 0,
  complete_count INTEGER DEFAULT 0, -- Has all required fields
  has_relationships_count INTEGER DEFAULT 0, -- Has at least one relationship
  featured_count INTEGER DEFAULT 0,
  last_checked_at TIMESTAMPTZ DEFAULT now(),
  issues JSONB DEFAULT '[]', -- Array of issues found
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_health_type ON content_health(entity_type);

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. VIEWS FOR CONTENT COMPLETENESS
-- ─────────────────────────────────────────────────────────────────────────────

-- Intervention completeness view
CREATE OR REPLACE VIEW intervention_completeness AS
SELECT
  id,
  name,
  CASE WHEN description IS NOT NULL AND length(description) > 50 THEN 1 ELSE 0 END +
  CASE WHEN type IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN evidence_level IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN consent_level IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN metadata->>'state' IS NOT NULL THEN 1 ELSE 0 END AS completeness_score,
  5 AS max_score,
  ROUND(
    (CASE WHEN description IS NOT NULL AND length(description) > 50 THEN 1 ELSE 0 END +
     CASE WHEN type IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN evidence_level IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN consent_level IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN metadata->>'state' IS NOT NULL THEN 1 ELSE 0 END)::numeric / 5 * 100
  ) AS completeness_pct
FROM alma_interventions;

-- Organization completeness view
CREATE OR REPLACE VIEW organization_completeness AS
SELECT
  id,
  name,
  CASE WHEN description IS NOT NULL AND length(description) > 20 THEN 1 ELSE 0 END +
  CASE WHEN type IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN state IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN website IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN logo_url IS NOT NULL THEN 1 ELSE 0 END AS completeness_score,
  5 AS max_score
FROM organizations;

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. ROW LEVEL SECURITY (Enable if not already)
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable RLS on new tables
ALTER TABLE organization_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE alma_intervention_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE alma_intervention_outcome ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_program ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_intervention ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_health ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY IF NOT EXISTS "Public read organization_profile"
  ON organization_profile FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Public read intervention_evidence"
  ON alma_intervention_evidence FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Public read intervention_outcome"
  ON alma_intervention_outcome FOR SELECT USING (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- DONE: Run this migration in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════
