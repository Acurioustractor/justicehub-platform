-- SQL Script to Create AI Scraper Tables
-- Run this in your Supabase SQL editor to create the missing tables

-- Core scraping metadata table
CREATE TABLE IF NOT EXISTS scraping_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    source_type VARCHAR(50) NOT NULL,
    source_url TEXT NOT NULL,
    discovery_method VARCHAR(50) NOT NULL,
    extraction_method VARCHAR(50) NOT NULL,
    scraping_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ai_processing_version VARCHAR(20) NOT NULL,
    confidence_scores JSONB NOT NULL DEFAULT '{}',
    validation_status VARCHAR(20) DEFAULT 'pending',
    data_lineage JSONB DEFAULT '[]',
    quality_flags JSONB DEFAULT '[]',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI processing logs for debugging and improvement
CREATE TABLE IF NOT EXISTS ai_processing_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL,
    organization_id UUID REFERENCES organizations(id),
    ai_model_used VARCHAR(50) NOT NULL,
    prompt_hash VARCHAR(64),
    input_content_hash VARCHAR(64),
    extracted_data JSONB,
    confidence_scores JSONB,
    processing_time_ms INTEGER,
    token_usage JSONB,
    error_message TEXT,
    quality_flags JSONB DEFAULT '[]',
    processing_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Data sources configuration and monitoring
CREATE TABLE IF NOT EXISTS data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    base_url TEXT NOT NULL,
    api_endpoint TEXT,
    scraping_config JSONB NOT NULL DEFAULT '{}',
    discovery_patterns JSONB DEFAULT '[]',
    update_frequency VARCHAR(20) DEFAULT 'weekly',
    reliability_score DECIMAL(3,2) DEFAULT 0.5,
    last_successful_scrape TIMESTAMP WITH TIME ZONE,
    last_error_message TEXT,
    active BOOLEAN DEFAULT true,
    rate_limit_ms INTEGER DEFAULT 1000,
    max_concurrent_requests INTEGER DEFAULT 1,
    respect_robots_txt BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, type)
);

-- Processing jobs queue and status tracking
CREATE TABLE IF NOT EXISTS processing_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'queued',
    priority VARCHAR(20) DEFAULT 'medium',
    source_urls TEXT[] DEFAULT '{}',
    data_source_id UUID REFERENCES data_sources(id),
    configuration JSONB NOT NULL DEFAULT '{}',
    progress_percentage INTEGER DEFAULT 0,
    results_summary JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_completion TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Organization enrichment data from AI scraping
CREATE TABLE IF NOT EXISTS organization_enrichment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    enrichment_type VARCHAR(50) NOT NULL,
    data JSONB NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL,
    source_metadata JSONB,
    validation_status VARCHAR(20) DEFAULT 'pending',
    validated_by VARCHAR(255),
    validated_at TIMESTAMP WITH TIME ZONE,
    validation_notes TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, enrichment_type, created_at)
);

-- Service offerings extracted through AI scraping
CREATE TABLE IF NOT EXISTS scraped_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    eligibility_criteria TEXT[],
    cost_structure VARCHAR(50),
    availability_schedule JSONB,
    contact_info JSONB,
    outcomes_evidence TEXT[],
    geographical_coverage JSONB,
    target_demographics JSONB,
    capacity_indicators JSONB,
    confidence_score DECIMAL(3,2) NOT NULL,
    source_url TEXT,
    extraction_timestamp TIMESTAMP WITH TIME ZONE,
    validation_status VARCHAR(20) DEFAULT 'pending',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Duplicate detection and entity resolution
CREATE TABLE IF NOT EXISTS organization_duplicates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    primary_organization_id UUID REFERENCES organizations(id),
    duplicate_organization_id UUID REFERENCES organizations(id),
    similarity_score DECIMAL(5,4) NOT NULL,
    matching_fields TEXT[] DEFAULT '{}',
    confidence_level VARCHAR(20) NOT NULL,
    resolution_status VARCHAR(20) DEFAULT 'pending',
    resolution_notes TEXT,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by VARCHAR(255),
    CHECK (primary_organization_id != duplicate_organization_id)
);

-- Quality monitoring and metrics
CREATE TABLE IF NOT EXISTS data_quality_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    metric_type VARCHAR(50) NOT NULL,
    metric_value DECIMAL(5,4) NOT NULL,
    metric_details JSONB,
    measurement_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_source VARCHAR(100),
    benchmark_comparison JSONB,
    improvement_suggestions TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Content cache for efficient re-processing
