#!/usr/bin/env node
/**
 * Column Discovery Test
 * 
 * Discovers the actual columns in the processing_jobs table
 */

import { createClient } from '@supabase/supabase-js'

async function columnDiscoveryTest() {
  console.log('🔍 Column Discovery Test...')
  
  // Create Supabase client
  const supabase = createClient(
    'https://tednluwflfhxyucgwigh.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo'
  )
  
  try {
    console.log('\n🔍 Discovering actual table columns...')
    
    // Try to get all columns by selecting *
    const { data, error } = await supabase
      .from('processing_jobs')
      .select('*')
      .limit(0)
    
    if (error) {
      console.log('❌ Select * failed:', error.message)
      // This might give us clues about the actual column names
      
      // Try with no columns specified
      const { data: emptyData, error: emptyError } = await supabase
        .from('processing_jobs')
        .select()
        .limit(0)
      
      if (emptyError) {
        console.log('❌ Empty select also failed:', emptyError.message)
      } else {
        console.log('✅ Empty select succeeded')
        if (emptyData) {
          console.log('Empty data length:', emptyData.length)
        }
      }
    } else {
      console.log('✅ Select * succeeded')
      if (data && data.length === 0) {
        console.log('   Table exists and is empty')
        console.log('   Available columns might be:', Object.keys(data[0] || {}))
      }
    }
    
    // Try a more direct approach - just get the column names
    console.log('\n🔍 Trying alternative column discovery...')
    
    // Try to insert with known columns from the schema
    const testInsert = {
      type: 'discovery',
      status: 'queued',
      priority: 'low',
      data_source_id: null,
      created_by: 'column_test'
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('processing_jobs')
      .insert(testInsert)
      .select()
    
    if (insertError) {
      console.log('❌ Test insert failed:', insertError.message)
      // Parse the error to see what columns it knows about
      if (insertError.message.includes('column')) {
        console.log('   Error mentions columns - this is helpful!')
      }
    } else {
      console.log('✅ Test insert succeeded!')
      console.log('Insert result:', insertData)
    }
    
  } catch (error) {
    console.error('💥 Column discovery test failed:', error.message)
  }
}

// Run the test
columnDiscoveryTest()