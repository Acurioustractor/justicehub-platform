-- Unified Services Schema Migration
-- This migration unifies the platform services table with youth justice service finder requirements
-- Created: 2025-01-21

-- =====================================
-- STEP 1: ADD MISSING FIELDS TO SERVICES TABLE
-- =====================================

-- Add core columns from initial schema (if they don't exist)
ALTER TABLE services ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS program_type TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS service_category TEXT[] DEFAULT '{}';
ALTER TABLE services ADD COLUMN IF NOT EXISTS delivery_method TEXT[] DEFAULT '{}';
ALTER TABLE services ADD COLUMN IF NOT EXISTS capacity_total INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS capacity_current INTEGER DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_accepting_referrals BOOLEAN DEFAULT true;
ALTER TABLE services ADD COLUMN IF NOT EXISTS cost TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS eligibility_criteria TEXT[] DEFAULT '{}';
ALTER TABLE services ADD COLUMN IF NOT EXISTS location_address TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS location_city TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS location_state TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS location_postcode TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS success_rate DECIMAL(5,2);
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE services ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE services ADD COLUMN IF NOT EXISTS operating_hours JSONB DEFAULT '{}';
ALTER TABLE services ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add youth justice specific fields
ALTER TABLE services ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';
ALTER TABLE services ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}';
ALTER TABLE services ADD COLUMN IF NOT EXISTS target_age_min INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS target_age_max INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS youth_specific BOOLEAN DEFAULT false;
ALTER TABLE services ADD COLUMN IF NOT EXISTS indigenous_specific BOOLEAN DEFAULT false;

-- Add service details for scraping
ALTER TABLE services ADD COLUMN IF NOT EXISTS gender_specific TEXT[] DEFAULT '{}';
ALTER TABLE services ADD COLUMN IF NOT EXISTS languages_supported TEXT[] DEFAULT '{}';
ALTER TABLE services ADD COLUMN IF NOT EXISTS accessibility_features TEXT[] DEFAULT '{}';
ALTER TABLE services ADD COLUMN IF NOT EXISTS service_type TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS location_type TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS service_area TEXT[] DEFAULT '{}';

-- Add quality assurance fields for AI scraping
ALTER TABLE services ADD COLUMN IF NOT EXISTS data_source TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS data_source_url TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE services ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified';
ALTER TABLE services ADD COLUMN IF NOT EXISTS scrape_confidence_score DECIMAL(3,2);
ALTER TABLE services ADD COLUMN IF NOT EXISTS last_scraped_at TIMESTAMP WITH TIME ZONE;

-- Add capacity and availability
ALTER TABLE services ADD COLUMN IF NOT EXISTS waitlist_time_weeks INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS online_booking_url TEXT;

-- Add location coordinates
ALTER TABLE services ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE services ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add project field for multi-tenancy
ALTER TABLE services ADD COLUMN IF NOT EXISTS project TEXT DEFAULT 'youth-justice-service-finder';

-- Add parent service relationship for hierarchies
ALTER TABLE services ADD COLUMN IF NOT EXISTS parent_service_id UUID REFERENCES services(id);

-- =====================================
-- STEP 1B: ADD MISSING FIELDS TO ORGANIZATIONS TABLE
-- =====================================

