-- LGA-level cross-system statistics for the Pipeline Intensity heatmap
-- Combines school system, welfare system, justice system, and demographic data
-- to show which communities are being failed by every system simultaneously.

CREATE TABLE IF NOT EXISTS lga_cross_system_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lga_code TEXT NOT NULL,              -- ABS LGA code (e.g., 'LGA31000')
  lga_name TEXT NOT NULL,              -- Human name (e.g., 'Brisbane')
  state TEXT NOT NULL,                 -- State abbreviation

  -- SCHOOL SYSTEM
  low_icsea_schools INT DEFAULT 0,     -- Count of schools with ICSEA < 900
  avg_icsea INT,                       -- Average ICSEA score across LGA schools
  school_count INT DEFAULT 0,          -- Total schools in LGA

  -- DEMOGRAPHICS
  population INT,                      -- Total LGA population
  youth_population INT,                -- Population aged 10-17
  indigenous_pct NUMERIC(5,2),         -- % Aboriginal/Torres Strait Islander
  indigenous_youth_pct NUMERIC(5,2),   -- % Indigenous among 10-17 year olds

  -- WELFARE SYSTEM
  dsp_recipients INT DEFAULT 0,        -- Disability Support Pension recipients
  jobseeker_recipients INT DEFAULT 0,  -- JobSeeker Payment recipients
  youth_allowance_recipients INT DEFAULT 0, -- Youth Allowance recipients

  -- JUSTICE SYSTEM (new columns)
  youth_offenders INT DEFAULT 0,       -- Recorded youth offenders aged 10-17 (ABS)
  youth_offender_rate NUMERIC(8,2),    -- Rate per 100,000 youth population
  detention_beds INT DEFAULT 0,        -- Youth detention bed capacity in/near LGA
  detention_facility_count INT DEFAULT 0, -- Number of detention facilities in LGA
  court_appearances INT DEFAULT 0,     -- Youth court appearances (where available)
  jh_funding_tracked BIGINT DEFAULT 0, -- Justice funding tracked by JusticeHub for orgs in this LGA
  jh_org_count INT DEFAULT 0,          -- Number of JusticeHub-tracked orgs in this LGA

  -- COMPUTED
  pipeline_intensity NUMERIC(5,1),     -- Composite score (higher = more systems failing)

  -- META
  data_year TEXT DEFAULT '2023-24',    -- Reference period for most data
  sources JSONB DEFAULT '{}',          -- Source URLs/references per column
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(lga_code)
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_lga_stats_state ON lga_cross_system_stats(state);
CREATE INDEX IF NOT EXISTS idx_lga_stats_intensity ON lga_cross_system_stats(pipeline_intensity DESC NULLS LAST);

-- Comments
COMMENT ON TABLE lga_cross_system_stats IS 'LGA-level cross-system overlap data for the Pipeline Intensity heatmap. Shows how school failure, welfare dependency, and youth justice contact concentrate in the same communities.';
COMMENT ON COLUMN lga_cross_system_stats.pipeline_intensity IS 'Composite burden score (0-100). Weighted: school 25%, welfare 25%, justice 35%, demographics 15%. Higher = more systems failing this community.';
