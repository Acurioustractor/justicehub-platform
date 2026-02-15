-- Migrate Existing Seed Data to Unified Schema
-- This migration updates existing seed data to work with the unified schema
-- Created: 2025-01-21

-- =====================================
-- STEP 1: UPDATE EXISTING SERVICES WITH NEW FIELDS
-- =====================================

-- Set project for existing services
UPDATE services
SET project = 'youth-justice-service-finder'
WHERE project IS NULL;

-- Generate slugs for services that don't have them
UPDATE services
SET slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- Make slugs unique by appending UUID if duplicates exist
WITH duplicate_slugs AS (
  SELECT slug, COUNT(*) as count
  FROM services
  GROUP BY slug
  HAVING COUNT(*) > 1
)
UPDATE services s
SET slug = s.slug || '-' || substring(s.id::text, 1, 8)
WHERE s.slug IN (SELECT slug FROM duplicate_slugs)
  AND s.id NOT IN (
    SELECT DISTINCT ON (slug) id
    FROM services
    WHERE slug IN (SELECT slug FROM duplicate_slugs)
    ORDER BY slug, created_at
  );

-- Set default program_type based on categories
UPDATE services
SET program_type = CASE
  WHEN 'legal_aid' = ANY(categories) THEN 'legal_support'
  WHEN 'mental_health' = ANY(categories) THEN 'counseling'
  WHEN 'housing' = ANY(categories) THEN 'accommodation'
  WHEN 'crisis_support' = ANY(categories) THEN 'crisis_intervention'
  WHEN 'education_training' = ANY(categories) THEN 'education'
  WHEN 'case_management' = ANY(categories) THEN 'case_management'
  ELSE 'general_support'
END
WHERE program_type IS NULL OR program_type = '';

-- Set default delivery_method
UPDATE services
SET delivery_method = ARRAY['in_person']::TEXT[]
WHERE delivery_method IS NULL OR delivery_method = '{}';

-- Set default cost
UPDATE services
SET cost = 'free'
WHERE cost IS NULL OR cost = '';

-- Set is_active for all existing services
UPDATE services
SET is_active = true
WHERE is_active IS NULL;

-- Set is_accepting_referrals
UPDATE services
SET is_accepting_referrals = true
WHERE is_accepting_referrals IS NULL;

-- Mark youth-specific services
UPDATE services
SET youth_specific = true
WHERE
  (target_age_min IS NOT NULL AND target_age_min < 25) OR
  (target_age_max IS NOT NULL AND target_age_max <= 25) OR
  'youth' = ANY(keywords) OR
  'young people' = ANY(keywords) OR
  name ILIKE '%youth%' OR
  name ILIKE '%young%';

-- Mark indigenous-specific services
UPDATE services
SET indigenous_specific = true
WHERE
  'aboriginal' = ANY(keywords) OR
  'torres strait islander' = ANY(keywords) OR
  'indigenous' = ANY(keywords) OR
  'murri' = ANY(keywords) OR
  'atsi' = ANY(keywords) OR
  name ILIKE '%aboriginal%' OR
  name ILIKE '%torres strait%' OR
  name ILIKE '%indigenous%' OR
  name ILIKE '%murri%' OR
  name ILIKE '%atsils%';

-- Set data_source for existing services
UPDATE services
SET
  data_source = 'manual_entry',
  verification_status = 'unverified',
  last_verified_at = created_at
WHERE data_source IS NULL;

-- =====================================
-- STEP 2: ENSURE SERVICE CATEGORIES ARE VALID
-- =====================================

-- Standardize category names
UPDATE services
SET categories = ARRAY(
  SELECT DISTINCT unnest(categories)
  FROM (SELECT categories) AS t
)
WHERE categories IS NOT NULL;

-- Add service_category from categories for compatibility
UPDATE services
SET service_category = categories
WHERE service_category IS NULL OR service_category = '{}';

-- =====================================
-- STEP 3: SET DEFAULT LOCATION TYPE
-- =====================================

