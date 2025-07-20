import { proxyActivities } from '@temporalio/workflow';
import { sleep } from '@temporalio/workflow';

// Import activity types
const activities = proxyActivities({
  startOptions: {
    startToCloseTimeout: '30 minutes',
    retry: {
      initialInterval: '1s',
      backoffCoefficient: 2,
      maximumAttempts: 5
    }
  }
});

/**
 * Main service discovery workflow
 */
export async function serviceDiscoveryWorkflow(params) {
  const { sources = [] } = params;
  
  // Phase 1: Discovery
  const discoveryResults = await Promise.all(
    sources.map(source => 
      activities.discoverServiceDirectories({ 
        searchQuery: source.searchQuery,
        region: source.region 
      })
    )
  );

  // Phase 2: Scraping
  const scrapingJobs = [];
  for (const discoveries of discoveryResults) {
    for (const directory of discoveries) {
      scrapingJobs.push({
        url: directory.url,
        type: directory.type,
        priority: directory.priority || 5
      });
    }
  }

  // Sort by priority and process
  scrapingJobs.sort((a, b) => b.priority - a.priority);
  
  const scrapingResults = [];
  for (const job of scrapingJobs) {
    try {
      const result = await activities.scrapeServiceDirectory(job);
      scrapingResults.push(result);
      
      // Rate limiting between sources
      await sleep('2s');
    } catch (error) {
      await activities.logScrapingError({
        job,
        error: error.message
      });
    }
  }

  // Phase 3: Data Quality & Deduplication
  await activities.processScrapedData({
    results: scrapingResults
  });

  // Phase 4: Index in Elasticsearch
  await activities.updateSearchIndex();

  // Phase 5: Generate report
  const report = await activities.generateScrapingReport({
    sources: sources.length,
    directoriesFound: scrapingJobs.length,
    servicesProcessed: scrapingResults.reduce((sum, r) => sum + r.servicesFound, 0)
  });

  return report;
}

/**
 * Scheduled scraping workflow
 */
export async function scheduledScrapingWorkflow() {
  const sources = [
    { name: 'ask_izzy', schedule: 'daily' },
    { name: 'qld_open_data', schedule: 'weekly' },
    { name: 'government_directories', schedule: 'weekly' },
    { name: 'community_orgs', schedule: 'weekly' }
  ];

  const results = [];
  
  for (const source of sources) {
    try {
      const result = await activities.runScraper({
        scraperName: source.name,
        options: {}
      });
      
      results.push({
        source: source.name,
        success: true,
        stats: result
      });
      
      // Stagger scrapers
      await sleep('5m');
    } catch (error) {
      results.push({
        source: source.name,
        success: false,
        error: error.message
      });
      
      // Continue with next scraper
      continue;
    }
  }

  // Run quality checks
  await activities.runQualityChecks();
  
  // Send summary notification
  await activities.sendNotification({
    type: 'scraping_complete',
    results
  });

  return results;
}

/**
 * Service verification workflow
 */
export async function serviceVerificationWorkflow(params) {
  const { serviceIds, verificationType } = params;
  
  const verificationResults = [];
  
  for (const serviceId of serviceIds) {
    try {
      // Get current service data
      const service = await activities.getService(serviceId);
      
      if (!service) {
        continue;
      }
      
      // Perform verification based on type
      let verified = false;
      
      switch (verificationType) {
        case 'contact':
          verified = await activities.verifyContactInfo({
            phone: service.contact?.phone,
            email: service.contact?.email,
            website: service.url
          });
          break;
          
        case 'location':
          verified = await activities.verifyLocation({
            address: service.location,
            coordinates: { lat: service.lat, lng: service.lng }
          });
          break;
          
        case 'active':
          verified = await activities.verifyServiceActive({
            url: service.url,
            lastUpdated: service.updated_at
          });
          break;
          
        default:
          // Full verification
          const contactVerified = await activities.verifyContactInfo({
            phone: service.contact?.phone,
            email: service.contact?.email,
            website: service.url
          });
          
          const locationVerified = await activities.verifyLocation({
            address: service.location
          });
          
          verified = contactVerified && locationVerified;
      }
      
      // Update verification status
      await activities.updateServiceVerification({
        serviceId,
        verified,
        verificationType,
        verifiedAt: new Date()
      });
      
      verificationResults.push({
        serviceId,
        verified,
        type: verificationType
      });
      
      // Rate limiting
      await sleep('1s');
    } catch (error) {
      await activities.logVerificationError({
        serviceId,
        error: error.message
      });
    }
  }

  return {
    totalVerified: verificationResults.filter(r => r.verified).length,
    totalFailed: verificationResults.filter(r => !r.verified).length,
    results: verificationResults
  };
}

