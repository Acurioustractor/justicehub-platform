-- Dedupe org-browser at gs_entity_id level. When multiple JH organizations rows
-- point at the same gs_entity, collapse them into ONE row. Sum programs across
-- the group. Sum funding distinctly to avoid double-counting where two orgs
-- share an ABN.

CREATE OR REPLACE FUNCTION get_yj_orgs_for_browser()
RETURNS TABLE (
  org_id uuid,                       -- representative org_id (highest program-count among the group)
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
  org_row_count integer,             -- # JH org rows that collapse into this group (1 = unique)
  lat numeric,
  lng numeric,
  tier text,
  unmappable_reason text
)
LANGUAGE sql
STABLE
AS $$
  WITH yj_orgs AS (
    -- One row per JH org that delivers a YJ program. Group key prefers gs_entity_id; falls back to org_id.
    SELECT DISTINCT
      o.id AS jh_org_id,
      o.gs_entity_id,
      coalesce(o.gs_entity_id::text, o.id::text) AS group_key,
      o.name AS jh_name,
      o.slug
    FROM organizations o
    WHERE EXISTS (
      SELECT 1 FROM alma_interventions i
      WHERE i.operating_organization_id = o.id
        AND i.verification_status != 'ai_generated'
    )
  ),
  program_per_org AS (
    SELECT i.operating_organization_id AS jh_org_id,
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
  -- For each grouping key (gs_entity or fallback org_id), pick the representative jh_org_id
  -- as the one with the highest program count (stable, deterministic).
  rep_org AS (
    SELECT DISTINCT ON (y.group_key)
      y.group_key,
      y.jh_org_id AS rep_jh_org_id,
      y.gs_entity_id,
      y.jh_name AS rep_name,
      y.slug AS rep_slug
    FROM yj_orgs y
    LEFT JOIN program_per_org p ON p.jh_org_id = y.jh_org_id
    ORDER BY y.group_key, coalesce(p.program_count, 0) DESC, y.jh_org_id
  ),
  group_program_rollup AS (
    SELECT y.group_key,
           sum(coalesce(p.program_count, 0))::int AS program_count,
           sum(coalesce(p.strong_evidence_count, 0))::int AS strong_evidence_count,
           count(DISTINCT y.jh_org_id)::int AS org_row_count
    FROM yj_orgs y
    LEFT JOIN program_per_org p ON p.jh_org_id = y.jh_org_id
    GROUP BY y.group_key
  ),
  -- Funding: aggregate distinct funding records per group (avoid double-counting via ABN).
  group_funding AS (
    SELECT y.group_key,
           coalesce(sum(f.amount_dollars), 0) AS funding_total,
           count(DISTINCT f.id)::int AS funding_records
    FROM yj_orgs y
    JOIN organizations o ON o.id = y.jh_org_id
    LEFT JOIN justice_funding f
      ON (f.alma_organization_id = y.jh_org_id
          OR (o.abn IS NOT NULL AND f.recipient_abn = o.abn))
    GROUP BY y.group_key
  ),
  joined AS (
    SELECT
      r.rep_jh_org_id AS org_id,
      coalesce(e.canonical_name, r.rep_name)::text AS name,
      r.rep_slug AS slug,
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
      gp.program_count,
      gp.strong_evidence_count,
      gp.org_row_count,
      gf.funding_total,
      gf.funding_records,
      pg.latitude AS lat,
      pg.longitude AS lng,
      r.gs_entity_id,
      e.postcode IS NOT NULL AS gs_has_postcode,
      pg.latitude IS NOT NULL AS pg_has_coords
    FROM rep_org r
    LEFT JOIN gs_entities e ON e.id = r.gs_entity_id
    LEFT JOIN acnc_charities a ON a.abn = e.abn
    LEFT JOIN group_program_rollup gp ON gp.group_key = r.group_key
    LEFT JOIN group_funding gf ON gf.group_key = r.group_key
    LEFT JOIN LATERAL (
      SELECT * FROM postcode_geo pg2
      WHERE pg2.postcode = e.postcode AND pg2.latitude IS NOT NULL
      LIMIT 1
    ) pg ON true
  )
  SELECT
    org_id, name, slug, abn, state, postcode, locality, lga_name, remoteness, sector,
    community_controlled, cc_tier, supply_nation_certified, charity_size, acnc_registered,
    acnc_registration_date, ben_aboriginal_tsi, ben_youth, is_oric_corporation,
    program_count, strong_evidence_count, funding_total, funding_records, org_row_count,
    lat, lng,
    CASE
      WHEN program_count >= 5 AND funding_total >= 1000000 THEN 'heavy_lifter'
      WHEN program_count >= 3 OR funding_total >= 500000 OR (community_controlled AND acnc_registered) THEN 'established'
      WHEN program_count >= 1 AND (acnc_registered OR community_controlled) THEN 'verified'
      ELSE 'emerging'
    END AS tier,
    CASE
      WHEN gs_entity_id IS NULL THEN 'no_gs_entity_link'
      WHEN NOT gs_has_postcode THEN 'no_postcode_in_gs_entity'
      WHEN NOT pg_has_coords THEN 'postcode_not_geocoded'
      ELSE NULL
    END AS unmappable_reason
  FROM joined;
$$;

GRANT EXECUTE ON FUNCTION get_yj_orgs_for_browser() TO anon, authenticated, service_role;
