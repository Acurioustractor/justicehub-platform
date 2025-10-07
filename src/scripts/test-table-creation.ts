#!/usr/bin/env node
/**
 * Test Direct Table Creation
 * 
 * Tests if we can create tables directly using the Supabase client
 */

import { createClient } from '@supabase/supabase-js'

async function testDirectTableCreation() {
  console.log('🔧 Testing direct table creation...')
  
  // Create Supabase client with service key
  const supabase = createClient(
    'https://tednluwflfhxyucgwigh.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo'
  )
  
  try {
    // Try to create a simple test table
    const { error } = await supabase.rpc('exec_sql', { 
      sql: "CREATE TABLE IF NOT EXISTS test_table (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), name VARCHAR(255));" 
    })
    
    if (error) {
      console.log('❌ exec_sql RPC not available:', error.message)
      console.log('\n📋 You need to manually create the tables using the Supabase SQL Editor:')
      console.log('   1. Go to https://app.supabase.com/project/tednluwflfhxyucgwigh/sql')
      console.log('   2. Copy and paste the SQL from src/database/ai-scraper-schema.sql')
      console.log('   3. Run each CREATE TABLE statement')
      return false
    } else {
      console.log('✅ exec_sql RPC is available')
      // Clean up test table
      await supabase.rpc('exec_sql', { sql: "DROP TABLE IF EXISTS test_table;" })
      return true
    }
  } catch (error) {
    console.log('❌ exec_sql RPC not available:', error)
    console.log('\n📋 You need to manually create the tables using the Supabase SQL Editor:')
    console.log('   1. Go to https://app.supabase.com/project/tednluwflfhxyucgwigh/sql')
    console.log('   2. Copy and paste the SQL from src/database/ai-scraper-schema.sql')
    console.log('   3. Run each CREATE TABLE statement')
    return false
  }
}

// Run the test
testDirectTableCreation()