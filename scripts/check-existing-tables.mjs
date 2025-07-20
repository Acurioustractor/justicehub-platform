#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🔍 Checking which tables actually exist...\n')

async function checkTables() {
  console.log('Checking tables individually...\n')
    
    // Try checking each table individually
    const testTables = [
      'scraped_content', 'scraper_health', 'court_statistics', 'court_sentencing',
      'youth_crimes', 'youth_crime_patterns', 'rti_requests', 'youth_statistics',
      'budget_allocations', 'parliamentary_documents'
    ]
    
    console.log('📋 Table Existence Check:')
    const existingTables = []
    
    for (const table of testTables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (!error) {
          console.log(`   ✅ ${table}: EXISTS (${count || 0} records)`)
          existingTables.push(table)
        } else {
          console.log(`   ❌ ${table}: MISSING (${error.message})`)
        }
      } catch (err) {
        console.log(`   ❌ ${table}: ERROR (${err.message})`)
      }
    }
    
    console.log(`\n📊 Summary: ${existingTables.length}/${testTables.length} tables exist`)
    
    const missingTables = testTables.filter(t => !existingTables.includes(t))
    if (missingTables.length > 0) {
      console.log('\n🔧 Missing tables that need to be created:')
      missingTables.forEach(table => {
        console.log(`   • ${table}`)
      })
    }
    
    return { existing: existingTables, missing: missingTables }
}

checkTables().catch(console.error)