-- Justice Matrix Source Discovery Tables
-- Supports Ralph's autonomous research pipeline

-- ===========================================
-- SOURCES TABLE - Track Scraping Sources
-- ===========================================

CREATE TABLE IF NOT EXISTS justice_matrix_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Source identification
    name TEXT NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- 'court_database', 'advocacy_org', 'legal_database', 'regional_body', 'news'
    url TEXT NOT NULL,

    -- Geographic/jurisdictional scope
    region VARCHAR(50), -- 'europe', 'americas', 'asia_pacific', 'africa', 'global'
    jurisdictions TEXT[], -- Countries/jurisdictions this source covers

    -- Source metadata
    organization TEXT, -- Owning organization
    description TEXT,
    data_format VARCHAR(50), -- 'html', 'api', 'rss', 'pdf'
    requires_auth BOOLEAN DEFAULT FALSE,
    auth_type VARCHAR(20), -- 'none', 'api_key', 'oauth', 'session'

    -- Scraping configuration
    scrape_frequency VARCHAR(20) DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly', 'manual'
    scrape_priority INTEGER DEFAULT 5, -- 1 (highest) to 10 (lowest)
    rate_limit_ms INTEGER DEFAULT 1000, -- Delay between requests
    css_selectors JSONB, -- Selectors for data extraction
    extraction_patterns JSONB, -- Regex or AI extraction patterns

    -- Health tracking
    is_active BOOLEAN DEFAULT TRUE,
    last_scraped_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,
    last_error TEXT,
    success_rate DECIMAL(5,2) DEFAULT 100.00, -- Percentage
    total_items_found INTEGER DEFAULT 0,
    total_items_approved INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- DISCOVERED TABLE - Pending Review Queue
-- ===========================================

