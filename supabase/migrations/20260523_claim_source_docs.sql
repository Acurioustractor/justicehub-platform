-- Backfill source_doc_urls on civic_intelligence_claims with canonical
-- primary-source URLs by claim family. The kiosk trust-drill modal surfaces
-- these so a journalist can click straight to the AIHW / RoGS / ACNC /
-- ORIC source without opening a methodology rabbit hole.

-- RoGS justice-spending chapter for detention + community per-youth costs
-- and the ratio claims that derive from them.
UPDATE civic_intelligence_claims
SET source_doc_urls = jsonb_build_array(
  'https://www.pc.gov.au/ongoing/report-on-government-services/2025/community-services/youth-justice'
)
WHERE claim_id LIKE 'access.cost.detention_per_youth.annual.%'
   OR claim_id LIKE 'access.cost.community_per_youth.annual.%'
   OR claim_id LIKE 'access.ratio.detention_vs_community_cost.%';

-- AIHW Youth Justice in Australia 2024-25 for population and return-to-supervision
UPDATE civic_intelligence_claims
SET source_doc_urls = jsonb_build_array(
  'https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-2024-25/'
)
WHERE claim_id LIKE 'access.count.detention_avg_daily_pop.%'
   OR claim_id LIKE 'oversight.rate.return_to_supervision.%';

-- ACNC + ORIC public registers for Indigenous-controlled share and Tier 1 counts
UPDATE civic_intelligence_claims
SET source_doc_urls = jsonb_build_array(
  'https://www.acnc.gov.au/charity/charities',
  'https://www.oric.gov.au'
)
WHERE claim_id LIKE 'access.indigenous_share.%'
   OR claim_id LIKE 'access.count.tier_1_orgs.%'
   OR claim_id LIKE 'access.indigenous_funding_share.%';

-- Detention beds — AIHW remains the canonical reference where not otherwise set
UPDATE civic_intelligence_claims
SET source_doc_urls = jsonb_build_array(
  'https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-2024-25/'
)
WHERE claim_id LIKE 'access.count.detention_beds.%'
  AND (source_doc_urls IS NULL OR jsonb_array_length(source_doc_urls) = 0);
