-- YJ-relevance classification columns on foundation_grantees.
-- Populated by scripts/civic/classify-foundation-grants-yj.mjs via Gemini.
ALTER TABLE foundation_grantees ADD COLUMN IF NOT EXISTS yj_relevant boolean;
ALTER TABLE foundation_grantees ADD COLUMN IF NOT EXISTS yj_category text;
ALTER TABLE foundation_grantees ADD COLUMN IF NOT EXISTS yj_classified_at timestamptz;
ALTER TABLE foundation_grantees ADD COLUMN IF NOT EXISTS yj_confidence numeric;
ALTER TABLE foundation_grantees ADD COLUMN IF NOT EXISTS yj_evidence_snippet text;
CREATE INDEX IF NOT EXISTS idx_fg_yj_relevant ON foundation_grantees(yj_relevant) WHERE yj_relevant = true;
COMMENT ON COLUMN foundation_grantees.yj_relevant IS 'TRUE if grant is YJ-relevant per LLM classification. yj_category options: direct_yj_service | yj_research | yj_advocacy | broader_justice_includes_yj | indigenous_youth_general | not_yj.';
