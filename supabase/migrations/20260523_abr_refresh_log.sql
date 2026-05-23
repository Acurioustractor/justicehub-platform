-- ABR (Australian Business Register) refresh detection log.
--
-- Source: data.gov.au CKAN package `abn-bulk-extract`, dataset id
-- 5bd7fcab-e315-42cb-8daf-50b7efc2027e. Refresh cadence is weekly
-- (~20MB compressed × ~20 zipped XML splits), so we poll the CKAN
-- package_show endpoint and snapshot each resource's `last_modified`
-- timestamp. This table is the DETECTION layer only — it records
-- when a new bulk extract has been published. The downstream full
-- streaming ingest (sax/node-expat, 20M+ records) reads `processed=false`
-- rows from this log and marks them once a backfill run completes.
--
-- See docs/civic-connectors/build-specs.md section 6.A for the full
-- design. scripts/civic/check-abr-refresh.mjs is the cheap detector
-- that writes here.

CREATE TABLE IF NOT EXISTS abr_refresh_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id text NOT NULL,
  resource_label text,                    -- e.g. 'public_split_01_10.zip'
  last_modified timestamptz NOT NULL,     -- from CKAN resource.last_modified
  detected_at timestamptz DEFAULT now(),
  processed boolean DEFAULT false,        -- TRUE once a full ingest run consumes this
  processed_at timestamptz,
  UNIQUE (resource_id, last_modified)
);

CREATE INDEX IF NOT EXISTS idx_abr_refresh_log_processed
  ON abr_refresh_log (processed, detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_abr_refresh_log_resource
  ON abr_refresh_log (resource_id, last_modified DESC);

-- abr_registry — add hash/last-seen columns so the future streaming
-- ingestor can do change-detection without a native diff file (ABR
-- only publishes full extracts; no delta). Hash each record, mark
-- last_seen_in_extract per refresh, and infer cancellation when an
-- ABN is missing from two consecutive extracts.
ALTER TABLE abr_registry
  ADD COLUMN IF NOT EXISTS record_hash text,
  ADD COLUMN IF NOT EXISTS last_seen_in_extract date,
  ADD COLUMN IF NOT EXISTS cancelled_inferred_at date;

CREATE INDEX IF NOT EXISTS idx_abr_last_seen
  ON abr_registry (last_seen_in_extract);
