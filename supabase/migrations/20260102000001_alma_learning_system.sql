-- ALMA Learning System Migration
-- Creates tables for continuous learning scraper
-- Date: 2026-01-02

-- Source Registry: Track all known sources and their quality
CREATE TABLE IF NOT EXISTS alma_source_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Source identification
  url TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  organization TEXT,
  source_type TEXT CHECK (source_type IN ('government', 'indigenous', 'research', 'media', 'advocacy', 'legal', 'inquiry')),
  jurisdiction TEXT CHECK (jurisdiction IN ('VIC', 'QLD', 'NSW', 'NT', 'SA', 'WA', 'TAS', 'ACT', 'National', 'International')),

  -- Cultural protocols
  cultural_authority BOOLEAN DEFAULT FALSE,
  consent_level TEXT DEFAULT 'Public Knowledge Commons',

  -- Learning metrics
  last_scraped_at TIMESTAMPTZ,
  scrape_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN scrape_count > 0 THEN (success_count::DECIMAL / scrape_count * 100) ELSE 0 END
  ) STORED,

  -- Extraction quality
  total_entities_extracted INTEGER DEFAULT 0,
  avg_entities_per_scrape DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN success_count > 0 THEN (total_entities_extracted::DECIMAL / success_count) ELSE 0 END
  ) STORED,
  quality_score DECIMAL(5,2) DEFAULT 5.0, -- 0-10 scale

  -- Discovery tracking
  discovered_from TEXT, -- URL that led to this source
  discovered_at TIMESTAMPTZ,
  child_links TEXT[] DEFAULT '{}', -- Links found on this page

  -- Priority and scheduling
  priority_score DECIMAL(5,2) DEFAULT 5.0, -- Higher = scrape more often
  update_frequency TEXT DEFAULT 'monthly' CHECK (update_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'once')),
  next_scrape_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_source_registry_priority ON alma_source_registry(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_source_registry_next_scrape ON alma_source_registry(next_scrape_at);
CREATE INDEX IF NOT EXISTS idx_source_registry_jurisdiction ON alma_source_registry(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_source_registry_type ON alma_source_registry(source_type);

-- Extraction Patterns: Learn what prompts work best
CREATE TABLE IF NOT EXISTS alma_extraction_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Pattern identification
  source_type TEXT NOT NULL, -- government, indigenous, research, etc.
  pattern_name TEXT NOT NULL,
  pattern_version INTEGER DEFAULT 1,

  -- The actual prompt
  extraction_prompt TEXT NOT NULL,

  -- Learning metrics
  times_used INTEGER DEFAULT 0,
  successful_extractions INTEGER DEFAULT 0,
  total_entities_extracted INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN times_used > 0 THEN (successful_extractions::DECIMAL / times_used * 100) ELSE 0 END
  ) STORED,
  avg_entities DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN successful_extractions > 0 THEN (total_entities_extracted::DECIMAL / successful_extractions) ELSE 0 END
  ) STORED,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  superseded_by UUID REFERENCES alma_extraction_patterns(id),

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,

  UNIQUE(source_type, pattern_name, pattern_version)
);

-- Discovered Links: Track links found during scraping
CREATE TABLE IF NOT EXISTS alma_discovered_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Link details
  url TEXT UNIQUE NOT NULL,
  title TEXT,
  discovered_from TEXT NOT NULL, -- Source URL that found this link

  -- Classification
  predicted_type TEXT, -- What type of source we think this is
  predicted_relevance DECIMAL(5,2), -- 0-10 how relevant to youth justice
  jurisdiction_hint TEXT, -- Detected jurisdiction

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'scraped', 'rejected', 'error')),
  priority INTEGER DEFAULT 0, -- Higher = scrape sooner
  rejection_reason TEXT,
  error_message TEXT,

  -- Processing
  scraped_at TIMESTAMPTZ,
  added_to_registry BOOLEAN DEFAULT FALSE,

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_discovered_links_status ON alma_discovered_links(status);
CREATE INDEX IF NOT EXISTS idx_discovered_links_priority ON alma_discovered_links(priority DESC);

