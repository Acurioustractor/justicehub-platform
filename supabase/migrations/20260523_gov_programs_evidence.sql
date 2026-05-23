-- Triangulation columns for alma_government_programs.
-- The community_led flag from the announcing minister text is one signal;
-- evidence_community_led is set by cross-referencing against alma_interventions
-- delivered by ACCO/Indigenous orgs. Both are kept so the page can show both.
ALTER TABLE alma_government_programs ADD COLUMN IF NOT EXISTS evidence_community_led boolean;
ALTER TABLE alma_government_programs ADD COLUMN IF NOT EXISTS evidence_indigenous_delivery boolean;
ALTER TABLE alma_government_programs ADD COLUMN IF NOT EXISTS evidence_matched_interventions int DEFAULT 0;
ALTER TABLE alma_government_programs ADD COLUMN IF NOT EXISTS evidence_matched_acco_interventions int DEFAULT 0;
ALTER TABLE alma_government_programs ADD COLUMN IF NOT EXISTS evidence_at timestamptz;
COMMENT ON COLUMN alma_government_programs.evidence_community_led IS
  'TRUE when bottom-up evidence from alma_interventions shows matching programs are delivered by community/Indigenous orgs (ACCO or is_indigenous_org). Separate from community_led which was extracted from the announcing minister text.';
