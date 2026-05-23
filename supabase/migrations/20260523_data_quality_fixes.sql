-- Data quality fixes from 2026-05-23 session.
--
-- Fix #1: acco_certified flag from authoritative ORIC presence.
-- Distinguishes ACCO (Aboriginal Community Controlled Organisation, certified
-- via ORIC registration) from the looser is_indigenous_org heuristic, which
-- can be set by LLM enrichment and may not match ORIC.
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS acco_certified boolean DEFAULT false;
COMMENT ON COLUMN organizations.acco_certified IS
  'TRUE if organization ABN appears in oric_corporations. Authoritative ACCO test (Aboriginal Community Controlled Organisation). is_indigenous_org is a looser heuristic flag.';
CREATE INDEX IF NOT EXISTS idx_organizations_acco ON organizations(acco_certified) WHERE acco_certified;

-- The actual UPDATE (idempotent, safe to re-run):
UPDATE organizations o
SET acco_certified = true
WHERE EXISTS (SELECT 1 FROM oric_corporations oc WHERE oc.abn = o.abn AND oc.abn IS NOT NULL)
  AND o.acco_certified IS NOT TRUE;

-- Fix #4: tag the 179 foundations (from foundation_grantees) as type='foundation'.
-- They already exist as organizations rows via ABN; this just labels them.
UPDATE organizations o
SET type = 'foundation', updated_at = NOW()
WHERE EXISTS (
  SELECT 1 FROM foundation_grantees fg
  WHERE fg.foundation_abn = o.abn AND fg.foundation_abn IS NOT NULL
)
AND (o.type IS NULL OR o.type NOT IN ('foundation', 'detention_centre'));
