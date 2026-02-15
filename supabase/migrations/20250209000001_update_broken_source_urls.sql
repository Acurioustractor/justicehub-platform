-- Update broken government URLs identified during scraper testing
-- Run this after the source registry migration

UPDATE alma_sources 
SET 
  url = 'https://www.youthjustice.qld.gov.au/',
  updated_at = NOW(),
  metadata = jsonb_build_object(
    'previous_url', 'https://www.cyjma.qld.gov.au/youth-justice',
    'updated_reason', '404 error - URL changed',
    'updated_at', NOW()
  )
WHERE url = 'https://www.cyjma.qld.gov.au/youth-justice';

UPDATE alma_sources 
SET 
  url = 'https://agd.nt.gov.au/',
  updated_at = NOW(),
  metadata = jsonb_build_object(
    'previous_url', 'https://justice.nt.gov.au/youth-justice',
    'updated_reason', '404 error - URL changed to Attorney-General Department',
    'updated_at', NOW()
  )
WHERE url = 'https://justice.nt.gov.au/youth-justice';

UPDATE alma_sources 
SET 
  url = 'https://www.cys.act.gov.au/',
  updated_at = NOW(),
  metadata = jsonb_build_object(
    'previous_url', 'https://www.communityservices.act.gov.au/children-and-families/youth-justice',
    'updated_reason', '404 error - URL changed to Child and Youth Services',
    'updated_at', NOW()
  )
WHERE url = 'https://www.communityservices.act.gov.au/children-and-families/youth-justice';

-- Update NT URL to Attorney-General Department (merged)
UPDATE alma_sources 
SET 
  url = 'https://agd.nt.gov.au/',
  updated_at = NOW(),
  metadata = jsonb_build_object(
    'previous_url', 'https://nt.gov.au/law/crime-and-victims/youth-justice',
    'updated_reason', '404 error - NT Justice merged into Attorney-General Department',
    'updated_at', NOW()
  )
WHERE url = 'https://nt.gov.au/law/crime-and-victims/youth-justice';

-- Mark sources that require JavaScript rendering
UPDATE alma_sources 
SET 
  metadata = metadata || '{"requires_js": true}'::jsonb,
  updated_at = NOW()
WHERE url IN (
  'https://www.justice.vic.gov.au/youth-justice',
  'https://www.childprotection.sa.gov.au/youth-justice'
);

-- Add comment
COMMENT ON TABLE alma_sources IS 'Registry of data sources for ALMA scraper. Updated Feb 2026 with corrected URLs.';
