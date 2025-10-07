#!/usr/bin/env node
/**
 * Check Final Service Data
 * 
 * Check if services have been populated in the database
 */

import { createClient } from '@supabase/supabase-js'

async function checkFinalServiceData() {
  console.log('🔍 Checking final service data...')
  
  // Create Supabase client with service key
  const supabase = createClient(
    'https://tednluwflfhxyucgwigh.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo'
  )
  
  try {
    // Check services count
    const { count, error } = await supabase
      .from('services')
      .select('*', { count: 'exact' })
    
    if (error) {
      console.log('❌ Error checking services:', error.message)
      return
    }
    
    console.log(`📊 Total services in database: ${count}`)
    
    if (count > 0) {
      // Get sample services
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select(`
          *,
          organization:organizations(name)
        `)
        .limit(5)
      
      if (servicesError) {
        console.log('❌ Error fetching services:', servicesError.message)
      } else {
        console.log('\n📋 Sample services:')
        services.forEach((service, index) => {
          console.log(`${index + 1}. ${service.name} (${service.category}) - ${service.organization?.name || 'No org'}`)
        })
      }
    } else {
      console.log('⚠️  No services found in database')
      console.log('💡 You may want to run the sample data script:')
      console.log('   npx tsx src/scripts/insert-sample-data.ts')
    }
    
    // Check data sources
    const { count: sourcesCount, error: sourcesError } = await supabase
      .from('data_sources')
      .select('*', { count: 'exact' })
    
    if (sourcesError) {
      console.log('❌ Error checking data sources:', sourcesError.message)
    } else {
      console.log(`\n📊 Data sources configured: ${sourcesCount}`)
    }
    
    console.log('\n🎉 Final verification complete!')
    console.log('🚀 Your JusticeHub Service Finder & AI Scraper are ready to go!')
    
  } catch (error) {
    console.error('💥 Error:', error)
  }
}

// Run the check
checkFinalServiceData()