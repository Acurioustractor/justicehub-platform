-- =============================================================================
-- ALMA Enhanced Data Model Migration
-- =============================================================================
-- Purpose: Add comprehensive data infrastructure for:
--   1. Raw content storage (re-processing, audit trail)
--   2. Vector embeddings (semantic search, similarity)
--   3. Flexible tagging system (faceted search, categorization)
--   4. Funding-intervention linking (cost-effectiveness analysis)
--   5. Geographic data (mapping, regional analysis)
--   6. Dashboard materialized views (fast reporting)
--   7. Time-series tracking (trend analysis)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. RAW CONTENT STORAGE
-- -----------------------------------------------------------------------------
-- Store scraped content for re-processing without re-scraping
-- Enables: Audit trail, re-extraction with improved prompts, full-text search

CREATE TABLE IF NOT EXISTS alma_raw_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Source identification
  source_url TEXT NOT NULL,
  source_type TEXT CHECK (source_type IN ('webpage', 'pdf', 'document', 'api', 'rss')),

  -- Content storage
  raw_content TEXT NOT NULL,
  content_hash TEXT NOT NULL, -- SHA256 for deduplication
  content_length INTEGER GENERATED ALWAYS AS (length(raw_content)) STORED,

  -- File storage (for PDFs and documents)
  file_path TEXT, -- Local path to stored file (e.g., 'data/pdfs/AIHW_Youth_Justice_2023.pdf')
  file_size_bytes BIGINT,
  file_mime_type TEXT, -- 'application/pdf', 'text/html', etc.
  file_hash TEXT, -- SHA256 of the actual file for integrity verification

  -- Extraction metadata
  extraction_method TEXT, -- 'firecrawl', 'playwright', 'pdfjs', 'manual'
  extracted_at TIMESTAMPTZ DEFAULT NOW(),
  page_count INTEGER, -- For PDFs

  -- Processing status
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN (
    'pending', 'processing', 'completed', 'failed', 'needs_reprocessing'
  )),
  last_processed_at TIMESTAMPTZ,
  processing_error TEXT,

  -- Quality metrics
  language TEXT DEFAULT 'en',
  word_count INTEGER,
  relevance_score DECIMAL(3,2), -- 0.00 to 1.00

  -- Linked entities (populated after extraction)
  interventions_extracted INTEGER DEFAULT 0,
  evidence_extracted INTEGER DEFAULT 0,
  funding_data_extracted INTEGER DEFAULT 0,

  -- Full-text search
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(source_url, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(LEFT(raw_content, 50000), '')), 'B')
  ) STORED,

  UNIQUE(content_hash)
);

-- Indexes for raw content
CREATE INDEX idx_alma_raw_content_source_url ON alma_raw_content(source_url);
CREATE INDEX idx_alma_raw_content_status ON alma_raw_content(processing_status);
CREATE INDEX idx_alma_raw_content_extracted_at ON alma_raw_content(extracted_at);
CREATE INDEX idx_alma_raw_content_search ON alma_raw_content USING GIN(search_vector);
CREATE INDEX idx_alma_raw_content_file_path ON alma_raw_content(file_path) WHERE file_path IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 1b. SOURCE DOCUMENTS (Authoritative PDFs and Reports)
-- -----------------------------------------------------------------------------
-- Store metadata about authoritative source documents for legitimacy and linking
-- Enables: Citation, verification, audit trail, source linking

