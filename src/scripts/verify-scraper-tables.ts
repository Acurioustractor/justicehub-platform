#!/usr/bin/env node
/**
 * Verify AI Scraper Database Tables
 * 
 * Checks that all required tables for the AI scraper exist in the database
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

async function verifyScraperTables() {
  console.log('🔍 Verifying AI Scraper Database Tables...')
  
  // Create Supabase client with service key
  const supabase = createClient(
    'https://tednluwflfhxyucgwigh.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo'
  )
  
  // Tables that should exist for the AI scraper
  const requiredTables = [
    'data_sources',
    'processing_jobs',
    'scraping_metadata',
    'organization_enrichment',
    'scraped_services'
  ]
  
  console.log('📋 Checking for required tables...')
  
  for (const tableName of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('count')
        .limit(1)
      
      if (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          console.log(`❌ ${tableName}: Missing (needs to be created)`)
        } else {
          console.log(`❌ ${tableName}: Error - ${error.message}`)
        }
      } else {
        console.log(`✅ ${tableName}: Exists`)
      }
    } catch (error) {
      console.log(`❌ ${tableName}: Error - ${error}`)
    }
  }
  
  console.log('\n📋 Required tables for AI scraper:')
  console.log('1. data_sources - Configuration for data sources to scrape')
  console.log('2. processing_jobs - Queue and status tracking for scraping jobs')
  console.log('3. scraping_metadata - Metadata about scraping processes')
  console.log('4. organization_enrichment - AI-extracted enrichment data')
  console.log('5. scraped_services - Service offerings discovered through AI scraping')
  
  console.log('\n🔧 To create missing tables, run the database schema from:')
  console.log('   src/modules/ai-scraper/database/schema.sql')
}

// Run verification
verifyScraperTables()