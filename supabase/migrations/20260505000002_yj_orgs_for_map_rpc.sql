-- Map-grade YJ org data, joined across the canonical chain:
--   alma_interventions → organizations → gs_entities → postcode_geo
-- One row per delivery org. Unmappable orgs returned with NULL coords + reason.

CREATE OR REPLACE FUNCTION get_yj_orgs_for_map()
RETURNS TABLE (
  org_id uuid,
  name text,
  abn text,
  state text,
  postcode text,
  locality text,
  lga_name text,
  remoteness text,
  sector text,
  community_controlled boolean,
  cc_tier text,
  program_count integer,
  lat numeric,
  lng numeric,
  unmappable_reason text
)
LANGUAGE sql
STABLE
AS $$
  WITH yj_orgs AS (
    SELECT
      o.id AS org_id,
      o.name AS jh_name,
      o.gs_entity_id,
      count(i.id)::int AS program_count
    FROM organizations o
    JOIN alma_interventions i ON i.operating_organization_id = o.id
    WHERE i.verification_status != 'ai_generated'
    GROUP BY o.id, o.name, o.gs_entity_id
  ),
  with_gs AS (
    SELECT
      y.*,
      e.canonical_name,
      e.abn,
      e.state,
      e.postcode,
      e.lga_name AS gs_lga,
      e.remoteness AS gs_remoteness,
      e.sector,
      e.is_community_controlled,
      e.community_controlled_tier
    FROM yj_orgs y
    LEFT JOIN gs_entities e ON e.id = y.gs_entity_id
  ),
  with_geo AS (
    SELECT DISTINCT ON (w.org_id)
      w.*,
      pg.latitude,
      pg.longitude,
      pg.locality,
      pg.lga_name AS pg_lga,
      pg.remoteness_2021 AS pg_remoteness
    FROM with_gs w
    LEFT JOIN postcode_geo pg
      ON pg.postcode = w.postcode AND pg.latitude IS NOT NULL
    ORDER BY w.org_id, pg.locality
  )
  SELECT
    org_id,
    coalesce(canonical_name, jh_name)::text AS name,
    abn,
    state,
    postcode,
    locality,
    coalesce(gs_lga, pg_lga)::text AS lga_name,
    coalesce(gs_remoteness, pg_remoteness)::text AS remoteness,
    sector,
    coalesce(is_community_controlled, false) AS community_controlled,
    community_controlled_tier AS cc_tier,
    program_count,
    latitude AS lat,
    longitude AS lng,
    CASE
      WHEN gs_entity_id IS NULL THEN 'no_gs_entity_link'
      WHEN postcode IS NULL THEN 'no_postcode_in_gs_entity'
      WHEN latitude IS NULL THEN 'postcode_not_geocoded'
      ELSE NULL
    END AS unmappable_reason
  FROM with_geo
  ORDER BY program_count DESC;
$$;

GRANT EXECUTE ON FUNCTION get_yj_orgs_for_map() TO anon, authenticated, service_role;
