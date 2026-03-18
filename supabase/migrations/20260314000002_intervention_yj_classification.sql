-- Add youth justice classification columns to alma_interventions
-- Populated by scripts/classify-interventions-yj.mjs

ALTER TABLE alma_interventions
  ADD COLUMN IF NOT EXISTS serves_youth_justice BOOLEAN,
  ADD COLUMN IF NOT EXISTS service_role TEXT,
  ADD COLUMN IF NOT EXISTS estimated_annual_capacity INTEGER;

-- service_role values: diversion, bail_support, post_release, residential_therapeutic,
-- family_support, legal_aid, community_program, justice_reinvestment, prevention, other

COMMENT ON COLUMN alma_interventions.serves_youth_justice IS 'LLM-classified: does this org specifically serve young people in or at risk of entering the justice system?';
COMMENT ON COLUMN alma_interventions.service_role IS 'LLM-classified: what role in the justice pipeline (diversion, bail_support, post_release, etc)';
COMMENT ON COLUMN alma_interventions.estimated_annual_capacity IS 'LLM-estimated: rough number of young people served per year';
