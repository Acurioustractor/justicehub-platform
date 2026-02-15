-- Fix materialized views - correct array aggregation and add unique indexes
BEGIN;

-- Drop existing views
DROP MATERIALIZED VIEW IF EXISTS alma_daily_sentiment;
DROP MATERIALIZED VIEW IF EXISTS alma_sentiment_program_correlation;

-- Recreate alma_daily_sentiment without array aggregation issue
CREATE MATERIALIZED VIEW alma_daily_sentiment AS
SELECT
  DATE_TRUNC('day', published_date) as date,
  source_name,
  COUNT(*) as article_count,
  AVG(sentiment_score) as avg_sentiment,
  STDDEV(sentiment_score) as sentiment_stddev,
  COUNT(*) FILTER (WHERE sentiment = 'positive') as positive_count,
  COUNT(*) FILTER (WHERE sentiment = 'negative') as negative_count,
  COUNT(*) FILTER (WHERE sentiment = 'neutral') as neutral_count,
  COUNT(*) FILTER (WHERE sentiment = 'mixed') as mixed_count
FROM alma_media_articles
WHERE published_date IS NOT NULL
GROUP BY DATE_TRUNC('day', published_date), source_name
ORDER BY date DESC;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX idx_alma_daily_sentiment_unique
  ON alma_daily_sentiment(date, source_name);

-- Recreate alma_sentiment_program_correlation
CREATE MATERIALIZED VIEW alma_sentiment_program_correlation AS
SELECT
  p.id as program_id,
  p.name as program_name,
  p.announced_date,
  p.community_led,

  -- Sentiment BEFORE announcement (30 days prior)
  AVG(CASE
    WHEN DATE_TRUNC('day', a.published_date)
         BETWEEN p.announced_date - INTERVAL '30 days'
         AND p.announced_date - INTERVAL '1 day'
    THEN a.sentiment_score
  END) as sentiment_before,

  -- Sentiment AFTER announcement (30 days after)
  AVG(CASE
    WHEN DATE_TRUNC('day', a.published_date)
         BETWEEN p.announced_date
         AND p.announced_date + INTERVAL '30 days'
    THEN a.sentiment_score
  END) as sentiment_after,

  -- Calculate sentiment shift
  AVG(CASE
    WHEN DATE_TRUNC('day', a.published_date)
         BETWEEN p.announced_date
         AND p.announced_date + INTERVAL '30 days'
    THEN a.sentiment_score
  END) - AVG(CASE
    WHEN DATE_TRUNC('day', a.published_date)
         BETWEEN p.announced_date - INTERVAL '30 days'
         AND p.announced_date - INTERVAL '1 day'
    THEN a.sentiment_score
  END) as sentiment_shift

FROM alma_government_programs p
LEFT JOIN alma_media_articles a ON TRUE
WHERE p.announced_date IS NOT NULL
GROUP BY p.id, p.name, p.announced_date, p.community_led
HAVING COUNT(a.id) > 0;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX idx_alma_sentiment_program_correlation_unique
  ON alma_sentiment_program_correlation(program_id);

COMMIT;
