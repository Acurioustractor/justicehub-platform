#!/usr/bin/env node

import dotenv from 'dotenv'
import pino from 'pino'
import { setTimeout } from 'timers/promises'

// Import all scrapers
import { LegalAidScraper } from '../src/scrapers/legal-aid-scraper.js'
import { HeadspaceScraper } from '../src/scrapers/headspace-scraper.js'
import { PCYCScraper } from '../src/scrapers/pcyc-scraper.js'
import { QLDYouthJusticeScraper } from '../src/scrapers/qld-youth-justice-scraper.js'
import { YouthAdvocacyScraper } from '../src/scrapers/youth-advocacy-scraper.js'
import { AboriginalTorresStraitScraper } from '../src/scrapers/aboriginal-torres-strait-scraper.js'
import { CrisisSupportScraper } from '../src/scrapers/crisis-support-scraper.js'
import { AskIzzyScraper } from '../src/scrapers/ask-izzy-scraper.js'
import { MyCommunityDirectoryScraper } from '../src/scrapers/my-community-directory-scraper.js'
import { ACNCScraper } from '../src/scrapers/acnc-scraper.js'
import { QLDCKANScraper } from '../src/scrapers/qld-ckan-scraper.js'
import { QueenslandOpenDataScraper } from '../src/scrapers/queensland-open-data-scraper.js'

// Import services
import { getDuplicateDetector } from '../src/services/duplicate-detector.js'
import db from '../src/config/database.js'

dotenv.config()

const logger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true }
  }
})

console.log(`
╔════════════════════════════════════════════════════╗
║        Youth Justice Service Finder               ║
║           Comprehensive Data Scraping             ║
╚════════════════════════════════════════════════════╝
`)

class MasterScraper {
  constructor() {
    this.scrapers = [
      // Government and Legal Services
      { name: 'Legal Aid Queensland', scraper: new LegalAidScraper(db), priority: 'high' },
      { name: 'QLD Youth Justice', scraper: new QLDYouthJusticeScraper(db), priority: 'high' },
      
      // Mental Health and Crisis Support
      { name: 'headspace', scraper: new HeadspaceScraper(db), priority: 'high' },
      { name: 'Crisis Support', scraper: new CrisisSupportScraper(db), priority: 'high' },
      
      // Community Organizations
      { name: 'Youth Advocacy Centre', scraper: new YouthAdvocacyScraper(db), priority: 'high' },
      { name: 'PCYC Queensland', scraper: new PCYCScraper(db), priority: 'medium' },
      { name: 'Aboriginal & Torres Strait Islander Services', scraper: new AboriginalTorresStraitScraper(db), priority: 'high' },
      
      // Comprehensive Directories
      { name: 'Ask Izzy', scraper: new AskIzzyScraper(db), priority: 'medium' },
      
      // Open Data Sources
      { name: 'Queensland Open Data', scraper: new QueenslandOpenDataScraper(db), priority: 'medium' },
      { name: 'QLD CKAN Portal', scraper: new QLDCKANScraper(db), priority: 'medium' },
      { name: 'ACNC Charities', scraper: new ACNCScraper(db), priority: 'low' },
      
      // Community Directories (API required)
      { name: 'MyCommunityDirectory', scraper: new MyCommunityDirectoryScraper(db), priority: 'low' }
    ]

    this.results = {
      total_scrapers: this.scrapers.length,
      successful: 0,
      failed: 0,
      total_services: 0,
      new_services: 0,
      duplicates_found: 0,
      details: []
    }
  }

  async runAllScrapers() {
    logger.info(`Starting comprehensive scraping of ${this.scrapers.length} data sources`)
    
    // Get initial counts
    const initialStats = await this.getStats()
    logger.info(`Initial database state: ${initialStats.services} services, ${initialStats.organizations} organizations`)

    // Run scrapers by priority
    const priorities = ['high', 'medium', 'low']
    
    for (const priority of priorities) {
      logger.info(`\n🔍 Running ${priority.toUpperCase()} priority scrapers...`)
      
      const priorityScrapers = this.scrapers.filter(s => s.priority === priority)
      
      for (const { name, scraper } of priorityScrapers) {
        await this.runScraper(name, scraper)
        
        // Rate limiting between scrapers
        await setTimeout(2000)
      }

      // Longer pause between priority groups
      if (priority !== 'low') {
        logger.info(`\n⏸️ Pausing 5 seconds before next priority group...`)
        await setTimeout(5000)
      }
    }

    // Final duplicate detection pass
    logger.info('\n🔍 Running final duplicate detection...')
    await this.runDuplicateDetection()

    // Generate final report
    const finalStats = await this.getStats()
    await this.generateReport(initialStats, finalStats)
  }

