-- Data sufficiency layer.
--
-- Two tables + one view that track what civic-intelligence data we have,
-- what's known to be missing, and where to look next. Powers
-- /admin/data-sufficiency and reminds the team to continually reconsider
-- whether the dataset is complete enough.

CREATE TABLE IF NOT EXISTS data_sources_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key text UNIQUE NOT NULL,
  topic text NOT NULL CHECK (topic IN ('grants', 'foundations', 'government', 'orgs', 'oversight', 'demographics', 'meta')),
  display_name text NOT NULL,
  description text,
  url text,
  ingest_method text,
  refresh_cadence text,
  last_refreshed_at timestamptz,
  row_count integer,
  coverage_note text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'discontinued', 'planned')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_data_sources_inventory_topic ON data_sources_inventory (topic);
CREATE INDEX IF NOT EXISTS idx_data_sources_inventory_status ON data_sources_inventory (status);

CREATE TABLE IF NOT EXISTS data_gap_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  topic text NOT NULL CHECK (topic IN ('grants', 'foundations', 'government', 'orgs', 'oversight', 'demographics', 'meta')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'sourced', 'closed', 'wontfix')),
  proposed_source_url text,
  outcome_note text,
  raised_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  owner text,
  priority smallint NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5)
);

CREATE INDEX IF NOT EXISTS idx_data_gap_questions_status ON data_gap_questions (status, priority);
CREATE INDEX IF NOT EXISTS idx_data_gap_questions_topic ON data_gap_questions (topic);

CREATE OR REPLACE VIEW v_data_sufficiency AS
SELECT
  topic,
  COUNT(*) FILTER (WHERE status = 'active') AS active_sources,
  COUNT(*) FILTER (WHERE status = 'planned') AS planned_sources,
  COUNT(*) FILTER (WHERE status = 'paused') AS paused_sources,
  COUNT(*) FILTER (WHERE last_refreshed_at IS NULL OR last_refreshed_at < now() - interval '60 days') AS stale_sources,
  SUM(row_count) FILTER (WHERE status = 'active') AS active_row_count
FROM data_sources_inventory
GROUP BY topic;

COMMENT ON TABLE data_sources_inventory IS
  'Registry of every dataset the civic-intelligence layer depends on. One row per source. Powers /admin/data-sufficiency.';
COMMENT ON TABLE data_gap_questions IS
  'Open questions about data we know is missing or partial. Status moves open -> investigating -> sourced -> closed. Wontfix = decided not to pursue.';
COMMENT ON VIEW v_data_sufficiency IS
  'Per-topic rollup of source counts + staleness for the admin dashboard.';
