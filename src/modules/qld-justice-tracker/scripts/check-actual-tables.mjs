#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

console.log('🔍 CHECKING WHAT TABLES ACTUALLY EXIST IN YOUR DATABASE')
console.log('======================================================\n')

const tables = [
  'youth_statistics',
  'budget_allocations',
  'court_statistics',
  'court_annual_statistics', 
  'detention_census',
  'police_youth_statistics',
  'scraped_content',
  'parliamentary_documents',
  'cost_comparisons',
  'hidden_costs',
  'expenditures',
  'detention_stats',
  'youth_crimes',
  'court_sentencing',
  'rti_requests',
  'scraper_health',
  'scraper_logs'
]

async function checkTables() {
  const existing = []
  const missing = []
  
  for (const table of tables) {
    try {
      const { error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        missing.push(table)
        console.log(`❌ ${table} - NOT FOUND`)
      } else {
        existing.push(table)
        console.log(`✅ ${table} - EXISTS (${count || 0} records)`)
      }
    } catch (e) {
      missing.push(table)
      console.log(`❌ ${table} - ERROR`)
    }
  }
  
  console.log('\n📊 SUMMARY:')
  console.log(`   Tables found: ${existing.length}`)
  console.log(`   Tables missing: ${missing.length}`)
  
  if (existing.length > 0) {
    console.log('\n✅ EXISTING TABLES WE CAN USE:')
    existing.forEach(t => console.log(`   - ${t}`))
  }
  
  return { existing, missing }
}

checkTables()