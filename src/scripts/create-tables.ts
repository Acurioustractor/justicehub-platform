import { createClient } from '@supabase/supabase-js'

// Use the service role key for admin access
const supabase = createClient(
  'https://tednluwflfhxyucgwigh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo'
)

async function createTables() {
  console.log('Creating organizations table...')
  
  // Create organizations table
  const { error: orgError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        website_url TEXT,
        email TEXT,
        phone TEXT,
        address JSONB,
        type VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(is_active);
      CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(type);
    `
  })
  
  if (orgError) {
    console.error('Error creating organizations table:', orgError)
  } else {
    console.log('Organizations table created successfully!')
  }
  
  console.log('Creating services table...')
  
  // Create services table
  const { error: serviceError } = await supabase.rpc('exec_sql', {
    sql: `
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
      
      CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
      CREATE INDEX IF NOT EXISTS idx_services_active ON services(active);
      CREATE INDEX IF NOT EXISTS idx_services_organization ON services(organization_id);
      CREATE INDEX IF NOT EXISTS idx_services_geographical ON services USING GIN(geographical_coverage);
    `
  })
  
  if (serviceError) {
    console.error('Error creating services table:', serviceError)
  } else {
    console.log('Services table created successfully!')
  }
}

createTables()