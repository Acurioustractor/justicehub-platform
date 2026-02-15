-- Migration: ALMA Funding Opportunities
-- Purpose: Track grants, philanthropy, and funding opportunities for basecamps
-- Part of JusticeHub Data Intelligence Strategy Phase 1

-- Funding Opportunities Table
CREATE TABLE IF NOT EXISTS alma_funding_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Information
  name TEXT NOT NULL,
  description TEXT,
  funder_name TEXT NOT NULL,

  -- Classification
  source_type TEXT NOT NULL CHECK (source_type IN ('government', 'philanthropy', 'corporate', 'community')),
  category TEXT CHECK (category IN (
    'youth_justice',
    'indigenous_programs',
    'mental_health',
    'education',
    'employment',
    'housing',
    'family_services',
    'community_development',
    'research',
    'capacity_building',
    'general'
  )),

  -- Funding Details
  total_pool_amount NUMERIC,
  min_grant_amount NUMERIC,
  max_grant_amount NUMERIC,
  funding_duration TEXT, -- e.g., "12 months", "3 years"

  -- Timeline
  opens_at TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  decision_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('upcoming', 'open', 'closing_soon', 'closed', 'recurring', 'archived')),

  -- Geographic Scope
  jurisdictions TEXT[] DEFAULT '{}', -- ['QLD', 'NSW', 'National', etc.]
  regions TEXT[] DEFAULT '{}', -- More specific: ['Brisbane', 'Alice Springs']
  is_national BOOLEAN DEFAULT false,

  -- Eligibility
  eligibility_criteria JSONB DEFAULT '{}',
  eligible_org_types TEXT[] DEFAULT '{}', -- ['nonprofit', 'indigenous_org', 'charity']
  requires_deductible_gift_recipient BOOLEAN DEFAULT false,
  requires_abn BOOLEAN DEFAULT true,

  -- Focus Areas (for matching)
  focus_areas TEXT[] DEFAULT '{}', -- ['youth', 'justice', 'indigenous', 'mental_health']
  keywords TEXT[] DEFAULT '{}', -- Additional keywords for search

  -- URLs
  source_url TEXT,
  application_url TEXT,
  guidelines_url TEXT,

  -- Scraping Metadata
  source_id TEXT, -- External ID from source system
  scraped_at TIMESTAMPTZ,
  scrape_source TEXT, -- 'grants.gov.au', 'philanthropy_australia', etc.
  raw_data JSONB, -- Original scraped data

  -- Matching & Scoring
  relevance_score NUMERIC DEFAULT 0, -- Calculated relevance to youth justice

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_amounts CHECK (
    (min_grant_amount IS NULL OR max_grant_amount IS NULL OR min_grant_amount <= max_grant_amount)
  ),
  CONSTRAINT valid_timeline CHECK (
    (opens_at IS NULL OR deadline IS NULL OR opens_at <= deadline)
  )
);

-- Indexes for common queries
CREATE INDEX idx_funding_opportunities_status ON alma_funding_opportunities(status);
CREATE INDEX idx_funding_opportunities_deadline ON alma_funding_opportunities(deadline);
CREATE INDEX idx_funding_opportunities_source_type ON alma_funding_opportunities(source_type);
CREATE INDEX idx_funding_opportunities_jurisdictions ON alma_funding_opportunities USING GIN(jurisdictions);
CREATE INDEX idx_funding_opportunities_focus_areas ON alma_funding_opportunities USING GIN(focus_areas);
CREATE INDEX idx_funding_opportunities_funder ON alma_funding_opportunities(funder_name);
CREATE INDEX idx_funding_opportunities_source_id ON alma_funding_opportunities(scrape_source, source_id);

-- Full-text search index
CREATE INDEX idx_funding_opportunities_fts ON alma_funding_opportunities
  USING GIN(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(funder_name, '')));

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_funding_opportunities_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_funding_opportunities_updated
  BEFORE UPDATE ON alma_funding_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_funding_opportunities_timestamp();

