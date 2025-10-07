#!/usr/bin/env node
/**
 * Post-Setup Verification
 * 
 * Verifies that the JusticeHub Service Finder and AI Scraper are working correctly
 */

import { createClient } from '@supabase/supabase-js'

async function postSetupVerification() {
  console.log('✅ Post-Setup Verification\n')
  
  // Create Supabase client with service key
  const supabase = createClient(
    'https://tednluwflfhxyucgwigh.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo'
  )
  
  try {
    // Check if services table exists and has data
    console.log('🔍 Checking services table...')
    const { data: services, error: servicesError, count } = await supabase
      .from('services')
      .select('*', { count: 'exact' })
    
    if (servicesError) {
      console.log('❌ Services table error:', servicesError.message)
    } else {
      console.log(`✅ Services table: ${count} services found`)
    }
    
    // Check if organizations table exists
    console.log('🔍 Checking organizations table...')
    const { data: orgs, error: orgsError, count: orgCount } = await supabase
      .from('organizations')
      .select('*', { count: 'exact' })
    
    if (orgsError) {
      console.log('❌ Organizations table error:', orgsError.message)
    } else {
      console.log(`✅ Organizations table: ${orgCount} organizations found`)
    }
    
    // Check if AI scraper tables exist
    console.log('🔍 Checking AI scraper tables...')
    const scraperTables = ['data_sources', 'processing_jobs', 'scraping_metadata', 'organization_enrichment', 'scraped_services']
    
    for (const table of scraperTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1)
        
        if (error) {
          console.log(`❌ ${table}: Error - ${error.message}`)
        } else {
          console.log(`✅ ${table}: Exists`)
        }
      } catch (error) {
        console.log(`❌ ${table}: Error - ${error}`)
      }
    }
    
    // Test a sample query that the Service Finder would make
    console.log('🔍 Testing Service Finder queries...')
    const { data: sampleServices, error: sampleError } = await supabase
      .from('services')
      .select(`
        *,
        organization:organizations(name, website_url)
      `)
      .eq('active', true)
      .limit(3)
    
    if (sampleError) {
      console.log('❌ Sample service query failed:', sampleError.message)
    } else {
      console.log('✅ Sample service query successful')
      if (sampleServices && sampleServices.length > 0) {
        console.log(`📋 Sample service: ${sampleServices[0].name}`)
      }
    }
    
    console.log('\n🎉 Post-Setup Verification Complete!')
    console.log('\n🚀 You\'re ready to go!')
    console.log('   Run: npm run dev')
    console.log('   Visit: http://localhost:3000/services')
    
  } catch (error) {
    console.error('💥 Verification failed:', error)
  }
}

// Run verification
postSetupVerification()
