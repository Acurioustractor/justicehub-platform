-- AIHW Youth Justice in Australia — supplementary table stats (tidy/long-form).
-- Source: https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-<year>/
-- Per docs/civic-connectors/build-specs.md section 1.
--
-- One row per (state, metric, indigenous_status, age_group, legal_status) tuple
-- per report year. Sheets currently whitelisted in the ingester: S18 (remand vs
-- sentenced detention), S20 (detention population), S37 (Indigenous status),
-- S54 (age splits). Additional sheets can be added without schema change.
--
-- "np" (not published), "na" (not applicable), "..." in AIHW source workbooks
-- map to NULL metric_value — never zero. Sums must not coerce.

CREATE TABLE IF NOT EXISTS aihw_youth_justice_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Report identity
  report_year TEXT NOT NULL,              -- '2024-25', '2023-24'
  state TEXT NOT NULL,                    -- 'NSW','VIC','QLD','SA','WA','TAS','ACT','NT','NAT'
  metric_key TEXT NOT NULL,               -- 'avg_daily_supervision', 'detention_pop', 'remand_pct'
  metric_value NUMERIC,                   -- NULL when source = np / na / ...
  unit TEXT,                              -- 'count','rate_per_10k','percent','ratio'

  -- Cohort dimensions (default 'all' rather than NULL so the unique
  -- constraint behaves predictably across NULL semantics)
  indigenous_status TEXT DEFAULT 'all',   -- 'indigenous','non_indigenous','all','unknown'
  age_group TEXT DEFAULT 'all',           -- '10-13','14-17','10-17','18+','all'
  legal_status TEXT DEFAULT 'all',        -- 'remand','sentenced','community','all'

  -- Source provenance
  source_table TEXT,                      -- 'S18','S20','S37','S54' AIHW table id
  source_sheet_label TEXT,                -- the raw sheet name we parsed
  source_url TEXT NOT NULL,
  source_format TEXT DEFAULT 'xlsx',      -- 'xlsx' | 'pdf' (fallback)
  published_at DATE,
  ingested_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT aihw_yj_state_chk CHECK (
    state IN ('NSW','VIC','QLD','SA','WA','TAS','ACT','NT','NAT')
  ),
  CONSTRAINT aihw_yj_indig_chk CHECK (
    indigenous_status IN ('indigenous','non_indigenous','all','unknown')
  ),
  CONSTRAINT aihw_yj_legal_chk CHECK (
    legal_status IN ('remand','sentenced','community','all')
  )
);

-- Idempotent upsert key. NB: every dimension column has a DEFAULT, so the
-- unique constraint compares concrete strings (no NULL-equality pitfalls).
CREATE UNIQUE INDEX IF NOT EXISTS uniq_aihw_yj_stats_key
  ON aihw_youth_justice_stats (
    report_year, state, metric_key, indigenous_status, age_group, legal_status
  );

CREATE INDEX IF NOT EXISTS idx_aihw_yj_stats_year ON aihw_youth_justice_stats (report_year);
CREATE INDEX IF NOT EXISTS idx_aihw_yj_stats_state ON aihw_youth_justice_stats (state);
CREATE INDEX IF NOT EXISTS idx_aihw_yj_stats_metric ON aihw_youth_justice_stats (metric_key);
CREATE INDEX IF NOT EXISTS idx_aihw_yj_stats_table ON aihw_youth_justice_stats (source_table);

COMMENT ON TABLE aihw_youth_justice_stats IS
  'AIHW Youth justice in Australia supplementary tables, in tidy/long form. One row per metric x state x cohort tuple. See docs/civic-connectors/build-specs.md section 1.';
COMMENT ON COLUMN aihw_youth_justice_stats.metric_value IS
  'NULL when source = np / na / ... — must not be coerced to 0 in any downstream aggregation.';
COMMENT ON COLUMN aihw_youth_justice_stats.source_format IS
  'xlsx when parsed from the supplementary tables workbook; pdf when the workbook was unavailable and we fell back to the main report PDF.';
