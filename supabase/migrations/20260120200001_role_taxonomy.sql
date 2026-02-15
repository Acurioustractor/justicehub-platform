-- Role Taxonomy for JusticeHub
-- Created: January 20, 2026
-- Purpose: Standardize role naming across all junction tables
--
-- This creates a lookup table for roles instead of an ENUM,
-- allowing new roles to be added without migrations.

-- ============================================
-- 1. Role Taxonomy Lookup Table
-- ============================================
CREATE TABLE IF NOT EXISTS role_taxonomy (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('leadership', 'staff', 'community', 'supporting', 'content', 'testimonial')),
  display_name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_role_taxonomy_category ON role_taxonomy(category);
CREATE INDEX IF NOT EXISTS idx_role_taxonomy_active ON role_taxonomy(is_active) WHERE is_active = true;

-- ============================================
-- 2. Seed Initial Role Values
-- ============================================

-- Leadership roles
INSERT INTO role_taxonomy (id, category, display_name, description, display_order) VALUES
  ('founder', 'leadership', 'Founder', 'Original founder of the organization or initiative', 1),
  ('co-founder', 'leadership', 'Co-Founder', 'Co-founder of the organization or initiative', 2),
  ('director', 'leadership', 'Director', 'Executive or program director', 3),
  ('coordinator', 'leadership', 'Coordinator', 'Program or project coordinator', 4),
  ('board-member', 'leadership', 'Board Member', 'Member of the board of directors', 5)
ON CONFLICT (id) DO NOTHING;

-- Staff roles
INSERT INTO role_taxonomy (id, category, display_name, description, display_order) VALUES
  ('staff', 'staff', 'Staff', 'General staff member', 10),
  ('researcher', 'staff', 'Researcher', 'Research staff or academic researcher', 11),
  ('evaluator', 'staff', 'Evaluator', 'Program evaluator or assessor', 12),
  ('facilitator', 'staff', 'Facilitator', 'Workshop or program facilitator', 13),
  ('case-worker', 'staff', 'Case Worker', 'Youth or community case worker', 14),
  ('youth-worker', 'staff', 'Youth Worker', 'Youth engagement worker', 15)
ON CONFLICT (id) DO NOTHING;

-- Community roles
INSERT INTO role_taxonomy (id, category, display_name, description, display_order) VALUES
  ('participant', 'community', 'Participant', 'Program participant', 20),
  ('community-elder', 'community', 'Community Elder', 'Respected community elder', 21),
  ('elder', 'community', 'Elder', 'Elder (alternative to community-elder)', 22),
  ('mentor', 'community', 'Mentor', 'Mentor or role model', 23),
  ('graduate', 'community', 'Graduate', 'Program graduate or alumni', 24),
  ('family-member', 'community', 'Family Member', 'Family member of participant', 25),
  ('peer-support', 'community', 'Peer Support', 'Peer support worker with lived experience', 26)
ON CONFLICT (id) DO NOTHING;

-- Supporting roles
INSERT INTO role_taxonomy (id, category, display_name, description, display_order) VALUES
  ('volunteer', 'supporting', 'Volunteer', 'Volunteer contributor', 30),
  ('contributor', 'supporting', 'Contributor', 'Content or project contributor', 31),
  ('collaborator', 'supporting', 'Collaborator', 'Partner or collaborator', 32),
  ('supporter', 'supporting', 'Supporter', 'Financial or moral supporter', 33),
  ('advisor', 'supporting', 'Advisor', 'Advisory role', 34),
  ('ambassador', 'supporting', 'Ambassador', 'Community or youth ambassador', 35)
ON CONFLICT (id) DO NOTHING;

-- Content roles
INSERT INTO role_taxonomy (id, category, display_name, description, display_order) VALUES
  ('creator', 'content', 'Creator', 'Content creator', 40),
  ('author', 'content', 'Author', 'Article or story author', 41),
  ('subject', 'content', 'Subject', 'Subject of story or interview', 42),
  ('mentioned', 'content', 'Mentioned', 'Mentioned in content', 43),
  ('photographer', 'content', 'Photographer', 'Photographer or videographer', 44),
  ('interviewer', 'content', 'Interviewer', 'Conducted interview', 45)
ON CONFLICT (id) DO NOTHING;

-- Testimonial roles
INSERT INTO role_taxonomy (id, category, display_name, description, display_order) VALUES
  ('testimonial', 'testimonial', 'Testimonial', 'Provided testimonial', 50),
  ('storyteller', 'testimonial', 'Storyteller', 'Shared their story', 51),
  ('voice', 'testimonial', 'Voice', 'Participant voice or perspective', 52)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. RLS Policies
-- ============================================
ALTER TABLE role_taxonomy ENABLE ROW LEVEL SECURITY;

-- Public can read all roles
CREATE POLICY "Public can view role taxonomy" ON role_taxonomy
  FOR SELECT USING (is_active = true);

-- Service role has full access
CREATE POLICY "Service role full access role taxonomy" ON role_taxonomy
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- 4. Helper Function to Get Roles by Category
-- ============================================
CREATE OR REPLACE FUNCTION get_roles_by_category(p_category TEXT DEFAULT NULL)
RETURNS TABLE (
  id TEXT,
  category TEXT,
  display_name TEXT,
  description TEXT,
  display_order INTEGER
)
LANGUAGE SQL
STABLE
AS $$
  SELECT id, category, display_name, description, display_order
  FROM role_taxonomy
  WHERE is_active = true
    AND (p_category IS NULL OR category = p_category)
  ORDER BY display_order, display_name;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_roles_by_category TO authenticated;
GRANT EXECUTE ON FUNCTION get_roles_by_category TO anon;
