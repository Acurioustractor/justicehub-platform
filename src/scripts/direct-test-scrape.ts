#!/usr/bin/env node
/**
 * Direct Test Scrape Script
 * 
 * Bypasses the authentication issues and directly creates a scraping job
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

async function directTestScrape() {
  console.log('🧪 Direct Test Scrape...')
  
  // Use the service key directly
  const supabase = createClient(
    'https://tednluwflfhxyucgwigh.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo'
  )
  
  try {
    // Get an active data source
    console.log('📋 Getting active data source...')
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
    
    // Create a processing job
    console.log('🔧 Creating processing job...')
    const { data: job, error: jobError } = await supabase
      .from('processing_jobs')
      .insert({
        status: 'queued',
        data_source_id: source.id
      })
      .select()
      .single()
    
    if (jobError) {
      console.error('❌ Failed to create processing job:', jobError.message)
      return
    }
    
    console.log(`✅ Created processing job: ${job.id}`)
    console.log('🚀 Job is queued and will be processed by the scraping system')
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message)
  }
}

// Run the test
directTestScrape()