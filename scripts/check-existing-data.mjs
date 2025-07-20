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

async function checkExistingData() {
  console.log('\n🔍 Checking your existing scraped data in Supabase...\n')

  // Tables from your migration file
  const tables = [
    'budget_allocations',
    'budget_spending_categories', 
    'youth_detention_stats',
    'indigenous_representation',
    'parliamentary_documents',
    'committee_reports',
    'questions_on_notice',
    'hidden_costs',
    'cost_benefit_analyses',
    'rti_requests',
    'rti_documents',
    'media_coverage',
    'community_feedback',
    'stakeholder_contacts'
  ]

  let foundTables = []
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(5)
      
      if (!error && data) {
        foundTables.push(table)
        console.log(`✅ Table "${table}" - Found ${data.length} records`)
        
        // Show sample data
        if (data.length > 0) {
          console.log(`   Sample: ${JSON.stringify(data[0]).substring(0, 100)}...`)
        }
      } else {
        console.log(`❌ Table "${table}" - Not found or empty`)
      }
    } catch (e) {
      console.log(`❌ Table "${table}" - Error accessing`)
    }
  }
  
  console.log(`\n📊 Summary: Found ${foundTables.length} tables with scraped data`)
  
  if (foundTables.length > 0) {
    console.log('\n🎯 Your scrapers are collecting data into these tables:')
    foundTables.forEach(table => console.log(`   - ${table}`))
    
    console.log('\n💡 The monitoring system will track the health of scrapers that populate these tables')
    console.log('   Once you set up the monitoring tables, you\'ll see real-time status for each scraper')
  }
}

checkExistingData().catch(console.error)