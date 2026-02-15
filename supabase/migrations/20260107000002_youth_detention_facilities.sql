-- Youth Detention Facilities & Ecosystem Mapping
-- This extends the transparency module to track detention centres and their connections
-- to community programs, services, and organizations

-- ============================================
-- YOUTH DETENTION FACILITIES
-- ============================================
CREATE TABLE IF NOT EXISTS youth_detention_facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  facility_type TEXT CHECK (facility_type IN (
    'youth_detention',      -- Secure youth detention centre
    'remand_centre',        -- Short-term remand
    'training_centre',      -- Youth training/rehabilitation
    'watch_house',          -- Police watch house with youth section
    'therapeutic_facility', -- Therapeutic residential
    'transition_facility'   -- Step-down/transition facility
  )) NOT NULL DEFAULT 'youth_detention',

  -- Location
  street_address TEXT,
  suburb TEXT,
  city TEXT NOT NULL,
  state TEXT CHECK (state IN ('NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT')) NOT NULL,
  postcode TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Operational Details
  operational_status TEXT CHECK (operational_status IN (
    'operational', 'under_construction', 'closed', 'temporary_closure'
  )) DEFAULT 'operational',
  opened_date DATE,
  closed_date DATE,

  -- Capacity & Demographics
  capacity_beds INTEGER,
  current_population INTEGER,
  male_capacity INTEGER,
  female_capacity INTEGER,
  age_range_min INTEGER DEFAULT 10,
  age_range_max INTEGER DEFAULT 18,

  -- Government Administration
  government_department TEXT NOT NULL, -- e.g., "Department of Youth Justice"
  managing_agency TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  website TEXT,

  -- Classification & Security
  security_level TEXT CHECK (security_level IN (
    'minimum', 'medium', 'maximum', 'mixed'
  )) DEFAULT 'mixed',
  has_remand_section BOOLEAN DEFAULT true,
  has_sentenced_section BOOLEAN DEFAULT true,
  has_therapeutic_programs BOOLEAN DEFAULT false,
  has_education_programs BOOLEAN DEFAULT true,

  -- Indigenous & Cultural
  indigenous_population_percentage DECIMAL(5,2),
  has_cultural_programs BOOLEAN DEFAULT false,
  has_indigenous_liaison BOOLEAN DEFAULT false,

  -- Data Quality
  data_source TEXT,
  data_source_url TEXT,
  last_data_update DATE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_detention_facilities_state
  ON youth_detention_facilities(state);
