-- Cross-system statistics for youth justice, child protection, and disability crossover data
-- Sources: AIHW, Productivity Commission CTG, BOCSAR/DSS

CREATE TABLE IF NOT EXISTS cross_system_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL,
  metric text NOT NULL,
  value numeric,
  unit text,
  state text,
  indigenous_status text,
  age_group text,
  gender text,
  financial_year text,
  source_name text NOT NULL,
  source_url text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cross_system_domain ON cross_system_stats(domain);
CREATE INDEX IF NOT EXISTS idx_cross_system_state ON cross_system_stats(state);
CREATE INDEX IF NOT EXISTS idx_cross_system_metric ON cross_system_stats(metric, state);
