-- Migration: ALMA Weekly Intelligence Reports
-- Purpose: Store and generate weekly intelligence reports for basecamps
-- Part of JusticeHub Data Intelligence Strategy Phase 1

-- Weekly Reports Table
CREATE TABLE IF NOT EXISTS alma_weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Report Period
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,

  -- Report Type
  report_type TEXT NOT NULL CHECK (report_type IN (
    'comprehensive',  -- Full weekly digest
    'funding',        -- Funding-focused
    'research',       -- Research updates
    'media',          -- Media and sentiment
    'sector',         -- Sector movements
    'basecamp'        -- Basecamp-specific
  )),

  -- For basecamp-specific reports
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

  -- Report Content
  title TEXT NOT NULL,
  executive_summary TEXT,

  -- Structured Sections (JSONB for flexibility)
  funding_section JSONB DEFAULT '{}',
  -- {
  --   new_opportunities: [...],
  --   closing_soon: [...],
  --   recently_closed: [...],
  --   total_available: number,
  --   matched_for_basecamp: [...]
  -- }

  research_section JSONB DEFAULT '{}',
  -- {
  --   new_papers: [...],
  --   key_findings: [...],
  --   evidence_gaps: [...]
  -- }

  sector_section JSONB DEFAULT '{}',
  -- {
  --   announcements: [...],
  --   policy_changes: [...],
  --   personnel_changes: [...],
  --   new_programs: [...]
  -- }

  media_section JSONB DEFAULT '{}',
  -- {
  --   positive_coverage: [...],
  --   negative_coverage: [...],
  --   trending_topics: [...],
  --   sentiment_score: number
  -- }

  -- Highlights & Alerts
  highlights TEXT[] DEFAULT '{}',
  alerts TEXT[] DEFAULT '{}',
  recommended_actions TEXT[] DEFAULT '{}',

  -- Statistics Snapshot
  stats_snapshot JSONB DEFAULT '{}',
  -- {
  --   total_services: number,
  --   total_interventions: number,
  --   evidence_records: number,
  --   coverage_by_state: {...}
  -- }

  -- Generation Metadata
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generation_duration_ms INTEGER,
  data_sources_used TEXT[] DEFAULT '{}',

  -- Publishing
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(week_start, report_type, organization_id)
);

-- Indexes
CREATE INDEX idx_weekly_reports_week ON alma_weekly_reports(week_start);
CREATE INDEX idx_weekly_reports_type ON alma_weekly_reports(report_type);
CREATE INDEX idx_weekly_reports_org ON alma_weekly_reports(organization_id);
CREATE INDEX idx_weekly_reports_status ON alma_weekly_reports(status);

-- Auto-update timestamp trigger
CREATE TRIGGER trigger_weekly_reports_updated
  BEFORE UPDATE ON alma_weekly_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_funding_opportunities_timestamp();

-- Report Subscriptions
CREATE TABLE IF NOT EXISTS alma_report_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Subscriber
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT, -- For non-user subscriptions
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

  -- Preferences
  report_types TEXT[] DEFAULT ARRAY['comprehensive'],
  frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  delivery_method TEXT NOT NULL DEFAULT 'email' CHECK (delivery_method IN ('email', 'dashboard', 'both')),

  -- Status
  is_active BOOLEAN DEFAULT true,
  confirmed_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT subscriber_check CHECK (user_id IS NOT NULL OR email IS NOT NULL)
);

CREATE INDEX idx_report_subscriptions_user ON alma_report_subscriptions(user_id);
CREATE INDEX idx_report_subscriptions_org ON alma_report_subscriptions(organization_id);
CREATE INDEX idx_report_subscriptions_active ON alma_report_subscriptions(is_active) WHERE is_active = true;

-- Report Delivery Log
CREATE TABLE IF NOT EXISTS alma_report_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES alma_weekly_reports(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES alma_report_subscriptions(id) ON DELETE SET NULL,

  -- Delivery Details
  delivery_method TEXT NOT NULL,
  recipient_email TEXT,
  recipient_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'opened')),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_report_deliveries_report ON alma_report_deliveries(report_id);
CREATE INDEX idx_report_deliveries_subscription ON alma_report_deliveries(subscription_id);

