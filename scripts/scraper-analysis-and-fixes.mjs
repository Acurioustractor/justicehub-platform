#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('📊 Comprehensive Scraper Analysis & Fix Plan')
console.log('=============================================')
console.log('Analyzing all scrapers, identifying issues, and creating fix plan\n')

const SCRAPERS = [
  {
    name: 'Courts Enhanced',
    file: 'courts-scraper-v2.mjs',
    status: 'PARTIALLY_WORKING',
    issues: ['Database connection errors', 'Table structure mismatch'],
    dataQuality: 'HIGH',
    priority: 'HIGH',
    fixComplexity: 'LOW'
  },
  {
    name: 'Police Enhanced', 
    file: 'police-scraper-v2.mjs',
    status: 'PARTIALLY_WORKING',
    issues: ['Database connection errors', 'Mock data only'],
    dataQuality: 'MEDIUM',
    priority: 'HIGH', 
    fixComplexity: 'LOW'
  },
  {
    name: 'RTI Enhanced',
    file: 'rti-scraper-v2.mjs', 
    status: 'PARTIALLY_WORKING',
    issues: ['Database connection errors', 'Mock data only'],
    dataQuality: 'HIGH',
    priority: 'MEDIUM',
    fixComplexity: 'LOW'
  },
  {
    name: 'Youth Justice Core',
    file: 'youth-justice-scraper.mjs',
    status: 'NOT_WORKING',
    issues: ['No real data collection', 'Hardcoded mock data'],
    dataQuality: 'LOW',
    priority: 'MEDIUM',
    fixComplexity: 'HIGH'
  },
  {
    name: 'Budget Tracker',
    file: 'budget.js',
    status: 'BROKEN',
    issues: ['404 errors on all URLs', 'Budget year mismatch'],
    dataQuality: 'MEDIUM',
    priority: 'HIGH',
    fixComplexity: 'MEDIUM'
  },
  {
    name: 'Parliament Monitor',
    file: 'parliament.js', 
    status: 'NOT_WORKING',
    issues: ['No data being found', 'Possibly wrong URLs'],
    dataQuality: 'LOW',
    priority: 'LOW',
    fixComplexity: 'MEDIUM'
  },
  {
    name: 'Firecrawl Enhanced',
    file: 'firecrawl-enhanced-scraper.mjs',
    status: 'WORKING',
    issues: ['Database table missing'],
    dataQuality: 'HIGH',
    priority: 'HIGH',
    fixComplexity: 'LOW'
  }
]

async function analyzeDatabaseTables() {
  console.log('🗄️  DATABASE TABLE ANALYSIS')
  console.log('===========================')
  
  const tables = [
    'court_statistics', 'court_sentencing', 'youth_crimes', 'youth_crime_patterns',
    'rti_requests', 'youth_statistics', 'budget_allocations', 'parliamentary_documents',
    'scraped_content'
  ]
  
  const tableStatus = {}
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        tableStatus[table] = { status: 'ERROR', error: error.message, count: 0 }
      } else {
        tableStatus[table] = { status: 'EXISTS', count: count || 0 }
      }
    } catch (error) {
      tableStatus[table] = { status: 'MISSING', error: error.message, count: 0 }
    }
  }
  
  console.log('\n📋 Table Status:')
  Object.entries(tableStatus).forEach(([table, status]) => {
    const icon = status.status === 'EXISTS' ? '✅' : '❌'
    console.log(`   ${icon} ${table}: ${status.status} (${status.count} records)`)
    if (status.error) {
      console.log(`      Error: ${status.error}`)
    }
  })
  
  return tableStatus
}

function prioritizeScrapers() {
  console.log('\n🎯 SCRAPER PRIORITIZATION')
  console.log('========================')
  
  // Sort by priority and fix complexity
  const prioritized = SCRAPERS
    .filter(s => s.status !== 'WORKING')
    .sort((a, b) => {
      const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 }
      const complexityOrder = { 'LOW': 3, 'MEDIUM': 2, 'HIGH': 1 }
      
      const aScore = priorityOrder[a.priority] + complexityOrder[a.fixComplexity]
      const bScore = priorityOrder[b.priority] + complexityOrder[b.fixComplexity]
      
      return bScore - aScore
    })
  
  console.log('\n🏆 Fix Priority Order:')
  prioritized.forEach((scraper, index) => {
    console.log(`   ${index + 1}. ${scraper.name}`)
    console.log(`      Priority: ${scraper.priority} | Complexity: ${scraper.fixComplexity}`)
    console.log(`      Issues: ${scraper.issues.join(', ')}`)
    console.log()
  })
  
  return prioritized
}

