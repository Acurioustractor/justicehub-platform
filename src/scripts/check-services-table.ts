#!/usr/bin/env node
/**
 * Check if Services Table Exists
 * 
 * Specifically checks for the services table that we need for the Service Finder
 */

import { createClient } from '@supabase/supabase-js'

async function checkServicesTable() {
  console.log('🔍 Checking if services table exists...')
  
  // Create Supabase client with service key
  const supabase = createClient(
    'https://tednluwflfhxyucgwigh.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo'
  )
  
  try {
    // Test if services table exists
    const { data, error } = await supabase
      .from('services')
      .select('count')
      .limit(1)
    
    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('❌ Services table does not exist yet')
        console.log('\n📋 To create the services table:')
        console.log('1. Go to your Supabase Dashboard: https://app.supabase.com/project/tednluwflfhxyucgwigh')
        console.log('2. Navigate to SQL Editor')
        console.log('3. Run this SQL command:')
        console.log('\nCREATE TABLE IF NOT EXISTS services (')
        console.log('    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),')
        console.log('    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,')
        console.log('    name VARCHAR(255) NOT NULL,')
        console.log('    description TEXT,')
        console.log('    category VARCHAR(100),')
        console.log('    subcategory VARCHAR(100),')
        console.log('    eligibility_criteria TEXT[],')
        console.log('    cost_structure VARCHAR(50),')
        console.log('    availability_schedule JSONB,')
        console.log('    contact_info JSONB,')
        console.log('    outcomes_evidence TEXT[],')
        console.log('    geographical_coverage JSONB,')
        console.log('    target_demographics JSONB,')
        console.log('    capacity_indicators JSONB,')
        console.log('    active BOOLEAN DEFAULT true,')
        console.log('    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,')
        console.log('    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP')
        console.log(');')
        console.log('\nCREATE INDEX IF NOT EXISTS idx_services_category ON services(category);')
        console.log('CREATE INDEX IF NOT EXISTS idx_services_active ON services(active);')
        console.log('CREATE INDEX IF NOT EXISTS idx_services_organization ON services(organization_id);')
        console.log('CREATE INDEX IF NOT EXISTS idx_services_geographical ON services USING GIN(geographical_coverage);')
        return false
      } else {
        console.log('❌ Error checking services table:', error.message)
        return false
      }
    } else {
      console.log('✅ Services table exists!')
      console.log('📊 Found', data[0].count, 'services')
      return true
    }
  } catch (error) {
    console.log('❌ Error:', error)
    return false
  }
}

// Run the check
checkServicesTable()
