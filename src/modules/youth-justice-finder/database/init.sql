-- Production Database Initialization Script
-- Youth Justice Service Finder

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text matching

-- Create services table
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    
    -- Data Quality & Verification
    completeness_score DECIMAL(3,2) CHECK (completeness_score BETWEEN 0 AND 1),
    verification_status VARCHAR(20) DEFAULT 'unverified',
    verification_score INTEGER CHECK (verification_score BETWEEN 0 AND 100),
    
    -- Youth-specific flags
    youth_specific BOOLEAN DEFAULT false,
    indigenous_specific BOOLEAN DEFAULT false,
    
    -- Data lineage
    data_source VARCHAR(100) NOT NULL,
    source_id VARCHAR(100), -- Original ID from source system
    source_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_verified TIMESTAMP WITH TIME ZONE,
    
    -- Search optimization
    search_vector tsvector,
    
    CONSTRAINT services_name_source_unique UNIQUE (name, data_source)
);

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    organization_type VARCHAR(50),
    legal_status VARCHAR(100),
    
    -- Identifiers
    abn VARCHAR(11), -- Australian Business Number
    acn VARCHAR(9),  -- Australian Company Number
    tax_id VARCHAR(50),
    website_url TEXT,
    
    -- Data lineage
    data_source VARCHAR(100) NOT NULL,
    verification_status VARCHAR(20) DEFAULT 'unverified',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create service categories table
CREATE TABLE IF NOT EXISTS service_categories (
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    
    PRIMARY KEY (service_id, category)
);

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    
    name VARCHAR(255),
    address_1 VARCHAR(255),
    address_2 VARCHAR(255),
    city VARCHAR(100),
    state_province VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(2) DEFAULT 'AU',
    
    -- Geographic coordinates
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    geom GEOMETRY(POINT, 4326), -- PostGIS geometry for spatial queries
    
    -- Regional classification
    region VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    
    name VARCHAR(255),
    email VARCHAR(255),
    phone JSONB, -- Array of phone numbers
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create data sources registry
CREATE TABLE IF NOT EXISTS data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- 'api', 'csv', 'web_scraping'
    base_url TEXT,
    
    -- Configuration
    config JSONB, -- Adapter-specific configuration
    
    -- Status tracking
    is_active BOOLEAN DEFAULT true,
    last_extraction TIMESTAMP WITH TIME ZONE,
    next_extraction TIMESTAMP WITH TIME ZONE,
    extraction_frequency INTERVAL, -- e.g., '1 day', '1 week'
    
    -- Performance metrics
    total_extractions INTEGER DEFAULT 0,
    successful_extractions INTEGER DEFAULT 0,
    average_processing_time INTEGER, -- milliseconds
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create extraction jobs table
CREATE TABLE IF NOT EXISTS extraction_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_name VARCHAR(100) REFERENCES data_sources(name),
    
    status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
    
    -- Job configuration
    config JSONB,
    
    -- Results
    services_extracted INTEGER DEFAULT 0,
    services_processed INTEGER DEFAULT 0,
    services_stored INTEGER DEFAULT 0,
    duplicates_found INTEGER DEFAULT 0,
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    processing_time INTEGER, -- milliseconds
    
    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quality issues tracking
CREATE TABLE IF NOT EXISTS quality_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    
    issue_type VARCHAR(50) NOT NULL, -- 'missing_contact', 'invalid_address', 'outdated_info'
    issue_description TEXT,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
    
    -- Resolution
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_services_search ON services USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_services_youth ON services(youth_specific);
CREATE INDEX IF NOT EXISTS idx_services_source ON services(data_source);
CREATE INDEX IF NOT EXISTS idx_services_updated ON services(updated_at);

CREATE INDEX IF NOT EXISTS idx_organizations_abn ON organizations(abn);
CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);

CREATE INDEX IF NOT EXISTS idx_service_categories_category ON service_categories(category);

CREATE INDEX IF NOT EXISTS idx_locations_geom ON locations USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_locations_service ON locations(service_id);
CREATE INDEX IF NOT EXISTS idx_locations_state ON locations(state_province);
CREATE INDEX IF NOT EXISTS idx_locations_city ON locations(city);

CREATE INDEX IF NOT EXISTS idx_contacts_service ON contacts(service_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

CREATE INDEX IF NOT EXISTS idx_extraction_jobs_status ON extraction_jobs(status);
CREATE INDEX IF NOT EXISTS idx_extraction_jobs_source ON extraction_jobs(source_name);
CREATE INDEX IF NOT EXISTS idx_extraction_jobs_created ON extraction_jobs(created_at);

CREATE INDEX IF NOT EXISTS idx_quality_issues_service ON quality_issues(service_id);
CREATE INDEX IF NOT EXISTS idx_quality_issues_type ON quality_issues(issue_type);
CREATE INDEX IF NOT EXISTS idx_quality_issues_resolved ON quality_issues(is_resolved);

-- Create functions and triggers

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Search vector updates
CREATE OR REPLACE FUNCTION update_service_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector = 
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_service_search_vector_trigger
    BEFORE INSERT OR UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_service_search_vector();

-- Trigger to automatically update geom from lat/lng
CREATE OR REPLACE FUNCTION update_location_geom()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_location_geom
    BEFORE INSERT OR UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_location_geom();

-- Create analytics views

-- Service statistics view
CREATE VIEW service_statistics AS
SELECT 
    s.data_source,
    COUNT(*) as total_services,
    COUNT(*) FILTER (WHERE s.status = 'active') as active_services,
    AVG(s.completeness_score) as avg_quality_score,
    COUNT(*) FILTER (WHERE s.youth_specific = true) as youth_specific_count,
    COUNT(*) FILTER (WHERE s.verification_status = 'verified') as verified_count,
    COUNT(DISTINCT l.state_province) as states_covered,
    MAX(s.updated_at) as last_updated
FROM services s
LEFT JOIN locations l ON s.id = l.service_id
GROUP BY s.data_source;

-- Geographic coverage view
CREATE VIEW geographic_coverage AS
SELECT 
    l.state_province,
    l.city,
    COUNT(*) as service_count,
    COUNT(*) FILTER (WHERE s.youth_specific = true) as youth_services,
    AVG(s.completeness_score) as avg_quality
FROM services s
JOIN locations l ON s.id = l.service_id
WHERE s.status = 'active'
GROUP BY l.state_province, l.city
ORDER BY service_count DESC;

-- Insert initial data sources
INSERT INTO data_sources (name, source_type, base_url, extraction_frequency, config) VALUES
('acnc', 'api', 'https://data.gov.au/api/3/action', '1 week', '{"dataset_id": "acnc-register"}'),
('qld-data', 'csv', 'https://www.families.qld.gov.au', '1 month', '{"datasets": ["youthJusticeCentres"]}'),
('vic-cso', 'file', '', '1 month', '{}')
ON CONFLICT (name) DO NOTHING;

-- Grant permissions to application user
GRANT ALL ON ALL TABLES IN SCHEMA public TO yjs_app;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO yjs_app;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO yjs_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO yjs_app;