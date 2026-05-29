-- Consent gating for ALMA evidence on PUBLIC Justice Matrix surfaces.
-- Policy (set 2026-05-29): 'Public Knowledge Commons' shown fully;
-- 'Community Controlled' shown as title + provenance only (findings/methodology/
-- source redacted, access on request); 'Strictly Private' and anything else
-- (incl. NULL) excluded entirely. Enforced in SQL so the public API can never
-- leak restricted content even if the app layer has a bug.

-- 1. Semantic search RPC — return type changes, so drop + recreate.
DROP FUNCTION IF EXISTS public.justice_matrix_search_evidence(vector, integer, double precision);

CREATE FUNCTION public.justice_matrix_search_evidence(
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
  consent_level text,
  cultural_safety text,
  distance double precision
)
LANGUAGE sql
STABLE
AS $function$
  SELECT
    e.id,
    e.title,
    e.evidence_type,
    CASE WHEN e.consent_level = 'Community Controlled' THEN NULL ELSE e.findings END,
    CASE WHEN e.consent_level = 'Community Controlled' THEN NULL ELSE e.methodology END,
    e.organization,
    e.author,
    EXTRACT(YEAR FROM e.publication_date)::integer AS year,
    CASE WHEN e.consent_level = 'Community Controlled' THEN NULL
         ELSE COALESCE(e.source_url, e.source_document_url) END AS source_url,
    e.consent_level,
    e.cultural_safety,
    (e.embedding <=> query_embedding) AS distance
  FROM alma_evidence e
  WHERE e.embedding IS NOT NULL
    AND e.consent_level IN ('Public Knowledge Commons', 'Community Controlled')
    AND (e.embedding <=> query_embedding) < max_distance
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_limit;
$function$;

-- 2. Case-page related evidence — semantic, replaces the old ilike-on-categories
-- query. Mirrors justice_matrix_related_cases (embedding of the case drives it).
CREATE OR REPLACE FUNCTION public.justice_matrix_related_evidence_for_case(
  case_id uuid,
  match_limit integer DEFAULT 6,
  max_distance double precision DEFAULT 0.6
)
RETURNS TABLE(
  id uuid,
  title text,
  evidence_type text,
  findings text,
  organization text,
  author text,
  year integer,
  source_url text,
  consent_level text,
  cultural_safety text,
  distance double precision
)
LANGUAGE sql
STABLE
AS $function$
  WITH base AS (
    SELECT embedding FROM justice_matrix_cases WHERE id = case_id
  )
  SELECT
    e.id,
    e.title,
    e.evidence_type,
    CASE WHEN e.consent_level = 'Community Controlled' THEN NULL ELSE e.findings END,
    e.organization,
    e.author,
    EXTRACT(YEAR FROM e.publication_date)::integer AS year,
    CASE WHEN e.consent_level = 'Community Controlled' THEN NULL
         ELSE COALESCE(e.source_url, e.source_document_url) END AS source_url,
    e.consent_level,
    e.cultural_safety,
    (e.embedding <=> (SELECT embedding FROM base)) AS distance
  FROM alma_evidence e, base
  WHERE e.embedding IS NOT NULL
    AND base.embedding IS NOT NULL
    AND e.consent_level IN ('Public Knowledge Commons', 'Community Controlled')
    AND (e.embedding <=> base.embedding) < max_distance
  ORDER BY e.embedding <=> base.embedding
  LIMIT match_limit;
$function$;
