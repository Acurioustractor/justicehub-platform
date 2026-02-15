-- ALMA Media Sentiment Tracking
-- Tracks media coverage sentiment and correlates with government program rollouts

BEGIN;

-- Media articles with sentiment analysis
CREATE TABLE IF NOT EXISTS alma_media_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES alma_ingestion_jobs(id),

  -- Article metadata
  headline TEXT NOT NULL,
  url TEXT,
  published_date TIMESTAMPTZ,
  source_name TEXT, -- 'The Guardian', 'ABC News', etc.

  -- Sentiment analysis
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral', 'mixed')),
  sentiment_score DECIMAL CHECK (sentiment_score >= -1.0 AND sentiment_score <= 1.0),
  confidence DECIMAL CHECK (confidence >= 0.0 AND confidence <= 1.0),

  -- Topics and mentions
  topics TEXT[], -- ['youth detention', 'bail reform', 'cultural programs']
  government_mentions JSONB, -- {programs: [...], ministers: [...], departments: [...]}
  community_mentions JSONB, -- {organizations: [...], elders: [...], advocates: [...]}
  intervention_mentions UUID[], -- Links to alma_interventions

  -- Content
  summary TEXT,
  key_quotes TEXT[],
  full_text TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Government program announcements (manually curated or auto-detected)
CREATE TABLE IF NOT EXISTS alma_government_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Program details
  name TEXT NOT NULL,
  jurisdiction TEXT, -- QLD, NSW, VIC, etc.
  program_type TEXT, -- 'diversion', 'cultural', 'therapeutic', etc.

  -- Timeline
  announced_date DATE,
  implementation_date DATE,
  status TEXT CHECK (status IN ('announced', 'in_progress', 'implemented', 'abandoned')),

  -- Funding
  budget_amount DECIMAL,
  budget_currency TEXT DEFAULT 'AUD',

  -- Description
  description TEXT,
  official_url TEXT,

  -- Community involvement
  community_led BOOLEAN DEFAULT FALSE,
  cultural_authority BOOLEAN DEFAULT FALSE,
  consent_level TEXT DEFAULT 'Public Knowledge Commons',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link programs to interventions in ALMA
CREATE TABLE IF NOT EXISTS alma_program_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES alma_government_programs(id),
  intervention_id UUID REFERENCES alma_interventions(id),

  -- Relationship type
  relationship TEXT CHECK (relationship IN (
    'implements',        -- Program implements the intervention
    'inspired_by',      -- Program was inspired by the intervention
    'contradicts',      -- Program contradicts the intervention's approach
    'replaces',         -- Program replaces the intervention
    'expands'           -- Program expands the intervention
  )),

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sentiment aggregation view (daily)
CREATE MATERIALIZED VIEW IF NOT EXISTS alma_daily_sentiment AS
SELECT
  DATE_TRUNC('day', published_date) as date,
  source_name,
  COUNT(*) as article_count,
  AVG(sentiment_score) as avg_sentiment,
  STDDEV(sentiment_score) as sentiment_stddev,
  ARRAY_AGG(DISTINCT topics) as all_topics,
  COUNT(*) FILTER (WHERE sentiment = 'positive') as positive_count,
  COUNT(*) FILTER (WHERE sentiment = 'negative') as negative_count,
  COUNT(*) FILTER (WHERE sentiment = 'neutral') as neutral_count
FROM alma_media_articles
WHERE published_date IS NOT NULL
GROUP BY DATE_TRUNC('day', published_date), source_name
ORDER BY date DESC;

-- Sentiment correlation with programs
CREATE MATERIALIZED VIEW IF NOT EXISTS alma_sentiment_program_correlation AS
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
HAVING COUNT(a.id) > 0; -- Only programs with media coverage

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_alma_media_articles_published_date
  ON alma_media_articles(published_date DESC);

CREATE INDEX IF NOT EXISTS idx_alma_media_articles_sentiment
  ON alma_media_articles(sentiment, sentiment_score);

CREATE INDEX IF NOT EXISTS idx_alma_media_articles_source
  ON alma_media_articles(source_name);

CREATE INDEX IF NOT EXISTS idx_alma_media_articles_topics
  ON alma_media_articles USING GIN(topics);

CREATE INDEX IF NOT EXISTS idx_alma_government_programs_announced_date
  ON alma_government_programs(announced_date);

CREATE INDEX IF NOT EXISTS idx_alma_government_programs_community_led
  ON alma_government_programs(community_led, cultural_authority);

-- Functions to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_sentiment_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY alma_daily_sentiment;
  REFRESH MATERIALIZED VIEW CONCURRENTLY alma_sentiment_program_correlation;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh (called by cron or manual trigger)
COMMENT ON FUNCTION refresh_sentiment_analytics IS 'Refresh sentiment analytics materialized views. Call this after media ingestion.';

COMMIT;
