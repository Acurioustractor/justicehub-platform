-- Children's Commissioner annual reports — per build-specs.md §3
-- Stores structured extractions from the 9 jurisdictional children's
-- commissioners' annual reports (NSW, VIC, QLD, WA, SA, TAS, NT, ACT, Federal).
--
-- One row per (jurisdiction, report_year) tuple. UNIQUE constraint lets the
-- ingestion script safely re-run; conflicts update the extraction in place.
--
-- Pipeline: ingest-children-commissioners.mjs fetches the index page for each
-- body, resolves the latest annual-report PDF (or HTML for WA), runs pdf-parse
-- v2 → chunks text → per-chunk LLM extraction (Gemini 2.5 Flash) → merges
-- findings + recommendations across chunks → upserts.

CREATE TABLE IF NOT EXISTS children_commissioner_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction text NOT NULL,                       -- 'NSW','VIC','QLD','WA','SA','SA-Aboriginal','TAS','NT','ACT','Federal'
  body_name text NOT NULL,                          -- e.g. 'Advocate for Children & Young People (NSW)'
  report_year text NOT NULL,                        -- '2024-25' or '2024' depending on report
  report_url text NOT NULL,                         -- direct PDF (or HTML for WA) URL
  report_title text,                                -- as printed on the cover page
  page_count int,                                   -- pages extracted from the PDF (null for HTML)
  published_date date,                              -- if discoverable from filename / cover
  raw_text text,                                    -- full extracted text; truncated to ~500K chars
  key_findings jsonb,                               -- [{theme, finding, page_ref}] — merged across chunks
  recommendations jsonb,                            -- [{number, text, target_body, yj_relevant, raise_age_relevant, indigenous_overrep}]
  yj_relevant boolean DEFAULT false,                -- true if any recommendation tagged yj_relevant
  raise_age_mentioned boolean DEFAULT false,        -- true if any recommendation tagged raise_age_relevant
  detention_mentioned boolean DEFAULT false,        -- true if any finding/recommendation mentions detention
  indigenous_overrep_mentioned boolean DEFAULT false, -- true if any recommendation tagged indigenous_overrep
  metadata jsonb,                                   -- {is_consolidated_act: bool, sa_secondary: bool, source_format: 'pdf'|'html', chunk_count, ...}
  extracted_at timestamptz DEFAULT now(),
  llm_model text,                                   -- 'gemini-2.5-flash' etc.
  ingested_at timestamptz DEFAULT now(),
  UNIQUE (jurisdiction, report_year)
);

CREATE INDEX IF NOT EXISTS idx_ccr_jurisdiction ON children_commissioner_reports(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_ccr_report_year ON children_commissioner_reports(report_year);
CREATE INDEX IF NOT EXISTS idx_ccr_yj_relevant ON children_commissioner_reports(yj_relevant) WHERE yj_relevant = true;
CREATE INDEX IF NOT EXISTS idx_ccr_raise_age ON children_commissioner_reports(raise_age_mentioned) WHERE raise_age_mentioned = true;
CREATE INDEX IF NOT EXISTS idx_ccr_published_date ON children_commissioner_reports(published_date);

COMMENT ON TABLE children_commissioner_reports IS
  'Children''s Commissioner annual reports across 9 AU jurisdictions. Built from PDF/HTML scrapes via scripts/civic/ingest-children-commissioners.mjs. See docs/civic-connectors/build-specs.md §3.';
COMMENT ON COLUMN children_commissioner_reports.jurisdiction IS
  'Jurisdiction code. SA has two commissioners — use ''SA'' for the general CCYP and ''SA-Aboriginal'' for the Commissioner for Aboriginal Children & Young People.';
COMMENT ON COLUMN children_commissioner_reports.recommendations IS
  'JSONB array of explicit recommendations. Each: {number: string, text: string (verbatim), target_body: string, yj_relevant: bool, raise_age_relevant: bool, indigenous_overrep: bool, page_ref: int|null}. Only EXPLICIT recommendations (e.g. "the Commission recommends...") — not inferred suggestions.';
COMMENT ON COLUMN children_commissioner_reports.key_findings IS
  'JSONB array of structured findings. Each: {theme: string, finding: string, page_ref: int|null}. Themes typically: detention, mental_health, education, child_protection, indigenous_overrep, raise_age.';
COMMENT ON COLUMN children_commissioner_reports.metadata IS
  'Per-jurisdiction context flags. Keys: source_format (''pdf''|''html''), is_consolidated_act (true if extracted from HRC report), sa_secondary (true for SA-Aboriginal sibling), chunk_count, extractor_provider, raw_text_chars.';
