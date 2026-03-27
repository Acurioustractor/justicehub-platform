-- Add sentiment analysis columns to alma_media_articles
-- Used by /api/cron/alma/enrich?mode=sentiment

ALTER TABLE alma_media_articles
  ADD COLUMN IF NOT EXISTS sentiment text,
  ADD COLUMN IF NOT EXISTS sentiment_score numeric,
  ADD COLUMN IF NOT EXISTS organizations_mentioned text[],
  ADD COLUMN IF NOT EXISTS programs_mentioned text[],
  ADD COLUMN IF NOT EXISTS key_claims jsonb;

-- Index for finding unanalyzed articles
CREATE INDEX IF NOT EXISTS idx_media_articles_sentiment_null
  ON alma_media_articles (published_date DESC NULLS LAST)
  WHERE sentiment IS NULL;

-- Index for sentiment filtering in queries
CREATE INDEX IF NOT EXISTS idx_media_articles_sentiment
  ON alma_media_articles (sentiment)
  WHERE sentiment IS NOT NULL;

COMMENT ON COLUMN alma_media_articles.sentiment IS 'fear_narrative | solutions_focused | neutral | mixed';
COMMENT ON COLUMN alma_media_articles.sentiment_score IS '-1 (pure fear/punitive) to +1 (pure solutions/evidence)';
COMMENT ON COLUMN alma_media_articles.key_claims IS 'Array of {claim, type, verifiable} objects extracted by LLM';
