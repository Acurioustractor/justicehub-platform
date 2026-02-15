-- Fix broken URLs in alma_sources table
-- Run this after the initial migration to correct known broken URLs

-- Update broken government URLs
UPDATE alma_sources SET 
  url = 'https://www.youthjustice.qld.gov.au/',
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{url_fixed}',
    'true'::jsonb
  )
WHERE name = 'QLD Youth Justice';

UPDATE alma_sources SET 
  url = 'https://agd.nt.gov.au/',
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{url_fixed}',
    'true'::jsonb
  )
WHERE name = 'NT Youth Justice';

-- Mark sources that require JavaScript rendering (403 errors without browser)
UPDATE alma_sources SET 
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{requires_js}',
    'true'::jsonb
  )
WHERE name IN ('VIC Youth Justice', 'SA Youth Justice');

-- Mark sources that need extended timeout
UPDATE alma_sources SET 
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{extended_timeout}',
    'true'::jsonb
  )
WHERE name = 'AIC Research';

-- Mark Indigenous legal services that may have SSL issues
UPDATE alma_sources SET 
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{ssl_issues}',
    'true'::jsonb
  )
WHERE name IN ('ALS NSW/ACT', 'VALS', 'NAAJA', 'ALRM SA', 'ALS WA');

-- Add requires_js flag to metadata for sources that block scrapers
UPDATE alma_sources SET 
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{requires_js}',
    'true'::jsonb
  )
WHERE url LIKE '%.vic.gov.au%' OR url LIKE '%childprotection.sa.gov.au%';

-- Reset health status for all sources to force re-check
UPDATE alma_sources SET 
  health_status = 'unknown',
  last_health_check = NULL;

-- Add comment
COMMENT ON TABLE alma_sources IS 'Registry of data sources for ALMA scraper. Updated 2026-02-13 with fixed URLs.';
