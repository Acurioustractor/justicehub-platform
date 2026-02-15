#!/usr/bin/env node
/**
 * Simple Schema Cache Test
 * 
 * Tests if the schema cache is working properly
 */

import { createClient } from '@supabase/supabase-js'

async function simpleTest() {
  console.log('🔍 Simple Schema Cache Test...')
  
  const supabase = createClient(
    'https://tednluwflfhxyucgwigh.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo'
  )
  
  try {
    // Test simple select from processing_jobs
    console.log('📋 Testing processing_jobs table access...')
    const { data, error } = await supabase
      .from('processing_jobs')
      .select('status')
      .limit(1)
    
    if (error) {
      console.error('❌ processing_jobs access failed:', error.message)
      return
    }
    
    console.log('✅ processing_jobs table accessible')
    
    // Test insert with minimal fields
    console.log('🔧 Testing minimal insert...')
    const { data: insertData, error: insertError } = await supabase
      .from('processing_jobs')
      .insert({
        status: 'queued'
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ Minimal insert failed:', insertError.message)
      return
    }
    
    console.log('✅ Minimal insert successful')
    console.log('📋 Job ID:', insertData.id)
    
    // Clean up
    const { error: deleteError } = await supabase
      .from('processing_jobs')
      .delete()
      .eq('id', insertData.id)
    
    if (deleteError) {
      console.log('⚠️  Cleanup warning:', deleteError.message)
    } else {
      console.log('✅ Test job cleaned up')
    }
    
    console.log('\n🎉 Schema cache test completed successfully!')
    
  } catch (error) {
    console.error('💥 Test failed:', error.message)
  }
}

simpleTest()