CREATE TABLE IF NOT EXISTS alma_source_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Document identification
  title TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'government_report', 'academic_paper', 'inquiry_report', 'policy_document',
    'evaluation_report', 'annual_report', 'budget_paper', 'statistical_report',
    'community_report', 'media_article', 'legal_document', 'other'
  )),

  -- Source information
  source_url TEXT NOT NULL,
  source_organization TEXT,
  author TEXT,
  publication_date DATE,
  report_period TEXT, -- e.g., '2023-24'

  -- File storage
  file_path TEXT, -- Local storage path
  file_name TEXT,
  file_size_bytes BIGINT,
  file_hash TEXT, -- SHA256 for verification
  mime_type TEXT DEFAULT 'application/pdf',
  page_count INTEGER,

  -- Download/access info
  downloaded_at TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ, -- Last checked if URL still works
  is_accessible BOOLEAN DEFAULT TRUE,

  -- Content summary
  abstract TEXT,
  key_findings JSONB DEFAULT '[]', -- Array of key findings
  topics TEXT[], -- Main topics covered

  -- Jurisdiction and scope
  jurisdiction TEXT,
  scope TEXT CHECK (scope IN ('national', 'state', 'regional', 'local', 'international')),

  -- Credibility/authority
  authority_level TEXT CHECK (authority_level IN (
    'primary_source', 'government_official', 'peer_reviewed',
    'grey_literature', 'media', 'community_voice'
  )),
  citation_count INTEGER DEFAULT 0, -- How many times we've cited this

  -- Full-text search
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(source_organization, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(abstract, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(topics, ' '), '')), 'D')
  ) STORED,

  UNIQUE(source_url)
);

CREATE INDEX idx_alma_source_documents_type ON alma_source_documents(document_type);
CREATE INDEX idx_alma_source_documents_jurisdiction ON alma_source_documents(jurisdiction);
CREATE INDEX idx_alma_source_documents_org ON alma_source_documents(source_organization);
CREATE INDEX idx_alma_source_documents_search ON alma_source_documents USING GIN(search_vector);
CREATE INDEX idx_alma_source_documents_topics ON alma_source_documents USING GIN(topics);

-- Junction table to link entities to source documents
CREATE TABLE IF NOT EXISTS alma_entity_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- The entity being cited
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'intervention', 'evidence', 'outcome', 'context', 'funding'
  )),
  entity_id UUID NOT NULL,

  -- The source document
  source_document_id UUID NOT NULL REFERENCES alma_source_documents(id) ON DELETE CASCADE,

  -- Citation details
  page_numbers TEXT, -- e.g., 'pp. 45-52'
  section_reference TEXT, -- e.g., 'Chapter 3.2'
  quote TEXT, -- Direct quote from document
  citation_context TEXT, -- Why this source is relevant

  -- Verification
  verified_by UUID, -- User who verified the link
  verified_at TIMESTAMPTZ,

  UNIQUE(entity_type, entity_id, source_document_id)
);

CREATE INDEX idx_alma_entity_sources_entity ON alma_entity_sources(entity_type, entity_id);
CREATE INDEX idx_alma_entity_sources_document ON alma_entity_sources(source_document_id);

-- Update citation count when sources are linked
CREATE OR REPLACE FUNCTION update_citation_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE alma_source_documents SET citation_count = citation_count + 1 WHERE id = NEW.source_document_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE alma_source_documents SET citation_count = citation_count - 1 WHERE id = OLD.source_document_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_citation_count
AFTER INSERT OR DELETE ON alma_entity_sources
FOR EACH ROW EXECUTE FUNCTION update_citation_count();

-- -----------------------------------------------------------------------------
-- 2. VECTOR EMBEDDINGS FOR SEMANTIC SEARCH
-- -----------------------------------------------------------------------------
-- Store embeddings for interventions, evidence, and content
-- Enables: Semantic search, similarity matching, clustering

-- Note: Using pgvector extension - ensure it's enabled
-- CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS alma_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Polymorphic reference to any ALMA entity
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'intervention', 'evidence', 'outcome', 'context', 'raw_content', 'funding'
  )),
  entity_id UUID NOT NULL,

  -- Embedding data
  embedding_model TEXT NOT NULL DEFAULT 'text-embedding-3-small',
  embedding_dimensions INTEGER NOT NULL DEFAULT 1536,
  -- Note: Using TEXT to store embedding as JSON array since vector type requires extension
  -- If pgvector is enabled, change to: embedding VECTOR(1536)
  embedding_data JSONB NOT NULL,

  -- Text that was embedded (for debugging/re-embedding)
  source_text TEXT NOT NULL,
  source_text_hash TEXT NOT NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  UNIQUE(entity_type, entity_id, embedding_model)
);

-- Indexes for embeddings
CREATE INDEX idx_alma_embeddings_entity ON alma_embeddings(entity_type, entity_id);
CREATE INDEX idx_alma_embeddings_model ON alma_embeddings(embedding_model);

