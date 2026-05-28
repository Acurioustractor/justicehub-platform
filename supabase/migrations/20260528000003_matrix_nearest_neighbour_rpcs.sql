-- Nearest-neighbour RPCs for semantic dedup in the Justice Matrix scanner.
-- The caller passes the candidate item's embedding; the function returns the
-- closest existing case or campaign, with cosine distance, or nothing if
-- nothing is under max_distance.
--
-- Originally applied 2026-05-28 via the Supabase MCP.

CREATE OR REPLACE FUNCTION justice_matrix_nearest_case(
  query_embedding vector(1536),
  max_distance float DEFAULT 0.20
)
RETURNS TABLE(id uuid, case_citation text, distance float)
LANGUAGE sql STABLE AS $$
  SELECT c.id, c.case_citation, (c.embedding <=> query_embedding) AS distance
  FROM justice_matrix_cases c
  WHERE c.embedding IS NOT NULL
    AND (c.embedding <=> query_embedding) < max_distance
  ORDER BY c.embedding <=> query_embedding
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION justice_matrix_nearest_campaign(
  query_embedding vector(1536),
  max_distance float DEFAULT 0.20
)
RETURNS TABLE(id uuid, campaign_name text, distance float)
LANGUAGE sql STABLE AS $$
  SELECT c.id, c.campaign_name, (c.embedding <=> query_embedding) AS distance
  FROM justice_matrix_campaigns c
  WHERE c.embedding IS NOT NULL
    AND (c.embedding <=> query_embedding) < max_distance
  ORDER BY c.embedding <=> query_embedding
  LIMIT 1;
$$;