CREATE TABLE IF NOT EXISTS content_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url_hash VARCHAR(64) NOT NULL UNIQUE,
    url TEXT NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    content_type VARCHAR(50),
    raw_content TEXT,
    processed_content JSONB,
    extraction_metadata JSONB,
    cache_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expiry_timestamp TIMESTAMP WITH TIME ZONE,
    access_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    content_size_bytes INTEGER,
    compression_used BOOLEAN DEFAULT false
);

-- Monitoring and alerting for scraper health
CREATE TABLE IF NOT EXISTS scraper_health_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_source_id UUID REFERENCES data_sources(id),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,4),
    metric_unit VARCHAR(20),
    status VARCHAR(20) DEFAULT 'normal',
    threshold_warning DECIMAL(10,4),
    threshold_critical DECIMAL(10,4),
    measurement_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    alert_sent BOOLEAN DEFAULT false,
    alert_sent_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_scraping_metadata_org_id ON scraping_metadata(organization_id);
CREATE INDEX IF NOT EXISTS idx_scraping_metadata_source_type ON scraping_metadata(source_type);
CREATE INDEX IF NOT EXISTS idx_scraping_metadata_timestamp ON scraping_metadata(scraping_timestamp);
CREATE INDEX IF NOT EXISTS idx_scraping_metadata_validation_status ON scraping_metadata(validation_status);

CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_model ON ai_processing_logs(ai_model_used);
CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_timestamp ON ai_processing_logs(processing_timestamp);
CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_request_id ON ai_processing_logs(request_id);

CREATE INDEX IF NOT EXISTS idx_data_sources_type ON data_sources(type);
CREATE INDEX IF NOT EXISTS idx_data_sources_active ON data_sources(active);
CREATE INDEX IF NOT EXISTS idx_data_sources_last_scrape ON data_sources(last_successful_scrape);

CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_priority ON processing_jobs(priority);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_type ON processing_jobs(type);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_created_at ON processing_jobs(created_at);

