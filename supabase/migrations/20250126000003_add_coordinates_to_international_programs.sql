-- Add latitude and longitude columns to international_programs table
ALTER TABLE international_programs
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_international_programs_coordinates
ON international_programs(latitude, longitude);

-- Add comment
COMMENT ON COLUMN international_programs.latitude IS 'Latitude coordinate for mapping';
COMMENT ON COLUMN international_programs.longitude IS 'Longitude coordinate for mapping';
