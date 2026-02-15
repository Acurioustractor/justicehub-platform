#!/usr/bin/env node
/**
 * Create Processing Job Directly
 * 
 * Creates a processing job with minimal fields to test if it works
 */

import { createClient } from '@supabase/supabase-js'

async function createProcessingJob() {
  console.log('🔧 Creating Processing Job Directly...')
  
  try {
    // Use the same credentials as simple-database-test which worked
    const supabase = createClient(
      'https://tednluwflfhxyucgwigh.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo'
    )
    
    // Get a data source ID
    console.log('📋 Getting data source...')
    const { data: sources, error: sourcesError } = await supabase
      .from('data_sources')
      .select('id')
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
    
    const dataSourceId = sources[0].id
    console.log(`✅ Using data source ID: ${dataSourceId}`)
    
    // Try to create a job with minimal required fields
    console.log('🔧 Creating job with minimal fields...')
    const { data: job, error: jobError } = await supabase
      .from('processing_jobs')
      .insert({
        type: 'discovery',
        status: 'queued',
        data_source_id: dataSourceId
      })
      .select()
      .single()
    
    if (jobError) {
      console.error('❌ Failed to create job:', jobError.message)
      return
    }
    
    console.log(`✅ Job created successfully!`)
    console.log(`   ID: ${job.id}`)
    console.log(`   Type: ${job.type}`)
    console.log(`   Status: ${job.status}`)
    console.log(`   Created: ${job.created_at}`)
    
  } catch (error) {
    console.error('💥 Job creation failed:', error.message)
  }
}

// Run the function
createProcessingJob()