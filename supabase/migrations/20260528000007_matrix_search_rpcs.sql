-- Top-N semantic-search + related-by-id RPCs for the public Justice Matrix.
-- The single-result nearest-neighbour RPCs in 20260528000003 are kept for the
-- scanner's dedup path; these new RPCs serve the public explore UI and the
-- case/campaign detail "related" panels.

CREATE OR REPLACE FUNCTION justice_matrix_search_cases(
  query_embedding vector(1536),
  match_limit int DEFAULT 20,
  max_distance float DEFAULT 0.6
)
RETURNS TABLE(
  id uuid,
  case_citation text,
  jurisdiction text,
  year int,
  court text,
  strategic_issue text,
  key_holding text,
  region text,
  country_code varchar,
  categories text[],
  outcome varchar,
  precedent_strength varchar,
  case_type text,
  authoritative_link text,
  distance float
)
LANGUAGE sql STABLE AS $$
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
    (c.embedding <=> query_embedding) AS distance
  FROM justice_matrix_cases c
  WHERE c.embedding IS NOT NULL
    AND (c.embedding <=> query_embedding) < max_distance
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_limit;
$$;

CREATE OR REPLACE FUNCTION justice_matrix_search_campaigns(
  query_embedding vector(1536),
  match_limit int DEFAULT 20,
  max_distance float DEFAULT 0.6
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
  start_year int,
  end_year int,
  is_ongoing boolean,
  categories text[],
  country_code varchar,
  distance float
)
LANGUAGE sql STABLE AS $$
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
    (c.embedding <=> query_embedding) AS distance
  FROM justice_matrix_campaigns c
  WHERE c.embedding IS NOT NULL
    AND (c.embedding <=> query_embedding) < max_distance
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_limit;
$$;

-- Related-to-a-specific-case: returns other cases nearest to the given case_id.
-- Excludes the case itself. Used by the detail page's "Related cases" panel.
CREATE OR REPLACE FUNCTION justice_matrix_related_cases(
  case_id uuid,
  match_limit int DEFAULT 6
)
RETURNS TABLE(
  id uuid,
  case_citation text,
  jurisdiction text,
  year int,
  outcome varchar,
  precedent_strength varchar,
  distance float
)
LANGUAGE sql STABLE AS $$
  WITH base AS (
    SELECT embedding FROM justice_matrix_cases WHERE id = case_id
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
  WHERE c.id <> case_id
    AND c.embedding IS NOT NULL
    AND base.embedding IS NOT NULL
  ORDER BY c.embedding <=> base.embedding
  LIMIT match_limit;
$$;

-- Cross-table: campaigns nearest to a given case (and vice versa). Returns
-- the linked campaigns for a case detail page.
CREATE OR REPLACE FUNCTION justice_matrix_related_campaigns_for_case(
  case_id uuid,
  match_limit int DEFAULT 6
)
RETURNS TABLE(
  id uuid,
  campaign_name text,
  country_region text,
  is_ongoing boolean,
  categories text[],
  distance float
)
LANGUAGE sql STABLE AS $$
  WITH base AS (
    SELECT embedding FROM justice_matrix_cases WHERE id = case_id
  )
  SELECT
    c.id,
    c.campaign_name,
    c.country_region,
    c.is_ongoing,
    c.categories,
    (c.embedding <=> (SELECT embedding FROM base)) AS distance
  FROM justice_matrix_campaigns c, base
  WHERE c.embedding IS NOT NULL
    AND base.embedding IS NOT NULL
  ORDER BY c.embedding <=> base.embedding
  LIMIT match_limit;
$$;

CREATE OR REPLACE FUNCTION justice_matrix_related_cases_for_campaign(
  campaign_id uuid,
  match_limit int DEFAULT 6
)
RETURNS TABLE(
  id uuid,
  case_citation text,
  jurisdiction text,
  year int,
  outcome varchar,
  distance float
)
LANGUAGE sql STABLE AS $$
  WITH base AS (
    SELECT embedding FROM justice_matrix_campaigns WHERE id = campaign_id
  )
  SELECT
    c.id,
    c.case_citation,
    c.jurisdiction,
    c.year,
    c.outcome,
    (c.embedding <=> (SELECT embedding FROM base)) AS distance
  FROM justice_matrix_cases c, base
  WHERE c.embedding IS NOT NULL
    AND base.embedding IS NOT NULL
  ORDER BY c.embedding <=> base.embedding
  LIMIT match_limit;
$$;

CREATE OR REPLACE FUNCTION justice_matrix_related_campaigns(
  campaign_id uuid,
  match_limit int DEFAULT 6
)
RETURNS TABLE(
  id uuid,
  campaign_name text,
  country_region text,
  start_year int,
  is_ongoing boolean,
  distance float
)
LANGUAGE sql STABLE AS $$
  WITH base AS (
    SELECT embedding FROM justice_matrix_campaigns WHERE id = campaign_id
  )
  SELECT
    c.id,
    c.campaign_name,
    c.country_region,
    c.start_year,
    c.is_ongoing,
    (c.embedding <=> (SELECT embedding FROM base)) AS distance
  FROM justice_matrix_campaigns c, base
  WHERE c.id <> campaign_id
    AND c.embedding IS NOT NULL
    AND base.embedding IS NOT NULL
  ORDER BY c.embedding <=> base.embedding
  LIMIT match_limit;
$$;
