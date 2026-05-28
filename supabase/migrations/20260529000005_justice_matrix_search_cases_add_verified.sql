-- Add `verified` to the case search RPC so the explore UI can show a provenance
-- signal on semantic results too (keyword results already select it directly).
-- Return type changes, so drop + recreate.
DROP FUNCTION IF EXISTS public.justice_matrix_search_cases(vector, integer, double precision);

CREATE FUNCTION public.justice_matrix_search_cases(
  query_embedding vector,
  match_limit integer DEFAULT 20,
  max_distance double precision DEFAULT 0.6
)
RETURNS TABLE(
  id uuid,
  case_citation text,
  jurisdiction text,
  year integer,
  court text,
  strategic_issue text,
  key_holding text,
  region text,
  country_code character varying,
  categories text[],
  outcome character varying,
  precedent_strength character varying,
  case_type text,
  authoritative_link text,
  verified boolean,
  distance double precision
)
LANGUAGE sql
STABLE
AS $function$
  SELECT
    c.id,
    c.case_citation,
    c.jurisdiction,
    c.year,
    c.court,
    c.strategic_issue,
    c.key_holding,
    c.region,
    c.country_code,
    c.categories,
    c.outcome,
    c.precedent_strength,
    c.case_type,
    c.authoritative_link,
    c.verified,
    (c.embedding <=> query_embedding) AS distance
  FROM justice_matrix_cases c
  WHERE c.embedding IS NOT NULL
    AND (c.embedding <=> query_embedding) < max_distance
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_limit;
$function$;
