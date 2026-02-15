-- Add consent_level column to alma_ingestion_jobs table
-- This tracks the consent level of the source being ingested

ALTER TABLE alma_ingestion_jobs
ADD COLUMN consent_level TEXT DEFAULT 'Public Knowledge Commons' CHECK (consent_level IN (
  'Public Knowledge Commons',
  'Community Controlled',
  'Strictly Private'
));

-- Add cultural_authority flag for Indigenous sources
ALTER TABLE alma_ingestion_jobs
ADD COLUMN cultural_authority BOOLEAN DEFAULT FALSE;

-- Add category column for organizing sources
ALTER TABLE alma_ingestion_jobs
ADD COLUMN category TEXT CHECK (category IN (
  'government',
  'indigenous',
  'research',
  'media',
  'legal'
));

-- Create index for filtering by consent level
CREATE INDEX idx_alma_ingestion_jobs_consent_level ON alma_ingestion_jobs(consent_level);
CREATE INDEX idx_alma_ingestion_jobs_category ON alma_ingestion_jobs(category);

COMMENT ON COLUMN alma_ingestion_jobs.consent_level IS 'Consent level: Public Knowledge Commons, Community Controlled, or Strictly Private';
COMMENT ON COLUMN alma_ingestion_jobs.cultural_authority IS 'TRUE for Indigenous-controlled sources requiring cultural authority';
COMMENT ON COLUMN alma_ingestion_jobs.category IS 'Source category: government, indigenous, research, media, or legal';
