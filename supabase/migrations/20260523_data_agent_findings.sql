-- Research-agent findings table.
--
-- Nightly the agent loops over open data_gap_questions, web-searches for
-- candidate sources via Serper, asks Gemini Flash to rank each result, and
-- inserts ranked candidates here. An admin reviews each finding and either
-- accepts (creating an entry in data_sources_inventory) or rejects.

CREATE TABLE IF NOT EXISTS data_agent_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gap_question_id uuid REFERENCES data_gap_questions(id) ON DELETE SET NULL,
  topic text NOT NULL,
  candidate_url text NOT NULL,
  candidate_title text,
  summary text,
  relevance_score numeric,
  rationale text,
  search_query text,
  raw_result jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'duplicate')),
  reviewed_at timestamptz,
  reviewer text,
  resulting_source_key text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_data_agent_findings_status ON data_agent_findings (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_agent_findings_gap ON data_agent_findings (gap_question_id);

-- Dedupe same URL within the same gap question
CREATE UNIQUE INDEX IF NOT EXISTS idx_data_agent_findings_url_per_gap
  ON data_agent_findings (gap_question_id, lower(candidate_url))
  WHERE gap_question_id IS NOT NULL;

COMMENT ON TABLE data_agent_findings IS
  'Candidate data sources proposed by the research agent for review. status moves pending -> accepted | rejected | duplicate.';
