-- Add source_year column to civic_intelligence_claims so cards can show the
-- data year inline ("2024-25" or "live ledger" / "live register") instead of
-- forcing visitors to dig into methodology to find data freshness.
--
-- Backfill: regex value_text for "(YYYY-YY)" or bare "YYYY-YY"; mark the
-- live-computed counts (Tier 1 register, detention beds, foundation sums,
-- oversight totals) as 'live ledger' / 'live register' so visitors know
-- these numbers reflect the present-day registry, not a historical snapshot.

ALTER TABLE civic_intelligence_claims ADD COLUMN IF NOT EXISTS source_year text;
COMMENT ON COLUMN civic_intelligence_claims.source_year IS
  'Financial/calendar year the underlying data refers to, e.g. "2024-25". Surfaced on snapshot cards so visitors can see data freshness without opening the methodology. "live ledger" / "live register" mean the value is computed from the present-day database, not a snapshot from a specific report year.';

-- Pass 1: parenthetical year markers
UPDATE civic_intelligence_claims
SET source_year = matches[1]
FROM (
  SELECT claim_id, regexp_match(value_text, '\((20\d{2}-\d{2}|20\d{2})\)') AS matches
  FROM civic_intelligence_claims
  WHERE value_text IS NOT NULL
) t
WHERE civic_intelligence_claims.claim_id = t.claim_id
  AND t.matches IS NOT NULL
  AND civic_intelligence_claims.source_year IS NULL;

-- Pass 2: bare YYYY-YY anywhere in the value_text (catches "$X vs $Y, 2024-25")
UPDATE civic_intelligence_claims
SET source_year = matches[1]
FROM (
  SELECT claim_id, regexp_match(value_text, '(20\d{2}-\d{2})') AS matches
  FROM civic_intelligence_claims
  WHERE value_text IS NOT NULL AND source_year IS NULL
) t
WHERE civic_intelligence_claims.claim_id = t.claim_id
  AND t.matches IS NOT NULL;

-- Pass 3: live-register counts (orgs, detention beds, indigenous shares)
UPDATE civic_intelligence_claims
SET source_year = 'live register'
WHERE verification_status IN ('snapshot','verified')
  AND source_year IS NULL
  AND (
    claim_id LIKE 'access.count.detention_beds.%' OR
    claim_id LIKE 'access.count.tier_1_orgs.%' OR
    claim_id LIKE 'access.indigenous_share.%' OR
    claim_id LIKE 'access.indigenous_funding_share.%'
  );

-- Pass 4: live-ledger sums (justice_funding, foundation_grantees, oversight tallies, commitments)
UPDATE civic_intelligence_claims
SET source_year = 'live ledger'
WHERE verification_status IN ('snapshot','verified')
  AND source_year IS NULL
  AND (
    claim_id LIKE 'access.sum.%' OR
    claim_id LIKE 'access.median.%' OR
    claim_id LIKE 'access.share.%' OR
    claim_id LIKE 'access.ratio.consultancy%' OR
    claim_id LIKE 'access.ratio.dept_vs_frontline%' OR
    claim_id LIKE 'oversight.count.%' OR
    claim_id = 'promises.count.commitments'
  );
