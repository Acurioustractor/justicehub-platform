import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkMonitoringData() {
  console.log('📊 Checking monitoring data...\n')
  
  // Check scraper health
  console.log('Scraper Health:')
  const { data: health, error: healthError } = await supabase
    .from('scraper_health')
    .select('*')
    .order('last_run_at', { ascending: false })
  
  if (healthError) {
    console.error('Error:', healthError.message)
  } else if (health?.length > 0) {
    health.forEach(s => {
      console.log(`- ${s.scraper_name}: ${s.status} (last run: ${s.last_run_at || 'never'})`)
    })
  } else {
    console.log('  No scraper health data yet')
  }
  
  // Check recent runs
  console.log('\nRecent Scraper Runs:')
  const { data: runs, error: runsError } = await supabase
    .from('scraper_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(10)
  
  if (runsError) {
    console.error('Error:', runsError.message)
  } else if (runs?.length > 0) {
    runs.forEach(r => {
      console.log(`- ${r.scraper_name}: ${r.status} (${r.runtime_seconds?.toFixed(2)}s)`)
    })
  } else {
    console.log('  No scraper runs yet')
  }
  
  // Check if main data tables have data
  console.log('\nMain Data Tables:')
  const tables = ['budget_allocations', 'parliamentary_documents', 'youth_crimes', 'detention_statistics']
  
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    if (!error) {
      console.log(`- ${table}: ${count || 0} records`)
    }
  }
}

checkMonitoringData()