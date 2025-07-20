-- Migration: Optimize search performance
-- Add composite indexes for common search patterns

-- Composite index for status + text search optimization  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_status_active_search 
ON services(status) 
WHERE status = 'active';

-- Full-text search index for better text search performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_fulltext_search 
ON services 
USING gin(to_tsvector('english', name || ' ' || coalesce(description, '')));

-- Composite index for youth-specific active services
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_active_youth 
ON services(status, youth_specific, minimum_age, maximum_age) 
WHERE status = 'active';

-- Composite index for category searches on active services
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_active_categories 
ON services USING gin(categories) 
WHERE status = 'active';

-- Improve geographic search performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_locations_active_services_geo 
ON locations USING gist(coordinates) 
WHERE service_id IN (SELECT id FROM services WHERE status = 'active');

-- Optimize service joins with location data
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_locations_composite 
ON locations(service_id, region, city) 
WHERE service_id IN (SELECT id FROM services WHERE status = 'active');