import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })
dotenv.config({ path: join(__dirname, '..', '.env') })

// Import scrapers
import { ScraperManager } from '../src/monitoring/ScraperManager.js'
import { BudgetAllocationsScraper } from '../src/scrapers/monitored/BudgetAllocationsScraper.js'
import { ParliamentaryDocumentsScraper } from '../src/scrapers/monitored/ParliamentaryDocumentsScraper.js'
import { HiddenCostsCalculator } from '../src/scrapers/monitored/HiddenCostsCalculator.js'
import { RTIMonitor } from '../src/scrapers/monitored/RTIMonitor.js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

console.log('🚀 Queensland Youth Justice Scraper System')
console.log('==========================================\n')

async function runAllScrapers() {
  const results = {
    successful: [],
    failed: []
  }

  // 1. Budget Allocations Scraper
  console.log('\n💰 Running Budget Allocations Scraper...')
  console.log('----------------------------------------')
  try {
    const budgetScraper = new BudgetAllocationsScraper(supabaseUrl, supabaseKey)
    await budgetScraper.scrape()
    results.successful.push('Budget Allocations')
  } catch (error) {
    console.error('❌ Budget scraper failed:', error.message)
    results.failed.push({ scraper: 'Budget Allocations', error: error.message })
  }

  // 2. Parliamentary Documents Scraper
  console.log('\n\n📜 Running Parliamentary Documents Scraper...')
  console.log('--------------------------------------------')
  try {
    const parliamentScraper = new ParliamentaryDocumentsScraper(supabaseUrl, supabaseKey)
    await parliamentScraper.scrape()
    results.successful.push('Parliamentary Documents')
  } catch (error) {
    console.error('❌ Parliament scraper failed:', error.message)
    results.failed.push({ scraper: 'Parliamentary Documents', error: error.message })
  }

  // 3. Hidden Costs Calculator
  console.log('\n\n💸 Running Hidden Costs Calculator...')
  console.log('-------------------------------------')
  try {
    const hiddenCostsCalc = new HiddenCostsCalculator(supabaseUrl, supabaseKey)
    await hiddenCostsCalc.calculate()
    results.successful.push('Hidden Costs')
  } catch (error) {
    console.error('❌ Hidden costs calculator failed:', error.message)
    results.failed.push({ scraper: 'Hidden Costs', error: error.message })
  }

  // 4. RTI Monitor
  console.log('\n\n📋 Running RTI Monitor...')
  console.log('-------------------------')
  try {
    const rtiMonitor = new RTIMonitor(supabaseUrl, supabaseKey)
    await rtiMonitor.monitor()
    results.successful.push('RTI Monitor')
  } catch (error) {
    console.error('❌ RTI monitor failed:', error.message)
    results.failed.push({ scraper: 'RTI Monitor', error: error.message })
  }

  // Summary
  console.log('\n\n========================================')
  console.log('📊 SCRAPER RUN SUMMARY')
  console.log('========================================')
  console.log(`✅ Successful: ${results.successful.length}`)
  results.successful.forEach(scraper => {
    console.log(`   - ${scraper}`)
  })
  
  if (results.failed.length > 0) {
    console.log(`\n❌ Failed: ${results.failed.length}`)
    results.failed.forEach(({ scraper, error }) => {
      console.log(`   - ${scraper}: ${error}`)
    })
  }

  console.log('\n💡 View monitoring dashboard at: http://localhost:3001/monitoring')
  console.log('\n🔍 KEY INSIGHTS:')
  console.log('   • Youth detention costs $857/day (visible) but TRUE COST is much higher')
  console.log('   • Indigenous youth are 75% of detainees despite being 4.5% of population')
  console.log('   • 72% reoffending rate shows current system is failing')
  console.log('   • Hidden costs add 50-100% to visible detention costs')
  console.log('   • Community programs cost 95% less but get 20% of funding')
}

// Run scrapers
runAllScrapers().catch(console.error)