CREATE INDEX IF NOT EXISTS idx_detention_facilities_location
  ON youth_detention_facilities(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_detention_facilities_status
  ON youth_detention_facilities(operational_status);
CREATE INDEX IF NOT EXISTS idx_detention_facilities_type
  ON youth_detention_facilities(facility_type);

-- ============================================
-- FACILITY STATISTICS (Time-Series Data)
-- ============================================
CREATE TABLE IF NOT EXISTS facility_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES youth_detention_facilities(id) ON DELETE CASCADE,

  -- Time period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  reporting_period TEXT, -- e.g., "Q1 2024", "FY 2023-24"

  -- Population Statistics
  average_daily_population INTEGER,
  peak_population INTEGER,
  total_admissions INTEGER,
  total_releases INTEGER,

  -- Demographics
  indigenous_percentage DECIMAL(5,2),
  female_percentage DECIMAL(5,2),
  remand_percentage DECIMAL(5,2), -- % on remand vs sentenced

  -- Age breakdown
  age_10_13_count INTEGER,
  age_14_15_count INTEGER,
  age_16_17_count INTEGER,

  -- Outcomes
  incidents_count INTEGER,
  assaults_count INTEGER,
  self_harm_count INTEGER,
  escapes_count INTEGER,

  -- Programs
  education_participation_percentage DECIMAL(5,2),
  program_completion_count INTEGER,

  -- Source
  data_source TEXT,
  source_url TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_facility_stats_facility
  ON facility_statistics(facility_id, period_start DESC);

-- ============================================
-- FACILITY PARTNERSHIPS
-- Links detention facilities to community orgs/programs/services
-- ============================================
CREATE TABLE IF NOT EXISTS facility_partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES youth_detention_facilities(id) ON DELETE CASCADE,

  -- What's connected (polymorphic relationship)
  partner_type TEXT CHECK (partner_type IN (
    'organization', 'community_program', 'service'
  )) NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  program_id UUID REFERENCES community_programs(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,

  -- Partnership details
  partnership_type TEXT CHECK (partnership_type IN (
    'in_facility_program',      -- Program delivered inside facility
    'post_release_support',     -- Aftercare/reintegration
    'bail_support',             -- Bail/remand support
    'family_connection',        -- Family support services
    'education_provider',       -- Education/training provider
    'health_provider',          -- Health/mental health
    'legal_support',            -- Legal services
    'cultural_program',         -- Cultural/Indigenous programs
    'mentoring',                -- Mentoring programs
    'housing_support',          -- Housing assistance
    'employment_support',       -- Employment/training
    'advocacy',                 -- Advocacy/oversight
    'other'
  )) NOT NULL,

  -- Status
  is_active BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,

  -- Impact tracking
  participants_served INTEGER,
  description TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure only one foreign key is set
  CONSTRAINT valid_partner CHECK (
    (organization_id IS NOT NULL)::int +
    (program_id IS NOT NULL)::int +
    (service_id IS NOT NULL)::int = 1
  )
);

CREATE INDEX IF NOT EXISTS idx_facility_partnerships_facility
  ON facility_partnerships(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_partnerships_org
  ON facility_partnerships(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_facility_partnerships_program
  ON facility_partnerships(program_id) WHERE program_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_facility_partnerships_service
  ON facility_partnerships(service_id) WHERE service_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_facility_partnerships_type
  ON facility_partnerships(partnership_type);

-- ============================================
-- ADD COORDINATES TO COMMUNITY PROGRAMS
-- ============================================
ALTER TABLE community_programs
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS location_type TEXT CHECK (location_type IN (
    'fixed', 'mobile', 'statewide', 'remote_communities', 'multi_site'
  )) DEFAULT 'fixed';

CREATE INDEX IF NOT EXISTS idx_community_programs_location
  ON community_programs(latitude, longitude) WHERE latitude IS NOT NULL;

-- ============================================
-- GOVERNMENT PROGRAMS (Budget Line Items)
-- Links transparency budget items to actual programs/facilities
-- ============================================
CREATE TABLE IF NOT EXISTS government_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  program_type TEXT CHECK (program_type IN (
    'detention_operations',
    'community_supervision',
    'diversion',
    'court_services',
    'legal_aid',
    'health_services',
    'education',
    'family_support',
    'indigenous_programs',
    'infrastructure',
    'other'
  )) NOT NULL,

  -- Budget Link
  budget_id UUID REFERENCES transparency_budget(id),

  -- Administration
  state TEXT CHECK (state IN ('NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT', 'Federal')) NOT NULL,
  department TEXT NOT NULL,
  financial_year TEXT NOT NULL,

  -- Funding
  allocated_amount BIGINT, -- cents
  spent_amount BIGINT, -- cents

  -- Coverage
  facilities_covered TEXT[], -- Array of facility IDs
  regions_covered TEXT[],    -- Array of regions

  -- Description
  description TEXT,
  objectives TEXT[],
  target_outcomes TEXT[],

  -- Source
  source_document TEXT,
  source_url TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_government_programs_state
  ON government_programs(state, financial_year);
CREATE INDEX IF NOT EXISTS idx_government_programs_type
  ON government_programs(program_type);

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE youth_detention_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE government_programs ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access" ON youth_detention_facilities
  FOR SELECT USING (true);
CREATE POLICY "Public read access" ON facility_statistics
  FOR SELECT USING (true);
CREATE POLICY "Public read access" ON facility_partnerships
  FOR SELECT USING (true);
CREATE POLICY "Public read access" ON government_programs
  FOR SELECT USING (true);

-- Service role write access
CREATE POLICY "Service role write access" ON youth_detention_facilities
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write access" ON facility_statistics
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write access" ON facility_partnerships
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write access" ON government_programs
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- SEED DATA: Australian Youth Detention Centres
-- ============================================
INSERT INTO youth_detention_facilities (
  name, slug, facility_type, city, state,
  latitude, longitude,
  government_department,
  capacity_beds, security_level,
  has_therapeutic_programs, has_cultural_programs,
  data_source
) VALUES
-- Queensland
('Brisbane Youth Detention Centre', 'brisbane-ydc', 'youth_detention',
 'Wacol', 'QLD', -27.5945, 152.9339,
 'Department of Youth Justice', 96, 'maximum',
 true, true, 'QLD Youth Justice Annual Report'),

('Cleveland Youth Detention Centre', 'cleveland-ydc', 'youth_detention',
 'Townsville', 'QLD', -19.2590, 146.8169,
 'Department of Youth Justice', 48, 'maximum',
 true, true, 'QLD Youth Justice Annual Report'),

-- New South Wales
('Cobham Juvenile Justice Centre', 'cobham-jjc', 'youth_detention',
 'Werrington', 'NSW', -33.7573, 150.7533,
 'Youth Justice NSW', 42, 'maximum',
 true, true, 'NSW Youth Justice Annual Report'),

('Frank Baxter Juvenile Justice Centre', 'frank-baxter-jjc', 'youth_detention',
 'Kariong', 'NSW', -33.4386, 151.2976,
 'Youth Justice NSW', 120, 'maximum',
 true, true, 'NSW Youth Justice Annual Report'),

('Reiby Juvenile Justice Centre', 'reiby-jjc', 'youth_detention',
 'Airds', 'NSW', -34.0819, 150.8281,
 'Youth Justice NSW', 60, 'medium',
 true, true, 'NSW Youth Justice Annual Report'),

('Orana Juvenile Justice Centre', 'orana-jjc', 'youth_detention',
 'Dubbo', 'NSW', -32.2569, 148.6011,
 'Youth Justice NSW', 30, 'medium',
 true, true, 'NSW Youth Justice Annual Report'),

('Acmena Juvenile Justice Centre', 'acmena-jjc', 'youth_detention',
 'Grafton', 'NSW', -29.6767, 152.9370,
 'Youth Justice NSW', 36, 'medium',
 true, true, 'NSW Youth Justice Annual Report'),

-- Victoria
('Parkville Youth Justice Centre', 'parkville-yjc', 'youth_detention',
 'Parkville', 'VIC', -37.7839, 144.9490,
 'Department of Justice and Community Safety', 100, 'maximum',
 true, true, 'VIC Youth Justice Annual Report'),

('Malmsbury Youth Justice Centre', 'malmsbury-yjc', 'youth_detention',
 'Malmsbury', 'VIC', -37.1859, 144.3743,
 'Department of Justice and Community Safety', 120, 'maximum',
 true, true, 'VIC Youth Justice Annual Report'),

-- Western Australia
('Banksia Hill Detention Centre', 'banksia-hill', 'youth_detention',
 'Canning Vale', 'WA', -32.0766, 115.9180,
 'Department of Justice WA', 240, 'maximum',
 true, true, 'WA Corrective Services Annual Report'),

-- South Australia
('Adelaide Youth Training Centre', 'adelaide-ytc', 'youth_detention',
 'Cavan', 'SA', -34.8366, 138.5977,
 'Department of Human Services SA', 76, 'maximum',
 true, true, 'SA Youth Justice Annual Report'),

-- Northern Territory
('Don Dale Youth Detention Centre', 'don-dale', 'youth_detention',
 'Berrimah', 'NT', -12.4308, 130.9167,
 'Territory Families', 36, 'maximum',
 true, true, 'NT Territory Families Annual Report'),

('Alice Springs Youth Detention Centre', 'alice-springs-ydc', 'youth_detention',
 'Alice Springs', 'NT', -23.6980, 133.8807,
 'Territory Families', 24, 'medium',
 true, true, 'NT Territory Families Annual Report'),

-- Tasmania
('Ashley Youth Detention Centre', 'ashley-ydc', 'youth_detention',
 'Deloraine', 'TAS', -41.5175, 146.6503,
 'Department of Communities Tasmania', 51, 'medium',
 true, true, 'TAS Communities Annual Report'),

-- ACT
('Bimberi Youth Justice Centre', 'bimberi-yjc', 'youth_detention',
 'Mitchell', 'ACT', -35.2093, 149.1287,
 'ACT Community Services', 40, 'medium',
 true, true, 'ACT Community Services Annual Report')

ON CONFLICT (slug) DO UPDATE SET
  capacity_beds = EXCLUDED.capacity_beds,
  updated_at = NOW();

-- ============================================
-- HELPFUL VIEWS
-- ============================================

-- View: Facilities with partnership counts
CREATE OR REPLACE VIEW v_facilities_with_partnerships AS
SELECT
  f.*,
  COALESCE(p.partnership_count, 0) as partnership_count,
  COALESCE(p.active_partnerships, 0) as active_partnerships,
  COALESCE(p.organization_partners, 0) as organization_partners,
  COALESCE(p.program_partners, 0) as program_partners,
  COALESCE(p.service_partners, 0) as service_partners
FROM youth_detention_facilities f
LEFT JOIN (
  SELECT
    facility_id,
    COUNT(*) as partnership_count,
    COUNT(*) FILTER (WHERE is_active) as active_partnerships,
    COUNT(*) FILTER (WHERE partner_type = 'organization') as organization_partners,
    COUNT(*) FILTER (WHERE partner_type = 'community_program') as program_partners,
    COUNT(*) FILTER (WHERE partner_type = 'service') as service_partners
  FROM facility_partnerships
  GROUP BY facility_id
) p ON f.id = p.facility_id
WHERE f.operational_status = 'operational';

-- View: State-level ecosystem summary
CREATE OR REPLACE VIEW v_state_ecosystem_summary AS
SELECT
  state,
  COUNT(*) FILTER (WHERE operational_status = 'operational') as operational_facilities,
  SUM(capacity_beds) as total_capacity,
  SUM(current_population) as total_population,
  (SELECT COUNT(*) FROM community_programs cp WHERE cp.state = ydf.state) as community_programs,
  (SELECT COUNT(*) FROM services s WHERE s.location_state = ydf.state) as services,
  (SELECT COUNT(*) FROM organizations o WHERE o.state = ydf.state AND o.is_active) as organizations
FROM youth_detention_facilities ydf
GROUP BY state;

-- Comments
COMMENT ON TABLE youth_detention_facilities IS 'All youth detention facilities in Australia with location and operational data';
COMMENT ON TABLE facility_statistics IS 'Time-series statistics for each facility (population, demographics, incidents)';
COMMENT ON TABLE facility_partnerships IS 'Links between detention facilities and community organizations/programs/services';
COMMENT ON TABLE government_programs IS 'Government-funded programs with budget tracking';
COMMENT ON VIEW v_facilities_with_partnerships IS 'Facilities with counts of connected partners for ecosystem mapping';
COMMENT ON VIEW v_state_ecosystem_summary IS 'State-level summary of detention facilities and community ecosystem';
