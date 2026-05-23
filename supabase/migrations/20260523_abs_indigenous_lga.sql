-- ABS Indigenous population by LGA — SDMX-JSON ingestion target.
-- See docs/civic-connectors/build-specs.md §6.B and
-- scripts/civic/ingest-abs-indigenous-lga.mjs.
--
-- Raw-first pattern: every SDMX-JSON response is dumped into
-- abs_raw_responses BEFORE transformation, so we can refine extraction
-- later without re-hitting the ABS DataAPI. The transformed tidy rows
-- live in abs_indigenous_population_by_lga.

CREATE TABLE IF NOT EXISTS abs_raw_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataflow_id text NOT NULL,
  query_key text NOT NULL,
  query_url text,
  response_jsonb jsonb,
  fetched_at timestamptz DEFAULT now(),
  UNIQUE (dataflow_id, query_key)
);

CREATE TABLE IF NOT EXISTS abs_indigenous_population_by_lga (
  id bigserial PRIMARY KEY,
  lga_code text NOT NULL,
  lga_name text,
  state text,
  reference_year int NOT NULL,
  source text NOT NULL,
  age_group text DEFAULT 'all',
  sex text DEFAULT 'all',
  indigenous_status text NOT NULL,
  count_persons int,
  dataflow_id text,
  ingested_at timestamptz DEFAULT now(),
  UNIQUE (lga_code, reference_year, source, age_group, sex, indigenous_status)
);

CREATE INDEX IF NOT EXISTS idx_abs_indig_state
  ON abs_indigenous_population_by_lga(state, reference_year);