-- -----------------------------------------------------------------------------
-- 3. FLEXIBLE TAGGING SYSTEM
-- -----------------------------------------------------------------------------
-- Hierarchical tags for faceted search and categorization
-- Enables: Drill-down filtering, dynamic categorization, reporting dimensions

CREATE TABLE IF NOT EXISTS alma_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Tag hierarchy
  category TEXT NOT NULL, -- 'topic', 'jurisdiction', 'cohort', 'approach', 'outcome_type', 'source_type'
  name TEXT NOT NULL,
  slug TEXT NOT NULL, -- URL-safe version
  parent_id UUID REFERENCES alma_tags(id),

  -- Display
  display_name TEXT,
  description TEXT,
  color TEXT, -- hex color for UI
  icon TEXT, -- icon name for UI

  -- Metadata
  is_system BOOLEAN DEFAULT FALSE, -- system-managed vs user-created
  usage_count INTEGER DEFAULT 0,

  UNIQUE(category, slug)
);

-- Junction table for tagging any ALMA entity
CREATE TABLE IF NOT EXISTS alma_entity_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Polymorphic reference
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'intervention', 'evidence', 'outcome', 'context', 'raw_content', 'funding'
  )),
  entity_id UUID NOT NULL,

  -- Tag reference
  tag_id UUID NOT NULL REFERENCES alma_tags(id) ON DELETE CASCADE,

  -- Attribution
  tagged_by UUID, -- user who added tag
  confidence DECIMAL(3,2) DEFAULT 1.00, -- for AI-generated tags

  UNIQUE(entity_type, entity_id, tag_id)
);

-- Indexes for tags
CREATE INDEX idx_alma_tags_category ON alma_tags(category);
CREATE INDEX idx_alma_tags_parent ON alma_tags(parent_id);
CREATE INDEX idx_alma_entity_tags_entity ON alma_entity_tags(entity_type, entity_id);
CREATE INDEX idx_alma_entity_tags_tag ON alma_entity_tags(tag_id);

-- Pre-populate system tags
INSERT INTO alma_tags (category, name, slug, display_name, is_system) VALUES
-- Topics
('topic', 'Detention', 'detention', 'Detention & Custody', TRUE),
('topic', 'Diversion', 'diversion', 'Diversion Programs', TRUE),
('topic', 'Prevention', 'prevention', 'Prevention & Early Intervention', TRUE),
('topic', 'Recidivism', 'recidivism', 'Recidivism & Reoffending', TRUE),
('topic', 'Mental Health', 'mental-health', 'Mental Health', TRUE),
('topic', 'Education', 'education', 'Education & Training', TRUE),
('topic', 'Employment', 'employment', 'Employment & Skills', TRUE),
('topic', 'Family', 'family', 'Family Support', TRUE),
('topic', 'Housing', 'housing', 'Housing & Homelessness', TRUE),
('topic', 'Substance Use', 'substance-use', 'Substance Use', TRUE),
('topic', 'Trauma', 'trauma', 'Trauma-Informed Care', TRUE),
('topic', 'Cultural Connection', 'cultural-connection', 'Cultural Connection', TRUE),
('topic', 'Justice Reinvestment', 'justice-reinvestment', 'Justice Reinvestment', TRUE),
('topic', 'Restorative Justice', 'restorative-justice', 'Restorative Justice', TRUE),
('topic', 'Youth Conferencing', 'youth-conferencing', 'Youth Conferencing', TRUE),
-- Jurisdictions
('jurisdiction', 'National', 'national', 'Australia (National)', TRUE),
('jurisdiction', 'NSW', 'nsw', 'New South Wales', TRUE),
('jurisdiction', 'VIC', 'vic', 'Victoria', TRUE),
('jurisdiction', 'QLD', 'qld', 'Queensland', TRUE),
('jurisdiction', 'WA', 'wa', 'Western Australia', TRUE),
('jurisdiction', 'SA', 'sa', 'South Australia', TRUE),
('jurisdiction', 'TAS', 'tas', 'Tasmania', TRUE),
('jurisdiction', 'NT', 'nt', 'Northern Territory', TRUE),
('jurisdiction', 'ACT', 'act', 'Australian Capital Territory', TRUE),
-- Cohorts
('cohort', 'Aboriginal & Torres Strait Islander', 'indigenous', 'First Nations Youth', TRUE),
('cohort', 'Under 14', 'under-14', 'Children Under 14', TRUE),
('cohort', 'Adolescents 14-17', 'adolescents', 'Adolescents 14-17', TRUE),
('cohort', 'Young Adults 18-24', 'young-adults', 'Young Adults 18-24', TRUE),
('cohort', 'Girls & Young Women', 'female', 'Girls & Young Women', TRUE),
('cohort', 'LGBTIQ+', 'lgbtiq', 'LGBTIQ+ Youth', TRUE),
('cohort', 'Disability', 'disability', 'Youth with Disability', TRUE),
('cohort', 'Care Leavers', 'care-leavers', 'Care Leavers', TRUE),
('cohort', 'Rural & Remote', 'rural-remote', 'Rural & Remote', TRUE),
-- Source types
('source_type', 'Government Report', 'government', 'Government Report', TRUE),
('source_type', 'Academic Research', 'academic', 'Academic Research', TRUE),
('source_type', 'NGO Report', 'ngo', 'NGO/Advocacy Report', TRUE),
('source_type', 'Media', 'media', 'Media Article', TRUE),
('source_type', 'Inquiry/Royal Commission', 'inquiry', 'Inquiry/Royal Commission', TRUE),
('source_type', 'Community Voice', 'community', 'Community Voice/Lived Experience', TRUE)
ON CONFLICT (category, slug) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 4. FUNDING-INTERVENTION LINKING
-- -----------------------------------------------------------------------------
-- Connect funding data to specific interventions for cost-effectiveness analysis
-- Enables: Program-level ROI, funding gap analysis, investment recommendations

