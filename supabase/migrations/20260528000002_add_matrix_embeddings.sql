-- Add embedding columns to enable semantic dedup for the Justice Matrix.
-- The previous isDuplicate check was title ILIKE on a 40-char prefix, which
-- missed variant citations (the N.S. and Ilias dup-inserts from session 1).
-- pgvector + cosine distance gives proper semantic nearest-neighbour matching.
--
-- Dimension 1536 = OpenAI text-embedding-3-small.
--
-- Originally applied 2026-05-28 via the Supabase MCP; checking in here so a
-- fresh DB rebuilds the schema identically.

ALTER TABLE justice_matrix_cases     ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE justice_matrix_campaigns ADD COLUMN IF NOT EXISTS embedding vector(1536);

CREATE INDEX IF NOT EXISTS idx_cases_embedding_hnsw
  ON justice_matrix_cases     USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_campaigns_embedding_hnsw
  ON justice_matrix_campaigns USING hnsw (embedding vector_cosine_ops);