  async runScraper(name, scraper) {
    const startTime = Date.now()
    let scraperResult = {
      name,
      status: 'failed',
      services_scraped: 0,
      organizations_created: 0,
      error: null,
      duration: 0
    }

    try {
      logger.info(`\n📡 Starting ${name} scraper...`)
      
      const result = await scraper.scrape()
      
      scraperResult = {
        ...scraperResult,
        status: 'success',
        services_scraped: result.services?.length || 0,
        organizations_created: result.organizations?.length || 0,
        duration: Date.now() - startTime
      }

      this.results.successful++
      this.results.total_services += scraperResult.services_scraped
      
      logger.info(`✅ ${name} completed: ${scraperResult.services_scraped} services in ${Math.round(scraperResult.duration/1000)}s`)

    } catch (error) {
      scraperResult.error = error.message
      scraperResult.duration = Date.now() - startTime
      
      this.results.failed++
      
      logger.error(`❌ ${name} failed: ${error.message}`)
      
      // Continue with other scrapers even if one fails
    }

    this.results.details.push(scraperResult)
  }

  async runDuplicateDetection() {
    try {
      const duplicateDetector = getDuplicateDetector({ db })
      const duplicateResults = await duplicateDetector.findAllDuplicates()
      this.results.duplicates_found = duplicateResults.length || 0
      logger.info(`✅ Duplicate detection completed: ${this.results.duplicates_found} duplicate groups found`)
    } catch (error) {
      logger.error(`❌ Duplicate detection failed: ${error.message}`)
    }
  }

  async getStats() {
    try {
      const servicesCount = await db('services').count('* as count').first()
      const organizationsCount = await db('organizations').count('* as count').first()
      
      return {
        services: parseInt(servicesCount.count),
        organizations: parseInt(organizationsCount.count)
      }
    } catch (error) {
      logger.error('Failed to get database stats:', error.message)
      return { services: 0, organizations: 0 }
    }
  }

  async generateReport(initialStats, finalStats) {
    this.results.new_services = finalStats.services - initialStats.services

    console.log(`
╔════════════════════════════════════════════════════╗
║               SCRAPING COMPLETE                    ║
╚════════════════════════════════════════════════════╝

📊 SUMMARY:
   • Scrapers Run:        ${this.results.total_scrapers}
   • Successful:          ${this.results.successful}
   • Failed:              ${this.results.failed}
   • New Services Added:  ${this.results.new_services}
   • Duplicates Merged:   ${this.results.duplicates_found}

📈 DATABASE GROWTH:
   • Before:  ${initialStats.services} services, ${initialStats.organizations} organizations
   • After:   ${finalStats.services} services, ${finalStats.organizations} organizations
   • Growth:  +${finalStats.services - initialStats.services} services (+${finalStats.organizations - initialStats.organizations} organizations)

📋 DETAILED RESULTS:`)

    // Sort by success/failure, then by duration
    this.results.details.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'success' ? -1 : 1
      }
      return b.services_scraped - a.services_scraped
    })

    this.results.details.forEach(result => {
      const status = result.status === 'success' ? '✅' : '❌'
      const duration = Math.round(result.duration / 1000)
      const services = result.services_scraped || 0
      
      console.log(`   ${status} ${result.name.padEnd(35)} ${services.toString().padStart(3)} services  ${duration}s`)
      
      if (result.error) {
        console.log(`      Error: ${result.error}`)
      }
    })

    console.log(`
🎉 Scraping completed successfully!

📍 Next steps:
   1. Review the data in the database
   2. Update Elasticsearch index: npm run setup-elasticsearch
   3. Test the frontend: http://localhost:3003
   4. Check API documentation: http://127.0.0.1:3001/docs
`)

    // Save results to file for analysis
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const reportPath = `./scraping-report-${timestamp}.json`
    
    try {
      const fs = await import('fs/promises')
      await fs.writeFile(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        initial_stats: initialStats,
        final_stats: finalStats,
        results: this.results
      }, null, 2))
      
      logger.info(`📝 Detailed report saved to: ${reportPath}`)
    } catch (error) {
      logger.warn('Failed to save report file:', error.message)
    }
  }
}

async function main() {
  const masterScraper = new MasterScraper()
  
  try {
    await masterScraper.runAllScrapers()
  } catch (error) {
    logger.error('Master scraper failed:', error)
    process.exit(1)
  } finally {
    await db.destroy()
    process.exit(0)
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('\n🛑 Received interrupt signal, shutting down gracefully...')
  await db.destroy()
  process.exit(0)
})

main()