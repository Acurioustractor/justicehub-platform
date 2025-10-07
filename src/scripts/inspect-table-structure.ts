#!/usr/bin/env node
/**
 * Inspect Processing Jobs Table Structure
 * 
 * Gets the actual column information for the processing_jobs table
 */

import { createClient } from '@supabase/supabase-js'

async function inspectTableStructure() {
  console.log('🔍 Inspecting Processing Jobs Table Structure...')
  
  try {
    // Use the same credentials as simple-database-test which worked
    const supabase = createClient(
      'https://tednluwflfhxyucgwigh.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo'
    )
    
    // Try to get column information using a different approach
    console.log('📋 Getting column information...')
    
    // Use raw SQL to get column information
    const { data, error } = await supabase.rpc('execute_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'processing_jobs' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `
    })
    
    if (error) {
      console.error('❌ Failed to get column information:', error.message)
      
      // Try alternative approach
      console.log('📋 Trying alternative approach...')
      const { data: altData, error: altError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'processing_jobs')
        .eq('table_schema', 'public')
        .order('ordinal_position')
      
      if (altError) {
        console.error('❌ Alternative approach also failed:', altError.message)
        return
      }
      
      console.log('✅ Alternative approach succeeded:')
      console.log(altData)
    } else {
      console.log('✅ Column information retrieved:')
      console.log(data)
    }
    
  } catch (error) {
    console.error('💥 Inspection failed:', error.message)
  }
}

// Run the inspection
inspectTableStructure()