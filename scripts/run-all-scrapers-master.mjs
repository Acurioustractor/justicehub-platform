#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import { spawn } from 'child_process'
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

console.log('🚀 Queensland Youth Justice Tracker - Master Scraper Runner')
console.log('===========================================================')
console.log('Mission: Expose hidden youth justice data for evidence-based reform\n')

// Define all available scrapers
const SCRAPERS = [
  {
    name: 'Firecrawl Enhanced',
    file: 'firecrawl-enhanced-scraper.mjs',
    description: 'Advanced web scraping with Firecrawl',
    priority: 'HIGH',
    status: 'WORKING',
    runtime: 'node'
  },
  {
    name: 'Courts Enhanced V2',
    file: 'courts-scraper-v2.mjs',
    description: 'Queensland Courts youth justice statistics',
    priority: 'HIGH',
    status: 'READY',
    runtime: 'node'
  },
  {
    name: 'Police Enhanced V2',
    file: 'police-scraper-v2.mjs',
    description: 'Queensland Police Service crime data',
    priority: 'HIGH',
    status: 'READY',
    runtime: 'node'
  },
  {
    name: 'RTI Enhanced V2',
    file: 'rti-scraper-v2.mjs',
    description: 'Right to Information disclosure logs',
    priority: 'HIGH',
    status: 'READY',
    runtime: 'node'
  },
  {
    name: 'Youth Justice Core',
    file: 'youth-justice-scraper.mjs',
    description: 'Department of Youth Justice data',
    priority: 'MEDIUM',
    status: 'NEEDS_UPDATE',
    runtime: 'node'
  }
]

async function runScraper(scraper) {
  return new Promise((resolve) => {
    console.log(`\n🔄 Running: ${scraper.name}`)
    console.log(`   File: ${scraper.file}`)
    console.log(`   Description: ${scraper.description}`)
    
    const startTime = Date.now()
    
    const process = spawn(scraper.runtime, [join(__dirname, 'scrapers', scraper.file)], {
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: __dirname
    })
    
    let stdout = ''
    let stderr = ''
    
    process.stdout.on('data', (data) => {
      stdout += data.toString()
    })
    
    process.stderr.on('data', (data) => {
      stderr += data.toString()
    })
    
    process.on('close', (code) => {
      const duration = Date.now() - startTime
      
      const result = {
        name: scraper.name,
        file: scraper.file,
        success: code === 0,
        duration: duration,
        stdout: stdout.slice(-500), // Last 500 chars
        stderr: stderr.slice(-200), // Last 200 chars of errors
        exitCode: code
      }
      
      if (code === 0) {
        console.log(`   ✅ Success (${duration}ms)`)
        // Look for key indicators in output
        if (stdout.includes('Stored') || stdout.includes('inserted') || stdout.includes('saved')) {
          console.log(`   💾 Data successfully stored`)
        }
        if (stdout.includes('Found') || stdout.includes('scraped')) {
          const matches = stdout.match(/(\d+)\s+(items?|records?|mentions?)/gi)
          if (matches) {
            console.log(`   📊 ${matches[0]} collected`)
          }
        }
      } else {
        console.log(`   ❌ Failed (${duration}ms) - Exit code: ${code}`)
        if (stderr) {
          console.log(`   Error: ${stderr.split('\n')[0]}`)
        }
      }
      
      resolve(result)
    })
    
    // Timeout after 2 minutes per scraper
    setTimeout(() => {
      process.kill('SIGTERM')
      resolve({
        name: scraper.name,
        file: scraper.file,
        success: false,
        duration: 120000,
        stdout: stdout.slice(-500),
        stderr: 'Timeout after 2 minutes',
        exitCode: -1
      })
    }, 120000)
  })
}

async function checkDataStatus() {
  console.log('\n📈 Checking current data status...')
  
  const tables = [
    'scraped_content', 'court_statistics', 'youth_crimes', 
    'rti_requests', 'budget_allocations', 'parliamentary_documents'
  ]
  
  let totalRecords = 0
  
  for (const table of tables) {
    try {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      console.log(`   ${table}: ${count || 0} records`)
      totalRecords += count || 0
    } catch (error) {
      console.log(`   ${table}: Error checking`)
    }
  }
  
  console.log(`\n📊 Total Records: ${totalRecords}`)
  return totalRecords
}

async function runAllScrapers() {
  const startTime = Date.now()
  console.log(`Starting comprehensive scraper run at ${new Date().toISOString()}\n`)
  
  // Check initial data status
  const initialRecords = await checkDataStatus()
  
  // Filter to working scrapers first
  const workingScrapers = SCRAPERS.filter(s => 
    s.status === 'WORKING' || s.status === 'READY'
  )
  
  console.log(`\n🎯 Running ${workingScrapers.length} working scrapers:`)
  workingScrapers.forEach(s => {
    console.log(`   • ${s.name} (${s.priority} priority)`)
  })
  
  // Run all scrapers
  const results = []
  for (const scraper of workingScrapers) {
    const result = await runScraper(scraper)
    results.push(result)
    
    // Small delay between scrapers to be respectful
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  // Check final data status
  const finalRecords = await checkDataStatus()
  
  // Generate summary
  const totalDuration = Date.now() - startTime
  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  const newRecords = finalRecords - initialRecords
  
  console.log('\n🎉 SCRAPER RUN COMPLETE')
  console.log('=======================')
  console.log(`⏱️  Total Duration: ${Math.round(totalDuration / 1000)}s`)
  console.log(`✅ Successful: ${successful}/${results.length}`)
  console.log(`❌ Failed: ${failed}/${results.length}`)
  console.log(`📊 New Records: ${newRecords}`)
  console.log(`💾 Total Records: ${finalRecords}`)
  
  if (successful > 0) {
    console.log('\n🔍 Successful Scrapers:')
    results.filter(r => r.success).forEach(r => {
      console.log(`   ✅ ${r.name} (${Math.round(r.duration / 1000)}s)`)
    })
  }
  
  if (failed > 0) {
    console.log('\n⚠️  Failed Scrapers:')
    results.filter(r => !r.success).forEach(r => {
      console.log(`   ❌ ${r.name}: ${r.stderr || 'Unknown error'}`)
    })
  }
  
  console.log('\n🎯 MISSION IMPACT:')
  console.log(`   ${finalRecords} data points exposing youth justice system failures`)
  console.log(`   ${successful} automated scrapers monitoring government transparency`)
  console.log(`   Evidence base growing for systemic reform advocacy`)
  
  return results
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runAllScrapers()
    .then(() => {
      console.log('\n✅ Master scraper run complete!')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Master scraper run failed:', error.message)
      process.exit(1)
    })
}

export { runAllScrapers }