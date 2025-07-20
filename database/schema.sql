-- Youth Justice Service Finder Database Schema
-- PostgreSQL with PostGIS extension for geographic queries

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    alternate_name VARCHAR(255),
    description TEXT,
    email VARCHAR(255),
    url VARCHAR(500),
    tax_status VARCHAR(100),
    tax_id VARCHAR(100),
    year_incorporated INTEGER,
    legal_status VARCHAR(100),
    logo_url VARCHAR(500),
    organization_type VARCHAR(50) NOT NULL CHECK (organization_type IN (
        'government', 'non_profit', 'for_profit', 'community', 
        'indigenous', 'religious', 'educational', 'healthcare'
    )),
    accreditations TEXT[],
    funding_sources TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_verified_at TIMESTAMP WITH TIME ZONE,
    verification_status VARCHAR(20) DEFAULT 'unverified' CHECK (verification_status IN ('verified', 'unverified', 'pending')),
    data_source VARCHAR(255) NOT NULL,
    
    -- Indexes
    CONSTRAINT organizations_email_unique UNIQUE (email)
);

CREATE INDEX idx_organizations_name_trgm ON organizations USING gin(name gin_trgm_ops);
CREATE INDEX idx_organizations_type ON organizations(organization_type);
CREATE INDEX idx_organizations_verification ON organizations(verification_status);

-- Services table
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    alternate_name VARCHAR(255),
    description TEXT NOT NULL,
    url VARCHAR(500),
    email VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    interpretation_services BOOLEAN DEFAULT FALSE,
    application_process TEXT,
    wait_time VARCHAR(255),
    fees TEXT,
    accreditations TEXT[],
    
    -- Youth-specific fields
    minimum_age INTEGER CHECK (minimum_age >= 0 AND minimum_age <= 25),
    maximum_age INTEGER CHECK (maximum_age >= 0 AND maximum_age <= 25),
    youth_specific BOOLEAN DEFAULT TRUE,
    indigenous_specific BOOLEAN DEFAULT FALSE,
    
    -- Categorization
    categories TEXT[] NOT NULL CHECK (array_length(categories, 1) > 0),
    keywords TEXT[],
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_verified_at TIMESTAMP WITH TIME ZONE,
    verification_status VARCHAR(20) DEFAULT 'unverified' CHECK (verification_status IN ('verified', 'unverified', 'pending', 'rejected')),
    data_source VARCHAR(255) NOT NULL,
    source_url VARCHAR(500),
    
    -- Quality metrics
    completeness_score DECIMAL(3,2) DEFAULT 0 CHECK (completeness_score >= 0 AND completeness_score <= 1),
    verification_score INTEGER DEFAULT 0 CHECK (verification_score >= 0 AND verification_score <= 100),
    community_rating DECIMAL(2,1) CHECK (community_rating >= 0 AND community_rating <= 5),
    
    -- Constraints
    CONSTRAINT services_age_check CHECK (minimum_age IS NULL OR maximum_age IS NULL OR minimum_age <= maximum_age)
);

CREATE INDEX idx_services_organization ON services(organization_id);
CREATE INDEX idx_services_name_trgm ON services USING gin(name gin_trgm_ops);
CREATE INDEX idx_services_description_trgm ON services USING gin(description gin_trgm_ops);
CREATE INDEX idx_services_categories ON services USING gin(categories);
CREATE INDEX idx_services_status ON services(status);
CREATE INDEX idx_services_youth ON services(youth_specific, minimum_age, maximum_age);
CREATE INDEX idx_services_indigenous ON services(indigenous_specific);
CREATE INDEX idx_services_updated ON services(updated_at DESC);

-- Locations table with PostGIS
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    name VARCHAR(255),
    alternate_name VARCHAR(255),
    description TEXT,
    
    -- Address
    address_1 VARCHAR(255) NOT NULL,
    address_2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state_province VARCHAR(50) DEFAULT 'QLD',
    postal_code VARCHAR(10) NOT NULL,
    country CHAR(2) DEFAULT 'AU',
    
    -- Geographic data
    coordinates GEOGRAPHY(POINT, 4326) NOT NULL,
    
    -- Queensland regions
    region VARCHAR(50) NOT NULL CHECK (region IN (
        'brisbane', 'gold_coast', 'sunshine_coast', 'townsville', 'cairns',
        'toowoomba', 'mackay', 'rockhampton', 'bundaberg', 'hervey_bay',
        'gladstone', 'mount_isa', 'remote_queensland'
    )),
    
    -- Service area (stored as JSONB for flexibility)
    service_area JSONB,
    
    -- Accessibility
    wheelchair_accessible BOOLEAN DEFAULT FALSE,
    public_transport_access BOOLEAN DEFAULT FALSE,
    parking_available BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_locations_service ON locations(service_id);
CREATE INDEX idx_locations_coordinates ON locations USING gist(coordinates);
CREATE INDEX idx_locations_region ON locations(region);
CREATE INDEX idx_locations_postal ON locations(postal_code);

-- Contacts table
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    name VARCHAR(255),
    title VARCHAR(255),
    department VARCHAR(255),
    phone JSONB DEFAULT '[]',
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure at least one relationship exists
    CONSTRAINT contacts_relationship_check CHECK (
        service_id IS NOT NULL OR organization_id IS NOT NULL OR location_id IS NOT NULL
    )
);