-- Scrape History: Detailed log of every scrape
CREATE TABLE IF NOT EXISTS alma_scrape_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- What was scraped
  source_id UUID REFERENCES alma_source_registry(id),
  source_url TEXT NOT NULL,

  -- Results
  status TEXT CHECK (status IN ('success', 'partial', 'failed', 'skipped')),
  content_length INTEGER,
  entities_found INTEGER DEFAULT 0,
  entities_inserted INTEGER DEFAULT 0,

  -- Quality assessment
  relevance_score DECIMAL(5,2),
  novelty_score DECIMAL(5,2), -- How much was new vs duplicate
  quality_score DECIMAL(5,2),

  -- Pattern used
  pattern_id UUID REFERENCES alma_extraction_patterns(id),

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Errors
  error_message TEXT,

  -- Raw data (for learning)
  extracted_data JSONB,
  links_discovered TEXT[] DEFAULT '{}',

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_scrape_history_source ON alma_scrape_history(source_id);
CREATE INDEX IF NOT EXISTS idx_scrape_history_date ON alma_scrape_history(created_at DESC);

-- Coverage Tracking: What areas are well/poorly covered
CREATE TABLE IF NOT EXISTS alma_coverage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calculated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Dimension
  dimension_type TEXT CHECK (dimension_type IN ('jurisdiction', 'topic', 'source_type', 'organization')),
  dimension_value TEXT NOT NULL,

  -- Metrics
  source_count INTEGER DEFAULT 0,
  intervention_count INTEGER DEFAULT 0,
  evidence_count INTEGER DEFAULT 0,
  last_update TIMESTAMPTZ,
  update_frequency_avg DECIMAL(5,2), -- Days between updates

  -- Coverage score (0-100)
  coverage_score DECIMAL(5,2),

  -- Gap analysis
  recommended_sources TEXT[],
  priority_rank INTEGER,

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,

  UNIQUE(dimension_type, dimension_value)
);

