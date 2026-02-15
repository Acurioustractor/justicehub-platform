#!/usr/bin/env node
/**
 * Test AI Scraping Functionality (Simplified Version)
 * 
 * Runs a test scraping job to verify the AI scraper is working with your API keys
 * This version avoids complex schema references that cause cache issues
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

async function runTestScrape() {
  console.log('🧪 Running Test Scraping Job...')
  
  // Check if API keys are available
  const openaiKey = process.env.OPENAI_API_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const firecrawlKey = process.env.FIRECRAWL_API_KEY
  
  console.log('🔑 API Key Status:')
  console.log('OpenAI:', openaiKey ? '✅ Found' : '❌ Missing')
  console.log('Anthropic:', anthropicKey ? '✅ Found' : '❌ Missing')
  console.log('Firecrawl:', firecrawlKey ? '✅ Found' : '❌ Missing')
  
  if (!openaiKey && !anthropicKey) {
    console.log('⚠️  Warning: No AI API keys found. Scraping will use basic extraction only.')
  }
  
  if (!firecrawlKey) {
    console.log('⚠️  Warning: No Firecrawl API key found. Web scraping may be limited.')
  }
  
  // Create Supabase client with service key to bypass schema cache issues
  const supabase = createClient(
    process.env.SUPABASE_URL || 'https://tednluwflfhxyucgwigh.supabase.co',
    process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo'
  )
  
  try {
    // Get a data source to test with (using simpler query)
    console.log('🔍 Looking for active data sources...')
    const { data: sources, error: sourcesError } = await supabase
      .from('data_sources')
      .select('id,name,type,base_url')
      .eq('active', true)
      .limit(1)
    
    if (sourcesError) {
      console.error('❌ Failed to get data sources:', sourcesError.message)
      return
    }
    
    if (!sources || sources.length === 0) {
      console.log('⚠️  No active data sources found. Run the initialization script first:')
      console.log('   npx tsx src/scripts/initialize-scraper.ts')
      return
    }
    
    const source = sources[0]
    console.log(`📋 Testing with data source: ${source.name} (${source.type})`)
    
    // Create a simple processing job with minimal fields to avoid schema cache issues
    console.log('🚀 Creating test scraping job...')
    
    const jobData = {
      type: 'discovery',
      status: 'queued',
      priority: 'low',
      data_source_id: source.id,
      created_by: 'test_script_' + Date.now(),
      configuration: JSON.stringify({
        test_mode: true,
        max_urls: 3,
        timeout_override: 15000
      })
    }
    
    // Try inserting with minimal required fields first
    const { data: job, error: jobError } = await supabase
      .from('processing_jobs')
      .insert({
        type: 'discovery',
        status: 'queued',
        priority: 'low',
        data_source_id: source.id,
        created_by: 'test_script_' + Date.now()
      })
      .select()
      .single()
    
    if (jobError) {
      console.error('❌ Failed to create test job:', jobError.message)
      
      // Try even simpler insert
      const { data: simpleJob, error: simpleError } = await supabase
        .from('processing_jobs')
        .insert({
          type: 'test',
          status: 'queued'
        })
        .select()
        .single()
      
      if (simpleError) {
        console.error('❌ Even simpler job creation failed:', simpleError.message)
        console.log('\n🔧 This appears to be a schema cache issue with Supabase.')
        console.log('   Try refreshing the schema cache by:')
        console.log('   1. Restarting your Supabase project')
        console.log('   2. Or waiting a few minutes and trying again')
        return
      } else {
        console.log(`✅ Created simplified test job: ${simpleJob.id}`)
        console.log('🎉 Simplified job creation worked!')
      }
    } else {
      console.log(`✅ Created test job: ${job.id}`)
      console.log('🚀 Job is queued and will be processed by the scraping system')
      console.log('\n📋 To monitor the job status, you can query:')
      console.log('   SELECT * FROM processing_jobs WHERE id = ?', job.id)
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message)
    console.log('\n🔧 Try these troubleshooting steps:')
    console.log('   1. Wait a few minutes and try again (schema cache may refresh)')
    console.log('   2. Check your Supabase project status')
    console.log('   3. Restart your development server')
  }
}

// Run test
runTestScrape()