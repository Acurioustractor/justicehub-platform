-- Phase 1: single hybrid retrieval path (world-class roadmap 2026-06-13).
--
-- Today /search runs keyword OR semantic, never both, and the semantic path
-- applies facets in-memory AFTER the top-N is chosen, which can silently drop
-- every hit (search/route.ts:194-195). This migration introduces two
-- LANGUAGE plpgsql functions that fuse a full-text (ts_rank_cd) path and a
-- pgvector cosine path with Reciprocal Rank Fusion (1 / (60 + rank)) and push
-- every facet down into BOTH legs BEFORE the candidate cut, so a facet can no
-- longer empty a semantically-strong result set.
--
-- Why plpgsql (not sql): only a plpgsql body can `SET LOCAL hnsw.ef_search`,
-- which widens the HNSW search beam for the run so high-recall fusion is honest.
--
-- Indexes already present (verified live 2026-06-13):
--   idx_cases_fts / idx_campaigns_fts        GIN to_tsvector('english', ...)
--   idx_cases_embedding_hnsw / _campaigns_   HNSW vector_cosine_ops
-- The to_tsvector expression below MUST match the GIN index expression verbatim
-- or Postgres will not use the index.
--
-- Return contract (consumed by src/app/api/justice-matrix/search/route.ts):
--   * Every column the prior semantic RPC returned, UNCHANGED, plus
--   * distance     cosine distance from the vector leg; NULL for a keyword-only
--                  hit (no vector neighbour in the candidate pool). /ask fuses on
--                  this, so its confidence thresholds stay calibrated — keyword
--                  rescues backfill rather than perturb bestDistance.
--   * rrf_score    the fused score; rows come back ordered by it DESC. /search
--                  preserves this order as the result ranking.
--
-- Provenance (verified / human_confirmed) is returned for cases so the caller
-- keeps the Phase 0 trust ranking. NOTE: justice_matrix_cases uses the
-- `verified` + `human_confirmed` booleans, never a verification_status column.

-- Candidate pool per leg before fusion. Generous vs. the default match_limit so
-- a hit ranked, say, 40th by vector but 2nd by keyword still survives to fuse.
-- Kept inline as literals (no GUC) to keep the function self-contained.

DROP FUNCTION IF EXISTS public.justice_matrix_hybrid_cases(text, vector, integer, text[], text, text, text, text, text);

CREATE FUNCTION public.justice_matrix_hybrid_cases(
  query_text       text,
  query_embedding  vector DEFAULT NULL,
  match_limit      integer DEFAULT 20,
  p_cats           text[] DEFAULT NULL,
  p_outcome        text DEFAULT NULL,
  p_strength       text DEFAULT NULL,
  p_region         text DEFAULT NULL,
  p_country        text DEFAULT NULL,
  p_scope          text DEFAULT 'all'
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
  distance double precision,
  rrf_score double precision
)
LANGUAGE plpgsql
STABLE
-- Function-scoped GUC: widens the HNSW beam for the call and is auto-restored on
-- exit. Used as a CREATE attribute (not `SET LOCAL` in the body) because a STABLE
-- function may not run SET in its body ("SET is not allowed in a non-volatile function").
SET hnsw.ef_search = 100
AS $function$
DECLARE
  ts_q tsquery;
BEGIN
  -- websearch_to_tsquery tolerates raw user text (quotes, OR, -term) and never
  -- raises on punctuation, unlike plainto/to_tsquery. Empty text -> empty query
  -- -> the keyword leg simply contributes nothing (vector leg still runs).
  ts_q := websearch_to_tsquery('english', coalesce(query_text, ''));

  RETURN QUERY
  WITH facet AS (
    -- Single source of truth for the facet predicate, shared by both legs so a
    -- filter applies BEFORE each leg's candidate cut (no silent post-hoc drop).
    SELECT c.id AS cid
    FROM justice_matrix_cases c
    WHERE (p_cats IS NULL OR c.categories && p_cats)
      AND (p_outcome IS NULL OR c.outcome = p_outcome)
      AND (p_strength IS NULL OR c.precedent_strength = p_strength)
      AND (p_region IS NULL OR c.region ILIKE '%' || p_region || '%')
      AND (p_country IS NULL OR c.country_code = p_country)
      AND (
        p_scope = 'all'
        OR (p_scope = 'au' AND c.jurisdiction ILIKE '%australia%')
        OR (p_scope = 'global' AND (c.jurisdiction IS NULL OR c.jurisdiction NOT ILIKE '%australia%'))
      )
  ),
  kw AS (
    SELECT
      c.id AS cid,
      row_number() OVER (
        ORDER BY ts_rank_cd(
          to_tsvector('english',
            coalesce(c.case_citation, '') || ' ' ||
            coalesce(c.strategic_issue, '') || ' ' ||
            coalesce(c.key_holding, '')),
          ts_q) DESC
      ) AS kw_rank
    FROM justice_matrix_cases c
    JOIN facet f ON f.cid = c.id
    WHERE ts_q IS NOT NULL
      AND ts_q <> ''::tsquery
      AND to_tsvector('english',
            coalesce(c.case_citation, '') || ' ' ||
            coalesce(c.strategic_issue, '') || ' ' ||
            coalesce(c.key_holding, '')) @@ ts_q
    LIMIT 60
  ),
  vec AS (
    SELECT
      c.id AS cid,
      (c.embedding <=> query_embedding) AS dist,
      row_number() OVER (ORDER BY c.embedding <=> query_embedding) AS vec_rank
    FROM justice_matrix_cases c
    JOIN facet f ON f.cid = c.id
    WHERE query_embedding IS NOT NULL
      AND c.embedding IS NOT NULL
    ORDER BY c.embedding <=> query_embedding
    LIMIT 60
  ),
  fused AS (
    SELECT
      coalesce(kw.cid, vec.cid) AS cid,
      vec.dist AS dist,
      (coalesce(1.0 / (60 + kw.kw_rank), 0.0)
        + coalesce(1.0 / (60 + vec.vec_rank), 0.0))::double precision AS score
    FROM kw
    FULL OUTER JOIN vec ON kw.cid = vec.cid
  )
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
    fused.dist AS distance,
    fused.score AS rrf_score
  FROM fused
  JOIN justice_matrix_cases c ON c.id = fused.cid
  ORDER BY fused.score DESC, fused.dist ASC NULLS LAST
  LIMIT match_limit;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.justice_matrix_hybrid_cases(text, vector, integer, text[], text, text, text, text, text)
  TO anon, authenticated, service_role;


