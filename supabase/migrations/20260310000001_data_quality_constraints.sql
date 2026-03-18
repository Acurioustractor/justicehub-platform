-- Data Quality Constraints Migration
-- Adds unique constraints to prevent duplicate data at insert time
-- Cleans up existing duplicates first

-- 1. alma_evidence: unique on source_url (deduplicate first)
DELETE FROM alma_intervention_evidence
WHERE evidence_id IN (
  SELECT id FROM alma_evidence
  WHERE id NOT IN (
    SELECT DISTINCT ON (source_url) id
    FROM alma_evidence
    WHERE source_url IS NOT NULL
    ORDER BY source_url, created_at ASC
  )
  AND source_url IS NOT NULL
);

DELETE FROM alma_evidence
WHERE id NOT IN (
  SELECT DISTINCT ON (source_url) id
  FROM alma_evidence
  WHERE source_url IS NOT NULL
  ORDER BY source_url, created_at ASC
)
AND source_url IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_alma_evidence_source_url
  ON alma_evidence (source_url) WHERE source_url IS NOT NULL;

-- 2. alma_interventions: unique on lower(name) + lower(coalesce(operating_organization, ''))
-- Clean up duplicates first (keep oldest)
DELETE FROM alma_intervention_outcomes
WHERE intervention_id IN (
  SELECT id FROM alma_interventions
  WHERE id NOT IN (
    SELECT DISTINCT ON (lower(name), lower(coalesce(operating_organization, ''))) id
    FROM alma_interventions
    ORDER BY lower(name), lower(coalesce(operating_organization, '')), created_at ASC
  )
);

DELETE FROM alma_intervention_evidence
WHERE intervention_id IN (
  SELECT id FROM alma_interventions
  WHERE id NOT IN (
    SELECT DISTINCT ON (lower(name), lower(coalesce(operating_organization, ''))) id
    FROM alma_interventions
    ORDER BY lower(name), lower(coalesce(operating_organization, '')), created_at ASC
  )
);

DELETE FROM alma_interventions
WHERE id NOT IN (
  SELECT DISTINCT ON (lower(name), lower(coalesce(operating_organization, ''))) id
  FROM alma_interventions
  ORDER BY lower(name), lower(coalesce(operating_organization, '')), created_at ASC
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_alma_interventions_name_org
  ON alma_interventions (lower(name), lower(coalesce(operating_organization, '')));

-- 3. justice_funding: unique on source + source_statement_id (where source_statement_id exists)
-- This prevents re-importing the same AusTender/GrantConnect record
CREATE UNIQUE INDEX IF NOT EXISTS idx_justice_funding_source_dedup
  ON justice_funding (source, source_statement_id)
  WHERE source_statement_id IS NOT NULL;

-- 4. Add updated_at trigger for alma_interventions (for cache invalidation)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_alma_interventions'
  ) THEN
    CREATE TRIGGER set_updated_at_alma_interventions
      BEFORE UPDATE ON alma_interventions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;
