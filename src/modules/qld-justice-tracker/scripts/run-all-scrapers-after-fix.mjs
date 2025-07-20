#!/usr/bin/env node
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('🚀 Running All Scrapers After RLS Fix')
console.log('=====================================')
console.log('This script runs all working scrapers to populate the database\n')

// Define scrapers in order of reliability and importance
const SCRAPERS = [
  {
    name: '🔥 Firecrawl Enhanced',
    file: 'scrapers/firecrawl-enhanced-scraper.mjs',
    description: 'Scrapes multiple government websites',
    priority: 'HIGH'
  },
  {
    name: '💰 Budget Tracker',
    file: 'scrapers/budget.js',
    description: 'Queensland budget allocations',
    priority: 'HIGH'
  },
  {
    name: '🏛️ Parliament Monitor',
    file: 'scrapers/parliament.js',
    description: 'Parliamentary documents and Hansard',
    priority: 'HIGH'
  },
  {
    name: '⚖️ Courts Enhanced V2',
    file: 'scrapers/courts-scraper-v2.mjs',
    description: 'Court statistics and reports',
    priority: 'MEDIUM'
  },
  {
    name: '👮 Police Enhanced V2',
    file: 'scrapers/police-scraper-v2.mjs',
    description: 'Crime statistics and youth data',
    priority: 'MEDIUM'
  },
  {
    name: '📄 RTI Enhanced V2',
    file: 'scrapers/rti-scraper-v2.mjs',
    description: 'Right to Information disclosures',
    priority: 'MEDIUM'
  },
  {
    name: '🏢 Youth Justice Core',
    file: 'scrapers/youth-justice-scraper.mjs',
    description: 'Department data (currently mock)',
    priority: 'LOW'
  }
]

function runScraper(scraper) {
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Running: ${scraper.name}`)
    console.log(`Description: ${scraper.description}`)
    console.log(`Priority: ${scraper.priority}`)
    console.log(`${'='.repeat(60)}`)
    
    const startTime = Date.now()
    const runtime = scraper.file.endsWith('.mjs') ? 'node' : 'node'
    
    const process = spawn(runtime, [join(__dirname, scraper.file)], {
      stdio: 'inherit',
      cwd: __dirname,
      env: { ...process.env }
    })
    
    process.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1)
      
      if (code === 0) {
        console.log(`\n✅ ${scraper.name} completed successfully (${duration}s)`)
      } else {
        console.log(`\n❌ ${scraper.name} failed with exit code ${code} (${duration}s)`)
      }
      
      resolve({ scraper: scraper.name, success: code === 0, duration })
    })
    
    // Timeout after 3 minutes
    setTimeout(() => {
      console.log(`\n⏱️  ${scraper.name} timed out after 3 minutes`)
      process.kill('SIGTERM')
      resolve({ scraper: scraper.name, success: false, duration: 180 })
    }, 180000)
  })
}

async function runAllScrapers() {
  console.log('📋 Scraper Execution Plan:')
  SCRAPERS.forEach((s, i) => {
    console.log(`${i + 1}. ${s.name} - ${s.description}`)
  })
  
  console.log('\n⚠️  Important: Make sure you have run the RLS fix script first!')
  console.log('If not, scrapers will fail to insert data.\n')
  
  // Add a delay to let user read the message
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  const results = []
  const startTime = Date.now()
  
  // Run scrapers sequentially to avoid rate limiting
  for (const scraper of SCRAPERS) {
    const result = await runScraper(scraper)
    results.push(result)
    
    // Small delay between scrapers
    if (SCRAPERS.indexOf(scraper) < SCRAPERS.length - 1) {
      console.log('\n⏳ Waiting 5 seconds before next scraper...')
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }
  
  // Summary
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1)
  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  
  console.log('\n' + '='.repeat(60))
  console.log('📊 SCRAPER RUN SUMMARY')
  console.log('='.repeat(60))
  console.log(`Total Duration: ${totalDuration}s`)
  console.log(`Successful: ${successful}/${results.length}`)
  console.log(`Failed: ${failed}/${results.length}`)
  
  console.log('\n📋 Individual Results:')
  results.forEach(r => {
    const icon = r.success ? '✅' : '❌'
    console.log(`${icon} ${r.scraper} (${r.duration}s)`)
  })
  
  if (successful > 0) {
    console.log('\n✅ Data collection completed!')
    console.log('Next steps:')
    console.log('1. Run: node scripts/check-existing-data.mjs')
    console.log('2. Check the monitoring dashboard at http://localhost:3000/monitoring')
    console.log('3. View the main dashboard to see collected data')
  } else {
    console.log('\n❌ All scrapers failed!')
    console.log('Troubleshooting:')
    console.log('1. Check that RLS policies are fixed (run test-scraper-insertion.mjs)')
    console.log('2. Verify environment variables in .env.local')
    console.log('3. Check individual scraper logs above for specific errors')
  }
}

// Add error handling
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled error:', error)
  process.exit(1)
})

// Run the scrapers
runAllScrapers().catch(error => {
  console.error('\n❌ Script failed:', error)
  process.exit(1)
})