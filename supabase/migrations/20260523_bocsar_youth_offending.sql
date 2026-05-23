-- BOCSAR youth offending — per docs/civic-connectors/build-specs.md section 2.
-- Source: https://bocsar.nsw.gov.au — NSW Bureau of Crime Statistics & Research.
--
-- Captures NSW-specific youth offence / proceeding / custody data at state and
-- LGA granularity, by age group / Indigenous status / sex / ANZSOC offence /
-- legal proceeding type. Quarterly cadence (releases Mar / Jun / Sep / Dec
-- covering data 3-4 months prior). BOCSAR revises prior quarters — always
-- re-ingest the last 8 quarters and let the unique-key conflict update in
-- place.
--
-- CRITICAL — small-cell suppression: BOCSAR redacts counts < ~5 with markers
-- 'np' / 'n/a' / '*' / '<5'. Those rows MUST set count = NULL and
-- suppressed = true. Storing them as 0 silently corrupts time series and
-- under-represents low-incidence cohorts (small Indigenous LGAs especially).
--
-- CRITICAL — taxonomy boundaries:
--   * ANZSOC offence codes vs BOCSAR's own subcategories: store as-is in
--     separate columns (offence_anzsoc, offence_subcategory). Do NOT map
--     between them at ingest — different reports use different taxonomies.
--   * BOCSAR's Indigenous identification (police-flagged, ~20% rule) differs
--     from ABS self-identification. Never blend with ABS counts at query
--     time without surfacing the methodological mismatch.
--   * NSW LGAs are state boundaries — NOT ABS SA2. Do not join against
--     ABS Indigenous tables on geography without an explicit crosswalk.

CREATE TABLE IF NOT EXISTS bocsar_youth_offending (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Spatial / temporal
  state text NOT NULL DEFAULT 'NSW',
  period_start date NOT NULL,
  period_end date NOT NULL,
  period_type text NOT NULL,             -- 'month' | 'quarter' | 'year' | 'multi_year'
  geography_level text NOT NULL,         -- 'state' | 'lga' | 'region'
  geography_name text,                   -- NULL for state-level, LGA name otherwise

  -- Cohort dimensions
  age_group text NOT NULL,               -- '10-13' | '14-17' | '10-17' | '18-24' | 'all'
  indigenous_status text,                -- 'indigenous' | 'non_indigenous' | 'unknown' | 'all'
  sex text,                              -- 'male' | 'female' | 'other' | 'all'

  -- Offence + proceeding
  offence_anzsoc text,                   -- ANZSOC division/group code or label (raw from source)
  offence_subcategory text,              -- BOCSAR-specific subcategory if present
  legal_proceeding text,                 -- 'court' | 'caution' | 'yjc' | 'infringement' | 'custody' | NULL

  -- The measurement
  metric text NOT NULL,                  -- 'offenders' | 'incidents' | 'custody_population' | 'remand' | 'sentenced'
  count integer,                         -- NULL when suppressed
  suppressed boolean NOT NULL DEFAULT false,

  -- Provenance
  source_file text NOT NULL,             -- filename (e.g. 'young_people_proceedings_2024.csv')
  source_url text NOT NULL,              -- direct URL the file was downloaded from
  release_date date,                     -- BOCSAR's stated publication date if known
  metadata jsonb DEFAULT '{}'::jsonb,    -- { sheet_name, raw_row_index, original_indigenous_label, ... }

  ingested_at timestamptz NOT NULL DEFAULT now(),

  -- Idempotency: every cell of every BOCSAR table is uniquely identified by
  -- (period_start, geography_level, geography_name, age_group, indigenous_status,
  --  sex, offence_anzsoc, legal_proceeding, metric). Re-ingest of revised
  -- quarters updates count/suppressed in place via ON CONFLICT DO UPDATE.
  UNIQUE (period_start, geography_level, geography_name, age_group,
          indigenous_status, sex, offence_anzsoc, legal_proceeding, metric)
);

CREATE INDEX IF NOT EXISTS idx_bocsar_youth_period
  ON bocsar_youth_offending(period_start DESC);
