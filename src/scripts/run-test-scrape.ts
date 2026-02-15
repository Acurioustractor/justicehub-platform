#!/usr/bin/env node
/**
 * Test AI Scraping Functionality
 * 
 * Runs a test scraping job to verify the AI scraper is working with your API keys
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
  
  // Create Supabase client with service key
  const supabaseUrl = process.env.SUPABASE_URL || 'https://tednluwflfhxyucgwigh.supabase.co'
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo'
  
  console.log('🔧 Supabase URL:', supabaseUrl)
  console.log('🔧 Supabase Key type:', supabaseKey ? 'service_role' : 'missing')
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Get a data source to test with
    const { data: sources, error: sourcesError } = await supabase
      .from('data_sources')
      .select('*')
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
    console.log(`📋 Testing with data source: ${source.name}`)
    
    // Create a test job
    const { data: job, error: jobError } = await supabase
      .from('processing_jobs')
      .insert({
        type: 'discovery',
        status: 'queued',
        priority: 'low',
        data_source_id: source.id,
        configuration: {
          test_mode: true,
          max_urls: 3,
          timeout_override: 15000
        },
        created_by: 'test_script'
      })
      .select()
      .single()
    
    if (jobError) {
      console.error('❌ Failed to create test job:', jobError.message)
      return
    }
    
    console.log(`✅ Created test job: ${job.id}`)
    console.log('🚀 Job is queued and will be processed by the scraping system')
    console.log('\n📋 To monitor the job status, you can query the processing_jobs table:')
    console.log('   SELECT * FROM processing_jobs WHERE id = \'${job.id}\';')
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

// Run test
runTestScrape()