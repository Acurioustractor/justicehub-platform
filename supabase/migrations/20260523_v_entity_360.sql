-- Entity-360 view: every fact about an organisation, joined via ABN.
--
-- One row per active organizations row. LEFT JOINs all the entity-resolution
-- overlays we have so the civic page can show ACCO status, charity size, ATO
-- declared income, NDIS registration, civic Tier classification, full funding
-- journey (justice + foundation receipts and grants given) without writing
-- 8 separate queries.
--
-- ABN is the join key throughout. Some orgs share an ABN (~5,513 known dupes
-- as of 2026-05-23); the view doesn't dedupe — that's a separate fix.
--
-- Refresh strategy: VIEW (not materialised). Reads are sub-second on a single
-- org by id/slug. Aggregate scans over all 104K orgs take ~3-5 seconds.
-- Promote to materialised view if /intelligence/civic starts doing full-table
-- aggregates in user-facing requests.

CREATE OR REPLACE VIEW v_entity_360 AS
WITH funding_totals AS (
  SELECT alma_organization_id AS org_id, SUM(amount_dollars) AS total_justice_funding,
    COUNT(*) AS justice_funding_count
  FROM justice_funding WHERE alma_organization_id IS NOT NULL
  GROUP BY alma_organization_id
),
foundation_received AS (
  SELECT o.id AS org_id, SUM(fg.grant_amount) AS foundation_dollars_received,
    COUNT(*) AS foundation_grants_received
  FROM organizations o JOIN foundation_grantees fg ON fg.grantee_abn = o.abn
  WHERE o.abn IS NOT NULL
  GROUP BY o.id
),
foundation_given AS (
  SELECT o.id AS org_id, SUM(fg.grant_amount) AS foundation_dollars_given,
    COUNT(*) AS foundation_grants_given
  FROM organizations o JOIN foundation_grantees fg ON fg.foundation_abn = o.abn
  WHERE o.abn IS NOT NULL
  GROUP BY o.id
),
classifications AS (
  SELECT organization_id AS org_id,
    BOOL_OR(tier = 1 AND confirmed_at IS NOT NULL) AS is_confirmed_tier1,
    MAX(CASE WHEN confirmed_at IS NOT NULL THEN tier END) AS confirmed_tier,
    MAX(sector_category) FILTER (WHERE confirmed_at IS NOT NULL) AS confirmed_sector
  FROM civic_org_classifications
  GROUP BY organization_id
),
ato_latest AS (
  SELECT DISTINCT ON (abn) abn, total_income, taxable_income, report_year
  FROM ato_tax_transparency
  ORDER BY abn, report_year DESC NULLS LAST
)
SELECT
  o.id AS organization_id, o.abn, o.name, o.slug, o.state, o.city, o.type, o.is_active,
  o.acco_certified, o.is_indigenous_org, o.profile_completeness_score,
  ac.charity_size, ac.pbi, ac.hpc, ac.is_foundation AS acnc_is_foundation,
  ac.ben_aboriginal_tsi, ac.ben_youth,
  ac.charity_size IS NOT NULL AS is_acnc_charity,
  oc.icn AS oric_icn, oc.status AS oric_status, oc.corporation_size AS oric_corp_size,
  oc.abn IS NOT NULL AS in_oric_register,
  ato.total_income AS ato_total_income, ato.taxable_income AS ato_taxable_income,
  ato.report_year AS ato_report_year,
  ndis.registration_status AS ndis_status,
  cls.is_confirmed_tier1, cls.confirmed_tier, cls.confirmed_sector,
  COALESCE(ft.total_justice_funding, 0) AS total_justice_funding_received,
  COALESCE(ft.justice_funding_count, 0) AS justice_funding_records,
  COALESCE(fr.foundation_dollars_received, 0) AS foundation_dollars_received,
  COALESCE(fr.foundation_grants_received, 0) AS foundation_grants_received,
  COALESCE(fg.foundation_dollars_given, 0) AS foundation_dollars_given,
  COALESCE(fg.foundation_grants_given, 0) AS foundation_grants_given
FROM organizations o
LEFT JOIN acnc_charities ac ON ac.abn = o.abn AND o.abn IS NOT NULL
LEFT JOIN oric_corporations oc ON oc.abn = o.abn AND o.abn IS NOT NULL
LEFT JOIN ato_latest ato ON ato.abn = o.abn AND o.abn IS NOT NULL
LEFT JOIN ndis_registered_providers ndis ON ndis.abn = o.abn AND o.abn IS NOT NULL
LEFT JOIN classifications cls ON cls.org_id = o.id
LEFT JOIN funding_totals ft ON ft.org_id = o.id
LEFT JOIN foundation_received fr ON fr.org_id = o.id
LEFT JOIN foundation_given fg ON fg.org_id = o.id
WHERE o.archived <> true;

COMMENT ON VIEW v_entity_360 IS
  'Entity-360: every fact about an org joined via ABN. One row per active org. Powers /sites/[slug] cross-source enrichment.';
