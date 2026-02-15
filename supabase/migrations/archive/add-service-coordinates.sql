-- Add coordinate columns to services table for map-based discovery
ALTER TABLE services
ADD COLUMN IF NOT EXISTS location_latitude DECIMAL(10, 8);

ALTER TABLE services
ADD COLUMN IF NOT EXISTS location_longitude DECIMAL(11, 8);

ALTER TABLE services
ADD COLUMN IF NOT EXISTS location_geocoded_at TIMESTAMP WITH TIME ZONE;

-- Add index for spatial queries
CREATE INDEX IF NOT EXISTS idx_services_location ON services(location_latitude, location_longitude);

-- Add comment for documentation
COMMENT ON COLUMN services.location_latitude IS 'Latitude coordinate for map-based service discovery';
COMMENT ON COLUMN services.location_longitude IS 'Longitude coordinate for map-based service discovery';
COMMENT ON COLUMN services.location_geocoded_at IS 'Timestamp when coordinates were added/updated';
