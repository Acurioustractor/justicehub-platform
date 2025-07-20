#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import { exec } from 'child_process'
import { promisify } from 'util'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const execAsync = promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🧪 Testing All Scrapers')
console.log('======================')
console.log()

const scrapers = [
  { name: 'Youth Justice', file: 'youth-justice-scraper.mjs', table: 'youth_statistics' },
  { name: 'Courts', file: 'courts-scraper.mjs', table: 'court_statistics' },
  { name: 'Police', file: 'police-scraper.mjs', table: 'youth_crimes' },
  { name: 'RTI', file: 'rti-scraper.mjs', table: 'rti_requests' },
  { name: 'Budget', file: 'budget.js', table: 'budget_allocations' },
  { name: 'Parliament', file: 'parliament.js', table: 'parliamentary_documents' }
]

async function testScraper(scraper) {
  console.log(`\n📋 Testing ${scraper.name} Scraper...`)
  console.log(`   File: ${scraper.file}`)
  console.log(`   Table: ${scraper.table}`)
  
  try {
    // Run the scraper
    const scraperPath = join(__dirname, 'scrapers', scraper.file)
    const { stdout, stderr } = await execAsync(`node ${scraperPath}`)
    
    if (stderr) {
      console.log(`⚠️  Warnings: ${stderr}`)
    }
    
    // Check if data was inserted
    const { data, count, error } = await supabase
      .from(scraper.table)
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.log(`❌ Table error: ${error.message}`)
      return { name: scraper.name, status: 'table_missing', error: error.message }
    }
    
    console.log(`✅ Success! Records in table: ${count}`)
    return { name: scraper.name, status: 'success', records: count }
    
  } catch (error) {
    console.log(`❌ Execution error: ${error.message}`)
    return { name: scraper.name, status: 'failed', error: error.message }
  }
}

async function runTests() {
  const results = []
  
  for (const scraper of scrapers) {
    const result = await testScraper(scraper)
    results.push(result)
  }
  
  // Summary
  console.log('\n\n📊 Test Summary')
  console.log('===============')
  console.log()
  
  const successful = results.filter(r => r.status === 'success')
  const tableMissing = results.filter(r => r.status === 'table_missing')
  const failed = results.filter(r => r.status === 'failed')
  
  console.log(`✅ Successful: ${successful.length}`)
  successful.forEach(r => console.log(`   - ${r.name}: ${r.records} records`))
  
  if (tableMissing.length > 0) {
    console.log(`\n📦 Tables Missing: ${tableMissing.length}`)
    tableMissing.forEach(r => console.log(`   - ${r.name}: ${r.error}`))
  }
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}`)
    failed.forEach(r => console.log(`   - ${r.name}: ${r.error}`))
  }
  
  // Check what interesting data we have
  console.log('\n\n💡 Interesting Data Points')
  console.log('==========================')
  
  // Check for cost overruns
  const { data: budgetData } = await supabase
    .from('budget_allocations')
    .select('fiscal_year, program, amount')
    .eq('category', 'detention')
    .order('amount', { ascending: false })
    .limit(5)
  
  if (budgetData && budgetData.length > 0) {
    console.log('\n💰 Highest Detention Costs:')
    budgetData.forEach(b => {
      console.log(`   - ${b.program}: $${(b.amount / 1000000).toFixed(1)}M (${b.fiscal_year})`)
    })
  }
  
  // Check for Indigenous overrepresentation
  const { data: statsData } = await supabase
    .from('youth_statistics')
    .select('facility_name, indigenous_percentage, total_youth')
    .order('indigenous_percentage', { ascending: false })
    .limit(5)
  
  if (statsData && statsData.length > 0) {
    console.log('\n👥 Highest Indigenous Representation:')
    statsData.forEach(s => {
      console.log(`   - ${s.facility_name}: ${s.indigenous_percentage}% (${s.total_youth} youth)`)
    })
  }
  
  // Check for parliamentary mentions
  const { data: parlData } = await supabase
    .from('parliamentary_documents')
    .select('title, date, mentions_youth_justice, mentions_indigenous')
    .eq('mentions_youth_justice', true)
    .order('date', { ascending: false })
    .limit(5)
  
  if (parlData && parlData.length > 0) {
    console.log('\n🏛️ Recent Parliamentary Mentions:')
    parlData.forEach(p => {
      const tags = []
      if (p.mentions_indigenous) tags.push('Indigenous')
      console.log(`   - ${p.title} (${p.date}) ${tags.join(', ')}`)
    })
  }
}

runTests().catch(console.error)