CREATE TABLE IF NOT EXISTS alma_intervention_funding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Links
  intervention_id UUID NOT NULL REFERENCES alma_interventions(id) ON DELETE CASCADE,
  funding_data_id UUID REFERENCES alma_funding_data(id) ON DELETE SET NULL,

  -- Funding details (when no funding_data record)
  funding_source TEXT, -- 'State Government', 'Federal Government', 'Philanthropic', 'Mixed'
  funding_amount DECIMAL(15,2),
  funding_period_start DATE,
  funding_period_end DATE,
  funding_type TEXT CHECK (funding_type IN (
    'recurrent', 'one-off', 'pilot', 'grant', 'contract'
  )),

  -- Cost metrics
  annual_budget DECIMAL(15,2),
  cost_per_participant DECIMAL(10,2),
  participants_per_year INTEGER,

  -- Effectiveness metrics
  cost_per_successful_outcome DECIMAL(10,2),
  cost_benefit_ratio DECIMAL(5,2), -- e.g., 3.50 = $3.50 return per $1 spent
  comparison_to_detention DECIMAL(5,2), -- e.g., 0.05 = 5% of detention cost

  -- Data quality
  data_source TEXT,
  data_year INTEGER,
  confidence_level TEXT CHECK (confidence_level IN ('high', 'medium', 'low', 'estimated')),
  notes TEXT,

  UNIQUE(intervention_id, funding_data_id)
);

CREATE INDEX idx_alma_intervention_funding_intervention ON alma_intervention_funding(intervention_id);
CREATE INDEX idx_alma_intervention_funding_source ON alma_intervention_funding(funding_source);

-- -----------------------------------------------------------------------------
-- 5. GEOGRAPHIC DATA
-- -----------------------------------------------------------------------------
-- Add geographic coordinates for mapping and regional analysis

ALTER TABLE alma_interventions
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8),
ADD COLUMN IF NOT EXISTS service_area_km INTEGER, -- radius of service area
ADD COLUMN IF NOT EXISTS location_type TEXT CHECK (location_type IN (
  'metropolitan', 'regional', 'rural', 'remote', 'very_remote', 'statewide', 'national'
));

-- Add location lookup table for Australian localities
CREATE TABLE IF NOT EXISTS alma_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Location details
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  postcode TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),

  -- Classification
  location_type TEXT CHECK (location_type IN (
    'metropolitan', 'regional', 'rural', 'remote', 'very_remote'
  )),
  lga_name TEXT, -- Local Government Area
  sa3_name TEXT, -- Statistical Area Level 3

  -- Indigenous context
  traditional_country TEXT,
  indigenous_population_pct DECIMAL(5,2),

  UNIQUE(name, state)
);