UPDATE services
SET location_type = CASE
  WHEN location_address IS NOT NULL AND location_address != '' THEN 'fixed'
  WHEN 'online' = ANY(delivery_method) THEN 'online'
  WHEN location_state IS NOT NULL AND location_city IS NULL THEN 'statewide'
  ELSE 'fixed'
END
WHERE location_type IS NULL;

-- =====================================
-- STEP 4: CREATE SERVICE AREA FROM LOCATION DATA
-- =====================================

UPDATE services
SET service_area = ARRAY[location_city]::TEXT[]
WHERE
  location_city IS NOT NULL
  AND location_city != ''
  AND (service_area IS NULL OR service_area = '{}');

-- For statewide services
UPDATE services
SET service_area = ARRAY[location_state]::TEXT[]
WHERE
  location_type = 'statewide'
  AND location_state IS NOT NULL
  AND (service_area IS NULL OR service_area = '{}');

-- =====================================
-- STEP 5: SET ELIGIBILITY CRITERIA FROM KEYWORDS AND AGE
-- =====================================

UPDATE services
SET eligibility_criteria = ARRAY(
  SELECT DISTINCT criterion
  FROM (
    SELECT CASE
      WHEN target_age_min IS NOT NULL AND target_age_max IS NOT NULL
        THEN 'Ages ' || target_age_min::text || '-' || target_age_max::text
      WHEN target_age_min IS NOT NULL
        THEN 'Ages ' || target_age_min::text || '+'
      WHEN target_age_max IS NOT NULL
        THEN 'Up to age ' || target_age_max::text
    END AS criterion
    UNION
    SELECT CASE
      WHEN indigenous_specific THEN 'Aboriginal and Torres Strait Islander young people'
    END
    UNION
    SELECT CASE
      WHEN youth_specific AND NOT indigenous_specific THEN 'Young people'
    END
  ) AS criteria
  WHERE criterion IS NOT NULL
)
WHERE
  eligibility_criteria IS NULL OR eligibility_criteria = '{}'
  AND (target_age_min IS NOT NULL OR target_age_max IS NOT NULL OR indigenous_specific OR youth_specific);

-- =====================================
-- STEP 6: ADD TAGS FROM KEYWORDS
-- =====================================

UPDATE services
SET tags = keywords
WHERE (tags IS NULL OR tags = '{}') AND keywords IS NOT NULL;

-- =====================================
-- STEP 7: VALIDATE DATA INTEGRITY
-- =====================================

-- Ensure all services have required fields
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM services
  WHERE
    name IS NULL OR name = '' OR
    description IS NULL OR description = '' OR
    slug IS NULL OR slug = '';

  IF invalid_count > 0 THEN
    RAISE WARNING '% services are missing required fields (name, description, or slug)', invalid_count;
  ELSE
    RAISE NOTICE 'All services have required fields';
  END IF;
END $$;

-- =====================================
-- STEP 8: CREATE SUMMARY REPORT
-- =====================================

DO $$
DECLARE
  total_services INTEGER;
  youth_specific_count INTEGER;
  indigenous_count INTEGER;
  with_location INTEGER;
  with_contact INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_services FROM services;
  SELECT COUNT(*) INTO youth_specific_count FROM services WHERE youth_specific = true;
  SELECT COUNT(*) INTO indigenous_count FROM services WHERE indigenous_specific = true;
  SELECT COUNT(*) INTO with_location FROM services WHERE location_city IS NOT NULL;
  SELECT COUNT(*) INTO with_contact FROM services WHERE contact_phone IS NOT NULL OR contact_email IS NOT NULL;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SEED DATA MIGRATION SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total services migrated: %', total_services;
  RAISE NOTICE 'Youth-specific services: %', youth_specific_count;
  RAISE NOTICE 'Indigenous-specific services: %', indigenous_count;
  RAISE NOTICE 'Services with location: %', with_location;
  RAISE NOTICE 'Services with contact info: %', with_contact;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- =====================================
-- MIGRATION COMPLETE
-- =====================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 20250121000002_migrate_seed_data completed successfully';
END $$;
