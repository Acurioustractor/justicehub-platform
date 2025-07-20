#!/usr/bin/env node

import pino from 'pino';
import db from '../src/config/database.js';
import ScraperMonitor from '../src/monitoring/scraper-monitor.js';

// Import all scrapers
import { AskIzzyScraper } from '../src/scrapers/ask-izzy-scraper.js';
import { QueenslandOpenDataScraper } from '../src/scrapers/queensland-open-data-scraper.js';
import { HeadspaceScraper } from '../src/scrapers/headspace-scraper.js';
import { LegalAidScraper } from '../src/scrapers/legal-aid-scraper.js';
import { QldYouthJusticeScraper } from '../src/scrapers/qld-youth-justice-scraper.js';
import { PCYCScraper } from '../src/scrapers/pcyc-scraper.js';
import { YouthAdvocacyScraper } from '../src/scrapers/youth-advocacy-scraper.js';
import { AboriginalTorresStraitScraper } from '../src/scrapers/aboriginal-torres-strait-scraper.js';
import { CrisisSupportScraper } from '../src/scrapers/crisis-support-scraper.js';
import { MyCommunityDirectoryScraper } from '../src/scrapers/my-community-directory-scraper.js';
import { ACNCScraper } from '../src/scrapers/acnc-scraper.js';
import { QldCKANScraper } from '../src/scrapers/qld-ckan-scraper.js';

const logger = pino({ 
  name: 'master-scraper',
  level: 'info'
});

class MasterScraper {
  constructor() {
    this.scrapers = [];
    this.monitor = new ScraperMonitor();
    this.stats = {
      totalServicesFound: 0,
      totalServicesProcessed: 0,
      totalErrors: 0,
      scraperResults: {},
      startTime: new Date(),
      endTime: null
    };
    
    this.initializeScrapers();
  }

  initializeScrapers() {
    // High-priority Australian government and major organization scrapers
    const scraperConfigs = [
      {
        name: 'Queensland Open Data',
        scraper: QldYouthJusticeScraper,
        priority: 1,
        description: 'Official Queensland government youth justice services'
      },
      {
        name: 'Queensland CKAN',
        scraper: QldCKANScraper,
        priority: 1,
        description: 'Queensland government open data portal'
      },
      {
        name: 'Legal Aid Queensland', 
        scraper: LegalAidScraper,
        priority: 1,
        description: 'Official legal aid services for youth'
      },
      {
        name: 'Headspace',
        scraper: HeadspaceScraper,
        priority: 1,
        description: 'National youth mental health services'
      },
      {
        name: 'Ask Izzy',
        scraper: AskIzzyScraper,
        priority: 2,
        description: 'Comprehensive service directory'
      },
      {
        name: 'PCYC Queensland',
        scraper: PCYCScraper,
        priority: 2,
        description: 'Police Citizens Youth Club services'
      },
      {
        name: 'ACNC Charity Register',
        scraper: ACNCScraper,
        priority: 2,
        description: 'Australian charity register for youth services'
      },
      {
        name: 'Aboriginal & Torres Strait Islander Services',
        scraper: AboriginalTorresStraitScraper,
        priority: 2,
        description: 'Indigenous-specific youth services'
      },
      {
        name: 'Youth Advocacy Services',
        scraper: YouthAdvocacyScraper,
        priority: 3,
        description: 'Youth advocacy and rights organizations'
      },
      {
        name: 'Crisis Support Services',
        scraper: CrisisSupportScraper,
        priority: 3,
        description: 'Crisis intervention and emergency services'
      },
      {
        name: 'My Community Directory',
        scraper: MyCommunityDirectoryScraper,
        priority: 3,
        description: 'Community service directory'
      }
    ];

    // Initialize scrapers by priority
    this.scrapers = scraperConfigs
      .sort((a, b) => a.priority - b.priority)
      .map(config => ({
        ...config,
        instance: new config.scraper(db, {
          respectRateLimit: true,
          maxRetries: 3,
          timeout: 30000
        })
      }));

    logger.info(`Initialized ${this.scrapers.length} scrapers for comprehensive data collection`);
  }

