-- =========================================
-- STORY WORKSPACES & OWNERSHIP SYSTEM
-- Migration: 20250115_story_workspaces
-- =========================================

-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================
-- 1. STORY WORKSPACES TABLE
-- For AI-assisted transcript → story workflow
-- =========================================

CREATE TABLE IF NOT EXISTS story_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  working_title TEXT,
  storyteller_name TEXT NOT NULL,
  storyteller_contact TEXT,

  -- Source materials
  transcript_text TEXT,
  transcript_file_url TEXT,
  audio_file_url TEXT,
  interview_date DATE,
  interviewer_id UUID REFERENCES public_profiles(id),

  -- AI extraction results (JSONB for flexibility)
  extracted_quotes JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{"text": "quote", "theme": "theme name", "strength": "why powerful"}]

  key_themes JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{"name": "theme", "description": "desc", "quote_examples": []}]

  case_studies JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{"title": "title", "description": "desc", "key_points": []}]

  -- Draft versions
  draft_content TEXT,
  draft_version INTEGER DEFAULT 1,

  -- Status tracking
  status TEXT DEFAULT 'transcript_uploaded',
  -- Values: transcript_uploaded, quotes_extracted, draft_generated, sent_for_review, approved, published

  -- Link to published article
  published_article_id TEXT REFERENCES articles(slug),

  -- Notes
  notes TEXT,
  internal_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX idx_story_workspaces_status ON story_workspaces(status);
CREATE INDEX idx_story_workspaces_storyteller_contact ON story_workspaces(storyteller_contact);
CREATE INDEX idx_story_workspaces_interviewer ON story_workspaces(interviewer_id);

-- =========================================
-- 2. STORY OWNERSHIP TABLE
-- Track who owns each story and revenue sharing
-- =========================================

CREATE TABLE IF NOT EXISTS story_ownership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id TEXT REFERENCES articles(slug) ON DELETE CASCADE,

  -- Storyteller information
  storyteller_name TEXT NOT NULL,
  storyteller_email TEXT,
  storyteller_phone TEXT,
  storyteller_wallet TEXT, -- For crypto payments (future)

  -- Ownership details
  ownership_type TEXT DEFAULT 'full_ownership_with_platform_license',
  platform_license TEXT DEFAULT 'non_exclusive_revocable',
  can_modify BOOLEAN DEFAULT true,
  can_revoke BOOLEAN DEFAULT true,

  -- Revenue sharing
  revenue_share_percent INTEGER DEFAULT 10,
  payment_method TEXT DEFAULT 'bank_transfer',
  payment_details JSONB,

  -- Consent tracking
  consent_form_url TEXT,
  consent_date TIMESTAMP WITH TIME ZONE,
  consent_expiry TIMESTAMP WITH TIME ZONE,
  consent_status TEXT DEFAULT 'pending',
  -- Values: pending, approved, revoked

  -- Revenue totals
  total_revenue_generated DECIMAL(10,2) DEFAULT 0.00,
  total_revenue_paid DECIMAL(10,2) DEFAULT 0.00,
  last_payment_date TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_story_ownership_story_id ON story_ownership(story_id);
CREATE INDEX idx_story_ownership_storyteller_email ON story_ownership(storyteller_email);
CREATE INDEX idx_story_ownership_consent_status ON story_ownership(consent_status);

-- =========================================
-- 3. STORY REVENUE EVENTS TABLE
-- Track when stories generate value
-- =========================================

CREATE TABLE IF NOT EXISTS story_revenue_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id TEXT REFERENCES articles(slug),
  ownership_id UUID REFERENCES story_ownership(id),

  -- Event details
  event_type TEXT NOT NULL,
  -- Values: grant_citation, media_license, book_deal, speaking, policy_reference
  event_date DATE DEFAULT CURRENT_DATE,
  event_description TEXT,

  -- Revenue amounts
  total_amount DECIMAL(10,2),
  storyteller_share DECIMAL(10,2),
  platform_share DECIMAL(10,2),

  -- Payment tracking
  payment_status TEXT DEFAULT 'pending',
  -- Values: pending, paid, declined
  payment_date TIMESTAMP WITH TIME ZONE,
  payment_reference TEXT,
  payment_notes TEXT,

  -- Source information
  source_organization TEXT,
  source_contact TEXT,
  source_documentation_url TEXT,

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_story_revenue_events_story_id ON story_revenue_events(story_id);
CREATE INDEX idx_story_revenue_events_ownership_id ON story_revenue_events(ownership_id);
CREATE INDEX idx_story_revenue_events_payment_status ON story_revenue_events(payment_status);
CREATE INDEX idx_story_revenue_events_event_date ON story_revenue_events(event_date);

