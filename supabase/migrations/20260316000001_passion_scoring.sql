-- Add passion scoring columns to campaign_alignment_entities
ALTER TABLE campaign_alignment_entities
  ADD COLUMN IF NOT EXISTS passion_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS engagement_signals jsonb DEFAULT '[]'::jsonb;

-- Index for social proof queries (top passionate supporters)
CREATE INDEX IF NOT EXISTS idx_cae_passion_score
  ON campaign_alignment_entities (passion_score DESC)
  WHERE passion_score > 0;
