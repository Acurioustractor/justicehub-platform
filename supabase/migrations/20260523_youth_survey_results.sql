-- Mission Australia Youth Survey — aggregate-only results table.
--
-- Source: https://www.missionaustralia.com.au/what-we-do/evidence-impact-and-advocacy/research/youth-survey/
-- Schema follows docs/civic-connectors/build-specs.md section 5.B.
--
-- IMPORTANT SAFETY NOTES:
--   - Mission Australia's raw microdata is NOT public; researcher access is
--     gated. This table is AGGREGATE-ONLY by design. Do not extend it with
--     individual-respondent columns.
--   - Where the published report suppresses small-cell counts, the
--     ingestion script must SKIP the metric (do not store zeros).
--   - One row per (survey_year, geography_level, state, cohort_filter, metric_key).
--   - cohort_filter is jsonb so we can subset (e.g. indigenous=true,
--     age_range='14-15', gender='female') without exploding the schema.

CREATE TABLE IF NOT EXISTS youth_survey_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_year int NOT NULL,
  geography_level text NOT NULL,            -- 'national' | 'state' | 'territory'
  state text,                               -- NULL for national; 'NSW','VIC','QLD','SA','WA','TAS','ACT','NT' otherwise
  cohort_filter jsonb NOT NULL DEFAULT '{}'::jsonb,
                                            -- e.g. {"indigenous": true} or {"age_range": "14-15"} or {} for whole sample
  metric_key text NOT NULL,                 -- e.g. 'top_concern_cost_of_living_pct', 'police_contact_pct', 'k6_high_distress_pct'
  metric_value numeric,                     -- ratio/percent/count — type recorded in metric_unit
  metric_unit text,                         -- 'percent' | 'count' | 'rank' | 'mean_score'
  sample_size int,                          -- denominator (n=) — NULL if not stated
  source_pdf_url text NOT NULL,
  source_page int,                          -- page number in the published PDF where the metric appears
  notes text,                               -- extractor caveats / suppression notes / wording of survey item
  ingested_at timestamptz NOT NULL DEFAULT now()
);

-- Idempotency key per spec: one row per metric × cohort × geography × year.
-- cohort_filter is jsonb so we serialise it via expression index on its text
-- representation; this lets upserts work even when filter keys reorder.
CREATE UNIQUE INDEX IF NOT EXISTS idx_youth_survey_results_unique
  ON youth_survey_results (
    survey_year,
    geography_level,
    COALESCE(state, ''),
    (cohort_filter::text),
    metric_key
  );

CREATE INDEX IF NOT EXISTS idx_youth_survey_results_year
  ON youth_survey_results (survey_year);

CREATE INDEX IF NOT EXISTS idx_youth_survey_results_metric
  ON youth_survey_results (metric_key);

CREATE INDEX IF NOT EXISTS idx_youth_survey_results_state
  ON youth_survey_results (state) WHERE state IS NOT NULL;

COMMENT ON TABLE youth_survey_results IS
  'Mission Australia Youth Survey — aggregate-only metrics extracted from published annual reports. Microdata is gated; this table must remain aggregate-only.';
COMMENT ON COLUMN youth_survey_results.cohort_filter IS
  'Subgroup descriptor as jsonb. {} = whole sample. Examples: {"indigenous": true}, {"age_range": "14-15"}, {"gender": "female"}.';
COMMENT ON COLUMN youth_survey_results.metric_unit IS
  'Type of metric_value: percent | count | rank | mean_score. Required so consumers know how to render.';
COMMENT ON COLUMN youth_survey_results.sample_size IS
  'Denominator for this metric (n=). NULL if the report does not state it. Never compute from microdata — only record what is published.';