CREATE INDEX IF NOT EXISTS idx_organization_enrichment_org_id ON organization_enrichment(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_enrichment_type ON organization_enrichment(enrichment_type);
CREATE INDEX IF NOT EXISTS idx_organization_enrichment_confidence ON organization_enrichment(confidence_score);
CREATE INDEX IF NOT EXISTS idx_organization_enrichment_validation ON organization_enrichment(validation_status);

CREATE INDEX IF NOT EXISTS idx_scraped_services_org_id ON scraped_services(organization_id);
CREATE INDEX IF NOT EXISTS idx_scraped_services_category ON scraped_services(category);
CREATE INDEX IF NOT EXISTS idx_scraped_services_confidence ON scraped_services(confidence_score);
CREATE INDEX IF NOT EXISTS idx_scraped_services_validation ON scraped_services(validation_status);

CREATE INDEX IF NOT EXISTS idx_organization_duplicates_primary ON organization_duplicates(primary_organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_duplicates_duplicate ON organization_duplicates(duplicate_organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_duplicates_score ON organization_duplicates(similarity_score);
CREATE INDEX IF NOT EXISTS idx_organization_duplicates_status ON organization_duplicates(resolution_status);

CREATE INDEX IF NOT EXISTS idx_data_quality_metrics_org_id ON data_quality_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_data_quality_metrics_type ON data_quality_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_data_quality_metrics_date ON data_quality_metrics(measurement_date);

CREATE INDEX IF NOT EXISTS idx_content_cache_url_hash ON content_cache(url_hash);
CREATE INDEX IF NOT EXISTS idx_content_cache_content_hash ON content_cache(content_hash);
CREATE INDEX IF NOT EXISTS idx_content_cache_timestamp ON content_cache(cache_timestamp);
CREATE INDEX IF NOT EXISTS idx_content_cache_expiry ON content_cache(expiry_timestamp);

CREATE INDEX IF NOT EXISTS idx_scraper_health_source_id ON scraper_health_metrics(data_source_id);
CREATE INDEX IF NOT EXISTS idx_scraper_health_status ON scraper_health_metrics(status);
CREATE INDEX IF NOT EXISTS idx_scraper_health_timestamp ON scraper_health_metrics(measurement_timestamp);

-- Functions for data quality calculation
CREATE OR REPLACE FUNCTION calculate_organization_completeness(org_id UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    total_fields INTEGER := 10;
    filled_fields INTEGER := 0;
    org_record RECORD;
BEGIN
    SELECT * INTO org_record FROM organizations WHERE id = org_id;
    
    IF FOUND THEN
        -- Count filled core fields
        IF org_record.name IS NOT NULL AND LENGTH(org_record.name) > 0 THEN
            filled_fields := filled_fields + 1;
        END IF;
        IF org_record.description IS NOT NULL AND LENGTH(org_record.description) > 20 THEN
            filled_fields := filled_fields + 1;
        END IF;
        IF org_record.website_url IS NOT NULL THEN
            filled_fields := filled_fields + 1;
        END IF;
        IF org_record.email IS NOT NULL THEN
            filled_fields := filled_fields + 1;
        END IF;
        IF org_record.phone IS NOT NULL THEN
            filled_fields := filled_fields + 1;
        END IF;
        IF org_record.address IS NOT NULL THEN
            filled_fields := filled_fields + 1;
        END IF;
        
        -- Check for services
        IF EXISTS(SELECT 1 FROM scraped_services WHERE organization_id = org_id AND active = true) THEN
            filled_fields := filled_fields + 1;
        END IF;
        
        -- Check for enrichment data
        IF EXISTS(SELECT 1 FROM organization_enrichment WHERE organization_id = org_id AND active = true) THEN
            filled_fields := filled_fields + 1;
        END IF;
        
        -- Additional quality indicators
        IF org_record.created_at > CURRENT_TIMESTAMP - INTERVAL '90 days' THEN
            filled_fields := filled_fields + 1;
        END IF;
        
        -- Validation status
        IF EXISTS(SELECT 1 FROM scraping_metadata WHERE organization_id = org_id AND validation_status = 'approved') THEN
            filled_fields := filled_fields + 1;
        END IF;
    END IF;
    
    RETURN ROUND(filled_fields::DECIMAL / total_fields, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to update data quality metrics
CREATE OR REPLACE FUNCTION update_data_quality_metrics(org_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Update completeness metric
    INSERT INTO data_quality_metrics (organization_id, metric_type, metric_value, data_source)
    VALUES (org_id, 'completeness', calculate_organization_completeness(org_id), 'ai_scraper')
    ON CONFLICT (organization_id, metric_type) DO UPDATE SET
        metric_value = EXCLUDED.metric_value,
        measurement_date = CURRENT_TIMESTAMP;
        
    -- Additional metrics can be added here
END;
$$ LANGUAGE plpgsql;

-- Triggers to maintain data quality
CREATE OR REPLACE FUNCTION trigger_update_quality_metrics()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_data_quality_metrics(NEW.organization_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_quality_on_enrichment ON organization_enrichment;
CREATE TRIGGER update_quality_on_enrichment
    AFTER INSERT OR UPDATE ON organization_enrichment
    FOR EACH ROW EXECUTE FUNCTION trigger_update_quality_metrics();

DROP TRIGGER IF EXISTS update_quality_on_services ON scraped_services;
CREATE TRIGGER update_quality_on_services
    AFTER INSERT OR UPDATE ON scraped_services
    FOR EACH ROW EXECUTE FUNCTION trigger_update_quality_metrics();

-- Comments for documentation
COMMENT ON TABLE scraping_metadata IS 'Tracks metadata about AI scraping processes for organizations';
COMMENT ON TABLE ai_processing_logs IS 'Detailed logs of AI processing for debugging and optimization';
COMMENT ON TABLE data_sources IS 'Configuration and monitoring of external data sources';
COMMENT ON TABLE processing_jobs IS 'Queue and status tracking for scraping and processing jobs';
COMMENT ON TABLE organization_enrichment IS 'AI-extracted enrichment data for organizations';
COMMENT ON TABLE scraped_services IS 'Service offerings discovered through AI scraping';
COMMENT ON TABLE organization_duplicates IS 'Tracks potential duplicate organizations for entity resolution';
COMMENT ON TABLE data_quality_metrics IS 'Metrics tracking data quality and completeness';
COMMENT ON TABLE content_cache IS 'Caches web content to avoid redundant scraping';
COMMENT ON TABLE scraper_health_metrics IS 'Monitoring metrics for scraper system health';