-- Auto-update status based on deadline
CREATE OR REPLACE FUNCTION update_funding_opportunity_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Set to closing_soon if deadline is within 14 days
  IF NEW.deadline IS NOT NULL AND NEW.status = 'open' THEN
    IF NEW.deadline <= NOW() + INTERVAL '14 days' AND NEW.deadline > NOW() THEN
      NEW.status = 'closing_soon';
    ELSIF NEW.deadline <= NOW() THEN
      NEW.status = 'closed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_funding_status_update
  BEFORE INSERT OR UPDATE ON alma_funding_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_funding_opportunity_status();

-- Basecamp Funding Applications Tracker
CREATE TABLE IF NOT EXISTS alma_funding_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  opportunity_id UUID NOT NULL REFERENCES alma_funding_opportunities(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

  -- Application Details
  status TEXT NOT NULL DEFAULT 'identified' CHECK (status IN (
    'identified',      -- Found, not yet assessed
    'evaluating',      -- Assessing fit
    'preparing',       -- Writing application
    'submitted',       -- Application sent
    'under_review',    -- Being assessed
    'successful',      -- Awarded
    'unsuccessful',    -- Not awarded
    'withdrawn'        -- Withdrawn by applicant
  )),

  -- Tracking
  amount_requested NUMERIC,
  amount_awarded NUMERIC,
  submitted_at TIMESTAMPTZ,
  outcome_at TIMESTAMPTZ,

  -- Notes & Documents
  notes TEXT,
  internal_match_score NUMERIC, -- Manual override of auto score

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_funding_applications_opportunity ON alma_funding_applications(opportunity_id);
CREATE INDEX idx_funding_applications_organization ON alma_funding_applications(organization_id);
CREATE INDEX idx_funding_applications_status ON alma_funding_applications(status);

-- Trigger for applications timestamp
CREATE TRIGGER trigger_funding_applications_updated
  BEFORE UPDATE ON alma_funding_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_funding_opportunities_timestamp();

-- View: Active Funding Pipeline
CREATE OR REPLACE VIEW v_funding_pipeline AS
SELECT
  fo.id,
  fo.name,
  fo.funder_name,
  fo.source_type,
  fo.category,
  fo.total_pool_amount,
  fo.min_grant_amount,
  fo.max_grant_amount,
  fo.deadline,
  fo.status,
  fo.jurisdictions,
  fo.focus_areas,
  fo.source_url,
  fo.application_url,
  fo.relevance_score,
  CASE
    WHEN fo.deadline IS NULL THEN NULL
    WHEN fo.deadline <= NOW() THEN 0
    ELSE EXTRACT(DAY FROM fo.deadline - NOW())::INTEGER
  END as days_until_deadline,
  (
    SELECT COUNT(*)
    FROM alma_funding_applications fa
    WHERE fa.opportunity_id = fo.id
  ) as application_count,
  fo.created_at,
  fo.updated_at
FROM alma_funding_opportunities fo
WHERE fo.status NOT IN ('archived')
ORDER BY
  CASE fo.status
    WHEN 'closing_soon' THEN 1
    WHEN 'open' THEN 2
    WHEN 'upcoming' THEN 3
    ELSE 4
  END,
  fo.deadline ASC NULLS LAST;

-- View: Funding by Funder
CREATE OR REPLACE VIEW v_funders_summary AS
SELECT
  funder_name,
  source_type,
  COUNT(*) as total_opportunities,
  COUNT(*) FILTER (WHERE status IN ('open', 'closing_soon')) as active_opportunities,
  SUM(total_pool_amount) FILTER (WHERE status IN ('open', 'closing_soon')) as total_available,
  AVG(max_grant_amount) as avg_max_grant,
  array_agg(DISTINCT unnested_jurisdiction) as all_jurisdictions
FROM alma_funding_opportunities,
LATERAL unnest(COALESCE(jurisdictions, ARRAY[]::TEXT[])) as unnested_jurisdiction
GROUP BY funder_name, source_type
ORDER BY active_opportunities DESC, total_available DESC NULLS LAST;

-- Function: Calculate relevance score for a funding opportunity
CREATE OR REPLACE FUNCTION calculate_funding_relevance(opportunity_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  opp RECORD;
  score NUMERIC := 0;
BEGIN
  SELECT * INTO opp FROM alma_funding_opportunities WHERE id = opportunity_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Base score from category (0-40 points)
  IF opp.category IN ('youth_justice', 'indigenous_programs') THEN
    score := score + 40;
  ELSIF opp.category IN ('mental_health', 'family_services', 'community_development') THEN
    score := score + 30;
  ELSIF opp.category IN ('education', 'employment', 'housing') THEN
    score := score + 20;
  ELSE
    score := score + 10;
  END IF;

  -- Focus areas bonus (0-30 points)
  IF opp.focus_areas && ARRAY['youth', 'justice', 'indigenous', 'first_nations'] THEN
    score := score + 30;
  ELSIF opp.focus_areas && ARRAY['community', 'mental_health', 'rehabilitation'] THEN
    score := score + 20;
  ELSIF opp.focus_areas && ARRAY['education', 'employment', 'support'] THEN
    score := score + 10;
  END IF;

  -- Jurisdiction bonus (0-20 points) - National or NT/QLD prioritized
  IF opp.is_national OR 'National' = ANY(opp.jurisdictions) THEN
    score := score + 20;
  ELSIF opp.jurisdictions && ARRAY['NT', 'QLD', 'WA'] THEN
    score := score + 15;
  ELSIF array_length(opp.jurisdictions, 1) > 0 THEN
    score := score + 10;
  END IF;

  -- Amount bonus (0-10 points) - prefer larger grants
  IF opp.max_grant_amount >= 500000 THEN
    score := score + 10;
  ELSIF opp.max_grant_amount >= 100000 THEN
    score := score + 7;
  ELSIF opp.max_grant_amount >= 50000 THEN
    score := score + 5;
  ELSIF opp.max_grant_amount > 0 THEN
    score := score + 2;
  END IF;

  -- Normalize to 0-100
  RETURN LEAST(100, score);
END;
$$ LANGUAGE plpgsql;

-- Function: Update all relevance scores (run periodically)
CREATE OR REPLACE FUNCTION refresh_funding_relevance_scores()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  UPDATE alma_funding_opportunities
  SET relevance_score = calculate_funding_relevance(id)
  WHERE status NOT IN ('closed', 'archived');

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE alma_funding_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE alma_funding_applications ENABLE ROW LEVEL SECURITY;

-- Public can view all funding opportunities
CREATE POLICY "Anyone can view funding opportunities"
  ON alma_funding_opportunities FOR SELECT
  USING (true);

-- Only authenticated users can insert/update (admin check in API)
CREATE POLICY "Authenticated users can insert funding opportunities"
  ON alma_funding_opportunities FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update funding opportunities"
  ON alma_funding_opportunities FOR UPDATE
  TO authenticated
  USING (true);

-- Applications are more restricted
CREATE POLICY "Authenticated users can view applications"
  ON alma_funding_applications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage applications"
  ON alma_funding_applications FOR ALL
  TO authenticated
  USING (true);

-- Comments
COMMENT ON TABLE alma_funding_opportunities IS 'Funding opportunities from government, philanthropy, corporate, and community sources';
COMMENT ON TABLE alma_funding_applications IS 'Track basecamp applications to funding opportunities';
COMMENT ON VIEW v_funding_pipeline IS 'Active funding opportunities with days until deadline';
COMMENT ON VIEW v_funders_summary IS 'Summary of funders and their opportunities';
COMMENT ON FUNCTION calculate_funding_relevance IS 'Calculate youth justice relevance score (0-100) for funding opportunity';
