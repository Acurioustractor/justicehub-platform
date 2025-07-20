-- Clean, simple schema for Youth Justice Service Finder
-- PostgreSQL without complex dependencies

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    alternate_name VARCHAR(255),
    description TEXT,
    email VARCHAR(255),
    url VARCHAR(500),
    organization_type VARCHAR(50) NOT NULL DEFAULT 'non_profit',
    data_source VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);

-- Services table
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    alternate_name VARCHAR(255),
    description TEXT NOT NULL,
    url VARCHAR(500),
    email VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    service_type VARCHAR(50) NOT NULL DEFAULT 'direct_service',
    target_population TEXT[],
    eligibility_criteria TEXT,
    age_range_min INTEGER,
    age_range_max INTEGER,
    languages TEXT[],
    categories JSONB DEFAULT '[]',
    data_source VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_services_organization ON services(organization_id);
CREATE INDEX IF NOT EXISTS idx_services_name ON services(name);

-- Locations table (simplified)
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    name VARCHAR(255),
    description TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address_1 VARCHAR(255),
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(2) DEFAULT 'AU',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_locations_service ON locations(service_id);

-- Taxonomy table
CREATE TABLE IF NOT EXISTS taxonomy (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    vocabulary VARCHAR(255),
    description TEXT,
    youth_justice_category VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Service taxonomy relationships
CREATE TABLE IF NOT EXISTS service_taxonomy (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    taxonomy_id UUID NOT NULL REFERENCES taxonomy(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(service_id, taxonomy_id)
);

CREATE INDEX IF NOT EXISTS idx_service_taxonomy_service ON service_taxonomy(service_id);

-- Update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $function$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$function$ LANGUAGE 'plpgsql';

-- Create triggers (drop first to avoid conflicts)
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at 
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at 
    BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_locations_updated_at ON locations;
CREATE TRIGGER update_locations_updated_at 
    BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_taxonomy_updated_at ON taxonomy;
CREATE TRIGGER update_taxonomy_updated_at 
    BEFORE UPDATE ON taxonomy
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Simple search view
DROP VIEW IF EXISTS service_search_view;
CREATE VIEW service_search_view AS
SELECT 
    s.id,
    s.name,
    s.description,
    s.status,
    s.categories,
    o.name AS organization_name,
    o.organization_type
FROM services s
JOIN organizations o ON s.organization_id = o.id
WHERE s.status = 'active';