-- Insert default extraction patterns
INSERT INTO alma_extraction_patterns (source_type, pattern_name, extraction_prompt) VALUES
('government', 'default', 'Extract from this Australian government youth justice webpage:
- Program names and official titles
- Eligibility criteria and target cohorts
- Service locations and coverage areas
- Contact information
- Related legislation
- Published outcome data

Return as JSON with: interventions, evidence, outcomes, policies, organizations, links_to_explore'),

('indigenous', 'default', 'Extract from this Indigenous organization webpage with cultural respect:
- Community-led programs and initiatives
- Cultural elements and healing approaches
- Self-determination principles in action
- Community-defined outcomes

IMPORTANT: Mark as Community Controlled. Honor data sovereignty.

Return as JSON with: interventions, evidence, outcomes, organizations, links_to_explore'),

('research', 'default', 'Extract from this research publication:
- Study methodology and design
- Sample demographics
- Key findings with statistical significance
- Limitations acknowledged
- Policy implications
- Citations to relevant research

Return as JSON with: evidence, outcomes, organizations, links_to_explore'),

('media', 'default', 'Extract from this media article about youth justice:
- Main narrative and framing (positive/negative/neutral)
- Stakeholders quoted
- Statistics and data cited
- Policy positions mentioned
- Sentiment analysis

Return as JSON with: articles (title, date, sentiment, summary, topics), links_to_explore'),

('advocacy', 'default', 'Extract from this advocacy organization webpage:
- Campaign focus areas
- Policy recommendations
- Research citations
- Partner organizations
- Success stories and outcomes

Return as JSON with: interventions, evidence, outcomes, organizations, links_to_explore')

ON CONFLICT (source_type, pattern_name, pattern_version) DO NOTHING;

-- Function to calculate next scrape time
CREATE OR REPLACE FUNCTION calculate_next_scrape(
  p_update_frequency TEXT,
  p_priority_score DECIMAL
) RETURNS TIMESTAMPTZ AS $$
DECLARE
  base_interval INTERVAL;
  priority_factor DECIMAL;
BEGIN
  -- Base interval from frequency
  base_interval := CASE p_update_frequency
    WHEN 'daily' THEN INTERVAL '1 day'
    WHEN 'weekly' THEN INTERVAL '7 days'
    WHEN 'monthly' THEN INTERVAL '30 days'
    WHEN 'quarterly' THEN INTERVAL '90 days'
    WHEN 'yearly' THEN INTERVAL '365 days'
    ELSE INTERVAL '30 days'
  END;

  -- Higher priority = shorter interval (multiply by 0.5 to 1.5)
  priority_factor := 1.5 - (COALESCE(p_priority_score, 5) / 10);

  RETURN NOW() + (base_interval * priority_factor);
END;
$$ LANGUAGE plpgsql;

-- Function to update source metrics after scrape
CREATE OR REPLACE FUNCTION update_source_after_scrape(
  p_source_url TEXT,
  p_success BOOLEAN,
  p_entities_found INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE alma_source_registry
  SET
    updated_at = NOW(),
    last_scraped_at = NOW(),
    scrape_count = scrape_count + 1,
    success_count = success_count + CASE WHEN p_success THEN 1 ELSE 0 END,
    failure_count = failure_count + CASE WHEN NOT p_success THEN 1 ELSE 0 END,
    total_entities_extracted = total_entities_extracted + COALESCE(p_entities_found, 0),
    quality_score = CASE
      WHEN p_success AND p_entities_found > 0 THEN
        LEAST(10, quality_score + 0.1) -- Small boost for good scrapes
      WHEN NOT p_success THEN
        GREATEST(0, quality_score - 0.2) -- Penalty for failures
      ELSE quality_score
    END,
    next_scrape_at = calculate_next_scrape(update_frequency, priority_score)
  WHERE url = p_source_url;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate coverage metrics
CREATE OR REPLACE FUNCTION calculate_coverage_metrics() RETURNS VOID AS $$
BEGIN
  -- Clear old metrics
  DELETE FROM alma_coverage_metrics WHERE calculated_at < NOW() - INTERVAL '1 day';

  -- Calculate jurisdiction coverage
  INSERT INTO alma_coverage_metrics (dimension_type, dimension_value, source_count, intervention_count, coverage_score)
  SELECT
    'jurisdiction',
    COALESCE(s.jurisdiction, 'Unknown'),
    COUNT(DISTINCT s.id),
    COALESCE(SUM(s.total_entities_extracted), 0),
    LEAST(100, COUNT(DISTINCT s.id) * 5 + COALESCE(SUM(s.total_entities_extracted), 0) * 0.5)
  FROM alma_source_registry s
  GROUP BY s.jurisdiction
  ON CONFLICT (dimension_type, dimension_value) DO UPDATE SET
    source_count = EXCLUDED.source_count,
    intervention_count = EXCLUDED.intervention_count,
    coverage_score = EXCLUDED.coverage_score,
    calculated_at = NOW();

  -- Calculate source type coverage
  INSERT INTO alma_coverage_metrics (dimension_type, dimension_value, source_count, intervention_count, coverage_score)
  SELECT
    'source_type',
    COALESCE(s.source_type, 'Unknown'),
    COUNT(DISTINCT s.id),
    COALESCE(SUM(s.total_entities_extracted), 0),
    LEAST(100, COUNT(DISTINCT s.id) * 5 + COALESCE(SUM(s.total_entities_extracted), 0) * 0.5)
  FROM alma_source_registry s
  GROUP BY s.source_type
  ON CONFLICT (dimension_type, dimension_value) DO UPDATE SET
    source_count = EXCLUDED.source_count,
    intervention_count = EXCLUDED.intervention_count,
    coverage_score = EXCLUDED.coverage_score,
    calculated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies
ALTER TABLE alma_source_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE alma_extraction_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE alma_discovered_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE alma_scrape_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE alma_coverage_metrics ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "read_source_registry" ON alma_source_registry FOR SELECT USING (true);
CREATE POLICY "read_extraction_patterns" ON alma_extraction_patterns FOR SELECT USING (true);
CREATE POLICY "read_discovered_links" ON alma_discovered_links FOR SELECT USING (true);
CREATE POLICY "read_scrape_history" ON alma_scrape_history FOR SELECT USING (true);
CREATE POLICY "read_coverage_metrics" ON alma_coverage_metrics FOR SELECT USING (true);

-- Allow service role to modify
CREATE POLICY "admin_source_registry" ON alma_source_registry FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "admin_extraction_patterns" ON alma_extraction_patterns FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "admin_discovered_links" ON alma_discovered_links FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "admin_scrape_history" ON alma_scrape_history FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "admin_coverage_metrics" ON alma_coverage_metrics FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Comment on tables
COMMENT ON TABLE alma_source_registry IS 'Registry of all known sources with learning metrics';
COMMENT ON TABLE alma_extraction_patterns IS 'Learned extraction prompts that improve over time';
COMMENT ON TABLE alma_discovered_links IS 'Links discovered during scraping for follow-up';
COMMENT ON TABLE alma_scrape_history IS 'Detailed history of all scraping activity';
COMMENT ON TABLE alma_coverage_metrics IS 'Calculated coverage by jurisdiction, topic, etc.';
