import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })
dotenv.config({ path: join(__dirname, '..', '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

console.log('Supabase URL:', supabaseUrl)

async function setupMonitoringTables() {
  console.log('\n🚀 Setting up scraper monitoring tables in Supabase...\n')

  // Read the SQL migration file
  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '002_scraper_monitoring.sql')
  const sql = readFileSync(migrationPath, 'utf8')

  // Split into individual statements (basic split, may need refinement)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  console.log(`Found ${statements.length} SQL statements to execute\n`)

  // For now, let's just output the instructions since we can't execute raw SQL via the client library
  console.log('📋 INSTRUCTIONS TO SET UP MONITORING:\n')
  console.log('1. Go to your Supabase Dashboard:')
  console.log(`   ${supabaseUrl.replace('.supabase.co', '.supabase.com/dashboard/project/ivvvkombgqvjyrrmwmbs')}\n`)
  console.log('2. Click on "SQL Editor" in the left sidebar\n')
  console.log('3. Click "New query" button\n')
  console.log('4. Copy and paste the contents of this file:')
  console.log(`   ${migrationPath}\n`)
  console.log('5. Click "Run" button (or press Cmd/Ctrl + Enter)\n')
  console.log('6. You should see "Success. No rows returned" message\n')
  console.log('7. Come back here and run: node scripts/seed-monitoring.mjs\n')

  // Let's check if tables exist
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  console.log('🔍 Checking current table status...\n')
  
  const tables = [
    'scraper_health',
    'scraper_runs',
    'data_quality_metrics',
    'scraper_alerts',
    'rate_limit_configs'
  ]
  
  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ Table "${table}" - NOT FOUND`)
      } else {
        console.log(`✅ Table "${table}" - EXISTS`)
      }
    } catch (e) {
      console.log(`❌ Table "${table}" - NOT FOUND`)
    }
  }
  
  console.log('\n💡 TIP: You can also check your existing scrapers in Supabase:')
  console.log('   - Go to Table Editor in Supabase Dashboard')
  console.log('   - Look for tables like: budget_allocations, youth_detention_stats, etc.')
  console.log('   - These contain your actual scraped data\n')
}

setupMonitoringTables().catch(console.error)