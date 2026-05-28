-- Reverse links for the evidence detail page: given an evidence row, find the
-- nearest Justice Matrix cases and campaigns by embedding. Cases/campaigns are
-- public (global litigation/advocacy) so no consent gate is needed on the
-- RESULT; the page-level consent check on the evidence row itself decides
-- whether the page renders at all (Strictly Private -> 404).
CREATE OR REPLACE FUNCTION public.justice_matrix_related_cases_for_evidence(
  evidence_id uuid,
  match_limit integer DEFAULT 6,
  max_distance double precision DEFAULT 0.6
)
RETURNS TABLE(
  id uuid,
  case_citation text,
  jurisdiction text,
  year integer,
  outcome character varying,
  precedent_strength character varying,
  distance double precision
)
LANGUAGE sql
STABLE
AS $function$
  WITH base AS (
    SELECT embedding FROM alma_evidence WHERE id = evidence_id
  )
  SELECT
    c.id,
    c.case_citation,
    c.jurisdiction,
    c.year,
    c.outcome,
    c.precedent_strength,
    (c.embedding <=> (SELECT embedding FROM base)) AS distance
  FROM justice_matrix_cases c, base
  WHERE c.embedding IS NOT NULL
    AND base.embedding IS NOT NULL
    AND (c.embedding <=> base.embedding) < max_distance
  ORDER BY c.embedding <=> base.embedding
  LIMIT match_limit;
$function$;

CREATE OR REPLACE FUNCTION public.justice_matrix_related_campaigns_for_evidence(
  evidence_id uuid,
  match_limit integer DEFAULT 6,
  max_distance double precision DEFAULT 0.6
)
RETURNS TABLE(
  id uuid,
  campaign_name text,
  country_region text,
  is_ongoing boolean,
  distance double precision
)
LANGUAGE sql
STABLE
AS $function$
  WITH base AS (
    SELECT embedding FROM alma_evidence WHERE id = evidence_id
  )
  SELECT
    m.id,
    m.campaign_name,
    m.country_region,
    m.is_ongoing,
    (m.embedding <=> (SELECT embedding FROM base)) AS distance
  FROM justice_matrix_campaigns m, base
  WHERE m.embedding IS NOT NULL
    AND base.embedding IS NOT NULL
    AND (m.embedding <=> base.embedding) < max_distance
  ORDER BY m.embedding <=> base.embedding
  LIMIT match_limit;
$function$;
