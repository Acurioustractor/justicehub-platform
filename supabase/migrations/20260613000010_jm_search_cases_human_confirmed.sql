-- Phase 0 trust integrity (review roadmap 2026-06-13).
-- Return human_confirmed from the case semantic-search RPC so /ask can:
--   (1) down-rank unreviewed, machine-extracted cases below reviewed ones, and
--   (2) grade answer confidence honestly (no "strong" with zero human-confirmed cases).
-- Behaviour is otherwise IDENTICAL to the prior definition: one column added to
-- RETURNS TABLE and SELECT, same WHERE, same ORDER BY, same LANGUAGE sql STABLE.
--
-- Note: justice_matrix_cases uses `verified` + `human_confirmed` booleans, NOT a
-- `verification_status` column (that pattern lives only on the alma_* tables).
-- Adding a column to RETURNS TABLE changes the function signature, so this is a
-- DROP + CREATE, not CREATE OR REPLACE.

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
  human_confirmed boolean,
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
    c.human_confirmed,
    (c.embedding <=> query_embedding) AS distance
  FROM justice_matrix_cases c
  WHERE c.embedding IS NOT NULL
    AND (c.embedding <=> query_embedding) < max_distance
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_limit;
$function$;

-- Restore execute grants (DROP removes them).
GRANT EXECUTE ON FUNCTION public.justice_matrix_search_cases(vector, integer, double precision)
  TO anon, authenticated, service_role;
