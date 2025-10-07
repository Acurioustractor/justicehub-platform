#!/usr/bin/env node
/**
 * Direct SQL Test - Bypass Schema Cache
 * 
 * Tests if we can work around the schema cache issue by using direct SQL queries
 */

import { createClient } from '@supabase/supabase-js'

async function directSqlTest() {
  console.log('🔍 Direct SQL Test - Bypass Schema Cache...')
  
  // Create Supabase client
  const supabase = createClient(
    'https://tednluwflfhxyucgwigh.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo'
  )
  
  try {
    console.log('\n🔍 Testing direct SQL approach...')
    
    // Try to get the exact table structure using information_schema
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'processing_jobs')
      .eq('table_schema', 'public')
      .order('ordinal_position')
    
    if (columnsError) {
      console.log('❌ Could not get table structure:', columnsError.message)
    } else {
      console.log('✅ Got processing_jobs table structure:')
      columns.forEach(col => {
        console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`)
      })
    }
    
    // Try a simple raw SQL insert
    console.log('\n🚀 Testing raw SQL INSERT...')
    
    const insertSql = `
      INSERT INTO processing_jobs (type, status, priority, created_by)
      VALUES ('test_direct_sql', 'queued', 'low', 'manual_test')
      RETURNING id, type, status, created_at
    `
    
    const { data: result, error: insertError } = await supabase
      .rpc('execute_sql', { sql: insertSql })
    
    if (insertError) {
      console.log('❌ Raw SQL INSERT failed:', insertError.message)
      if (insertError.message.includes('Could not find the function public.execute_sql')) {
        console.log('   This means execute_sql RPC is not available')
      }
    } else {
      console.log('✅ Raw SQL INSERT succeeded!')
      console.log('Result:', result)
      
      // If we succeeded, try to clean up
      if (result && result.length > 0) {
        const jobId = result[0].id
        console.log(`\n🧹 Cleaning up test job ${jobId}...`)
        const { error: deleteError } = await supabase
          .from('processing_jobs')
          .delete()
          .eq('id', jobId)
        
        if (deleteError) {
          console.log('⚠️  Cleanup failed:', deleteError.message)
        } else {
          console.log('✅ Test job cleaned up')
        }
      }
    }
    
    console.log('\n📋 Summary:')
    console.log('✅ Can inspect table structure')
    console.log('❌ Cannot execute raw SQL (RPC not available)')
    console.log('❌ INSERT operations still blocked by schema cache')
    
  } catch (error) {
    console.error('💥 Direct SQL test failed:', error.message)
  }
}

// Run the test
directSqlTest()