-- Function: Generate comprehensive weekly report data
CREATE OR REPLACE FUNCTION generate_weekly_report_data(
  p_week_start DATE,
  p_organization_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  funding_data JSONB;
  research_data JSONB;
  stats_data JSONB;
BEGIN
  -- Funding section
  SELECT jsonb_build_object(
    'new_opportunities', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', id,
        'name', name,
        'funder', funder_name,
        'amount', max_grant_amount,
        'deadline', deadline,
        'relevance', relevance_score
      )), '[]'::jsonb)
      FROM alma_funding_opportunities
      WHERE created_at >= p_week_start
        AND created_at < p_week_start + INTERVAL '7 days'
        AND status IN ('open', 'closing_soon')
    ),
    'closing_soon', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', id,
        'name', name,
        'funder', funder_name,
        'deadline', deadline,
        'days_left', EXTRACT(DAY FROM deadline - NOW())::INTEGER
      )), '[]'::jsonb)
      FROM alma_funding_opportunities
      WHERE deadline > NOW()
        AND deadline <= NOW() + INTERVAL '14 days'
        AND status IN ('open', 'closing_soon')
      ORDER BY deadline ASC
    ),
    'total_available', (
      SELECT COALESCE(SUM(total_pool_amount), 0)
      FROM alma_funding_opportunities
      WHERE status IN ('open', 'closing_soon')
    ),
    'count_open', (
      SELECT COUNT(*)
      FROM alma_funding_opportunities
      WHERE status IN ('open', 'closing_soon')
    )
  ) INTO funding_data;

  -- Research section
  SELECT jsonb_build_object(
    'new_evidence', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', id,
        'title', title,
        'type', evidence_type,
        'quality', evidence_quality
      )), '[]'::jsonb)
      FROM alma_evidence
      WHERE created_at >= p_week_start
        AND created_at < p_week_start + INTERVAL '7 days'
      LIMIT 10
    ),
    'total_evidence', (SELECT COUNT(*) FROM alma_evidence)
  ) INTO research_data;

  -- Stats snapshot
  SELECT jsonb_build_object(
    'total_services', (SELECT COUNT(*) FROM services WHERE status = 'active'),
    'total_interventions', (SELECT COUNT(*) FROM alma_interventions WHERE status = 'active'),
    'total_evidence', (SELECT COUNT(*) FROM alma_evidence),
    'total_organizations', (SELECT COUNT(*) FROM organizations),
    'coverage_by_state', (
      SELECT COALESCE(jsonb_object_agg(state, cnt), '{}'::jsonb)
      FROM (
        SELECT state, COUNT(*) as cnt
        FROM services
        WHERE status = 'active' AND state IS NOT NULL
        GROUP BY state
      ) s
    )
  ) INTO stats_data;

  -- Combine all sections
  result := jsonb_build_object(
    'week_start', p_week_start,
    'week_end', p_week_start + INTERVAL '6 days',
    'generated_at', NOW(),
    'funding', funding_data,
    'research', research_data,
    'stats', stats_data
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function: Get current week start (Monday)
CREATE OR REPLACE FUNCTION get_week_start(p_date DATE DEFAULT CURRENT_DATE)
RETURNS DATE AS $$
BEGIN
  RETURN p_date - (EXTRACT(DOW FROM p_date)::INTEGER + 6) % 7;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- View: Latest reports by type
CREATE OR REPLACE VIEW v_latest_reports AS
SELECT DISTINCT ON (report_type)
  id,
  week_start,
  week_end,
  report_type,
  title,
  executive_summary,
  highlights,
  alerts,
  status,
  published_at,
  generated_at
FROM alma_weekly_reports
WHERE status = 'published'
ORDER BY report_type, week_start DESC;

-- RLS Policies
ALTER TABLE alma_weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE alma_report_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alma_report_deliveries ENABLE ROW LEVEL SECURITY;

-- Public published reports are viewable by all
CREATE POLICY "Anyone can view published reports"
  ON alma_weekly_reports FOR SELECT
  USING (status = 'published');

-- Authenticated can view all reports
CREATE POLICY "Authenticated can view all reports"
  ON alma_weekly_reports FOR SELECT
  TO authenticated
  USING (true);

-- Admin can manage reports
CREATE POLICY "Authenticated can manage reports"
  ON alma_weekly_reports FOR ALL
  TO authenticated
  USING (true);

-- Users can manage their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON alma_report_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own subscriptions"
  ON alma_report_subscriptions FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Delivery logs
CREATE POLICY "Users can view own deliveries"
  ON alma_report_deliveries FOR SELECT
  TO authenticated
  USING (recipient_user_id = auth.uid());

COMMENT ON TABLE alma_weekly_reports IS 'Weekly intelligence reports generated by ALMA';
COMMENT ON TABLE alma_report_subscriptions IS 'User subscriptions to weekly reports';
COMMENT ON TABLE alma_report_deliveries IS 'Log of report deliveries';
COMMENT ON FUNCTION generate_weekly_report_data IS 'Generate report data for a given week';