-- Add core columns from initial schema (if they don't exist)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS street_address TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS suburb TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS postcode TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- =====================================
-- STEP 2: CREATE NORMALIZED TABLES FOR MULTI-LOCATION SERVICES
-- =====================================

-- Service Locations (for services with multiple locations)
CREATE TABLE IF NOT EXISTS service_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  location_name TEXT,
  street_address TEXT,
  locality TEXT,
  city TEXT,
  region TEXT,
  state TEXT,
  postcode TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  contact_phone TEXT,
  contact_email TEXT,
  operating_hours JSONB,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service Contacts (for multiple contact points)
CREATE TABLE IF NOT EXISTS service_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  contact_type TEXT DEFAULT 'general',
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  hours TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- STEP 3: ADD INDEXES FOR PERFORMANCE
-- =====================================

-- Services indexes
CREATE INDEX IF NOT EXISTS idx_services_categories ON services USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_services_keywords ON services USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_services_project ON services(project);
CREATE INDEX IF NOT EXISTS idx_services_youth_specific ON services(youth_specific);
CREATE INDEX IF NOT EXISTS idx_services_indigenous_specific ON services(indigenous_specific);
CREATE INDEX IF NOT EXISTS idx_services_verification_status ON services(verification_status);
CREATE INDEX IF NOT EXISTS idx_services_data_source ON services(data_source);
CREATE INDEX IF NOT EXISTS idx_services_location_coords ON services(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Service locations indexes
CREATE INDEX IF NOT EXISTS idx_service_locations_service_id ON service_locations(service_id);
CREATE INDEX IF NOT EXISTS idx_service_locations_state ON service_locations(state);
CREATE INDEX IF NOT EXISTS idx_service_locations_region ON service_locations(region);
CREATE INDEX IF NOT EXISTS idx_service_locations_coords ON service_locations(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Service contacts indexes
CREATE INDEX IF NOT EXISTS idx_service_contacts_service_id ON service_contacts(service_id);
CREATE INDEX IF NOT EXISTS idx_service_contacts_type ON service_contacts(contact_type);

-- =====================================
-- STEP 4: CREATE CHECK CONSTRAINTS
-- =====================================

-- Drop existing constraints if they exist (PostgreSQL doesn't support IF NOT EXISTS for ALTER TABLE ADD CONSTRAINT)
DO $$
BEGIN
  -- Services constraints
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_verification_status') THEN
    ALTER TABLE services DROP CONSTRAINT chk_verification_status;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_scrape_confidence') THEN
    ALTER TABLE services DROP CONSTRAINT chk_scrape_confidence;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_age_range') THEN
    ALTER TABLE services DROP CONSTRAINT chk_age_range;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_location_type') THEN
    ALTER TABLE services DROP CONSTRAINT chk_location_type;
  END IF;

  -- Service contacts constraint
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_contact_type') THEN
    ALTER TABLE service_contacts DROP CONSTRAINT chk_contact_type;
  END IF;
END $$;

-- Add constraints
ALTER TABLE services ADD CONSTRAINT chk_verification_status
  CHECK (verification_status IN ('verified', 'unverified', 'needs_review', 'rejected'));

ALTER TABLE services ADD CONSTRAINT chk_scrape_confidence
  CHECK (scrape_confidence_score IS NULL OR (scrape_confidence_score >= 0 AND scrape_confidence_score <= 1));

ALTER TABLE services ADD CONSTRAINT chk_age_range
  CHECK (target_age_min IS NULL OR target_age_max IS NULL OR target_age_min <= target_age_max);

ALTER TABLE services ADD CONSTRAINT chk_location_type
  CHECK (location_type IS NULL OR location_type IN ('fixed', 'mobile', 'online', 'statewide', 'national'));

ALTER TABLE service_contacts ADD CONSTRAINT chk_contact_type
  CHECK (contact_type IN ('general', 'crisis', 'intake', 'admin', 'emergency', 'referral'));

-- =====================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- =====================================

ALTER TABLE service_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_contacts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (CREATE POLICY doesn't support IF NOT EXISTS in older PG versions)
DROP POLICY IF EXISTS "Public read access for service_locations" ON service_locations;
DROP POLICY IF EXISTS "Public read access for service_contacts" ON service_contacts;
DROP POLICY IF EXISTS "Service role can write service_locations" ON service_locations;
DROP POLICY IF EXISTS "Service role can write service_contacts" ON service_contacts;

-- Create public read policies
CREATE POLICY "Public read access for service_locations"
  ON service_locations FOR SELECT USING (true);

CREATE POLICY "Public read access for service_contacts"
  ON service_contacts FOR SELECT USING (true);

-- Service role can write (for scrapers)
CREATE POLICY "Service role can write service_locations"
  ON service_locations FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can write service_contacts"
  ON service_contacts FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================
-- STEP 6: CREATE UPDATED_AT TRIGGERS
-- =====================================

-- Drop triggers if they exist (PostgreSQL doesn't support IF NOT EXISTS for CREATE TRIGGER)
DROP TRIGGER IF EXISTS update_service_locations_updated_at ON service_locations;
DROP TRIGGER IF EXISTS update_service_contacts_updated_at ON service_contacts;

-- Create triggers
CREATE TRIGGER update_service_locations_updated_at
  BEFORE UPDATE ON service_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_contacts_updated_at
  BEFORE UPDATE ON service_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================
-- STEP 7: CREATE FRONTEND-COMPATIBLE VIEW
-- =====================================

CREATE OR REPLACE VIEW services_complete AS
SELECT
  s.id,
  s.name,
  s.slug,
  s.description,
  s.categories,
  s.keywords,
  s.target_age_min AS minimum_age,
  s.target_age_max AS maximum_age,

  -- Age range object
  CASE
    WHEN s.target_age_min IS NOT NULL OR s.target_age_max IS NOT NULL THEN
      jsonb_build_object(
        'minimum', s.target_age_min,
        'maximum', s.target_age_max
      )
    ELSE NULL
  END AS age_range,

  s.youth_specific,
  s.indigenous_specific,
  s.website_url AS url,
  s.is_active AS active,
  s.scrape_confidence_score AS score,

  -- Organization data
  CASE
    WHEN o.id IS NOT NULL THEN
      jsonb_build_object(
        'id', o.id,
        'name', o.name,
        'type', o.type,
        'website', o.website
      )
    ELSE NULL
  END AS organization,

  -- Alternative organization structure (for compatibility)
  CASE
    WHEN o.id IS NOT NULL THEN
      jsonb_build_object(
        'id', o.id,
        'name', o.name,
        'website', o.website
      )
    ELSE NULL
  END AS organizations,

  -- Primary location data
  CASE
    WHEN s.location_address IS NOT NULL OR s.location_city IS NOT NULL THEN
      jsonb_build_object(
        'address', s.location_address,
        'city', s.location_city,
        'region', s.location_city,
        'state', s.location_state,
        'postcode', s.location_postcode
      )
    ELSE NULL
  END AS location,

  -- Primary contact data
  jsonb_build_object(
    'phone', s.contact_phone,
    'email', s.contact_email,
    'website', s.website_url,
    'hours', s.operating_hours
  ) AS contact,

  -- All locations array
  (
    SELECT COALESCE(json_agg(
      jsonb_build_object(
        'id', sl.id,
        'street_address', sl.street_address,
        'locality', sl.locality,
        'region', sl.region,
        'state', sl.state,
        'postcode', sl.postcode
      ) ORDER BY sl.is_primary DESC, sl.location_name
    ), '[]'::json)
    FROM service_locations sl
    WHERE sl.service_id = s.id
  ) AS locations,

  -- All contacts array
  (
    SELECT COALESCE(json_agg(
      jsonb_build_object(
        'id', sc.id,
        'phone', sc.phone,
        'email', sc.email,
        'website', sc.website,
        'hours', sc.hours
      ) ORDER BY sc.is_primary DESC, sc.contact_type
    ), '[]'::json)
    FROM service_contacts sc
    WHERE sc.service_id = s.id
  ) AS contacts,

  s.created_at,
  s.updated_at,
  s.last_scraped_at

FROM services s
LEFT JOIN organizations o ON s.organization_id = o.id
WHERE s.is_active = true;

-- Grant select on view
GRANT SELECT ON services_complete TO anon, authenticated;

-- =====================================
-- STEP 8: CREATE HELPER FUNCTIONS
-- =====================================

-- Function to update service last_verified_at
CREATE OR REPLACE FUNCTION mark_service_verified(service_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE services
  SET
    last_verified_at = NOW(),
    verification_status = 'verified'
  WHERE id = service_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate service completeness score
CREATE OR REPLACE FUNCTION calculate_service_completeness(service_id_param UUID)
RETURNS DECIMAL AS $$
DECLARE
  completeness_score DECIMAL := 0;
  total_fields INTEGER := 15;
  filled_fields INTEGER := 0;
BEGIN
  SELECT COUNT(*) INTO filled_fields
  FROM (
    SELECT
      CASE WHEN name IS NOT NULL AND name != '' THEN 1 END,
      CASE WHEN description IS NOT NULL AND description != '' THEN 1 END,
      CASE WHEN categories IS NOT NULL AND array_length(categories, 1) > 0 THEN 1 END,
      CASE WHEN organization_id IS NOT NULL THEN 1 END,
      CASE WHEN contact_phone IS NOT NULL AND contact_phone != '' THEN 1 END,
      CASE WHEN contact_email IS NOT NULL AND contact_email != '' THEN 1 END,
      CASE WHEN website_url IS NOT NULL AND website_url != '' THEN 1 END,
      CASE WHEN location_address IS NOT NULL AND location_address != '' THEN 1 END,
      CASE WHEN location_city IS NOT NULL AND location_city != '' THEN 1 END,
      CASE WHEN location_state IS NOT NULL AND location_state != '' THEN 1 END,
      CASE WHEN target_age_min IS NOT NULL THEN 1 END,
      CASE WHEN target_age_max IS NOT NULL THEN 1 END,
      CASE WHEN operating_hours IS NOT NULL THEN 1 END,
      CASE WHEN eligibility_criteria IS NOT NULL AND array_length(eligibility_criteria, 1) > 0 THEN 1 END,
      CASE WHEN cost IS NOT NULL AND cost != '' THEN 1 END
    FROM services
    WHERE id = service_id_param
  ) AS field_check;

  completeness_score := (filled_fields::DECIMAL / total_fields::DECIMAL) * 100;
  RETURN ROUND(completeness_score, 2);
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- STEP 9: ADD COMMENTS FOR DOCUMENTATION
-- =====================================

COMMENT ON TABLE services IS 'Unified services table supporting both platform services and youth justice service finder';
COMMENT ON TABLE service_locations IS 'Multiple locations for services that operate in different places';
COMMENT ON TABLE service_contacts IS 'Multiple contact points for services with different contact types';

COMMENT ON COLUMN services.categories IS 'Service categories: legal_aid, mental_health, housing, crisis_support, etc.';
COMMENT ON COLUMN services.keywords IS 'Search keywords for service discovery';
COMMENT ON COLUMN services.youth_specific IS 'Whether service is specifically designed for youth';
COMMENT ON COLUMN services.indigenous_specific IS 'Whether service is culturally specific for Indigenous youth';
COMMENT ON COLUMN services.scrape_confidence_score IS 'AI confidence score for scraped data (0.00-1.00)';
COMMENT ON COLUMN services.data_source_url IS 'Original URL where service data was scraped from';
COMMENT ON COLUMN services.verification_status IS 'Manual verification status: verified, unverified, needs_review, rejected';

-- =====================================
-- MIGRATION COMPLETE
-- =====================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 20250121000001_unify_services_schema completed successfully';
  RAISE NOTICE 'Services table enhanced with youth justice fields';
  RAISE NOTICE 'Created service_locations and service_contacts tables';
  RAISE NOTICE 'Created services_complete view for frontend compatibility';
  RAISE NOTICE 'Added indexes and constraints for data quality';
END $$;
