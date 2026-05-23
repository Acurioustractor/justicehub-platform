-- State Auditors-General — performance audit reports related to youth justice.
--
-- Spec: docs/civic-connectors/build-specs.md §7.A
-- Ingestion: scripts/civic/ingest-auditors-general.mjs
--
-- One row per audit report. Source URLs are unique; we also index by
-- (jurisdiction, title) for idempotent reruns where the URL changes but
-- the report identity is stable.

CREATE TABLE IF NOT EXISTS auditor_general_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction text NOT NULL,         -- 'qld','nsw','vic','wa','sa','tas','nt','act'
  title text NOT NULL,
  report_number text,                 -- 'Report 15: 2023-24'
  url text NOT NULL UNIQUE,
  publication_date date,
  tabled_date date,                   -- distinct from publication; politically meaningful
  key_findings jsonb,
  key_recommendations jsonb,
  status text DEFAULT 'open',         -- 'open' | 'partially_implemented' | 'implemented' | 'rejected'
  raw_text text,
  metadata jsonb,
  extracted_at timestamptz DEFAULT now(),
  llm_model text,
  ingested_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aga_jurisdiction ON auditor_general_audits(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_aga_date ON auditor_general_audits(publication_date DESC);

-- Secondary identity for idempotent upserts where the host changes URLs.
CREATE UNIQUE INDEX IF NOT EXISTS idx_aga_jurisdiction_title
  ON auditor_general_audits(jurisdiction, lower(title));

COMMENT ON TABLE auditor_general_audits IS
  'State Auditor-General performance audits relevant to youth justice. Built spec: docs/civic-connectors/build-specs.md §7.A.';
COMMENT ON COLUMN auditor_general_audits.tabled_date IS
  'Date the report was tabled in parliament. May lag publication by days/weeks and is politically meaningful (debate triggers).';
COMMENT ON COLUMN auditor_general_audits.status IS
  'Implementation status of recommendations, where reported by follow-up audits. Defaults to "open" on first ingestion.';