-- Pre-populate major cities
INSERT INTO alma_locations (name, state, latitude, longitude, location_type) VALUES
('Sydney', 'NSW', -33.8688, 151.2093, 'metropolitan'),
('Melbourne', 'VIC', -37.8136, 144.9631, 'metropolitan'),
('Brisbane', 'QLD', -27.4698, 153.0251, 'metropolitan'),
('Perth', 'WA', -31.9505, 115.8605, 'metropolitan'),
('Adelaide', 'SA', -34.9285, 138.6007, 'metropolitan'),
('Hobart', 'TAS', -42.8821, 147.3272, 'metropolitan'),
('Darwin', 'NT', -12.4634, 130.8456, 'metropolitan'),
('Canberra', 'ACT', -35.2809, 149.1300, 'metropolitan'),
('Alice Springs', 'NT', -23.6980, 133.8807, 'remote'),
('Cairns', 'QLD', -16.9186, 145.7781, 'regional'),
('Townsville', 'QLD', -19.2590, 146.8169, 'regional'),
('Newcastle', 'NSW', -32.9283, 151.7817, 'regional'),
('Geelong', 'VIC', -38.1499, 144.3617, 'regional'),
('Broome', 'WA', -17.9614, 122.2359, 'remote'),
('Dubbo', 'NSW', -32.2569, 148.6011, 'regional'),
('Wagga Wagga', 'NSW', -35.1082, 147.3598, 'regional'),
('Bendigo', 'VIC', -36.7570, 144.2794, 'regional'),
('Ballarat', 'VIC', -37.5622, 143.8503, 'regional'),
('Toowoomba', 'QLD', -27.5598, 151.9507, 'regional'),
('Rockhampton', 'QLD', -23.3791, 150.5100, 'regional')
ON CONFLICT (name, state) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 6. DASHBOARD MATERIALIZED VIEWS
-- -----------------------------------------------------------------------------
-- Pre-aggregated data for fast dashboard rendering

-- Interventions summary by jurisdiction and type
CREATE MATERIALIZED VIEW IF NOT EXISTS alma_dashboard_interventions AS
SELECT
  COALESCE(geography[1], 'National') as jurisdiction,
  type as intervention_type,
  evidence_level,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE evidence_level IN ('Proven', 'Effective')) as evidence_backed_count,
  AVG(portfolio_score) as avg_portfolio_score,
  COUNT(*) FILTER (WHERE review_status = 'Published') as published_count
FROM alma_interventions
GROUP BY COALESCE(geography[1], 'National'), type, evidence_level;

CREATE UNIQUE INDEX idx_alma_dashboard_interventions
ON alma_dashboard_interventions(jurisdiction, intervention_type, evidence_level);

-- Funding summary by jurisdiction
CREATE MATERIALIZED VIEW IF NOT EXISTS alma_dashboard_funding AS
SELECT
  jurisdiction,
  report_year,
  SUM(total_expenditure) as total_expenditure,
  SUM(detention_expenditure) as detention_expenditure,
  SUM(community_expenditure) as community_expenditure,
  AVG(cost_per_day_detention) as avg_detention_cost_per_day,
  AVG(cost_per_day_community) as avg_community_cost_per_day,
  CASE
    WHEN SUM(total_expenditure) > 0
    THEN ROUND((SUM(detention_expenditure) / SUM(total_expenditure) * 100)::NUMERIC, 1)
    ELSE NULL
  END as detention_percentage
FROM alma_funding_data
WHERE total_expenditure IS NOT NULL
GROUP BY jurisdiction, report_year;

CREATE UNIQUE INDEX idx_alma_dashboard_funding
ON alma_dashboard_funding(jurisdiction, report_year);

-- Source quality metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS alma_dashboard_sources AS
SELECT
  source_type,
  jurisdiction,
  COUNT(*) as source_count,
  AVG(success_rate) as avg_success_rate,
  AVG(quality_score) as avg_quality_score,
  SUM(total_entities_extracted) as total_entities,
  MAX(last_scraped_at) as last_scraped
FROM alma_source_registry
GROUP BY source_type, jurisdiction;

