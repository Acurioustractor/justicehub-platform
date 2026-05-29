-- Programs view for the Programs tab. Joins to canonical org info via gs_entities.

CREATE OR REPLACE FUNCTION get_yj_programs_for_browser()
RETURNS TABLE (
  program_id uuid,
  name text,
  type text,
  description text,
  evidence_level text,
  target_cohort text[],
  geography text[],
  years_operating integer,
  cultural_authority text,
  portfolio_score numeric,
  org_id uuid,
  org_name text,
  org_state text,
  org_postcode text,
  org_locality text,
  org_lga text,
  org_remoteness text,
  org_community_controlled boolean,
  org_charity_size text
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    i.id AS program_id,
    i.name,
    i.type,
    i.description,
    i.evidence_level,
    i.target_cohort,
    i.geography,
    i.years_operating,
    i.cultural_authority,
    i.portfolio_score,
    o.id AS org_id,
    coalesce(e.canonical_name, o.name)::text AS org_name,
    e.state AS org_state,
    e.postcode AS org_postcode,
    pg.locality AS org_locality,
    coalesce(e.lga_name, pg.lga_name)::text AS org_lga,
    coalesce(e.remoteness, pg.remoteness_2021)::text AS org_remoteness,
    coalesce(e.is_community_controlled, false) AS org_community_controlled,
    a.charity_size AS org_charity_size
  FROM alma_interventions i
  LEFT JOIN organizations o ON o.id = i.operating_organization_id
  LEFT JOIN gs_entities e ON e.id = o.gs_entity_id
  LEFT JOIN acnc_charities a ON a.abn = e.abn
  LEFT JOIN LATERAL (
    SELECT * FROM postcode_geo pg2
    WHERE pg2.postcode = e.postcode AND pg2.latitude IS NOT NULL LIMIT 1
  ) pg ON true
  WHERE i.verification_status != 'ai_generated';
$$;

GRANT EXECUTE ON FUNCTION get_yj_programs_for_browser() TO anon, authenticated, service_role;
