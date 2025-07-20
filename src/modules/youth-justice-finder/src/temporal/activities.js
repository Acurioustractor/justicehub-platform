import pino from 'pino'
import { LegalAidScraper } from '../scrapers/legal-aid-scraper.js'
import { HeadspaceScraper } from '../scrapers/headspace-scraper.js'
import { PCYCScraper } from '../scrapers/pcyc-scraper.js'
import { QLDYouthJusticeScraper } from '../scrapers/qld-youth-justice-scraper.js'
import { YouthAdvocacyScraper } from '../scrapers/youth-advocacy-scraper.js'
import { AboriginalTorresStraitScraper } from '../scrapers/aboriginal-torres-strait-scraper.js'
import { CrisisSupportScraper } from '../scrapers/crisis-support-scraper.js'
import { AskIzzyScraper } from '../scrapers/ask-izzy-scraper.js'
import { MyCommunityDirectoryScraper } from '../scrapers/my-community-directory-scraper.js'
import { ACNCScraper } from '../scrapers/acnc-scraper.js'
import { QLDCKANScraper } from '../scrapers/qld-ckan-scraper.js'
import { QueenslandOpenDataScraper } from '../scrapers/queensland-open-data-scraper.js'
import { getDuplicateDetector } from '../services/duplicate-detector.js'
import db from '../config/database.js'

const logger = pino({ name: 'temporal-activities' })

/**
 * Activity to run a single scraper
 */
export async function runScraperActivity(scraperName) {
  logger.info(`Starting scraper activity: ${scraperName}`)
  
  const scraperMap = {
    'legal-aid': () => new LegalAidScraper(db),
    'headspace': () => new HeadspaceScraper(db),
    'pcyc': () => new PCYCScraper(db),
    'qld-youth-justice': () => new QLDYouthJusticeScraper(db),
    'youth-advocacy': () => new YouthAdvocacyScraper(db),
    'aboriginal-torres-strait': () => new AboriginalTorresStraitScraper(db),
    'crisis-support': () => new CrisisSupportScraper(db),
    'ask-izzy': () => new AskIzzyScraper(db),
    'my-community-directory': () => new MyCommunityDirectoryScraper(db),
    'acnc': () => new ACNCScraper(db),
    'qld-ckan': () => new QLDCKANScraper(db),
    'queensland-open-data': () => new QueenslandOpenDataScraper(db)
  }

  const scraperFactory = scraperMap[scraperName]
  if (!scraperFactory) {
    throw new Error(`Unknown scraper: ${scraperName}`)
  }

  try {
    const scraper = scraperFactory()
    const startTime = Date.now()
    const result = await scraper.scrape()
    const duration = Date.now() - startTime

    const activityResult = {
      scraperName,
      status: 'success',
      servicesScraped: result.services?.length || 0,
      organizationsCreated: result.organizations?.length || 0,
      duration,
      timestamp: new Date().toISOString()
    }

    logger.info(activityResult, `Scraper ${scraperName} completed successfully`)
    return activityResult
  } catch (error) {
    const activityResult = {
      scraperName,
      status: 'failed',
      error: error.message,
      timestamp: new Date().toISOString()
    }

    logger.error(activityResult, `Scraper ${scraperName} failed`)
    return activityResult
  }
}

/**
 * Activity to run duplicate detection
 */
export async function runDuplicateDetectionActivity() {
  logger.info('Starting duplicate detection activity')
  
  try {
    const duplicateDetector = getDuplicateDetector({ db })
    const startTime = Date.now()
    const duplicateResults = await duplicateDetector.findAllDuplicates()
    const duration = Date.now() - startTime

    const result = {
      status: 'success',
      duplicatesFound: duplicateResults.length || 0,
      duration,
      timestamp: new Date().toISOString()
    }

    logger.info(result, 'Duplicate detection completed successfully')
    return result
  } catch (error) {
    const result = {
      status: 'failed',
      error: error.message,
      timestamp: new Date().toISOString()
    }

    logger.error(result, 'Duplicate detection failed')
    return result
  }
}

/**
 * Activity to get database statistics
 */
export async function getDatabaseStatsActivity() {
  logger.info('Getting database statistics')
  
  try {
    const servicesCount = await db('services').count('* as count').first()
    const organizationsCount = await db('organizations').count('* as count').first()
    
    const stats = {
      services: parseInt(servicesCount.count),
      organizations: parseInt(organizationsCount.count),
      timestamp: new Date().toISOString()
    }

    logger.info(stats, 'Database statistics retrieved')
    return stats
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get database statistics')
    throw error
  }
}

/**
 * Activity to send notification (placeholder for future integration)
 */
export async function sendNotificationActivity(notification) {
  logger.info({ notification }, 'Sending notification')
  
  // For now, just log the notification
  // In the future, this could integrate with email, Slack, Discord, etc.
  console.log('📧 NOTIFICATION:', notification.message)
  
  return {
    status: 'sent',
    timestamp: new Date().toISOString(),
    method: 'console'
  }
}

/**
 * Activity to cleanup old data (placeholder for future implementation)
 */
export async function cleanupOldDataActivity(daysToKeep = 90) {
  logger.info(`Starting data cleanup for records older than ${daysToKeep} days`)
  
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
    
    // For now, just return a placeholder
    // In the future, this could remove old inactive services, update stale data, etc.
    const result = {
      status: 'success',
      recordsRemoved: 0,
      cutoffDate: cutoffDate.toISOString(),
      timestamp: new Date().toISOString()
    }

    logger.info(result, 'Data cleanup completed')
    return result
  } catch (error) {
    const result = {
      status: 'failed',
      error: error.message,
      timestamp: new Date().toISOString()
    }

    logger.error(result, 'Data cleanup failed')
    return result
  }
}