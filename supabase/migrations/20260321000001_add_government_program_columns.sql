-- Add minister, department, target_cohort columns to alma_government_programs
-- These support the government promise scraper pipeline

BEGIN;

ALTER TABLE alma_government_programs
  ADD COLUMN IF NOT EXISTS minister TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS target_cohort TEXT[];

-- Index on jurisdiction for state-scoped queries
CREATE INDEX IF NOT EXISTS idx_alma_government_programs_jurisdiction
  ON alma_government_programs(jurisdiction);

-- Index on status for filtering
CREATE INDEX IF NOT EXISTS idx_alma_government_programs_status
  ON alma_government_programs(status);

COMMIT;
