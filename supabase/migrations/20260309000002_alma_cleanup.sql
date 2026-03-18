-- ALMA Phase 1 Cleanup: Remove fabricated data
-- Portfolio scores, outcomes, and signal fields were AI-generated guesses presented as fact.
-- This migration adds verification tracking and removes the fabricated data.

-- 1. Add verification tracking columns
ALTER TABLE alma_interventions
  ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS data_provenance text;

-- 2. Flag template-generated filler
UPDATE alma_interventions
SET verification_status = 'ai_generated', data_provenance = 'template_generated'
WHERE metadata->>'generated' = 'true';

-- 3. Flag service conversions as needing review
UPDATE alma_interventions
SET verification_status = 'needs_review', data_provenance = 'service_conversion'
WHERE metadata->>'source' = 'services_conversion'
  AND verification_status = 'unverified';

-- 4. Flag interventions with real source docs as needs_review (higher priority)
UPDATE alma_interventions
SET verification_status = 'needs_review', data_provenance = 'web_scraped'
WHERE (source_documents IS NOT NULL AND jsonb_array_length(source_documents) > 0)
  AND verification_status = 'unverified';

-- 5. DELETE all garbage outcomes
DELETE FROM alma_intervention_outcomes;
DELETE FROM alma_outcomes;

-- 6. NULL out all LLM-guessed signal fields (scores are meaningless without real evaluation)
UPDATE alma_interventions SET
  portfolio_score = NULL,
  evidence_strength_signal = NULL,
  community_authority_signal = NULL,
  harm_risk_signal = NULL,
  implementation_capability_signal = NULL,
  option_value_signal = NULL,
  evidence_level = NULL,
  harm_risk_level = NULL,
  replication_readiness = NULL
WHERE verification_status != 'verified';

-- 7. Deduplicate evidence items (keep newest per unique title+source_url combo)
DELETE FROM alma_intervention_evidence
WHERE evidence_id IN (
  SELECT id FROM alma_evidence e1
  WHERE EXISTS (
    SELECT 1 FROM alma_evidence e2
    WHERE e2.title = e1.title
      AND e2.source_url = e1.source_url
      AND e2.created_at > e1.created_at
  )
);

DELETE FROM alma_evidence e1
WHERE EXISTS (
  SELECT 1 FROM alma_evidence e2
  WHERE e2.title = e1.title
    AND e2.source_url = e1.source_url
    AND e2.created_at > e1.created_at
);

-- 8. Create index for verification_status queries
CREATE INDEX IF NOT EXISTS idx_alma_interventions_verification_status
  ON alma_interventions (verification_status);
