#!/usr/bin/env node
/**
 * Manual Database Verification
 * 
 * Manually verifies database structure and attempts to work around schema cache issues
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

async function manualVerification() {
  console.log('🔬 Manual Database Verification...')
  
  // Create Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL || 'https://tednluwflfhxyucgwigh.supabase.co',
    process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo'
  )
  
  try {
    // Test basic table existence
    console.log('\n🔍 Testing table existence...')
    
    const tables = [
      'organizations',
      'services', 
      'data_sources',
      'processing_jobs',
      'scraping_metadata',
      'organization_enrichment',
      'scraped_services'
    ]
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1)
          
        if (error) {
          console.log(`❌ ${table}: ${error.message}`)
        } else {
          console.log(`✅ ${table}: Accessible`)
        }
      } catch (e) {
        console.log(`❌ ${table}: Exception - ${e.message}`)
      }
    }
    
    // Test data sources specifically
    console.log('\n📋 Checking data sources...')
    const { data: sources, error: sourcesError } = await supabase
      .from('data_sources')
      .select('id, name, type, base_url, active')
      .limit(3)
    
    if (sourcesError) {
      console.log('❌ Data sources query failed:', sourcesError.message)
    } else {
      console.log(`✅ Found ${sources.length} data sources:`)
      sources.forEach((source, index) => {
        console.log(`   ${index + 1}. ${source.name} (${source.type}) - ${source.active ? '✅' : '❌'}`)
      })
    }
    
    // Test services
    console.log('\n📊 Checking services...')
    const { count: serviceCount, error: serviceCountError } = await supabase
      .from('services')
      .select('*', { count: 'exact' })
    
    if (serviceCountError) {
      console.log('❌ Services count failed:', serviceCountError.message)
    } else {
      console.log(`✅ Services table contains ${serviceCount || 0} records`)
    }
    
    // Try to get a simple count from processing_jobs
    console.log('\n🔄 Checking processing jobs...')
    try {
      const { count: jobCount, error: jobCountError } = await supabase
        .from('processing_jobs')
        .select('*', { count: 'exact' })
        
      if (jobCountError) {
        console.log('❌ Processing jobs count failed:', jobCountError.message)
        // Try a different approach
        console.log('🔧 Trying alternative approach...')
      } else {
        console.log(`✅ Processing jobs table contains ${jobCount || 0} records`)
      }
    } catch (e) {
      console.log('❌ Processing jobs check failed:', e.message)
    }
    
    console.log('\n🎉 Manual verification completed!')
    
  } catch (error) {
    console.error('💥 Verification failed:', error.message)
  }
}

// Run verification
manualVerification()
