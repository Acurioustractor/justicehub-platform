#!/usr/bin/env node
/**
 * Direct Test - Create Processing Job
 * 
 * Directly creates a processing job to test if the system works
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

async function directTest() {
  console.log('🚀 Direct Test - Create Processing Job...')
  
  try {
    // Use the same credentials as simple-database-test which worked
    const supabase = createClient(
      'https://tednluwflfhxyucgwigh.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo'
    )
    
    // First, get a data source
    console.log('📋 Getting data sources...')
    const { data: sources, error: sourcesError } = await supabase
      .from('data_sources')
      .select('id, name')
      .eq('active', true)
      .limit(1)
    
    if (sourcesError) {
      console.error('❌ Failed to get data sources:', sourcesError.message)
      return
    }
    
    if (!sources || sources.length === 0) {
      console.log('❌ No active data sources found')
      return
    }
    
    const source = sources[0]
    console.log(`✅ Using data source: ${source.name}`)
    
    // Create a test job
    console.log('🔧 Creating test processing job...')
    const { data: job, error: jobError } = await supabase
      .from('processing_jobs')
      .insert({
        type: 'discovery',
        status: 'queued',
        priority: 'high',
        data_source_id: source.id,
        configuration: {
          test_mode: true,
          max_urls: 1,
          timeout_override: 10000
        },
        created_by: 'direct_test'
      })
      .select()
      .single()
    
    if (jobError) {
      console.error('❌ Failed to create processing job:', jobError.message)
      return
    }
    
    console.log(`✅ Successfully created processing job: ${job.id}`)
    console.log(`📊 Job details:`)
    console.log(`   Type: ${job.type}`)
    console.log(`   Status: ${job.status}`)
    console.log(`   Priority: ${job.priority}`)
    console.log(`   Created: ${job.created_at}`)
    
    // Verify the job exists
    console.log('\n🔍 Verifying job creation...')
    const { data: verifyJob, error: verifyError } = await supabase
      .from('processing_jobs')
      .select('*')
      .eq('id', job.id)
      .single()
    
    if (verifyError) {
      console.error('❌ Failed to verify job:', verifyError.message)
      return
    }
    
    console.log('✅ Job verification successful!')
    console.log('\n🎉 Direct test completed successfully!')
    console.log('📋 Next steps:')
    console.log('1. The job is now queued for processing')
    console.log('2. The AI scraper will process it automatically')
    console.log('3. Check the processing_jobs table for status updates')
    
  } catch (error) {
    console.error('💥 Direct test failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

// Run the test
directTest()