  async runScraper(scraperConfig) {
    const { name, instance, description } = scraperConfig;
    
    logger.info(`🚀 Starting ${name}: ${description}`);
    
    const startTime = Date.now();
    
    try {
      const result = await instance.scrape();
      const duration = Date.now() - startTime;
      
      const monitoringResult = {
        success: true,
        servicesFound: result.servicesFound || 0,
        servicesProcessed: result.servicesProcessed || 0,
        errors: result.errors || 0,
        duration: duration,
        details: result
      };

      // Track with monitoring system
      await this.monitor.trackScraperRun(name, monitoringResult);

      this.stats.scraperResults[name] = monitoringResult;
      this.stats.totalServicesFound += result.servicesFound || 0;
      this.stats.totalServicesProcessed += result.servicesProcessed || 0;
      this.stats.totalErrors += result.errors || 0;

      logger.info(`✅ ${name} completed: ${result.servicesFound || 0} services found, ${result.servicesProcessed || 0} processed in ${duration}ms`);
      
      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      const errorResult = {
        success: false,
        error: error.message,
        duration: duration,
        servicesFound: 0,
        servicesProcessed: 0,
        errors: 1
      };

      // Track error with monitoring system
      await this.monitor.trackScraperRun(name, errorResult);

      this.stats.scraperResults[name] = errorResult;
      this.stats.totalErrors++;
      
      logger.error({ error: error.message, scraper: name, duration }, `❌ ${name} failed`);
      
      throw error;
    }
  }

  async runAllScrapers() {
    logger.info('🌟 Starting comprehensive Australian youth justice service data collection');
    logger.info(`Target: Build world-class searchable database of youth services`);
    logger.info(`Scrapers: ${this.scrapers.length} professional data sources`);
    
    this.stats.startTime = new Date();

    // Run priority 1 scrapers first (government sources)
    const priority1 = this.scrapers.filter(s => s.priority === 1);
    logger.info(`📊 Phase 1: Government & Official Sources (${priority1.length} scrapers)`);
    
    for (const scraper of priority1) {
      try {
        await this.runScraper(scraper);
        
        // Rate limiting between government scrapers
        await this.sleep(2000);
        
      } catch (error) {
        logger.warn(`Continuing despite ${scraper.name} failure: ${error.message}`);
      }
    }

    // Run priority 2 scrapers (major organizations)
    const priority2 = this.scrapers.filter(s => s.priority === 2);
    logger.info(`🏢 Phase 2: Major Organizations (${priority2.length} scrapers)`);
    
    for (const scraper of priority2) {
      try {
        await this.runScraper(scraper);
        await this.sleep(1500);
      } catch (error) {
        logger.warn(`Continuing despite ${scraper.name} failure: ${error.message}`);
      }
    }

    // Run priority 3 scrapers (community sources)
    const priority3 = this.scrapers.filter(s => s.priority === 3);
    logger.info(`🌐 Phase 3: Community Sources (${priority3.length} scrapers)`);
    
    for (const scraper of priority3) {
      try {
        await this.runScraper(scraper);
        await this.sleep(1000);
      } catch (error) {
        logger.warn(`Continuing despite ${scraper.name} failure: ${error.message}`);
      }
    }

    this.stats.endTime = new Date();
    
    return this.generateFinalReport();
  }

  async generateFinalReport() {
    const duration = this.stats.endTime - this.stats.startTime;
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

    // Get database totals
    const [totalServices] = await db('services').count('* as count');
    const [totalOrganizations] = await db('organizations').count('* as count');
    const [totalLocations] = await db('locations').count('* as count');

    const report = {
      summary: {
        status: 'COMPLETED',
        totalRuntime: `${hours}h ${minutes}m`,
        servicesInDatabase: parseInt(totalServices.count),
        organizationsInDatabase: parseInt(totalOrganizations.count),
        locationsInDatabase: parseInt(totalLocations.count),
        newServicesThisRun: this.stats.totalServicesProcessed,
        totalErrorsThisRun: this.stats.totalErrors
      },
      scraperResults: this.stats.scraperResults,
      nextSteps: [
        'Data is now available in your Youth Justice Service Finder',
        'Frontend will display all scraped services with search and mapping',
        'Consider setting up automated daily/weekly scraping',
        'Monitor data quality and add more sources as needed'
      ]
    };

    logger.info('🎉 SCRAPING COMPLETE - WORLD-CLASS DATABASE READY');
    logger.info(`📊 Total Services: ${report.summary.servicesInDatabase}`);
    logger.info(`🏢 Total Organizations: ${report.summary.organizationsInDatabase}`);
    logger.info(`📍 Total Locations: ${report.summary.locationsInDatabase}`);
    logger.info(`⏱️  Runtime: ${report.summary.totalRuntime}`);
    
    return report;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const masterScraper = new MasterScraper();
  
  masterScraper.runAllScrapers()
    .then(report => {
      console.log('\n🚀 FINAL REPORT:');
      console.log(JSON.stringify(report, null, 2));
      process.exit(0);
    })
    .catch(error => {
      logger.error('Master scraper failed:', error);
      process.exit(1);
    });
}

export default MasterScraper;