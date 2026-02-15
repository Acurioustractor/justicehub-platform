#!/usr/bin/env node
/**
 * Initialize AI Scraping System
 * 
 * Sets up the AI scraper with government data sources and your API keys
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

async function initializeScrapingSystem() {
  console.log('🔧 Initializing AI Scraping System...')
  
  // Create Supabase client with service key
  const supabaseUrl = process.env.SUPABASE_URL || 'https://tednluwflfhxyucgwigh.supabase.co'
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo'
  
  console.log('🔧 Supabase URL:', supabaseUrl)
  console.log('🔧 Supabase Key type:', supabaseKey ? 'service_role' : 'missing')
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // Create default data sources
  const defaultSources = [
    // Federal Government
    {
      name: 'Australian Government Open Data',
      type: 'government_database',
      base_url: 'https://data.gov.au',
      api_endpoint: 'https://data.gov.au/api/3',
      scraping_config: {
        rate_limit_ms: 2000,
        max_concurrent_requests: 1,
        retry_attempts: 3,
        timeout_ms: 30000,
        respect_robots_txt: true,
        user_agent: 'JusticeHub-Bot/1.0',
        headers: {
          'Accept': 'application/json'
        }
      },
      discovery_patterns: [
        {
          pattern_type: 'css_selector',
          pattern: 'a[href*="youth"], a[href*="justice"], a[href*="legal"], a[href*="community"]',
          expected_result_type: 'organization_link',
          confidence_threshold: 0.7
        }
      ],
      update_frequency: 'weekly',
      reliability_score: 0.9,
      last_successful_scrape: null,
      active: true
    },

    // NSW Government
    {
      name: 'NSW Family and Community Services',
      type: 'government_database',
      base_url: 'https://www.facs.nsw.gov.au',
      scraping_config: {
        rate_limit_ms: 1500,
        max_concurrent_requests: 1,
        retry_attempts: 3,
        timeout_ms: 30000,
        respect_robots_txt: true,
        user_agent: 'JusticeHub-Bot/1.0'
      },
      discovery_patterns: [
        {
          pattern_type: 'css_selector',
          pattern: 'a[href*="service"], a[href*="provider"], a[href*="youth"]',
          expected_result_type: 'organization_link',
          confidence_threshold: 0.8
        }
      ],
      update_frequency: 'monthly',
      reliability_score: 0.85,
      last_successful_scrape: null,
      active: true
    },

    // Queensland Government
    {
      name: 'QLD Youth Justice Services',
      type: 'government_database',
      base_url: 'https://www.youthjustice.qld.gov.au',
      scraping_config: {
        rate_limit_ms: 1500,
        max_concurrent_requests: 1,
        retry_attempts: 3,
        timeout_ms: 30000,
        respect_robots_txt: true,
        user_agent: 'JusticeHub-Bot/1.0'
      },
      discovery_patterns: [
        {
          pattern_type: 'css_selector',
          pattern: 'a[href*="partner"], a[href*="service"], a[href*="program"]',
          expected_result_type: 'organization_link',
          confidence_threshold: 0.8
        }
      ],
      update_frequency: 'monthly',
      reliability_score: 0.9,
      last_successful_scrape: null,
      active: true
    },

    // Legal Aid - NSW
    {
      name: 'Legal Aid NSW',
      type: 'legal_aid_directory',
      base_url: 'https://www.legalaid.nsw.gov.au',
      scraping_config: {
        rate_limit_ms: 2000,
        max_concurrent_requests: 1,
        retry_attempts: 3,
        timeout_ms: 30000,
        respect_robots_txt: true,
        user_agent: 'JusticeHub-Bot/1.0'
      },
      discovery_patterns: [
        {
          pattern_type: 'css_selector',
          pattern: 'a[href*="help"], a[href*="service"], a[href*="legal"]',
          expected_result_type: 'service_info',
          confidence_threshold: 0.9
        }
      ],
      update_frequency: 'monthly',
      reliability_score: 0.95,
      last_successful_scrape: null,
      active: true
    },

    // Youth-specific organizations
    {
      name: 'Youth Law Australia',
      type: 'community_directory',
      base_url: 'https://www.youthlaw.asn.au',
      scraping_config: {
        rate_limit_ms: 2000,
        max_concurrent_requests: 1,
        retry_attempts: 3,
        timeout_ms: 30000,
        respect_robots_txt: true,
        user_agent: 'JusticeHub-Bot/1.0'
      },
      discovery_patterns: [
        {
          pattern_type: 'css_selector',
          pattern: 'a[href*="resource"], a[href*="service"], a[href*="legal"]',
          expected_result_type: 'organization_link',
          confidence_threshold: 0.9
        }
      ],
      update_frequency: 'monthly',
      reliability_score: 0.9,
      last_successful_scrape: null,
      active: true
    }
  ]

  // Insert data sources
  for (const source of defaultSources) {
    try {
      // Check if source already exists
      const { data: existing } = await supabase
        .from('data_sources')
        .select('id')
        .eq('name', source.name)
        .eq('type', source.type)
        .single()

      if (!existing) {
        const { error } = await supabase
          .from('data_sources')
          .insert(source)

        if (error) {
          console.error(`Failed to create data source ${source.name}:`, error)
        } else {
          console.log(`✅ Created data source: ${source.name}`)
        }
      } else {
        console.log(`⏭️  Data source already exists: ${source.name}`)
      }
    } catch (error) {
      console.error(`Error setting up data source ${source.name}:`, error)
    }
  }

  console.log('🎉 AI Scraping System initialization complete')
  console.log('\n📋 Next steps:')
  console.log('1. Make sure your API keys are in .env.local:')
  console.log('   OPENAI_API_KEY=your_new_openai_key')
  console.log('   ANTHROPIC_API_KEY=your_new_anthropic_key')
  console.log('   FIRECRAWL_API_KEY=your_new_firecrawl_key')
  console.log('2. Run a test scrape: npx tsx src/scripts/run-test-scrape.ts')
}

// Run initialization
initializeScrapingSystem().catch(console.error)