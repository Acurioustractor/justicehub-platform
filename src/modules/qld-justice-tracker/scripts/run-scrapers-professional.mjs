#!/usr/bin/env node

/**
 * Professional Scraper Runner for Queensland Youth Justice Tracker
 * 
 * This script runs the world-class scraper orchestration system.
 * Usage:
 *   node scripts/run-scrapers-professional.mjs [command] [options]
 * 
 * Commands:
 *   all                    Run all scrapers (default)
 *   youth-justice         Run only youth justice scraper
 *   budget                Run only budget scraper  
 *   police                Run only police scraper
 *   health                Check scraper health status
 *   
 * Options:
 *   --concurrent N        Max concurrent scrapers (default: 3)
 *   --no-retry           Don't retry failed scrapers
 *   --quiet              Minimal output
 *   --json               Output results as JSON
 */

import { scraperOrchestrator } from '../dist/scrapers/orchestrator.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') })
dotenv.config({ path: join(__dirname, '../.env.local') })

// Parse command line arguments
const args = process.argv.slice(2)
const command = args[0] || 'all'
const options = {
  concurrent: parseInt(args.find(arg => arg.startsWith('--concurrent'))?.split('=')[1]) || 3,
  retry: !args.includes('--no-retry'),
  quiet: args.includes('--quiet'),
  json: args.includes('--json')
}

async function main() {
  try {
    // Validate environment
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      console.error('❌ Missing required environment variables:')
      console.error('   NEXT_PUBLIC_SUPABASE_URL')
      console.error('   SUPABASE_SERVICE_KEY')
      process.exit(1)
    }

    if (!options.quiet) {
      console.log('🚀 Queensland Youth Justice Tracker - Professional Scraper System')
      console.log('================================================================')
      console.log(`Command: ${command}`)
      console.log(`Options: concurrent=${options.concurrent}, retry=${options.retry}`)
      console.log('')
    }

    let result

    switch (command) {
      case 'all':
        result = await scraperOrchestrator.runAll()
        break
        
      case 'youth-justice':
        result = await scraperOrchestrator.runScraper('youth-justice')
        break
        
      case 'budget':
        result = await scraperOrchestrator.runScraper('budget')
        break
        
      case 'police':
        result = await scraperOrchestrator.runScraper('police')
        break
        
      case 'health':
        result = await scraperOrchestrator.getHealthStatus()
        if (!options.quiet) {
          console.log('📊 Scraper Health Status:')
          result.forEach(scraper => {
            console.log(`   ${scraper.name}: ${scraper.dataSource}`)
          })
        }
        break
        
      default:
        console.error(`❌ Unknown command: ${command}`)
        console.error('Available commands: all, youth-justice, budget, police, health')
        process.exit(1)
    }

    // Output results
    if (options.json) {
      console.log(JSON.stringify(result, null, 2))
    } else if (!options.quiet && command !== 'health') {
      // Summary already printed by orchestrator
    }

    // Exit with appropriate code
    if (result && typeof result === 'object' && 'failed' in result) {
      process.exit(result.failed > 0 ? 1 : 0)
    } else {
      process.exit(0)
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message)
    if (!options.quiet) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log('\n🛑 Scraper interrupted by user')
  process.exit(130)
})

// Run the main function
main()