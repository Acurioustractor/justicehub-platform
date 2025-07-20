import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })
dotenv.config({ path: join(__dirname, '..', '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function testMonitoringReady() {
  console.log('\n🔍 Testing if monitoring tables are ready...\n')
  
  try {
    // Test scraper_health table
    const { data, error } = await supabase
      .from('scraper_health')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('❌ Monitoring tables NOT ready yet')
      console.log('\n📋 Please run the SQL migration first:')
      console.log('1. Go to: https://ivvvkombgqvjyrrmwmbs.supabase.com/dashboard/project/ivvvkombgqvjyrrmwmbs/sql/new')
      console.log('2. The SQL is already in your clipboard - just paste it!')
      console.log('3. Click Run')
      console.log('4. Then run: npm run scrape:monitored')
      return false
    }
    
    console.log('✅ Monitoring tables are ready!')
    console.log('\n🚀 You can now run: npm run scrape:monitored')
    
    // Seed some initial data if empty
    if (!data || data.length === 0) {
      console.log('\n📝 Seeding initial monitoring data...')
      
      const scrapers = [
        { scraper_name: 'Budget Allocations Scraper', data_source: 'budget_website' },
        { scraper_name: 'Parliamentary Documents Scraper', data_source: 'parliament_hansard' },
        { scraper_name: 'Hidden Costs Calculator', data_source: 'hidden_costs' },
        { scraper_name: 'RTI Monitor', data_source: 'rti_requests' }
      ]
      
      for (const scraper of scrapers) {
        await supabase
          .from('scraper_health')
          .upsert({
            ...scraper,
            status: 'healthy',
            records_scraped: 0,
            error_count: 0,
            consecutive_failures: 0
          }, {
            onConflict: 'scraper_name,data_source'
          })
      }
      
      console.log('✅ Initial scrapers registered in monitoring system')
    }
    
    return true
    
  } catch (error) {
    console.error('Error:', error.message)
    return false
  }
}

testMonitoringReady()