function generateFixPlan() {
  console.log('🔧 COMPREHENSIVE FIX PLAN')
  console.log('=========================')
  
  console.log('\n📋 PHASE 1: Database Issues (Immediate - 30 minutes)')
  console.log('   1. Fix table creation/migration issues')
  console.log('   2. Verify Supabase connection and permissions')
  console.log('   3. Test data insertion with simple records')
  console.log('   4. Update scraper error handling')
  
  console.log('\n📋 PHASE 2: Budget Scraper (High Priority - 1 hour)')
  console.log('   1. Update budget URLs for 2025-26 budget')
  console.log('   2. Test current Queensland budget website structure')
  console.log('   3. Fix URL patterns and data extraction')
  console.log('   4. Add Firecrawl fallback for dynamic content')
  
  console.log('\n📋 PHASE 3: Enhanced Scrapers (High Priority - 1 hour)')
  console.log('   1. Fix Courts Enhanced database insertion')
  console.log('   2. Fix Police Enhanced database insertion')  
  console.log('   3. Fix RTI Enhanced database insertion')
  console.log('   4. Test all enhanced scrapers end-to-end')
  
  console.log('\n📋 PHASE 4: Real Data Collection (Medium Priority - 2 hours)')
  console.log('   1. Replace mock data with real scraping logic')
  console.log('   2. Implement Youth Justice Core real data extraction')
  console.log('   3. Fix Parliament Monitor URL and parsing')
  console.log('   4. Add data validation and quality checks')
  
  console.log('\n📋 PHASE 5: Automation & Monitoring (Low Priority - 1 hour)')
  console.log('   1. Set up automated daily scraping')
  console.log('   2. Implement data quality alerts')
  console.log('   3. Add automated anomaly detection')
  console.log('   4. Create data review dashboard')
}

function suggestDataValidation() {
  console.log('\n🔍 DATA VALIDATION & SENSE CHECK PLAN')
  console.log('====================================')
  
  console.log('\n✅ AUTOMATED DATA CHECKS:')
  console.log('   1. Range Validation:')
  console.log('      • Indigenous percentages: 0-100%')
  console.log('      • Budget amounts: > 0 and reasonable')
  console.log('      • Dates: within expected ranges')
  console.log('   2. Consistency Checks:')
  console.log('      • Total percentages add up to ~100%')
  console.log('      • Budget allocations match known totals')
  console.log('      • Historical trends are reasonable')
  console.log('   3. Freshness Checks:')
  console.log('      • Data updated within expected timeframes')
  console.log('      • No stale data older than 6 months')
  console.log('      • Missing data gaps identified')
  
  console.log('\n🤖 AUTOMATED REVIEW FEATURES:')
  console.log('   1. Daily Data Quality Report:')
  console.log('      • Records added/updated in last 24h')
  console.log('      • Data quality scores by source')
  console.log('      • Anomalies and outliers detected')
  console.log('   2. Weekly Trend Analysis:')
  console.log('      • Key metric changes week-over-week')
  console.log('      • New insights discovered')
  console.log('      • Data gaps and collection issues')
  console.log('   3. Monthly Comprehensive Review:')
  console.log('      • System health and reliability')
  console.log('      • Data source performance')
  console.log('      • Mission impact assessment')
}

function identifyHighValueData() {
  console.log('\n💎 HIGH-VALUE DATA TARGETS')
  console.log('==========================')
  
  console.log('\n🎯 MISSION-CRITICAL DATA (Fix First):')
  console.log('   1. Indigenous Overrepresentation:')
  console.log('      • Court defendant percentages')
  console.log('      • Regional variations')
  console.log('      • Historical trends')
  console.log('   2. Hidden Cost Data:')
  console.log('      • True daily detention costs')
  console.log('      • Staff compensation claims')
  console.log('      • Family burden costs')
  console.log('   3. System Failure Evidence:')
  console.log('      • Repeat offender rates')
  console.log('      • Program effectiveness')
  console.log('      • Reoffending statistics')
  
  console.log('\n💰 BUDGET TRANSPARENCY (High Impact):')
  console.log('   • Detention vs community spending ratios')
  console.log('   • Cost per youth calculations')
  console.log('   • Year-over-year changes')
  console.log('   • Hidden departmental costs')
  
  console.log('\n📊 ADVOCACY AMMUNITION (Medium Impact):')
  console.log('   • Parliamentary admissions of failure')
  console.log('   • Minister statements and contradictions')
  console.log('   • RTI disclosures of problems')
  console.log('   • Comparison with other states')
}

async function runComprehensiveAnalysis() {
  console.log('🚀 Starting comprehensive scraper analysis...\n')
  
  // Analyze database
  const tableStatus = await analyzeDatabaseTables()
  
  // Prioritize fixes
  const prioritizedFixes = prioritizeScrapers()
  
  // Generate plans
  generateFixPlan()
  suggestDataValidation()
  identifyHighValueData()
  
  console.log('\n📈 IMMEDIATE NEXT STEPS')
  console.log('======================')
  console.log('1. 🔧 Fix database connection issues (all scrapers)')
  console.log('2. 🏛️  Update Budget scraper URLs for current year')
  console.log('3. ✅ Test Courts Enhanced with real data insertion')
  console.log('4. 🔥 Expand Firecrawl scraper for more sources')
  console.log('5. 🤖 Implement automated data quality checks')
  
  console.log('\n🎯 SUCCESS METRICS:')
  console.log('   • All 7 scrapers collecting real data')
  console.log('   • 1000+ records in database')
  console.log('   • Daily automated data collection')
  console.log('   • Zero database insertion errors')
  console.log('   • 95%+ data quality score')
  
  console.log('\n🌟 MISSION IMPACT:')
  console.log('   With all scrapers working, we will have the most')
  console.log('   comprehensive database of Queensland youth justice')
  console.log('   failures ever assembled - powerful ammunition')
  console.log('   for demanding evidence-based reform!')
}

runComprehensiveAnalysis().catch(console.error)