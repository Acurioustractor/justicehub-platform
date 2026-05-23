-- Final backfill pass for source_doc_urls — covers the last 15 claims that
-- the first pass missed (foundation share, consultancy, oversight tallies,
-- commitments, community totals). Brings coverage to 88 of 88.

-- Community pop + spend totals → AIHW + RoGS
UPDATE civic_intelligence_claims
SET source_doc_urls = jsonb_build_array(
  'https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-2024-25/',
  'https://www.pc.gov.au/ongoing/report-on-government-services/2025/community-services/youth-justice'
)
WHERE claim_id IN ('access.cost.community_total.national', 'access.count.community_avg_daily_pop.national');

-- Tier 1 funding sums + median → ACNC + RoGS
UPDATE civic_intelligence_claims
SET source_doc_urls = jsonb_build_array(
  'https://www.acnc.gov.au/charity/charities',
  'https://www.pc.gov.au/ongoing/report-on-government-services/2025/community-services/youth-justice'
)
WHERE claim_id IN (
  'access.sum.tier_1_funding.national',
  'access.sum.tier_1_grant_inflows.qld',
  'access.median.tier_1_funding_per_org.national'
);

-- QLD consultancy + asymmetry → QLD tenders + follow-the-money
UPDATE civic_intelligence_claims
SET source_doc_urls = jsonb_build_array(
  'https://qtenders.epw.qld.gov.au',
  'https://justicehub.com.au/follow-the-money'
)
WHERE claim_id IN ('access.ratio.consultancy_vs_tier1_funding.qld', 'access.sum.consultancy_yj_spend.qld');

-- QLD minister meetings → QLD Ministerial Diaries register
UPDATE civic_intelligence_claims
SET source_doc_urls = jsonb_build_array(
  'https://www.justice.qld.gov.au/about-us/services/right-to-information/published-information/ministerial-diaries'
)
WHERE claim_id = 'access.ratio.dept_vs_frontline_meetings.qld';

-- Foundation-share claims → ACNC + Philanthropy Australia + ORIC
UPDATE civic_intelligence_claims
SET source_doc_urls = jsonb_build_array(
  'https://www.acnc.gov.au/charity/charities',
  'https://www.philanthropy.org.au',
  'https://www.oric.gov.au'
)
WHERE claim_id IN ('access.share.foundation_dollars_to_acco.national', 'access.share.yj_foundation_dollars_to_acco.national');

-- Oversight tallies → state Auditors-General + Children's Commissioner + JH aggregation
UPDATE civic_intelligence_claims
SET source_doc_urls = jsonb_build_array(
  'https://www.audit.nt.gov.au',
  'https://www.qaud.qld.gov.au',
  'https://childcomm.qld.gov.au',
  'https://justicehub.com.au/intelligence/civic'
)
WHERE claim_id IN (
  'oversight.count.auditor_general_audits',
  'oversight.count.childrens_commissioner_reports',
  'oversight.count.recommendations',
  'oversight.count.recommendations_all_sources'
);

-- Commitments → federal Hansard + JusticeHub charter aggregation
UPDATE civic_intelligence_claims
SET source_doc_urls = jsonb_build_array(
  'https://www.aph.gov.au/Parliamentary_Business/Hansard',
  'https://justicehub.com.au/intelligence/civic'
)
WHERE claim_id = 'promises.count.commitments';