CREATE INDEX idx_contacts_service ON contacts(service_id);
CREATE INDEX idx_contacts_organization ON contacts(organization_id);
CREATE INDEX idx_contacts_location ON contacts(location_id);

-- Schedules table
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    regular_schedule JSONB DEFAULT '[]',
    holiday_schedule JSONB DEFAULT '[]',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure at least one relationship exists
    CONSTRAINT schedules_relationship_check CHECK (
        service_id IS NOT NULL OR location_id IS NOT NULL
    )
);

CREATE INDEX idx_schedules_service ON schedules(service_id);
CREATE INDEX idx_schedules_location ON schedules(location_id);

-- Taxonomy table for hierarchical categories
CREATE TABLE taxonomy (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES taxonomy(id) ON DELETE CASCADE,
    vocabulary VARCHAR(255),
    description TEXT,
    youth_justice_category VARCHAR(50) CHECK (youth_justice_category IN (
        'prevention', 'diversion', 'court_support', 'supervision', 'detention',
        'reintegration', 'family_support', 'education_training', 'mental_health',
        'substance_abuse', 'housing', 'legal_aid', 'advocacy', 'cultural_support'
    )),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_taxonomy_parent ON taxonomy(parent_id);
CREATE INDEX idx_taxonomy_category ON taxonomy(youth_justice_category);

-- Service taxonomy mapping
CREATE TABLE service_taxonomy (
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    taxonomy_id UUID REFERENCES taxonomy(id) ON DELETE CASCADE,
    PRIMARY KEY (service_id, taxonomy_id)
);

-- Scraping jobs table
CREATE TABLE scraping_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_name VARCHAR(255) NOT NULL,
    source_url VARCHAR(500) NOT NULL,
    job_type VARCHAR(20) NOT NULL CHECK (job_type IN ('discovery', 'update', 'deep_scan', 'verify')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    priority INTEGER DEFAULT 5 CHECK (priority >= 0 AND priority <= 10),
    config JSONB DEFAULT '{}',
    pages_scraped INTEGER DEFAULT 0,
    services_found INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    error_details JSONB,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255)
);

CREATE INDEX idx_scraping_jobs_status ON scraping_jobs(status);
CREATE INDEX idx_scraping_jobs_next_run ON scraping_jobs(next_run_at);
CREATE INDEX idx_scraping_jobs_source ON scraping_jobs(source_name);

-- Data quality tracking
CREATE TABLE data_quality (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    has_description BOOLEAN NOT NULL,
    has_contact BOOLEAN NOT NULL,
    has_location BOOLEAN NOT NULL,
    has_hours BOOLEAN NOT NULL,
    has_eligibility BOOLEAN NOT NULL,
    has_categories BOOLEAN NOT NULL,
    description_length INTEGER NOT NULL,
    contact_methods_count INTEGER NOT NULL,
    days_since_update INTEGER NOT NULL,
    days_since_verification INTEGER,
    completeness_score DECIMAL(3,2) NOT NULL CHECK (completeness_score >= 0 AND completeness_score <= 1),
    freshness_score DECIMAL(3,2) NOT NULL CHECK (freshness_score >= 0 AND freshness_score <= 1),
    overall_score DECIMAL(3,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 1),
    quality_issues JSONB DEFAULT '[]',
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_data_quality_service ON data_quality(service_id);
CREATE INDEX idx_data_quality_overall_score ON data_quality(overall_score DESC);

-- Service history for tracking changes
CREATE TABLE service_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    changed_fields JSONB NOT NULL,
    previous_values JSONB NOT NULL,
    new_values JSONB NOT NULL,
    change_type VARCHAR(20) CHECK (change_type IN ('create', 'update', 'verify', 'delete')),
    changed_by VARCHAR(255),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_service_history_service ON service_history(service_id);
CREATE INDEX idx_service_history_changed_at ON service_history(changed_at DESC);

-- User verification submissions
CREATE TABLE verification_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    user_id VARCHAR(255),
    verification_type VARCHAR(20) CHECK (verification_type IN ('confirm', 'update', 'report')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    data JSONB,
    notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by VARCHAR(255)
);

CREATE INDEX idx_verification_submissions_service ON verification_submissions(service_id);
CREATE INDEX idx_verification_submissions_status ON verification_submissions(status);

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_taxonomy_updated_at BEFORE UPDATE ON taxonomy
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scraping_jobs_updated_at BEFORE UPDATE ON scraping_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate distance between two points
CREATE OR REPLACE FUNCTION calculate_distance(lat1 float, lon1 float, lat2 float, lon2 float)
RETURNS float AS $$
BEGIN
    RETURN ST_Distance(
        ST_MakePoint(lon1, lat1)::geography,
        ST_MakePoint(lon2, lat2)::geography
    ) / 1000; -- Return in kilometers
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- View for service search with full details
CREATE OR REPLACE VIEW service_search_view AS
SELECT 
    s.*,
    o.name as organization_name,
    o.organization_type,
    array_agg(DISTINCT l.city) as cities,
    array_agg(DISTINCT l.region) as regions,
    array_agg(DISTINCT l.postal_code) as postal_codes,
    COUNT(DISTINCT l.id) as location_count,
    MAX(dq.overall_score) as quality_score
FROM services s
JOIN organizations o ON s.organization_id = o.id
LEFT JOIN locations l ON l.service_id = s.id
LEFT JOIN data_quality dq ON dq.service_id = s.id
WHERE s.status = 'active'
GROUP BY s.id, o.name, o.organization_type;