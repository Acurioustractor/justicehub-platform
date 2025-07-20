#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import { spawn } from 'child_process'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

// Load environment variables
dotenv.config({ path: join(rootDir, '.env.local') })
dotenv.config({ path: join(rootDir, '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

console.log('🚀 Running ALL Available Scrapers\n')
console.log('═'.repeat(80))

// Define all available scrapers
const scrapers = {
  python: [
    {
      name: 'Budget Scraper',
      file: 'src/scrapers/budget_scraper.py',
      description: 'Scrapes Queensland Budget website for youth justice allocations',
      target: 'https://budget.qld.gov.au',
      dataSource: 'budget_website'
    },
    {
      name: 'Parliament Scraper',
      file: 'src/scrapers/parliament_scraper.py',
      description: 'Scrapes Queensland Parliament for Hansard and committee reports',
      target: 'https://www.parliament.qld.gov.au',
      dataSource: 'parliament_hansard'
    },
    {
      name: 'Parliament QoN Scraper',
      file: 'src/scrapers/parliament_qon_scraper.py',
      description: 'Scrapes Questions on Notice with detailed analysis',
      target: 'https://www.parliament.qld.gov.au',
      dataSource: 'parliament_qon'
    },
    {
      name: 'Treasury Budget Scraper',
      file: 'src/scrapers/treasury_budget_scraper.py',
      description: 'Downloads and parses Treasury budget PDFs',
      target: 'Queensland Treasury PDFs',
      dataSource: 'treasury_budget'
    }
  ],
  javascript: [
    {
      name: 'Budget JS Scraper',
      file: 'scripts/scrapers/budget.js',
      description: 'Alternative JS version of budget scraper',
      target: 'https://budget.qld.gov.au',
      dataSource: 'budget_website'
    },
    {
      name: 'Parliament JS Scraper',
      file: 'scripts/scrapers/parliament.js',
      description: 'Alternative JS version of parliament scraper',
      target: 'https://www.parliament.qld.gov.au',
      dataSource: 'parliament_hansard'
    }
  ],
  typescript: [
    {
      name: 'Budget Allocations Monitor',
      file: 'src/scrapers/monitored/BudgetAllocationsScraper.ts',
      description: 'Monitored budget scraper with data quality checks',
      status: 'NEEDS_IMPLEMENTATION',
      dataSource: 'budget_website'
    },
    {
      name: 'Parliamentary Documents Monitor',
      file: 'src/scrapers/monitored/ParliamentaryDocumentsScraper.ts',
      description: 'Monitored parliament scraper with keyword analysis',
      status: 'NEEDS_IMPLEMENTATION',
      dataSource: 'parliament_hansard'
    },
    {
      name: 'RTI Monitor',
      file: 'src/scrapers/monitored/RTIMonitor.ts',
      description: 'Tracks Right to Information requests and compliance',
      status: 'NEEDS_IMPLEMENTATION',
      dataSource: 'rti_requests'
    },
    {
      name: 'Hidden Costs Calculator',
      file: 'src/scrapers/monitored/HiddenCostsCalculator.ts',
      description: 'Calculates true costs including hidden expenses',
      status: 'CALCULATOR_ONLY',
      dataSource: 'hidden_costs'
    }
  ],
  additional: [
    {
      name: 'Automation Scheduler',
      file: 'src/automation/scheduler.py',
      description: 'Runs scrapers on schedule with email alerts',
      schedule: 'Daily 9AM, Weekly reports Mondays 8AM'
    },
    {
      name: 'Simple Scheduler',
      file: 'scheduler.py',
      description: 'Basic scheduler for daily scraping',
      schedule: 'Daily 2AM'
    }
  ]
}

// Function to run Python scrapers
async function runPythonScraper(scraper) {
  return new Promise(async (resolve) => {
    const startTime = Date.now()
    console.log(`\n📊 Running ${scraper.name}...`)
    console.log(`   Target: ${scraper.target}`)
    console.log(`   File: ${scraper.file}`)
    
    // Record run start
    const { data: runData } = await supabase
      .from('scraper_runs')
      .insert({
        scraper_name: scraper.name,
        data_source: scraper.dataSource,
        status: 'started',
        started_at: new Date().toISOString()
      })
      .select()
      .single()
    
    const runId = runData?.id
    
    // Check if Python file exists
    const filePath = join(rootDir, scraper.file)
    if (!fs.existsSync(filePath)) {
      console.log(`   ❌ File not found: ${scraper.file}`)
      resolve({ success: false, error: 'File not found' })
      return
    }
    
    // Run the Python scraper
    const pythonProcess = spawn('python', [scraper.file], {
      cwd: rootDir,
      env: { ...process.env }
    })
    
    let output = ''
    let errorOutput = ''
    
    pythonProcess.stdout.on('data', (data) => {
      const text = data.toString()
      output += text
      process.stdout.write(`   ${text}`)
    })
    
    pythonProcess.stderr.on('data', (data) => {
      const text = data.toString()
      errorOutput += text
      process.stderr.write(`   ❌ ${text}`)
    })
    
    pythonProcess.on('close', async (code) => {
      const runtime = (Date.now() - startTime) / 1000
      const success = code === 0
      
      if (runId) {
        await supabase
          .from('scraper_runs')
          .update({
            status: success ? 'completed' : 'failed',
            completed_at: new Date().toISOString(),
            runtime_seconds: runtime,
            error_message: success ? null : errorOutput || 'Unknown error'
          })
          .eq('id', runId)
      }
      
      // Update health status
      await supabase
        .from('scraper_health')
        .upsert({
          scraper_name: scraper.name,
          data_source: scraper.dataSource,
          status: success ? 'healthy' : 'error',
          last_run_at: new Date().toISOString(),
          last_success_at: success ? new Date().toISOString() : undefined,
          consecutive_failures: success ? 0 : 1,
          average_runtime_seconds: runtime
        }, {
          onConflict: 'scraper_name,data_source'
        })
      
      console.log(`   ${success ? '✅' : '❌'} ${scraper.name} ${success ? 'completed' : 'failed'} in ${runtime.toFixed(2)}s`)
      resolve({ success, runtime, output, error: errorOutput })
    })
  })
}

// Function to check JavaScript scrapers
async function checkJavaScriptScraper(scraper) {
  const filePath = join(rootDir, scraper.file)
  const exists = fs.existsSync(filePath)
  
  console.log(`\n📦 ${scraper.name}`)
  console.log(`   Target: ${scraper.target}`)
  console.log(`   File: ${scraper.file}`)
  console.log(`   Status: ${exists ? '✅ Available' : '❌ Not found'}`)
  
  if (exists) {
    console.log(`   Run with: node ${scraper.file}`)
  }
  
  return { exists }
}

// Function to check TypeScript scrapers
async function checkTypeScriptScraper(scraper) {
  const filePath = join(rootDir, scraper.file)
  const exists = fs.existsSync(filePath)
  
  console.log(`\n🔷 ${scraper.name}`)
  console.log(`   File: ${scraper.file}`)
  console.log(`   Status: ${scraper.status || 'Available'}`)
  console.log(`   ${scraper.description}`)
  
  return { exists, needsImplementation: scraper.status === 'NEEDS_IMPLEMENTATION' }
}

// Main execution
async function runAllScrapers() {
  // 1. Run Python scrapers
  console.log('\n🐍 PYTHON SCRAPERS')
  console.log('─'.repeat(80))
  
  for (const scraper of scrapers.python) {
    await runPythonScraper(scraper)
  }
  
  // 2. Check JavaScript scrapers
  console.log('\n\n📜 JAVASCRIPT SCRAPERS')
  console.log('─'.repeat(80))
  
  for (const scraper of scrapers.javascript) {
    await checkJavaScriptScraper(scraper)
  }
  
  // 3. Check TypeScript scrapers
  console.log('\n\n📘 TYPESCRIPT MONITORED SCRAPERS')
  console.log('─'.repeat(80))
  
  for (const scraper of scrapers.typescript) {
    await checkTypeScriptScraper(scraper)
  }
  
  // 4. List automation options
  console.log('\n\n🤖 AUTOMATION OPTIONS')
  console.log('─'.repeat(80))
  
  for (const tool of scrapers.additional) {
    console.log(`\n⚙️  ${tool.name}`)
    console.log(`   File: ${tool.file}`)
    console.log(`   ${tool.description}`)
    if (tool.schedule) {
      console.log(`   Schedule: ${tool.schedule}`)
    }
  }
  
  // 5. Summary
  console.log('\n\n📊 SUMMARY')
  console.log('═'.repeat(80))
  
  const { data: healthData } = await supabase
    .from('scraper_health')
    .select('*')
    .order('last_run_at', { ascending: false })
  
  console.log('\nScraper Health Status:')
  if (healthData?.length > 0) {
    healthData.forEach(h => {
      const status = h.status === 'healthy' ? '✅' : '❌'
      console.log(`${status} ${h.scraper_name}: ${h.status} (last run: ${h.last_run_at || 'never'})`)
    })
  }
  
  const { count: budgetCount } = await supabase
    .from('budget_allocations')
    .select('*', { count: 'exact', head: true })
  
  const { count: parliamentCount } = await supabase
    .from('parliamentary_documents')
    .select('*', { count: 'exact', head: true })
  
  console.log('\n📈 Data Collected:')
  console.log(`- Budget Allocations: ${budgetCount || 0} records`)
  console.log(`- Parliamentary Documents: ${parliamentCount || 0} records`)
  
  console.log('\n🚀 Next Steps:')
  console.log('1. Implement TypeScript scrapers for real-time monitoring')
  console.log('2. Set up automation with: python run_automation.py')
  console.log('3. View results at: http://localhost:3001/monitoring')
  console.log('\n✨ Scraping complete!')
}

// Check Python environment
async function checkPythonEnvironment() {
  return new Promise((resolve) => {
    const pythonCheck = spawn('python', ['--version'])
    pythonCheck.on('close', (code) => {
      if (code !== 0) {
        console.error('❌ Python not found. Please install Python 3.x')
        console.log('   You may need to activate the virtual environment:')
        console.log('   source venv/bin/activate')
        resolve(false)
      } else {
        resolve(true)
      }
    })
  })
}

// Run
(async () => {
  const hasPython = await checkPythonEnvironment()
  if (!hasPython) {
    console.log('\n⚠️  Skipping Python scrapers due to missing Python environment')
    console.log('   To run Python scrapers:')
    console.log('   1. cd', rootDir)
    console.log('   2. python -m venv venv')
    console.log('   3. source venv/bin/activate')
    console.log('   4. pip install -r requirements.txt')
    console.log('   5. Run this script again')
  }
  
  await runAllScrapers()
})().catch(console.error)