CREATE UNIQUE INDEX idx_alma_dashboard_sources
ON alma_dashboard_sources(source_type, jurisdiction);

-- Processing queue status
CREATE MATERIALIZED VIEW IF NOT EXISTS alma_dashboard_queue AS
SELECT
  status,
  predicted_type as source_type,
  jurisdiction_hint as jurisdiction,
  COUNT(*) as count,
  AVG(priority) as avg_priority,
  MIN(created_at) as oldest_pending
FROM alma_discovered_links
GROUP BY status, predicted_type, jurisdiction_hint;

-- Tag usage summary
CREATE MATERIALIZED VIEW IF NOT EXISTS alma_dashboard_tags AS
SELECT
  t.category,
  t.name,
  t.slug,
  COUNT(et.id) as usage_count,
  COUNT(DISTINCT et.entity_id) as unique_entities
FROM alma_tags t
LEFT JOIN alma_entity_tags et ON t.id = et.tag_id
GROUP BY t.id, t.category, t.name, t.slug;

CREATE UNIQUE INDEX idx_alma_dashboard_tags ON alma_dashboard_tags(category, slug);

-- Function to refresh all dashboard views
CREATE OR REPLACE FUNCTION refresh_alma_dashboards()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY alma_dashboard_interventions;
  REFRESH MATERIALIZED VIEW CONCURRENTLY alma_dashboard_funding;
  REFRESH MATERIALIZED VIEW CONCURRENTLY alma_dashboard_sources;
  REFRESH MATERIALIZED VIEW alma_dashboard_queue;
  REFRESH MATERIALIZED VIEW CONCURRENTLY alma_dashboard_tags;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 7. TIME-SERIES TRACKING
-- -----------------------------------------------------------------------------
-- Track changes over time for trend analysis

CREATE TABLE IF NOT EXISTS alma_metrics_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recorded_at TIMESTAMPTZ DEFAULT NOW(),

  -- Metric identification
  metric_name TEXT NOT NULL,
  metric_category TEXT NOT NULL, -- 'interventions', 'funding', 'sources', 'processing'

  -- Dimensions
  jurisdiction TEXT,
  intervention_type TEXT,
  source_type TEXT,

  -- Values
  value_numeric DECIMAL(15,2),
  value_count INTEGER,
  value_percentage DECIMAL(5,2),

  -- Context
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_alma_metrics_history_time ON alma_metrics_history(recorded_at);
CREATE INDEX idx_alma_metrics_history_metric ON alma_metrics_history(metric_name, metric_category);

-- Function to snapshot current metrics
CREATE OR REPLACE FUNCTION snapshot_alma_metrics()
RETURNS void AS $$
BEGIN
  -- Intervention counts by type
  INSERT INTO alma_metrics_history (metric_name, metric_category, intervention_type, value_count)
  SELECT
    'intervention_count',
    'interventions',
    type,
    COUNT(*)
  FROM alma_interventions
  GROUP BY type;

  -- Funding totals by jurisdiction
  INSERT INTO alma_metrics_history (metric_name, metric_category, jurisdiction, value_numeric)
  SELECT
    'total_expenditure',
    'funding',
    jurisdiction,
    SUM(total_expenditure)
  FROM alma_funding_data
  GROUP BY jurisdiction;

  -- Source processing metrics
  INSERT INTO alma_metrics_history (metric_name, metric_category, source_type, value_count, value_percentage)
  SELECT
    'source_success_rate',
    'sources',
    source_type,
    COUNT(*),
    AVG(success_rate)
  FROM alma_source_registry
  GROUP BY source_type;

  -- Queue status
  INSERT INTO alma_metrics_history (metric_name, metric_category, value_count, metadata)
  SELECT
    'pending_links',
    'processing',
    COUNT(*),
    jsonb_build_object(
      'by_status', jsonb_object_agg(status, cnt)
    )
  FROM (
    SELECT status, COUNT(*) as cnt
    FROM alma_discovered_links
    GROUP BY status
  ) s;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 8. CONTENT-ENTITY LINKING
-- -----------------------------------------------------------------------------
-- Track which entities were extracted from which content

