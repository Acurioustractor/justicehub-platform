-- JR Network evaluations — per build-specs.md §5.A
-- Stores structured extractions from Justice Reinvestment Network research
-- papers / evaluation PDFs (Maranguka, Olabud Doogethu, Moree, Halls Creek,
-- Glen Innes, Cooktown). Source: justicereinvestment.net.au.
--
-- One row per source PDF. source_url is UNIQUE so the ingestion script can
-- safely re-run; conflicts update the extraction in place.

CREATE TABLE IF NOT EXISTS jr_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_name text,                            -- 'Maranguka Justice Reinvestment', 'Olabud Doogethu'
  site_location text,                           -- 'Bourke, NSW' (free-text, may include traditional name)
  alma_organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  evaluator text,                               -- 'KPMG', 'ANU JR Hub', 'Australian National University'
  publication_year int,
  evaluation_type text,                         -- 'impact_assessment' | 'community_led' | 'academic'
  program_cost_dollars bigint,                  -- Annual or total operating cost in AUD if stated
  claimed_savings_dollars bigint,               -- e.g. KPMG Maranguka $3.1M NSW savings
  outcomes_json jsonb,                          -- Flexible: { key_findings: [], metrics: {}, mechanisms: [] }
  source_url text NOT NULL UNIQUE,
  pdf_storage_path text,                        -- Future: supabase storage path once PDFs are mirrored
  verification_status text DEFAULT 'unverified', -- 'unverified' | 'human_reviewed' | 'ai_generated'
  extracted_at timestamptz DEFAULT now(),
  extractor jsonb,                              -- { provider, model } — provenance for re-extract decisions
  ingested_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jr_evaluations_org ON jr_evaluations(alma_organization_id);
CREATE INDEX IF NOT EXISTS idx_jr_evaluations_year ON jr_evaluations(publication_year);
CREATE INDEX IF NOT EXISTS idx_jr_evaluations_program ON jr_evaluations(program_name);

COMMENT ON TABLE jr_evaluations IS
  'Justice Reinvestment Network evaluation papers — built from justicereinvestment.net.au PDF scrapes. See scripts/civic/ingest-jr-network.mjs.';
COMMENT ON COLUMN jr_evaluations.outcomes_json IS
  'Flexible JSONB: { key_findings: string[], metrics: object, mechanisms: string[], geography: string }. Schema NOT enforced — evaluation types vary.';
COMMENT ON COLUMN jr_evaluations.verification_status IS
  'unverified = raw LLM output; human_reviewed = a human has checked claims against the PDF; ai_generated = synthesis without a real source (should be rare/filtered).';
