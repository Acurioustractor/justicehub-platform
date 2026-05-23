-- Claim-evidence lineage layer.
-- Powers the "earned by N sources" triangulation pattern on the civic page.
--
-- Each row links a civic_intelligence_claim to a source dataset that supports
-- (or contradicts) the claim. The reviewer_status field gates whether the
-- evidence has been sense-checked by a human.
CREATE TABLE IF NOT EXISTS civic_claim_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id text NOT NULL,
  source_table text NOT NULL,
  source_record_ids jsonb,
  supports boolean DEFAULT true,
  confidence numeric CHECK (confidence >= 0 AND confidence <= 1),
  methodology_note text,
  contributed_by text DEFAULT 'system',
  contributed_at timestamptz DEFAULT now(),
  reviewer_status text DEFAULT 'pending' CHECK (reviewer_status IN ('pending', 'verified', 'disputed', 'auto_high_confidence')),
  reviewer_id uuid,
  reviewed_at timestamptz,
  notes text,
  UNIQUE (claim_id, source_table)
);
CREATE INDEX IF NOT EXISTS idx_civic_claim_evidence_claim ON civic_claim_evidence(claim_id);
CREATE INDEX IF NOT EXISTS idx_civic_claim_evidence_source ON civic_claim_evidence(source_table);
CREATE INDEX IF NOT EXISTS idx_civic_claim_evidence_status ON civic_claim_evidence(reviewer_status);

CREATE OR REPLACE VIEW v_claim_evidence_summary AS
SELECT
  c.claim_id, c.display_label, c.chapter, c.region,
  COUNT(e.id) FILTER (WHERE e.supports = true) AS supporting_sources,
  COUNT(e.id) FILTER (WHERE e.supports = false) AS contradicting_sources,
  COUNT(e.id) FILTER (WHERE e.reviewer_status = 'verified') AS verified_sources,
  ROUND(AVG(e.confidence) FILTER (WHERE e.supports = true), 3) AS avg_confidence,
  COUNT(e.id) AS total_evidence_rows,
  CASE
    WHEN COUNT(e.id) FILTER (WHERE e.supports = true) >= 3 THEN 'triangulated'
    WHEN COUNT(e.id) FILTER (WHERE e.supports = true) = 2 THEN 'corroborated'
    WHEN COUNT(e.id) FILTER (WHERE e.supports = true) = 1 THEN 'single_source'
    ELSE 'no_evidence'
  END AS triangulation_tier
FROM civic_intelligence_claims c
LEFT JOIN civic_claim_evidence e ON e.claim_id = c.claim_id
GROUP BY c.claim_id, c.display_label, c.chapter, c.region;
