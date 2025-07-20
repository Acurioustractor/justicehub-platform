-- Add attribution support for open data compliance
-- This migration adds fields to track data source attribution and licensing

-- Add attribution column to services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS attribution JSONB;

-- Add ABN field to organizations for ACNC data
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS abn VARCHAR(50);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_services_attribution ON services USING GIN (attribution);
CREATE INDEX IF NOT EXISTS idx_organizations_abn ON organizations (abn);

-- Add comments
COMMENT ON COLUMN services.attribution IS 'Attribution information for open data compliance (JSON)';
COMMENT ON COLUMN organizations.abn IS 'Australian Business Number for registered organizations';

-- Insert attribution requirements as metadata
INSERT INTO metadata (key, value, description) 
VALUES 
  ('attribution_required', 'true', 'Whether attribution is required for data sources'),
  ('default_license', 'CC-BY 4.0', 'Default license for open data sources'),
  ('attribution_format', '{"source": "name", "license": "type", "url": "link"}', 'Required attribution format')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();