console.log(`
To create the services table in your Supabase database, please follow these steps:

1. Go to your Supabase dashboard: https://app.supabase.com/project/tednluwflfhxyucgwigh
2. Navigate to the SQL Editor
3. Copy and paste the following SQL commands:

-- Create services table
CREATE TABLE IF NOT EXISTS services (
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
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(active);
CREATE INDEX IF NOT EXISTS idx_services_organization ON services(organization_id);
CREATE INDEX IF NOT EXISTS idx_services_geographical ON services USING GIN(geographical_coverage);

4. Run the SQL commands in the editor
5. After creating the table, run the sample data insertion script:
   npx tsx src/scripts/insert-sample-data.ts
`)