CREATE INDEX IF NOT EXISTS idx_bocsar_youth_geography
  ON bocsar_youth_offending(geography_level, geography_name)
  WHERE geography_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bocsar_youth_indigenous
  ON bocsar_youth_offending(indigenous_status)
  WHERE indigenous_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bocsar_youth_offence
  ON bocsar_youth_offending(offence_anzsoc)
  WHERE offence_anzsoc IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bocsar_youth_metric
  ON bocsar_youth_offending(metric);

-- RLS
ALTER TABLE bocsar_youth_offending ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON bocsar_youth_offending
  FOR SELECT USING (true);

CREATE POLICY "Service role write access" ON bocsar_youth_offending
  FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE bocsar_youth_offending IS
  'NSW BOCSAR youth offending / custody data, quarterly. Source: bocsar.nsw.gov.au. See docs/civic-connectors/build-specs.md section 2. Suppressed cells set count=NULL, suppressed=true — never zero. BOCSAR Indigenous flag ≠ ABS self-id — do not blend.';
COMMENT ON COLUMN bocsar_youth_offending.count IS
  'Cell count. NULL means suppressed (BOCSAR redacts counts < ~5). When NULL, suppressed = true. Never sum across suppressed cells.';
COMMENT ON COLUMN bocsar_youth_offending.suppressed IS
  'True when the source cell was redacted ('np', 'n/a', '*', '<5'). count is NULL in that case.';
COMMENT ON COLUMN bocsar_youth_offending.offence_anzsoc IS
  'ANZSOC offence label as published by BOCSAR. Stored verbatim — no internal mapping. ANZSOC vs BOCSAR-specific subcategories live in offence_subcategory.';
COMMENT ON COLUMN bocsar_youth_offending.indigenous_status IS
  'BOCSAR Indigenous identification (police-flagged). Methodologically distinct from ABS self-identification. Surface the difference at query time; never silently blend with ABS sources.';
COMMENT ON COLUMN bocsar_youth_offending.metadata IS
  'Free-form provenance: source sheet/tab name, raw row index, original Indigenous label string before normalisation, units, footnotes. Useful for human review without re-downloading.';

-- ────────────────────────────────────────────────────────────────────
-- Source-file tracking — only re-download when file hash changes.
-- ────────────────────────────────────────────────────────────────────
-- BOCSAR re-publishes the same URLs with revised data. To avoid pointless
-- re-downloads (and re-parsing of unchanged sheets) the ingestion script
-- records each source URL's SHA-256 and last_seen timestamp. On next run,
-- it HEAD-fetches or full-fetches and compares hash before parsing.

CREATE TABLE IF NOT EXISTS bocsar_source_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url text NOT NULL UNIQUE,
  filename text,                         -- normalised filename for display
  index_page text,                       -- which BOCSAR index page the URL was discovered from
  sha256 text,                           -- SHA-256 of the downloaded bytes
  byte_size bigint,
  content_type text,                     -- 'text/csv' | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' | ...
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  last_downloaded_at timestamptz,
  last_parsed_at timestamptz,
  parse_status text DEFAULT 'pending',   -- 'pending' | 'ok' | 'unsupported' | 'error'
  parse_error text,                      -- stack/message when parse_status = 'error'
  rows_extracted int,                    -- count from last successful parse
  metadata jsonb DEFAULT '{}'::jsonb     -- { release_date, period_start, period_end, source_label, ... }
);

CREATE INDEX IF NOT EXISTS idx_bocsar_source_files_last_seen
  ON bocsar_source_files(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_bocsar_source_files_status
  ON bocsar_source_files(parse_status);

ALTER TABLE bocsar_source_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON bocsar_source_files
  FOR SELECT USING (true);

CREATE POLICY "Service role write access" ON bocsar_source_files
  FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE bocsar_source_files IS
  'Tracks every BOCSAR CSV/XLSX URL discovered by scripts/civic/ingest-bocsar-youth.mjs. sha256 lets the script skip re-download/re-parse when content has not changed since last run. Updated on every discovery sweep — first_seen vs last_seen is the file history.';
COMMENT ON COLUMN bocsar_source_files.sha256 IS
  'SHA-256 of the raw downloaded bytes. Compared on next run before parse — unchanged hash means skip parse entirely.';
COMMENT ON COLUMN bocsar_source_files.parse_status IS
  'pending = discovered, not yet parsed; ok = parsed successfully; unsupported = format not handled (e.g. PDF table); error = parse threw, see parse_error.';
