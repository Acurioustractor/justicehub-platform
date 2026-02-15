-- ALMA Funding Data Migration
-- Tracks youth justice expenditure for cost-effectiveness analysis
-- Date: 2026-01-02

-- Funding data table
CREATE TABLE IF NOT EXISTS alma_funding_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Source
  source_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_type TEXT CHECK (source_type IN ('government', 'research', 'budget', 'audit')),
  report_year TEXT NOT NULL,

  -- Jurisdiction
  jurisdiction TEXT CHECK (jurisdiction IN ('VIC', 'QLD', 'NSW', 'NT', 'SA', 'WA', 'TAS', 'ACT', 'National')),

  -- Expenditure totals (in dollars)
  total_expenditure DECIMAL(15,2),
  detention_expenditure DECIMAL(15,2),
  community_expenditure DECIMAL(15,2),
  diversion_expenditure DECIMAL(15,2),
  prevention_expenditure DECIMAL(15,2),

  -- Per-unit costs (in dollars)
  cost_per_day_detention DECIMAL(10,2),
  cost_per_day_community DECIMAL(10,2),
  cost_per_participant DECIMAL(10,2),

  -- Population data
  young_people_supervised INTEGER,
  young_people_detained INTEGER,
  indigenous_percentage DECIMAL(5,2),

  -- Effectiveness metrics
  recidivism_rate DECIMAL(5,2),
  completion_rate DECIMAL(5,2),

  -- Raw data for reference
  raw_data JSONB DEFAULT '{}'::JSONB,

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,

  UNIQUE(source_url, jurisdiction)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_funding_jurisdiction ON alma_funding_data(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_funding_year ON alma_funding_data(report_year);
CREATE INDEX IF NOT EXISTS idx_funding_type ON alma_funding_data(source_type);

-- Cost-effectiveness analysis view
CREATE OR REPLACE VIEW alma_cost_analysis AS
SELECT
  jurisdiction,
  report_year,
  total_expenditure,
  detention_expenditure,
  community_expenditure,
  CASE WHEN total_expenditure > 0 THEN
    ROUND((detention_expenditure / total_expenditure * 100)::numeric, 1)
  END as detention_percent,
  CASE WHEN total_expenditure > 0 THEN
    ROUND((community_expenditure / total_expenditure * 100)::numeric, 1)
  END as community_percent,
  cost_per_day_detention,
  cost_per_day_community,
  CASE WHEN cost_per_day_community > 0 THEN
    ROUND((cost_per_day_detention / cost_per_day_community)::numeric, 1)
  END as detention_vs_community_ratio,
  recidivism_rate,
  indigenous_percentage
FROM alma_funding_data
WHERE total_expenditure IS NOT NULL
ORDER BY jurisdiction, report_year DESC;

-- Community investment score function
CREATE OR REPLACE FUNCTION calculate_community_investment_score(p_jurisdiction TEXT)
RETURNS TABLE (
  jurisdiction TEXT,
  community_percent DECIMAL,
  detention_cost_ratio DECIMAL,
  investment_score DECIMAL,
  recommendation TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.jurisdiction,
    CASE WHEN f.total_expenditure > 0 THEN
      ROUND((f.community_expenditure / f.total_expenditure * 100)::numeric, 1)
    END as community_pct,
    CASE WHEN f.cost_per_day_community > 0 THEN
      ROUND((f.cost_per_day_detention / f.cost_per_day_community)::numeric, 1)
    END as cost_ratio,
    -- Score: Higher community % and lower recidivism = better
    ROUND(
      (COALESCE(f.community_expenditure / NULLIF(f.total_expenditure, 0), 0) * 50 +
       (1 - COALESCE(f.recidivism_rate / 100, 0.5)) * 50
      )::numeric, 1
    ) as score,
    CASE
      WHEN f.community_expenditure / NULLIF(f.total_expenditure, 0) < 0.35 THEN 'INCREASE community investment'
      WHEN f.recidivism_rate > 50 THEN 'EVALUATE program effectiveness'
      ELSE 'MAINTAIN current approach'
    END as rec
  FROM alma_funding_data f
  WHERE f.jurisdiction = p_jurisdiction
    OR p_jurisdiction IS NULL
  ORDER BY score DESC;
END;
$$ LANGUAGE plpgsql;

-- Savings calculator function
CREATE OR REPLACE FUNCTION calculate_potential_savings(
  p_young_people_diverted INTEGER,
  p_detention_cost_per_day DECIMAL DEFAULT 3320,
  p_community_cost_per_day DECIMAL DEFAULT 150,
  p_avg_detention_days INTEGER DEFAULT 180
)
RETURNS TABLE (
  young_people_diverted INTEGER,
  detention_cost_avoided DECIMAL,
  community_program_cost DECIMAL,
  net_savings DECIMAL,
  savings_per_person DECIMAL,
  generational_multiplier DECIMAL,
  total_generational_impact DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p_young_people_diverted,
    (p_detention_cost_per_day * p_avg_detention_days * p_young_people_diverted)::DECIMAL as det_cost,
    (p_community_cost_per_day * p_avg_detention_days * p_young_people_diverted)::DECIMAL as comm_cost,
    ((p_detention_cost_per_day - p_community_cost_per_day) * p_avg_detention_days * p_young_people_diverted)::DECIMAL as net,
    ((p_detention_cost_per_day - p_community_cost_per_day) * p_avg_detention_days)::DECIMAL as per_person,
    3.0::DECIMAL as gen_mult, -- Conservative multiplier for generational impact
    ((p_detention_cost_per_day - p_community_cost_per_day) * p_avg_detention_days * p_young_people_diverted * 3)::DECIMAL as total_gen;
END;
$$ LANGUAGE plpgsql;

-- RLS
ALTER TABLE alma_funding_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_funding_data" ON alma_funding_data FOR SELECT USING (true);
CREATE POLICY "admin_funding_data" ON alma_funding_data FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Insert known funding data (Productivity Commission ROGS 2025)
INSERT INTO alma_funding_data (
  source_url,
  source_name,
  source_type,
  report_year,
  jurisdiction,
  total_expenditure,
  detention_expenditure,
  community_expenditure,
  cost_per_day_detention,
  raw_data
) VALUES
(
  'https://www.pc.gov.au/ongoing/report-on-government-services/2025/community-services/youth-justice/',
  'Productivity Commission ROGS 2025',
  'government',
  '2023-24',
  'National',
  1500000000, -- $1.5 billion
  982500000,  -- 65.5% = $982.5M
  517500000,  -- 34.5% = $517.5M
  3320,       -- $3,320 per day
  '{"source": "ROGS 2025 Chapter 17", "perYoungPerson": 581}'::JSONB
)
ON CONFLICT (source_url, jurisdiction) DO UPDATE SET
  total_expenditure = EXCLUDED.total_expenditure,
  detention_expenditure = EXCLUDED.detention_expenditure,
  community_expenditure = EXCLUDED.community_expenditure,
  cost_per_day_detention = EXCLUDED.cost_per_day_detention,
  raw_data = EXCLUDED.raw_data,
  updated_at = NOW();

-- Comments
COMMENT ON TABLE alma_funding_data IS 'Youth justice expenditure data for cost-effectiveness analysis';
COMMENT ON VIEW alma_cost_analysis IS 'Pre-calculated cost analysis by jurisdiction';
COMMENT ON FUNCTION calculate_community_investment_score IS 'Calculates a score for community investment effectiveness';
COMMENT ON FUNCTION calculate_potential_savings IS 'Calculates potential savings from diverting young people from detention';
