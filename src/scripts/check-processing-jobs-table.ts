#!/usr/bin/env node
/**
 * Check Processing Jobs Table
 * 
 * Directly checks if the processing_jobs table exists and is accessible
 */

import { createClient } from '@supabase/supabase-js'

async function checkProcessingJobsTable() {
  console.log('🔍 Checking Processing Jobs Table...')
  
  try {
    // Use the same credentials as simple-database-test which worked
    const supabase = createClient(
      'https://tednluwflfhxyucgwigh.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo'
    )
    
    // Try to get the table structure
    console.log('📋 Checking table structure...')
    
    // Try a simple count query first
    const { count, error: countError } = await supabase
      .from('processing_jobs')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('❌ Count query failed:', countError.message)
      
      // Try to check if table exists using a different approach
      const { data, error } = await supabase.rpc('execute_sql', {
        sql: "SELECT table_name FROM information_schema.tables WHERE table_name = 'processing_jobs' AND table_schema = 'public'"
      })
      
      if (error) {
        console.error('❌ Information schema query failed:', error.message)
      } else {
        console.log('Information schema result:', data)
      }
    } else {
      console.log(`✅ Table exists with ${count} records`)
    }
    
  } catch (error) {
    console.error('💥 Table check failed:', error.message)
  }
}

// Run the check
checkProcessingJobsTable()