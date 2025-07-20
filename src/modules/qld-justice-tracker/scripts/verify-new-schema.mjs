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

console.log('🔍 VERIFYING NEW SCHEMA')
console.log('=======================\n')

async function verifySchema() {
  const tables = [
    'court_annual_statistics',
    'detention_census',
    'police_youth_statistics',
    'budget_annual_allocations',
    'calculated_metrics',
    'data_quality_log',
    'data_audit_trail'
  ]
  
  let allGood = true
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`❌ ${table}: NOT FOUND`)
        allGood = false
      } else {
        console.log(`✅ ${table}: EXISTS (${count || 0} records)`)
      }
    } catch (e) {
      console.log(`❌ ${table}: ERROR - ${e.message}`)
      allGood = false
    }
  }
  
  if (allGood) {
    console.log('\n✅ All tables created successfully!')
    console.log('Ready to load verified data.')
  } else {
    console.log('\n⚠️  Some tables are missing.')
    console.log('Please run the schema SQL in Supabase first.')
  }
  
  return allGood
}

verifySchema()