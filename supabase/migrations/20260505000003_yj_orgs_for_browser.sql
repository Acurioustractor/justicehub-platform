-- Org-centric browser RPC: rolls up programs + funding + ACNC per org and
-- classifies into a tier (heavy_lifter / established / verified / emerging).
--
-- This is the canonical query for the new /intelligence/interventions page.
-- Replaces the per-program list with org-first thinking, the way Grantscope
-- (CivicScope) already presents the data on its side.

CREATE OR REPLACE FUNCTION get_yj_orgs_for_browser()
RETURNS TABLE (
  org_id uuid,
  name text,
  slug text,
  abn text,
  state text,
  postcode text,
  locality text,
  lga_name text,
  remoteness text,
  sector text,
  community_controlled boolean,
  cc_tier text,
  supply_nation_certified boolean,
  charity_size text,
  acnc_registered boolean,
  acnc_registration_date date,
  ben_aboriginal_tsi boolean,
  ben_youth boolean,
  is_oric_corporation boolean,
  program_count integer,
  strong_evidence_count integer,
  funding_total numeric,
  funding_records integer,
  lat numeric,
  lng numeric,
  tier text,
  unmappable_reason text
)
LANGUAGE sql
STABLE
AS $$
  WITH yj_orgs AS (
    SELECT
      o.id AS org_id,
      o.name AS jh_name,
      o.slug,
      o.gs_entity_id
    FROM organizations o
    WHERE EXISTS (
      SELECT 1 FROM alma_interventions i
      WHERE i.operating_organization_id = o.id
        AND i.verification_status != 'ai_generated'
    )
  ),
  program_rollup AS (
    SELECT
      i.operating_organization_id AS org_id,
      count(*)::int AS program_count,
      count(*) FILTER (WHERE i.evidence_level IN (
        'Proven (RCT/quasi-experimental, replicated)',
        'Effective (strong evaluation, positive outcomes)',
        'Indigenous-led (culturally grounded, community authority)'
      ))::int AS strong_evidence_count
    FROM alma_interventions i
    WHERE i.verification_status != 'ai_generated' AND i.operating_organization_id IS NOT NULL
    GROUP BY i.operating_organization_id
  ),
  funding_rollup AS (
    -- Aggregate justice_funding records by alma_organization_id (preferred)
    -- + by recipient_abn (fallback when alma_organization_id is null but ABN matches).
    SELECT
      o.id AS org_id,
      coalesce(sum(f.amount_dollars), 0) AS funding_total,
      count(f.id)::int AS funding_records
    FROM organizations o
    LEFT JOIN justice_funding f
      ON (f.alma_organization_id = o.id
          OR (o.abn IS NOT NULL AND f.recipient_abn = o.abn))
    WHERE o.id IN (SELECT org_id FROM yj_orgs)
    GROUP BY o.id
  ),
  joined AS (
    SELECT
      y.org_id,
      coalesce(e.canonical_name, y.jh_name)::text AS name,
      y.slug,
      e.abn,
      e.state,
      e.postcode,
      pg.locality,
      coalesce(e.lga_name, pg.lga_name)::text AS lga_name,
      coalesce(e.remoteness, pg.remoteness_2021)::text AS remoteness,
      e.sector,
      coalesce(e.is_community_controlled, false) AS community_controlled,
      e.community_controlled_tier AS cc_tier,
      coalesce(e.is_supply_nation_certified, false) AS supply_nation_certified,
      a.charity_size,
      (a.abn IS NOT NULL) AS acnc_registered,
      a.registration_date AS acnc_registration_date,
      coalesce(a.ben_aboriginal_tsi, false) AS ben_aboriginal_tsi,
      coalesce(a.ben_youth, false) AS ben_youth,
      coalesce(a.is_oric_corporation, false) AS is_oric_corporation,
      coalesce(p.program_count, 0) AS program_count,
      coalesce(p.strong_evidence_count, 0) AS strong_evidence_count,
      coalesce(f.funding_total, 0) AS funding_total,
      coalesce(f.funding_records, 0) AS funding_records,
      pg.latitude AS lat,
      pg.longitude AS lng,
      CASE
        WHEN y.gs_entity_id IS NULL THEN 'no_gs_entity_link'
        WHEN e.postcode IS NULL THEN 'no_postcode_in_gs_entity'
        WHEN pg.latitude IS NULL THEN 'postcode_not_geocoded'
        ELSE NULL
      END AS unmappable_reason
    FROM yj_orgs y
    LEFT JOIN gs_entities e ON e.id = y.gs_entity_id
    LEFT JOIN acnc_charities a ON a.abn = e.abn
    LEFT JOIN program_rollup p ON p.org_id = y.org_id
    LEFT JOIN funding_rollup f ON f.org_id = y.org_id
    LEFT JOIN LATERAL (
      SELECT * FROM postcode_geo pg
      WHERE pg.postcode = e.postcode AND pg.latitude IS NOT NULL
      LIMIT 1
    ) pg ON true
  )
  SELECT
    org_id,
    name,
    slug,
    abn,
    state,
    postcode,
    locality,
    lga_name,
    remoteness,
    sector,
    community_controlled,
    cc_tier,
    supply_nation_certified,
    charity_size,
    acnc_registered,
    acnc_registration_date,
    ben_aboriginal_tsi,
    ben_youth,
    is_oric_corporation,
    program_count,
    strong_evidence_count,
    funding_total,
    funding_records,
    lat,
    lng,
    CASE
      WHEN program_count >= 5 AND funding_total >= 1000000 THEN 'heavy_lifter'
      WHEN program_count >= 3 OR funding_total >= 500000 OR (community_controlled AND acnc_registered) THEN 'established'
      WHEN program_count >= 1 AND (acnc_registered OR community_controlled) THEN 'verified'
      ELSE 'emerging'
    END AS tier,
    unmappable_reason
  FROM joined;
$$;

GRANT EXECUTE ON FUNCTION get_yj_orgs_for_browser() TO anon, authenticated, service_role;
