-- Canonical read model for community programs.
-- Backed by registered_services with optional organization + ALMA enrichment.

DROP VIEW IF EXISTS public.programs_catalog_v;

CREATE VIEW public.programs_catalog_v AS
SELECT
  rs.id,
  rs.name,
  COALESCE(NULLIF(rs.description, ''), ai.description) AS description,
  rs.organization_id,
  COALESCE(org.name, NULLIF(rs.organization, ''), ai.operating_organization) AS organization_name,
  COALESCE(NULLIF(rs.state, ''), org.state, ai.geography[1]) AS state,
  COALESCE(NULLIF(rs.location, ''), org.location) AS location,
  COALESCE(NULLIF(rs.approach, ''), ai.type) AS approach,
  COALESCE(NULLIF(rs.impact_summary, ''), ai.description) AS impact_summary,
  COALESCE(rs.tags, ai.target_cohort) AS tags,
  COALESCE(rs.latitude, ai.latitude) AS latitude,
  COALESCE(rs.longitude, ai.longitude) AS longitude,
  COALESCE(rs.alma_intervention_id, ai.id) AS alma_intervention_id,
  COALESCE(rs.linked_service_id, ai.linked_service_id) AS linked_service_id,
  COALESCE(rs.is_featured, false) AS is_featured,
  rs.created_at,
  rs.updated_at
FROM public.registered_services rs
LEFT JOIN public.organizations org
  ON org.id = rs.organization_id
LEFT JOIN LATERAL (
  SELECT ai_pick.*
  FROM public.alma_interventions ai_pick
  WHERE ai_pick.id = rs.alma_intervention_id
     OR ai_pick.linked_community_program_id = rs.id
  ORDER BY
    CASE WHEN ai_pick.id = rs.alma_intervention_id THEN 0 ELSE 1 END,
    ai_pick.created_at DESC NULLS LAST
  LIMIT 1
) ai ON true;

COMMENT ON VIEW public.programs_catalog_v IS
  'Canonical read model for community programs used by frontend and API adapters.';

GRANT SELECT ON public.programs_catalog_v TO anon, authenticated, service_role;
