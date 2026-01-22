-- Justice Matrix Schema Fix
-- Adds missing columns from seed data to match frontend requirements

-- ===========================================
-- CASES TABLE - Add Missing Columns
-- ===========================================

-- Geographic coordinates
ALTER TABLE justice_matrix_cases
ADD COLUMN IF NOT EXISTS lat DECIMAL(10, 7),
ADD COLUMN IF NOT EXISTS lng DECIMAL(10, 7);

-- Country identification
ALTER TABLE justice_matrix_cases
ADD COLUMN IF NOT EXISTS country_code VARCHAR(3);

-- Legal categories (array)
ALTER TABLE justice_matrix_cases
ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';

-- Case outcome tracking
ALTER TABLE justice_matrix_cases
ADD COLUMN IF NOT EXISTS outcome VARCHAR(20) CHECK (outcome IN ('favorable', 'adverse', 'pending'));

-- Precedent strength for prioritization
ALTER TABLE justice_matrix_cases
ADD COLUMN IF NOT EXISTS precedent_strength VARCHAR(10) CHECK (precedent_strength IN ('high', 'medium', 'low'));

-- Featured content highlighting
ALTER TABLE justice_matrix_cases
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS featured_at TIMESTAMPTZ;

-- ===========================================
-- CAMPAIGNS TABLE - Add Missing Columns
-- ===========================================

-- Geographic coordinates
ALTER TABLE justice_matrix_campaigns
ADD COLUMN IF NOT EXISTS lat DECIMAL(10, 7),
ADD COLUMN IF NOT EXISTS lng DECIMAL(10, 7);

-- Country identification
ALTER TABLE justice_matrix_campaigns
ADD COLUMN IF NOT EXISTS country_code VARCHAR(3);

-- Campaign categories (array)
ALTER TABLE justice_matrix_campaigns
ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';

-- Featured content highlighting
ALTER TABLE justice_matrix_campaigns
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS featured_at TIMESTAMPTZ;

-- ===========================================
-- Additional Indexes for New Columns
-- ===========================================

-- Spatial-like queries (for map filtering)
CREATE INDEX IF NOT EXISTS idx_cases_lat_lng ON justice_matrix_cases(lat, lng);
CREATE INDEX IF NOT EXISTS idx_campaigns_lat_lng ON justice_matrix_campaigns(lat, lng);

-- Country code lookups
CREATE INDEX IF NOT EXISTS idx_cases_country ON justice_matrix_cases(country_code);
CREATE INDEX IF NOT EXISTS idx_campaigns_country ON justice_matrix_campaigns(country_code);

-- Outcome filtering
CREATE INDEX IF NOT EXISTS idx_cases_outcome ON justice_matrix_cases(outcome);

-- Featured content queries
CREATE INDEX IF NOT EXISTS idx_cases_featured ON justice_matrix_cases(featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_campaigns_featured ON justice_matrix_campaigns(featured) WHERE featured = TRUE;

-- Category searches (GIN index for array contains)
CREATE INDEX IF NOT EXISTS idx_cases_categories ON justice_matrix_cases USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_campaigns_categories ON justice_matrix_campaigns USING GIN(categories);

-- ===========================================
-- Comments
-- ===========================================

COMMENT ON COLUMN justice_matrix_cases.lat IS 'Latitude for map visualization';
COMMENT ON COLUMN justice_matrix_cases.lng IS 'Longitude for map visualization';
COMMENT ON COLUMN justice_matrix_cases.country_code IS 'ISO 3166 country code';
COMMENT ON COLUMN justice_matrix_cases.categories IS 'Legal categories (non-refoulement, detention, etc.)';
COMMENT ON COLUMN justice_matrix_cases.outcome IS 'Case outcome: favorable, adverse, or pending';
COMMENT ON COLUMN justice_matrix_cases.precedent_strength IS 'Importance for future cases: high, medium, low';
COMMENT ON COLUMN justice_matrix_cases.featured IS 'Highlighted for storytelling';
COMMENT ON COLUMN justice_matrix_cases.featured_at IS 'When item was featured';

COMMENT ON COLUMN justice_matrix_campaigns.lat IS 'Latitude for map visualization';
COMMENT ON COLUMN justice_matrix_campaigns.lng IS 'Longitude for map visualization';
COMMENT ON COLUMN justice_matrix_campaigns.country_code IS 'ISO 3166 country code';
COMMENT ON COLUMN justice_matrix_campaigns.categories IS 'Campaign categories';
COMMENT ON COLUMN justice_matrix_campaigns.featured IS 'Highlighted for storytelling';
COMMENT ON COLUMN justice_matrix_campaigns.featured_at IS 'When item was featured';
