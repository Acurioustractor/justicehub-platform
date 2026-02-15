-- Add unique indexes to materialized views for concurrent refresh
BEGIN;

-- Create unique index on alma_daily_sentiment
CREATE UNIQUE INDEX IF NOT EXISTS idx_alma_daily_sentiment_unique
  ON alma_daily_sentiment(date, source_name);

-- Refresh views non-concurrently first time
REFRESH MATERIALIZED VIEW alma_daily_sentiment;
REFRESH MATERIALIZED VIEW alma_sentiment_program_correlation;

COMMIT;