CREATE TABLE IF NOT EXISTS justice_matrix_discovered (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Source tracking
    source_id UUID REFERENCES justice_matrix_sources(id),
    source_url TEXT NOT NULL, -- Original URL where item was found

    -- Item type
    item_type VARCHAR(20) NOT NULL, -- 'case', 'campaign', 'resource'

    -- Raw extracted data
    raw_data JSONB NOT NULL, -- All extracted fields before normalization

    -- AI-extracted structured data (proposed)
    extracted_title TEXT,
    extracted_jurisdiction TEXT,
    extracted_year INTEGER,
    extracted_categories TEXT[],
    extracted_summary TEXT,
    extracted_lat DECIMAL(10, 7),
    extracted_lng DECIMAL(10, 7),
    extracted_country_code VARCHAR(3),

    -- Review status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'merged', 'duplicate'
    review_notes TEXT,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,

    -- If approved, links to created item
    approved_case_id UUID REFERENCES justice_matrix_cases(id),
    approved_campaign_id UUID REFERENCES justice_matrix_campaigns(id),
    approved_resource_id UUID REFERENCES justice_matrix_resources(id),

    -- Duplicate detection
    similarity_score DECIMAL(5,2), -- AI-calculated similarity to existing items
    potential_duplicate_id UUID, -- ID of existing item it might duplicate

    -- AI confidence
    extraction_confidence DECIMAL(5,2), -- How confident AI is in extraction

    -- Timestamps
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- SCRAPE LOGS - Run History
-- ===========================================

CREATE TABLE IF NOT EXISTS justice_matrix_scrape_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Run identification
    source_id UUID REFERENCES justice_matrix_sources(id),
    run_type VARCHAR(20) NOT NULL, -- 'scheduled', 'manual', 'retry'

    -- Timing
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,

    -- Results
    status VARCHAR(20) NOT NULL, -- 'running', 'success', 'partial', 'failed'
    pages_crawled INTEGER DEFAULT 0,
    items_found INTEGER DEFAULT 0,
    items_new INTEGER DEFAULT 0,
    items_duplicate INTEGER DEFAULT 0,
    items_error INTEGER DEFAULT 0,

    -- Error tracking
    error_message TEXT,
    error_details JSONB,

    -- AI usage
    ai_tokens_used INTEGER DEFAULT 0,
    ai_model_used VARCHAR(50),

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- Indexes
-- ===========================================

-- Sources
CREATE INDEX IF NOT EXISTS idx_sources_type ON justice_matrix_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_sources_region ON justice_matrix_sources(region);
CREATE INDEX IF NOT EXISTS idx_sources_active ON justice_matrix_sources(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_sources_priority ON justice_matrix_sources(scrape_priority);

-- Discovered
CREATE INDEX IF NOT EXISTS idx_discovered_status ON justice_matrix_discovered(status);
CREATE INDEX IF NOT EXISTS idx_discovered_type ON justice_matrix_discovered(item_type);
CREATE INDEX IF NOT EXISTS idx_discovered_source ON justice_matrix_discovered(source_id);
CREATE INDEX IF NOT EXISTS idx_discovered_pending ON justice_matrix_discovered(status, discovered_at) WHERE status = 'pending';

-- Scrape logs
CREATE INDEX IF NOT EXISTS idx_scrape_logs_source ON justice_matrix_scrape_logs(source_id);
CREATE INDEX IF NOT EXISTS idx_scrape_logs_status ON justice_matrix_scrape_logs(status);
CREATE INDEX IF NOT EXISTS idx_scrape_logs_recent ON justice_matrix_scrape_logs(started_at DESC);

-- ===========================================
-- RLS Policies
-- ===========================================

ALTER TABLE justice_matrix_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE justice_matrix_discovered ENABLE ROW LEVEL SECURITY;
ALTER TABLE justice_matrix_scrape_logs ENABLE ROW LEVEL SECURITY;

-- Admin/authenticated read access for sources
CREATE POLICY "Authenticated read for sources" ON justice_matrix_sources
    FOR SELECT TO authenticated USING (true);

-- Admin only for discovered queue (not public)
CREATE POLICY "Admin read for discovered" ON justice_matrix_discovered
    FOR SELECT TO authenticated USING (true);

-- Admin only for scrape logs
CREATE POLICY "Admin read for scrape logs" ON justice_matrix_scrape_logs
    FOR SELECT TO authenticated USING (true);

-- ===========================================
-- Seed Initial Sources
-- ===========================================

INSERT INTO justice_matrix_sources (name, source_type, url, region, jurisdictions, organization, description, data_format, scrape_priority) VALUES
-- Court Databases
('ECHR HUDOC', 'court_database', 'https://hudoc.echr.coe.int', 'europe', ARRAY['ECHR'], 'Council of Europe', 'European Court of Human Rights case database', 'html', 1),
('Inter-American Court', 'court_database', 'https://www.corteidh.or.cr/casos_en_tramite.cfm', 'americas', ARRAY['OAS'], 'Inter-American Court of Human Rights', 'Inter-American human rights jurisprudence', 'html', 2),
('UN Treaty Bodies', 'court_database', 'https://juris.ohchr.org', 'global', ARRAY['UN'], 'OHCHR', 'UN human rights treaty body decisions', 'html', 1),

-- Advocacy Organizations
('Defence for Children International', 'advocacy_org', 'https://defenceforchildren.org', 'global', ARRAY['INT'], 'DCI', 'Child rights advocacy and campaigns', 'html', 3),
('Child Rights International Network', 'advocacy_org', 'https://home.crin.org', 'global', ARRAY['INT'], 'CRIN', 'Child rights legal database', 'html', 3),
('Raise the Age', 'advocacy_org', 'https://raisetheage.org.au', 'asia_pacific', ARRAY['AU'], 'Raise the Age Coalition', 'Australian campaign to raise minimum age', 'html', 4),
('Human Rights Watch', 'advocacy_org', 'https://www.hrw.org/topic/childrens-rights', 'global', ARRAY['INT'], 'HRW', 'Children''s rights research and advocacy', 'html', 3),

-- Legal Databases
('Oxford Reports on International Law', 'legal_database', 'https://opil.ouplaw.com', 'global', ARRAY['INT'], 'Oxford University Press', 'International law case reports', 'html', 5),

-- Regional Bodies
('African Court on Human Rights', 'regional_body', 'https://www.african-court.org', 'africa', ARRAY['AU'], 'African Union', 'African human rights jurisprudence', 'html', 4)

ON CONFLICT DO NOTHING;

-- ===========================================
-- Comments
-- ===========================================

COMMENT ON TABLE justice_matrix_sources IS 'Track sources for Ralph automated research - court databases, advocacy orgs, etc.';
COMMENT ON TABLE justice_matrix_discovered IS 'Queue of items discovered by Ralph pending human review';
COMMENT ON TABLE justice_matrix_scrape_logs IS 'History of scrape runs for monitoring and debugging';

COMMENT ON COLUMN justice_matrix_discovered.raw_data IS 'Full extracted data before normalization';
COMMENT ON COLUMN justice_matrix_discovered.extraction_confidence IS 'AI confidence in extraction accuracy (0-100)';
COMMENT ON COLUMN justice_matrix_discovered.similarity_score IS 'Similarity to existing items for deduplication';
