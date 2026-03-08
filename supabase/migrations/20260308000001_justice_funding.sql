-- Justice Funding Registry
-- Every dollar, every org, every program — searchable
-- Sources: QLD Ministerial Statements, Brisbane City Council, QLD Open Data, ROGS

CREATE TABLE IF NOT EXISTS justice_funding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source tracking
  source TEXT NOT NULL,              -- 'qld_ministerial', 'brisbane_council', 'qld_open_data', 'rogs', 'manual'
  source_url TEXT,                   -- URL of the source document
  source_statement_id TEXT,          -- e.g. ministerial statement ID '97570'

  -- Funding details
  recipient_name TEXT NOT NULL,      -- Organization name as listed
  recipient_abn TEXT,                -- ABN if available
  program_name TEXT NOT NULL,        -- Grant program name
  program_round TEXT,                -- e.g. 'Round 2', '2024-25'
  amount_dollars NUMERIC,           -- Funding amount in AUD

  -- Geography
  state TEXT DEFAULT 'QLD',          -- State code
  location TEXT,                     -- City/region (e.g. 'Logan', 'Cairns')

  -- Classification
  funding_type TEXT,                 -- 'grant', 'contract', 'consultancy', 'sponsorship'
  sector TEXT DEFAULT 'youth_justice', -- 'youth_justice', 'policing', 'corrections', 'courts', 'community_safety'

  -- Description
  project_description TEXT,          -- What the funding is for

  -- Date info
  announcement_date DATE,            -- When announced/awarded
  financial_year TEXT,               -- e.g. '2023-24'

  -- ALMA cross-reference
  alma_intervention_id UUID REFERENCES alma_interventions(id),
  alma_organization_id UUID REFERENCES organizations(id),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Dedup
  UNIQUE(source, recipient_name, program_name, COALESCE(program_round, ''), COALESCE(amount_dollars::text, ''))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_justice_funding_recipient ON justice_funding(recipient_name);
CREATE INDEX IF NOT EXISTS idx_justice_funding_source ON justice_funding(source);
CREATE INDEX IF NOT EXISTS idx_justice_funding_state ON justice_funding(state);
CREATE INDEX IF NOT EXISTS idx_justice_funding_sector ON justice_funding(sector);
CREATE INDEX IF NOT EXISTS idx_justice_funding_amount ON justice_funding(amount_dollars DESC);
CREATE INDEX IF NOT EXISTS idx_justice_funding_alma_org ON justice_funding(alma_organization_id);
CREATE INDEX IF NOT EXISTS idx_justice_funding_abn ON justice_funding(recipient_abn) WHERE recipient_abn IS NOT NULL;

-- Full text search
CREATE INDEX IF NOT EXISTS idx_justice_funding_fts ON justice_funding
  USING gin(to_tsvector('english', COALESCE(recipient_name, '') || ' ' || COALESCE(program_name, '') || ' ' || COALESCE(project_description, '') || ' ' || COALESCE(location, '')));

-- Summary views
CREATE OR REPLACE VIEW v_justice_funding_by_org AS
SELECT
  recipient_name,
  recipient_abn,
  alma_organization_id,
  COUNT(*) AS grant_count,
  SUM(amount_dollars) AS total_funding,
  MIN(announcement_date) AS first_funded,
  MAX(announcement_date) AS latest_funded,
  array_agg(DISTINCT program_name) AS programs,
  array_agg(DISTINCT location) FILTER (WHERE location IS NOT NULL) AS locations
FROM justice_funding
GROUP BY recipient_name, recipient_abn, alma_organization_id
ORDER BY total_funding DESC NULLS LAST;

CREATE OR REPLACE VIEW v_justice_funding_by_program AS
SELECT
  program_name,
  source,
  COUNT(*) AS recipient_count,
  SUM(amount_dollars) AS total_allocated,
  array_agg(DISTINCT recipient_name ORDER BY recipient_name) AS recipients,
  array_agg(DISTINCT location) FILTER (WHERE location IS NOT NULL) AS locations
FROM justice_funding
GROUP BY program_name, source
ORDER BY total_allocated DESC NULLS LAST;

CREATE OR REPLACE VIEW v_justice_funding_summary AS
SELECT
  state,
  sector,
  COUNT(*) AS records,
  COUNT(DISTINCT recipient_name) AS unique_orgs,
  SUM(amount_dollars) AS total_dollars,
  COUNT(DISTINCT program_name) AS programs,
  COUNT(*) FILTER (WHERE alma_organization_id IS NOT NULL) AS alma_linked
FROM justice_funding
GROUP BY state, sector
ORDER BY total_dollars DESC NULLS LAST;

-- RLS
ALTER TABLE justice_funding ENABLE ROW LEVEL SECURITY;
CREATE POLICY "justice_funding_public_read" ON justice_funding FOR SELECT USING (true);
CREATE POLICY "justice_funding_admin_write" ON justice_funding FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
