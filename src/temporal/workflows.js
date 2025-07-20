import { proxyActivities, sleep, log } from '@temporalio/workflow'

// Define activity proxies with timeouts
const {
  runScraperActivity,
  runDuplicateDetectionActivity,
  getDatabaseStatsActivity,
  sendNotificationActivity,
  cleanupOldDataActivity
} = proxyActivities({
  startToCloseTimeout: '30 minutes',
  heartbeatTimeout: '5 minutes',
  retryPolicy: {
    initialInterval: '30 seconds',
    maximumInterval: '5 minutes',
    maximumAttempts: 3,
    backoffCoefficient: 2
  }
})

/**
 * Workflow to run all scrapers systematically
 */
export async function dailyDataUpdateWorkflow() {
  log.info('Starting daily data update workflow')
  
  const workflowStart = Date.now()
  const results = []
  
  try {
    // Get initial database stats
    const initialStats = await getDatabaseStatsActivity()
    log.info(`Initial stats: ${initialStats.services} services, ${initialStats.organizations} organizations`)
    
    // Define scrapers by priority for systematic execution
    const scraperGroups = [
      {
        priority: 'high',
        scrapers: ['legal-aid', 'qld-youth-justice', 'headspace', 'crisis-support', 'youth-advocacy', 'aboriginal-torres-strait']
      },
      {
        priority: 'medium', 
        scrapers: ['pcyc', 'ask-izzy', 'queensland-open-data', 'qld-ckan']
      },
      {
        priority: 'low',
        scrapers: ['acnc', 'my-community-directory']
      }
    ]

    // Run scrapers by priority group with delays between groups
    for (const group of scraperGroups) {
      log.info(`Starting ${group.priority} priority scrapers: ${group.scrapers.join(', ')}`)
      
      // Run scrapers in this priority group
      for (const scraperName of group.scrapers) {
        try {
          const result = await runScraperActivity(scraperName)
          results.push(result)
          
          if (result.status === 'success') {
            log.info(`✅ ${scraperName}: ${result.servicesScraped} services in ${Math.round(result.duration/1000)}s`)
          } else {
            log.warn(`❌ ${scraperName}: ${result.error}`)
          }
          
          // Small delay between scrapers to be respectful
          await sleep('2 seconds')
        } catch (error) {
          log.error(`Failed to run scraper ${scraperName}: ${error.message}`)
          results.push({
            scraperName,
            status: 'failed',
            error: error.message,
            timestamp: new Date().toISOString()
          })
        }
      }
      
      // Longer pause between priority groups
      if (group.priority !== 'low') {
        log.info('Pausing between priority groups...')
        await sleep('5 seconds')
      }
    }

    // Run duplicate detection after all scrapers
    log.info('Running duplicate detection...')
    const duplicateResult = await runDuplicateDetectionActivity()
    results.push(duplicateResult)
    
    // Get final database stats
    const finalStats = await getDatabaseStatsActivity()
    
    // Calculate summary
    const successful = results.filter(r => r.status === 'success').length
    const failed = results.filter(r => r.status === 'failed').length
    const totalServices = results.reduce((sum, r) => sum + (r.servicesScraped || 0), 0)
    const newServices = finalStats.services - initialStats.services
    
    const summary = {
      workflowDuration: Date.now() - workflowStart,
      totalScrapers: scraperGroups.reduce((sum, g) => sum + g.scrapers.length, 0),
      successful,
      failed,
      totalServicesScraped: totalServices,
      newServicesAdded: newServices,
      duplicatesFound: duplicateResult.duplicatesFound || 0,
      initialStats,
      finalStats,
      timestamp: new Date().toISOString()
    }

    // Send completion notification
    await sendNotificationActivity({
      type: 'workflow-complete',
      title: 'Daily Data Update Complete',
      message: `✅ Data update completed successfully!\n\n📊 Summary:\n• Scrapers run: ${summary.totalScrapers}\n• Successful: ${successful}\n• Failed: ${failed}\n• New services: ${newServices}\n• Duplicates found: ${summary.duplicatesFound}\n\n📈 Database growth: ${initialStats.services} → ${finalStats.services} services`,
      summary,
      results
    })

    log.info('Daily data update workflow completed successfully')
    return summary
    
  } catch (error) {
    log.error(`Workflow failed: ${error.message}`)
    
    // Send failure notification
    await sendNotificationActivity({
      type: 'workflow-failed',
      title: 'Daily Data Update Failed',
      message: `❌ Data update workflow failed: ${error.message}`,
      error: error.message,
      timestamp: new Date().toISOString()
    })
    
    throw error
  }
}

/**
 * Workflow for weekly maintenance tasks
 */
export async function weeklyMaintenanceWorkflow() {
  log.info('Starting weekly maintenance workflow')
  
  try {
    // Clean up old data
    const cleanupResult = await cleanupOldDataActivity(90)
    
    // Run comprehensive duplicate detection
    const duplicateResult = await runDuplicateDetectionActivity()
    
    // Get final stats
    const stats = await getDatabaseStatsActivity()
    
    const summary = {
      cleanupResult,
      duplicateResult,
      finalStats: stats,
      timestamp: new Date().toISOString()
    }

    // Send completion notification
    await sendNotificationActivity({
      type: 'maintenance-complete',
      title: 'Weekly Maintenance Complete',
      message: `🔧 Weekly maintenance completed!\n\n📊 Summary:\n• Data cleanup: ${cleanupResult.recordsRemoved || 0} records removed\n• Duplicates found: ${duplicateResult.duplicatesFound || 0}\n• Current services: ${stats.services}`,
      summary
    })

    log.info('Weekly maintenance workflow completed successfully')
    return summary
    
  } catch (error) {
    log.error(`Maintenance workflow failed: ${error.message}`)
    
    await sendNotificationActivity({
      type: 'maintenance-failed',
      title: 'Weekly Maintenance Failed',
      message: `❌ Maintenance workflow failed: ${error.message}`,
      error: error.message,
      timestamp: new Date().toISOString()
    })
    
    throw error
  }
}

/**
 * Workflow to run a single scraper on demand
 */
export async function singleScraperWorkflow(scraperName) {
  log.info(`Starting single scraper workflow: ${scraperName}`)
  
  try {
    const initialStats = await getDatabaseStatsActivity()
    const result = await runScraperActivity(scraperName)
    const finalStats = await getDatabaseStatsActivity()
    
    const summary = {
      scraperName,
      result,
      newServices: finalStats.services - initialStats.services,
      initialStats,
      finalStats,
      timestamp: new Date().toISOString()
    }

    await sendNotificationActivity({
      type: 'single-scraper-complete',
      title: `${scraperName} Scraper Complete`,
      message: `✅ ${scraperName} scraper completed!\n\n📊 Results:\n• Status: ${result.status}\n• Services scraped: ${result.servicesScraped || 0}\n• New services: ${summary.newServices}`,
      summary
    })

    log.info(`Single scraper workflow completed: ${scraperName}`)
    return summary
    
  } catch (error) {
    log.error(`Single scraper workflow failed: ${error.message}`)
    
    await sendNotificationActivity({
      type: 'single-scraper-failed',
      title: `${scraperName} Scraper Failed`,
      message: `❌ ${scraperName} scraper failed: ${error.message}`,
      error: error.message,
      timestamp: new Date().toISOString()
    })
    
    throw error
  }
}