/**
 * Data quality improvement workflow
 */
export async function dataQualityWorkflow() {
  // Get services with low quality scores
  const lowQualityServices = await activities.getServicesNeedingImprovement({
    minScore: 0.5,
    limit: 100
  });

  const improvements = [];
  
  for (const service of lowQualityServices) {
    try {
      const issues = service.quality_issues || [];
      
      for (const issue of issues) {
        switch (issue.field) {
          case 'description':
            // Try to fetch better description from website
            if (service.url) {
              const enhanced = await activities.enhanceDescription({
                serviceId: service.id,
                url: service.url
              });
              if (enhanced) improvements.push(enhanced);
            }
            break;
            
          case 'location':
            // Geocode address to get coordinates
            if (service.location?.address_1) {
              const geocoded = await activities.geocodeAddress({
                serviceId: service.id,
                address: service.location
              });
              if (geocoded) improvements.push(geocoded);
            }
            break;
            
          case 'categories':
            // Auto-categorize based on description
            const categorized = await activities.autoCategorizeSer vice({
              serviceId: service.id,
              description: service.description,
              name: service.name
            });
            if (categorized) improvements.push(categorized);
            break;
        }
      }
      
      // Recalculate quality score
      await activities.recalculateQualityScore(service.id);
      
      // Rate limiting
      await sleep('500ms');
    } catch (error) {
      await activities.logQualityError({
        serviceId: service.id,
        error: error.message
      });
    }
  }

  return {
    servicesProcessed: lowQualityServices.length,
    improvementsMade: improvements.length,
    improvements
  };
}

/**
 * Emergency service update workflow
 */
export async function emergencyUpdateWorkflow(params) {
  const { message, affectedServices, updateType } = params;
  
  // Immediately update affected services
  const updates = [];
  
  for (const serviceId of affectedServices) {
    try {
      const update = await activities.applyEmergencyUpdate({
        serviceId,
        updateType,
        message
      });
      
      updates.push(update);
    } catch (error) {
      // Log but continue with other updates
      await activities.logEmergencyUpdateError({
        serviceId,
        error: error.message
      });
    }
  }

  // Notify stakeholders
  await activities.sendEmergencyNotification({
    message,
    affectedCount: affectedServices.length,
    updateType
  });

  // Update search index immediately
  await activities.updateSearchIndex({ 
    serviceIds: affectedServices 
  });

  return {
    updated: updates.length,
    failed: affectedServices.length - updates.length,
    updates
  };
}

/**
 * New source discovery workflow
 */
export async function discoverNewSourcesWorkflow() {
  const searchQueries = [
    'youth services directory Queensland',
    'youth justice programs QLD',
    'Queensland youth support services',
    'Brisbane youth services list',
    'Indigenous youth services Queensland',
    'mental health services young people QLD',
    'legal aid youth Queensland',
    'crisis accommodation youth Brisbane'
  ];

  const potentialSources = [];
  
  for (const query of searchQueries) {
    try {
      // Search for potential directories
      const searchResults = await activities.searchForDirectories({
        query,
        limit: 20
      });
      
      // Analyze each result
      for (const result of searchResults) {
        const analysis = await activities.analyzeWebsite({
          url: result.url,
          title: result.title,
          description: result.description
        });
        
        if (analysis.isServiceDirectory && analysis.relevanceScore > 0.7) {
          potentialSources.push({
            url: result.url,
            name: result.title,
            type: analysis.directoryType,
            estimatedServices: analysis.estimatedServices,
            relevanceScore: analysis.relevanceScore
          });
        }
      }
      
      // Rate limiting between searches
      await sleep('5s');
    } catch (error) {
      await activities.logDiscoveryError({
        query,
        error: error.message
      });
    }
  }

  // Deduplicate and rank sources
  const uniqueSources = await activities.deduplicateSources(potentialSources);
  const rankedSources = uniqueSources.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Save new sources for review
  await activities.saveDiscoveredSources(rankedSources);

  return {
    queriesRun: searchQueries.length,
    sourcesFound: rankedSources.length,
    topSources: rankedSources.slice(0, 10)
  };
}