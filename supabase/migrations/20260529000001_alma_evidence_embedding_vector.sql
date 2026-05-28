-- Add pgvector embedding to alma_evidence so Australian youth-justice evidence
-- can be semantically cross-linked into the Justice Matrix explore surface as a
-- distinct kind. Mirrors the cases/campaigns pattern: vector(1536) + HNSW cosine.
ALTER TABLE public.alma_evidence
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

CREATE INDEX IF NOT EXISTS idx_alma_evidence_embedding_hnsw
  ON public.alma_evidence
  USING hnsw (embedding vector_cosine_ops);
