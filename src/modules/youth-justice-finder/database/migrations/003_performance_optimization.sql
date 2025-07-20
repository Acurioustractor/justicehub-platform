-- Performance optimization migration
-- Add additional indexes for common query patterns

-- Services table optimizations
CREATE INDEX IF NOT EXISTS idx_services_verification_status ON services(verification_status);
CREATE INDEX IF NOT EXISTS idx_services_data_source ON services(data_source);
CREATE INDEX IF NOT EXISTS idx_services_completeness_score ON services(completeness_score DESC);
CREATE INDEX IF NOT EXISTS idx_services_verification_score ON services(verification_score DESC);

-- Composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_services_youth_active ON services(youth_specific, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_services_indigenous_active ON services(indigenous_specific, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_services_categories_youth ON services USING gin(categories) WHERE youth_specific = true;

-- Organizations table optimizations
CREATE INDEX IF NOT EXISTS idx_organizations_data_source ON organizations(data_source);
CREATE INDEX IF NOT EXISTS idx_organizations_updated ON organizations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_organizations_created ON organizations(created_at DESC);

-- Locations table optimizations
CREATE INDEX IF NOT EXISTS idx_locations_city ON locations(city);
CREATE INDEX IF NOT EXISTS idx_locations_state ON locations(state_province);
CREATE INDEX IF NOT EXISTS idx_locations_accessibility ON locations(wheelchair_accessible) WHERE wheelchair_accessible = true;

-- Composite index for geographic search with filters
CREATE INDEX IF NOT EXISTS idx_locations_region_coordinates ON locations(region, coordinates) USING gist(coordinates);

-- Contacts table optimizations
CREATE INDEX IF NOT EXISTS idx_contacts_service ON contacts(service_id) WHERE service_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_organization ON contacts(organization_id) WHERE organization_id IS NOT NULL;

-- Full-text search optimizations
CREATE INDEX IF NOT EXISTS idx_services_keywords_trgm ON services USING gin(keywords gin_trgm_ops);

-- Query performance view for common searches
CREATE OR REPLACE VIEW service_search_view AS
SELECT 
    s.id,
    s.name,
    s.description,
    s.categories,
    s.youth_specific,
    s.indigenous_specific,
    s.minimum_age,
    s.maximum_age,
    s.status,
    s.completeness_score,
    s.verification_score,
    o.name as organization_name,
    o.organization_type,
    l.city,
    l.state_province,
    l.region,
    l.postal_code,
    l.coordinates,
    l.wheelchair_accessible,
    c.phone,
    c.email
FROM services s
JOIN organizations o ON s.organization_id = o.id
LEFT JOIN locations l ON s.id = l.service_id
LEFT JOIN contacts c ON s.id = c.service_id
WHERE s.status = 'active';

-- Index on the view for faster materialized queries
CREATE INDEX IF NOT EXISTS idx_service_search_view_categories ON services USING gin(categories) WHERE status = 'active';

-- Add query performance monitoring table
CREATE TABLE IF NOT EXISTS query_performance_log (
    id SERIAL PRIMARY KEY,
    query_type VARCHAR(100) NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    query_hash VARCHAR(64),
    execution_plan JSONB,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    slow_query BOOLEAN GENERATED ALWAYS AS (execution_time_ms > 1000) STORED
);

CREATE INDEX IF NOT EXISTS idx_query_performance_type ON query_performance_log(query_type);
CREATE INDEX IF NOT EXISTS idx_query_performance_time ON query_performance_log(execution_time_ms DESC);
CREATE INDEX IF NOT EXISTS idx_query_performance_slow ON query_performance_log(slow_query) WHERE slow_query = true;
CREATE INDEX IF NOT EXISTS idx_query_performance_executed ON query_performance_log(executed_at DESC);

-- Function to log slow queries
CREATE OR REPLACE FUNCTION log_query_performance(
    p_query_type VARCHAR(100),
    p_execution_time_ms INTEGER,
    p_query_hash VARCHAR(64) DEFAULT NULL,
    p_execution_plan JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO query_performance_log (query_type, execution_time_ms, query_hash, execution_plan)
    VALUES (p_query_type, p_execution_time_ms, p_query_hash, p_execution_plan);
END;
$$ LANGUAGE plpgsql;

-- Statistics view for query performance analysis
CREATE OR REPLACE VIEW query_performance_stats AS
SELECT 
    query_type,
    COUNT(*) as total_queries,
    AVG(execution_time_ms) as avg_execution_time,
    MIN(execution_time_ms) as min_execution_time,
    MAX(execution_time_ms) as max_execution_time,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY execution_time_ms) as median_execution_time,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY execution_time_ms) as p95_execution_time,
    COUNT(*) FILTER (WHERE slow_query = true) as slow_query_count,
    (COUNT(*) FILTER (WHERE slow_query = true) * 100.0 / COUNT(*)) as slow_query_percentage
FROM query_performance_log
WHERE executed_at > NOW() - INTERVAL '24 hours'
GROUP BY query_type
ORDER BY avg_execution_time DESC;

-- Analyze tables to update statistics
ANALYZE organizations;
ANALYZE services;
ANALYZE locations;
ANALYZE contacts;