-- =========================================
-- 4. STORY USAGE LOG TABLE
-- Track how stories are being used (citations, references)
-- =========================================

CREATE TABLE IF NOT EXISTS story_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id TEXT REFERENCES articles(slug),

  -- Usage details
  usage_type TEXT NOT NULL,
  -- Values: grant_application, media_article, policy_document, presentation, research_paper
  used_by TEXT,
  usage_date DATE DEFAULT CURRENT_DATE,
  usage_url TEXT,
  usage_description TEXT,

  -- Consent verification
  consent_verified BOOLEAN DEFAULT false,
  consent_verified_by UUID REFERENCES public_profiles(id),
  consent_verified_date TIMESTAMP WITH TIME ZONE,

  -- Notes
  notes TEXT,

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_story_usage_log_story_id ON story_usage_log(story_id);
CREATE INDEX idx_story_usage_log_usage_type ON story_usage_log(usage_type);
CREATE INDEX idx_story_usage_log_usage_date ON story_usage_log(usage_date);

-- =========================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================

-- Enable RLS on all new tables
ALTER TABLE story_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_ownership ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_revenue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_usage_log ENABLE ROW LEVEL SECURITY;

-- Story Workspaces: Only admins can manage
CREATE POLICY "Admins can manage all workspaces"
  ON story_workspaces FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_role = 'admin'
    )
  );

-- Story Ownership: Admins can manage all
CREATE POLICY "Admins can manage all ownership records"
  ON story_ownership FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_role = 'admin'
    )
  );

-- Story Ownership: Storytellers can view their own (future feature)
CREATE POLICY "Storytellers can view their own ownership"
  ON story_ownership FOR SELECT
  USING (storyteller_email = auth.jwt()->>'email');

-- Revenue Events: Admins only
CREATE POLICY "Admins can manage revenue events"
  ON story_revenue_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_role = 'admin'
    )
  );

-- Usage Log: Admins only
CREATE POLICY "Admins can manage usage log"
  ON story_usage_log FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_role = 'admin'
    )
  );

-- =========================================
-- 6. HELPER FUNCTIONS
-- =========================================

-- Function to update workspace timestamp on changes
CREATE OR REPLACE FUNCTION update_story_workspace_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update workspace timestamp
CREATE TRIGGER update_story_workspace_timestamp
  BEFORE UPDATE ON story_workspaces
  FOR EACH ROW
  EXECUTE FUNCTION update_story_workspace_timestamp();

-- Function to update ownership timestamp on changes
CREATE OR REPLACE FUNCTION update_story_ownership_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update ownership timestamp
CREATE TRIGGER update_story_ownership_timestamp
  BEFORE UPDATE ON story_ownership
  FOR EACH ROW
  EXECUTE FUNCTION update_story_ownership_timestamp();

-- =========================================
-- 7. VERIFICATION
-- =========================================

-- Check that all tables were created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('story_workspaces', 'story_ownership', 'story_revenue_events', 'story_usage_log')
  ) THEN
    RAISE NOTICE '✅ All story workspace tables created successfully';
  ELSE
    RAISE EXCEPTION '❌ Some tables failed to create';
  END IF;
END $$;

-- Display summary
SELECT
  'story_workspaces' as table_name,
  COUNT(*) as row_count
FROM story_workspaces
UNION ALL
SELECT
  'story_ownership' as table_name,
  COUNT(*) as row_count
FROM story_ownership
UNION ALL
SELECT
  'story_revenue_events' as table_name,
  COUNT(*) as row_count
FROM story_revenue_events
UNION ALL
SELECT
  'story_usage_log' as table_name,
  COUNT(*) as row_count
FROM story_usage_log;

-- =========================================
-- SUCCESS MESSAGE
-- =========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║   STORY WORKSPACES MIGRATION COMPLETED SUCCESSFULLY        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Tables created:';
  RAISE NOTICE '   • story_workspaces (AI workflow)';
  RAISE NOTICE '   • story_ownership (ownership tracking)';
  RAISE NOTICE '   • story_revenue_events (revenue tracking)';
  RAISE NOTICE '   • story_usage_log (usage tracking)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ RLS policies enabled (admin-only access)';
  RAISE NOTICE '✅ Indexes created for performance';
  RAISE NOTICE '✅ Triggers added for auto-timestamps';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Create API route: /api/stories/extract-quotes';
  RAISE NOTICE '2. Create admin page: /admin/stories/transcript';
  RAISE NOTICE '3. Add ANTHROPIC_API_KEY to .env.local';
  RAISE NOTICE '';
END $$;
