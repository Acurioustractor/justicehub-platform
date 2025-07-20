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

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedBasicScrapers() {
  console.log('Seeding basic scraper data...')

  const scrapers = [
    {
      scraper_name: 'Parliament Hansard',
      data_source: 'parliament_hansard',
      status: 'healthy',
      last_run_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      last_success_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      records_scraped: 156,
      error_count: 0,
      consecutive_failures: 0,
      average_runtime_seconds: 125.5
    },
    {
      scraper_name: 'Parliament Committees',
      data_source: 'parliament_committees',
      status: 'healthy',
      last_run_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      last_success_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      records_scraped: 89,
      error_count: 0,
      consecutive_failures: 0,
      average_runtime_seconds: 98.2
    },
    {
      scraper_name: 'Parliament QoN',
      data_source: 'parliament_qon',
      status: 'warning',
      last_run_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      last_success_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
      records_scraped: 0,
      error_count: 2,
      consecutive_failures: 1,
      average_runtime_seconds: 45.8
    },
    {
      scraper_name: 'Treasury Budget',
      data_source: 'treasury_budget',
      status: 'error',
      last_run_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      last_success_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      records_scraped: 0,
      error_count: 5,
      consecutive_failures: 3,
      average_runtime_seconds: 215.3
    },
    {
      scraper_name: 'Budget Website',
      data_source: 'budget_website',
      status: 'healthy',
      last_run_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      last_success_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      records_scraped: 234,
      error_count: 0,
      consecutive_failures: 0,
      average_runtime_seconds: 156.7
    },
    {
      scraper_name: 'Youth Statistics',
      data_source: 'youth_statistics',
      status: 'healthy',
      last_run_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      last_success_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      records_scraped: 45,
      error_count: 1,
      consecutive_failures: 0,
      average_runtime_seconds: 67.9
    }
  ]

  for (const scraper of scrapers) {
    try {
      const { error } = await supabase
        .from('scraper_health')
        .upsert(scraper, {
          onConflict: 'scraper_name,data_source'
        })

      if (error) throw error
      console.log(`✓ Seeded ${scraper.scraper_name}`)
    } catch (error) {
      console.error(`Error seeding ${scraper.scraper_name}:`, error.message)
    }
  }

  // Add some sample alerts
  const alerts = [
    {
      scraper_name: 'Treasury Budget',
      data_source: 'treasury_budget',
      alert_type: 'failure',
      severity: 'critical',
      message: 'Scraper has failed 3 consecutive times - PDF parsing error',
      details: { error: 'Unable to extract tables from PDF', consecutive_failures: 3 },
      is_resolved: false
    },
    {
      scraper_name: 'Parliament QoN',
      data_source: 'parliament_qon',
      alert_type: 'missing_data',
      severity: 'medium',
      message: 'No new Questions on Notice found in last 24 hours',
      details: { last_successful_scrape: '2025-06-15', expected_frequency: 'daily' },
      is_resolved: false
    }
  ]

  for (const alert of alerts) {
    try {
      const { error } = await supabase
        .from('scraper_alerts')
        .insert(alert)

      if (error && !error.message.includes('duplicate')) {
        throw error
      }
      console.log(`✓ Created alert for ${alert.scraper_name}`)
    } catch (error) {
      console.error(`Error creating alert:`, error.message)
    }
  }

  console.log('\n✅ Basic scraper data seeded successfully!')
  console.log('View at: http://localhost:3001/monitoring')
}

seedBasicScrapers().catch(console.error)