CREATE TABLE IF NOT EXISTS alma_content_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Link to raw content
  raw_content_id UUID NOT NULL REFERENCES alma_raw_content(id) ON DELETE CASCADE,

  -- Link to extracted entity
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'intervention', 'evidence', 'outcome', 'context', 'funding'
  )),
  entity_id UUID NOT NULL,

  -- Extraction metadata
  extraction_confidence DECIMAL(3,2) DEFAULT 1.00,
  extraction_method TEXT, -- 'ai', 'rule-based', 'manual'
  extracted_at TIMESTAMPTZ DEFAULT NOW(),

  -- Source location in content (for highlighting)
  content_start_pos INTEGER,
  content_end_pos INTEGER,
  matched_text TEXT,

  UNIQUE(raw_content_id, entity_type, entity_id)
);

CREATE INDEX idx_alma_content_entities_content ON alma_content_entities(raw_content_id);
CREATE INDEX idx_alma_content_entities_entity ON alma_content_entities(entity_type, entity_id);

-- -----------------------------------------------------------------------------
-- 9. SEARCH OPTIMIZATION
-- -----------------------------------------------------------------------------
-- Combined search view for unified search across all entity types

CREATE OR REPLACE VIEW alma_unified_search AS
SELECT
  'intervention' as entity_type,
  id as entity_id,
  name as title,
  description,
  type as category,
  geography[1] as jurisdiction,
  search_vector,
  portfolio_score as relevance_boost,
  created_at
FROM alma_interventions
WHERE review_status = 'Published'

UNION ALL

SELECT
  'evidence' as entity_type,
  id as entity_id,
  title,
  findings as description,
  evidence_type as category,
  NULL as jurisdiction,
  search_vector,
  CASE evidence_type
    WHEN 'RCT' THEN 1.0
    WHEN 'Quasi-experimental' THEN 0.9
    WHEN 'Program eval' THEN 0.8
    ELSE 0.5
  END as relevance_boost,
  created_at
FROM alma_evidence

UNION ALL

SELECT
  'funding' as entity_type,
  id as entity_id,
  source_name as title,
  CONCAT('$', (total_expenditure/1000000)::TEXT, 'M expenditure in ', report_year) as description,
  source_type as category,
  jurisdiction,
  to_tsvector('english', COALESCE(source_name, '') || ' ' || COALESCE(jurisdiction, '')) as search_vector,
  0.7 as relevance_boost,
  created_at
FROM alma_funding_data;

