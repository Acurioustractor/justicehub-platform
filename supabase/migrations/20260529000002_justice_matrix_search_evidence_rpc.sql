-- Semantic search RPC over alma_evidence, mirroring justice_matrix_search_cases
-- /_campaigns so the search route can interleave evidence as a distinct third
-- kind. Same model space (text-embedding-3-small, cosine) as cases/campaigns so
-- distances are comparable. Evidence is Australia-only; the route stamps AU.
--
-- NOTE: superseded by 20260529000003 (consent gate adds redaction + filtering).
-- Kept for accurate migration history; the later migration drops + recreates it.
CREATE OR REPLACE FUNCTION public.justice_matrix_search_evidence(
  query_embedding vector,
  match_limit integer DEFAULT 20,
  max_distance double precision DEFAULT 0.6
)
RETURNS TABLE(
  id uuid,
  title text,
  evidence_type text,
  findings text,
  methodology text,
  organization text,
  author text,
  year integer,
  source_url text,
  distance double precision
)
LANGUAGE sql
STABLE
AS $function$
  SELECT
    e.id,
    e.title,
    e.evidence_type,
    e.findings,
    e.methodology,
    e.organization,
    e.author,
    EXTRACT(YEAR FROM e.publication_date)::integer AS year,
    COALESCE(e.source_url, e.source_document_url) AS source_url,
    (e.embedding <=> query_embedding) AS distance
  FROM alma_evidence e
  WHERE e.embedding IS NOT NULL
    AND (e.embedding <=> query_embedding) < max_distance
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_limit;
$function$;