DROP FUNCTION IF EXISTS public.justice_matrix_hybrid_campaigns(text, vector, integer, text[], text, text, text);

CREATE FUNCTION public.justice_matrix_hybrid_campaigns(
  query_text       text,
  query_embedding  vector DEFAULT NULL,
  match_limit      integer DEFAULT 20,
  p_cats           text[] DEFAULT NULL,
  p_region         text DEFAULT NULL,
  p_country        text DEFAULT NULL,
  p_scope          text DEFAULT 'all'
)
RETURNS TABLE(
  id uuid,
  campaign_name text,
  country_region text,
  lead_organizations text,
  goals text,
  notable_tactics text,
  outcome_status text,
  campaign_link text,
  start_year integer,
  end_year integer,
  is_ongoing boolean,
  categories text[],
  country_code character varying,
  distance double precision,
  rrf_score double precision
)
LANGUAGE plpgsql
-- VOLATILE (the default) so the body can `SET LOCAL hnsw.ef_search`. A STABLE
-- body may not run SET ("SET is not allowed in a non-volatile function"), and
-- the function-level SET clause is permission-denied for the migration role on
-- this extension GUC. SET LOCAL is a USERSET op (verified runnable here) scoped
-- to the call's transaction. The function is read-only in practice; VOLATILE
-- only forgoes planner caching, which is irrelevant for a once-per-request RPC.
AS $function$
DECLARE
  ts_q tsquery;
BEGIN
  -- Widen the HNSW beam for this call so high-recall fusion is honest.
  SET LOCAL hnsw.ef_search = 100;
  ts_q := websearch_to_tsquery('english', coalesce(query_text, ''));

  RETURN QUERY
  WITH facet AS (
    SELECT c.id AS cid
    FROM justice_matrix_campaigns c
    WHERE (p_cats IS NULL OR c.categories && p_cats)
      AND (p_region IS NULL OR c.country_region ILIKE '%' || p_region || '%')
      AND (p_country IS NULL OR c.country_code = p_country)
      AND (
        p_scope = 'all'
        OR (p_scope = 'au' AND c.country_region ILIKE '%australia%')
        OR (p_scope = 'global' AND (c.country_region IS NULL OR c.country_region NOT ILIKE '%australia%'))
      )
  ),
  kw AS (
    SELECT
      c.id AS cid,
      row_number() OVER (
        ORDER BY ts_rank_cd(
          to_tsvector('english',
            coalesce(c.campaign_name, '') || ' ' ||
            coalesce(c.goals, '') || ' ' ||
            coalesce(c.notable_tactics, '')),
          ts_q) DESC
      ) AS kw_rank
    FROM justice_matrix_campaigns c
    JOIN facet f ON f.cid = c.id
    WHERE ts_q IS NOT NULL
      AND ts_q <> ''::tsquery
      AND to_tsvector('english',
            coalesce(c.campaign_name, '') || ' ' ||
            coalesce(c.goals, '') || ' ' ||
            coalesce(c.notable_tactics, '')) @@ ts_q
    LIMIT 60
  ),
  vec AS (
    SELECT
      c.id AS cid,
      (c.embedding <=> query_embedding) AS dist,
      row_number() OVER (ORDER BY c.embedding <=> query_embedding) AS vec_rank
    FROM justice_matrix_campaigns c
    JOIN facet f ON f.cid = c.id
    WHERE query_embedding IS NOT NULL
      AND c.embedding IS NOT NULL
    ORDER BY c.embedding <=> query_embedding
    LIMIT 60
  ),
  fused AS (
    SELECT
      coalesce(kw.cid, vec.cid) AS cid,
      vec.dist AS dist,
      (coalesce(1.0 / (60 + kw.kw_rank), 0.0)
        + coalesce(1.0 / (60 + vec.vec_rank), 0.0))::double precision AS score
    FROM kw
    FULL OUTER JOIN vec ON kw.cid = vec.cid
  )
  SELECT
    c.id,
    c.campaign_name,
    c.country_region,
    c.lead_organizations,
    c.goals,
    c.notable_tactics,
    c.outcome_status,
    c.campaign_link,
    c.start_year,
    c.end_year,
    c.is_ongoing,
    c.categories,
    c.country_code,
    fused.dist AS distance,
    fused.score AS rrf_score
  FROM fused
  JOIN justice_matrix_campaigns c ON c.id = fused.cid
  ORDER BY fused.score DESC, fused.dist ASC NULLS LAST
  LIMIT match_limit;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.justice_matrix_hybrid_campaigns(text, vector, integer, text[], text, text, text)
  TO anon, authenticated, service_role;