-- Full-text search function across all entities
CREATE OR REPLACE FUNCTION search_alma_unified(
  query_text TEXT,
  entity_types TEXT[] DEFAULT NULL,
  jurisdictions TEXT[] DEFAULT NULL,
  limit_results INTEGER DEFAULT 50
)
RETURNS TABLE (
  entity_type TEXT,
  entity_id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  jurisdiction TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.entity_type,
    s.entity_id,
    s.title,
    LEFT(s.description, 500) as description,
    s.category,
    s.jurisdiction,
    (ts_rank(s.search_vector, websearch_to_tsquery('english', query_text)) * s.relevance_boost) as rank
  FROM alma_unified_search s
  WHERE
    s.search_vector @@ websearch_to_tsquery('english', query_text)
    AND (entity_types IS NULL OR s.entity_type = ANY(entity_types))
    AND (jurisdictions IS NULL OR s.jurisdiction = ANY(jurisdictions) OR s.jurisdiction IS NULL)
  ORDER BY rank DESC
  LIMIT limit_results;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 10. TRIGGERS FOR AUTOMATED MAINTENANCE
-- -----------------------------------------------------------------------------

-- Update tag usage counts
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE alma_tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE alma_tags SET usage_count = usage_count - 1 WHERE id = OLD.tag_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tag_usage
AFTER INSERT OR DELETE ON alma_entity_tags
FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

-- Update raw_content processing stats
CREATE OR REPLACE FUNCTION update_raw_content_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE alma_raw_content
  SET
    interventions_extracted = (
      SELECT COUNT(*) FROM alma_content_entities
      WHERE raw_content_id = NEW.raw_content_id AND entity_type = 'intervention'
    ),
    evidence_extracted = (
      SELECT COUNT(*) FROM alma_content_entities
      WHERE raw_content_id = NEW.raw_content_id AND entity_type = 'evidence'
    ),
    funding_data_extracted = (
      SELECT COUNT(*) FROM alma_content_entities
      WHERE raw_content_id = NEW.raw_content_id AND entity_type = 'funding'
    ),
    processing_status = 'completed',
    last_processed_at = NOW()
  WHERE id = NEW.raw_content_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_raw_content_stats
AFTER INSERT ON alma_content_entities
FOR EACH ROW EXECUTE FUNCTION update_raw_content_stats();

-- Auto-refresh dashboard views (can be called by cron)
-- Note: For production, set up pg_cron or external scheduler

-- -----------------------------------------------------------------------------
-- 11. RLS POLICIES FOR NEW TABLES
-- -----------------------------------------------------------------------------

ALTER TABLE alma_raw_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE alma_source_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE alma_entity_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE alma_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE alma_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE alma_entity_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE alma_intervention_funding ENABLE ROW LEVEL SECURITY;
ALTER TABLE alma_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE alma_metrics_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE alma_content_entities ENABLE ROW LEVEL SECURITY;

-- Public read access for reference data
CREATE POLICY "Public read for tags" ON alma_tags FOR SELECT USING (true);
CREATE POLICY "Public read for locations" ON alma_locations FOR SELECT USING (true);
CREATE POLICY "Public read for source_documents" ON alma_source_documents FOR SELECT USING (true);
CREATE POLICY "Public read for entity_sources" ON alma_entity_sources FOR SELECT USING (true);

-- Authenticated read for analytics
CREATE POLICY "Authenticated read for raw_content" ON alma_raw_content
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read for embeddings" ON alma_embeddings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read for entity_tags" ON alma_entity_tags
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read for intervention_funding" ON alma_intervention_funding
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read for metrics_history" ON alma_metrics_history
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read for content_entities" ON alma_content_entities
  FOR SELECT TO authenticated USING (true);

-- Service role full access
CREATE POLICY "Service role full access raw_content" ON alma_raw_content
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access embeddings" ON alma_embeddings
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access entity_tags" ON alma_entity_tags
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access intervention_funding" ON alma_intervention_funding
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access metrics_history" ON alma_metrics_history
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access content_entities" ON alma_content_entities
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access source_documents" ON alma_source_documents
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access entity_sources" ON alma_entity_sources
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- MIGRATION COMPLETE
-- -----------------------------------------------------------------------------
-- Summary of new capabilities:
--
-- DATA STORAGE:
-- 1. alma_raw_content - Store scraped content with file paths for re-processing
-- 2. alma_source_documents - Authoritative PDFs/reports with citation tracking
-- 3. alma_entity_sources - Link any entity to its source documents
--
-- SEARCH & DISCOVERY:
-- 4. alma_embeddings - Vector embeddings for semantic search
-- 5. alma_tags + alma_entity_tags - Flexible tagging system (45 pre-populated)
-- 6. alma_unified_search view + search_alma_unified() - Cross-entity search
--
-- ANALYSIS & REPORTING:
-- 7. alma_intervention_funding - Link interventions to funding data
-- 8. alma_locations - Geographic coordinates for mapping (20 pre-populated)
-- 9. 5 materialized views - Pre-aggregated dashboard data
-- 10. alma_metrics_history - Time-series tracking for trends
--
-- AUDIT & LINKING:
-- 11. alma_content_entities - Track content-to-entity extraction provenance
-- 12. Automated triggers for stats maintenance
-- 13. RLS policies for security
--
-- NEW TABLES SUMMARY:
-- - alma_raw_content (with file_path, file_hash for PDFs)
-- - alma_source_documents (authoritative document registry)
-- - alma_entity_sources (citation linking)
-- - alma_embeddings (semantic search)
-- - alma_tags (taxonomy)
-- - alma_entity_tags (tagging junction)
-- - alma_intervention_funding (cost-effectiveness)
-- - alma_locations (geographic data)
-- - alma_metrics_history (time-series)
-- - alma_content_entities (extraction provenance)
--
-- Next steps:
-- - Run: SELECT refresh_alma_dashboards();
-- - Set up pg_cron for periodic dashboard refresh
-- - Update extraction scripts to use new tables
-- =============================================================================
