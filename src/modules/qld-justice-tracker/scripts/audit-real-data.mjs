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

async function auditRealData() {
  console.log('🔍 QUEENSLAND YOUTH JUSTICE TRACKER - DATA AUDIT')
  console.log('================================================\n')
  
  // 1. Check scraped_content table
  console.log('📊 1. SCRAPED CONTENT ANALYSIS:')
  console.log('--------------------------------')
  
  const { data: scraped, count } = await supabase
    .from('scraped_content')
    .select('*', { count: 'exact' })
    .order('scraped_at', { ascending: false })
  
  console.log(`Total records: ${count || 0}`)
  
  if (scraped && scraped.length > 0) {
    // Group by source
    const sources = {}
    scraped.forEach(item => {
      const source = item.source || item.source_type || 'Unknown'
      if (!sources[source]) sources[source] = 0
      sources[source]++
    })
    
    console.log('\nData sources found:')
    Object.entries(sources).forEach(([source, count]) => {
      console.log(`  • ${source}: ${count} records`)
    })
    
    // Show sample data
    console.log('\nSample scraped data:')
    scraped.slice(0, 3).forEach((item, i) => {
      console.log(`\n  ${i + 1}. ${item.title || 'No title'}`)
      console.log(`     URL: ${item.url || item.source_url || 'No URL'}`)
      console.log(`     Type: ${item.data_type || item.source_type}`)
      console.log(`     Scraped: ${item.scraped_at}`)
      if (item.content) {
        const preview = item.content.substring(0, 200).replace(/\n/g, ' ')
        console.log(`     Content: ${preview}...`)
      }
    })
  } else {
    console.log('❌ No scraped content found')
  }
  
  // 2. Check budget_allocations
  console.log('\n\n💰 2. BUDGET ALLOCATIONS:')
  console.log('-------------------------')
  
  const { data: budget } = await supabase
    .from('budget_allocations')
    .select('*')
    .order('fiscal_year', { ascending: false })
  
  if (budget && budget.length > 0) {
    console.log(`Total records: ${budget.length}`)
    
    // Group by fiscal year
    const byYear = {}
    budget.forEach(item => {
      if (!byYear[item.fiscal_year]) byYear[item.fiscal_year] = {
        total: 0,
        detention: 0,
        community: 0,
        programs: []
      }
      byYear[item.fiscal_year].total += item.amount || 0
      if (item.category === 'detention') byYear[item.fiscal_year].detention += item.amount || 0
      if (item.category === 'community') byYear[item.fiscal_year].community += item.amount || 0
      byYear[item.fiscal_year].programs.push(item.program)
    })
    
    console.log('\nBudget breakdown by year:')
    Object.entries(byYear).forEach(([year, data]) => {
      console.log(`\n  ${year}:`)
      console.log(`    Total: $${data.total.toLocaleString()}`)
      if (data.detention > 0) {
        const detentionPct = ((data.detention / data.total) * 100).toFixed(1)
        console.log(`    Detention: $${data.detention.toLocaleString()} (${detentionPct}%)`)
      }
      if (data.community > 0) {
        const communityPct = ((data.community / data.total) * 100).toFixed(1)
        console.log(`    Community: $${data.community.toLocaleString()} (${communityPct}%)`)
      }
      console.log(`    Programs: ${[...new Set(data.programs)].join(', ')}`)
    })
  } else {
    console.log('❌ No budget data found')
  }
  
  // 3. Check other data tables
  console.log('\n\n📋 3. OTHER DATA TABLES:')
  console.log('------------------------')
  
  const tables = [
    'court_statistics',
    'court_sentencing', 
    'police_statistics',
    'budget_transparency',
    'parliamentary_documents',
    'scraper_health'
  ]
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (!error) {
        console.log(`✅ ${table}: ${count || 0} records`)
      } else {
        console.log(`❌ ${table}: Not found`)
      }
    } catch (e) {
      console.log(`❌ ${table}: Error`)
    }
  }
  
  // 4. Data Quality Assessment
  console.log('\n\n🎯 4. DATA QUALITY ASSESSMENT:')
  console.log('------------------------------')
  
  const assessment = {
    realDataSources: [],
    mockDataSources: [],
    validationIssues: [],
    recommendations: []
  }
  
  // Check for real vs mock data
  if (scraped && scraped.length > 0) {
    scraped.forEach(item => {
      const content = (item.content || '').toLowerCase()
      const source = item.source || item.source_type || ''
      
      // Check for mock data indicators
      if (content.includes('mock') || content.includes('example') || content.includes('demo')) {
        if (!assessment.mockDataSources.includes(source)) {
          assessment.mockDataSources.push(source)
        }
      } else if (item.url && item.url.includes('.qld.gov.au')) {
        if (!assessment.realDataSources.includes(source)) {
          assessment.realDataSources.push(source)
        }
      }
    })
  }
  
  // Check budget data validity
  if (budget && budget.length > 0) {
    const hasRealAmounts = budget.some(b => b.amount && b.amount > 1000000)
    if (hasRealAmounts) {
      assessment.realDataSources.push('Budget Allocations')
    } else {
      assessment.mockDataSources.push('Budget Allocations')
    }
  }
  
  console.log('\n✅ REAL DATA SOURCES:')
  if (assessment.realDataSources.length > 0) {
    assessment.realDataSources.forEach(source => {
      console.log(`  • ${source}`)
    })
  } else {
    console.log('  ❌ No confirmed real data sources')
  }
  
  console.log('\n⚠️  MOCK/DEMO DATA SOURCES:')
  if (assessment.mockDataSources.length > 0) {
    assessment.mockDataSources.forEach(source => {
      console.log(`  • ${source}`)
    })
  } else {
    console.log('  ✅ No mock data detected')
  }
  
  // 5. Recommendations
  console.log('\n\n💡 5. RECOMMENDATIONS:')
  console.log('----------------------')
  
  console.log('\nTo improve data reliability:')
  console.log('  1. Run the real data scrapers:')
  console.log('     • node scripts/scrapers/courts-scraper-real.mjs')
  console.log('     • node scripts/scrapers/qps-crime-stats-scraper.mjs')
  console.log('     • node scripts/scrapers/treasury-budget-scraper.mjs')
  console.log('\n  2. Verify Firecrawl API key is set in .env.local')
  console.log('\n  3. Run the monitoring dashboard to track scraper health:')
  console.log('     • npm run dev')
  console.log('     • Visit http://localhost:3000/monitoring')
  console.log('\n  4. Set up automated scraping:')
  console.log('     • node scripts/start-automation.mjs')
  
  return assessment
}

// Run audit
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  auditRealData()
    .then(assessment => {
      console.log('\n\n✅ Audit complete!')
    })
    .catch(error => {
      console.error('❌ Audit error:', error)
    })
}

export { auditRealData }