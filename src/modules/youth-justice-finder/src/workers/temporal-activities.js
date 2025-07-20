import pino from 'pino';
import { Client } from '@elastic/elasticsearch';
import { createAskIzzyScraper } from '../scrapers/ask-izzy-scraper.js';
import { createQueenslandOpenDataScraper } from '../scrapers/queensland-open-data-scraper.js';
import { getFirecrawlClient } from '../services/firecrawl-client.js';
import { sendEmail } from '../services/email-service.js';
import { geocodeAddress as geocodeUtil } from '../services/geocoding-service.js';
import db from '../config/database.js';

const logger = pino({ name: 'temporal-activities' });
const elastic = new Client({ node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200' });
const firecrawl = getFirecrawlClient();

/**
 * Discover service directories
 */
export async function discoverServiceDirectories({ searchQuery, region }) {
  logger.info({ searchQuery, region }, 'Discovering service directories');
  
  try {
    // Search using Firecrawl
    const searchResults = await firecrawl.searchWeb(searchQuery, {
      limit: 50
    });

    const directories = [];
    
    for (const result of searchResults.results) {
      // Check if it looks like a service directory
      const isDirectory = await analyzeIfServiceDirectory(result.url);
      
      if (isDirectory) {
        directories.push({
          url: result.url,
          name: result.title,
          type: determineDirectoryType(result),
          priority: calculatePriority(result)
        });
      }
    }

    return directories;
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to discover directories');
    throw error;
  }
}

/**
 * Scrape a service directory
 */
export async function scrapeServiceDirectory({ url, type }) {
  logger.info({ url, type }, 'Scraping service directory');
  
  try {
    let scraper;
    let result;
    
    // Use specific scraper if available
    if (url.includes('askizzy.org.au')) {
      scraper = await createAskIzzyScraper(db);
      result = await scraper.scrape();
    } else if (url.includes('data.qld.gov.au')) {
      scraper = await createQueenslandOpenDataScraper(db);
      result = await scraper.scrape();
    } else {
      // Generic scraping with Firecrawl
      result = await genericServiceScrape(url);
    }

    return {
      url,
      success: true,
      servicesFound: result.servicesFound || 0,
      errors: result.errors || 0
    };
  } catch (error) {
    logger.error({ url, error: error.message }, 'Scraping failed');
    throw error;
  }
}

/**
 * Process scraped data
 */
export async function processScrapedData({ results }) {
  logger.info({ resultCount: results.length }, 'Processing scraped data');
  
  try {
    let totalProcessed = 0;
    let duplicatesFound = 0;
    
    for (const result of results) {
      if (!result.success) continue;
      
      // Run deduplication
      const dedupeResult = await deduplicateServices();
      duplicatesFound += dedupeResult.duplicatesRemoved;
      
      // Calculate quality scores
      await calculateQualityScores();
      
      totalProcessed += result.servicesFound;
    }

    return {
      totalProcessed,
      duplicatesFound
    };
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to process scraped data');
    throw error;
  }
}

/**
 * Update Elasticsearch index
 */
export async function updateSearchIndex({ serviceIds } = {}) {
  logger.info({ serviceIds }, 'Updating search index');
  
  try {
    let services;
    
    if (serviceIds && serviceIds.length > 0) {
      // Update specific services
      services = await db('service_search_view')
        .whereIn('id', serviceIds);
    } else {
      // Update all services (in batches)
      services = await db('service_search_view')
        .where('status', 'active')
        .limit(1000);
    }

    // Bulk index to Elasticsearch
    const operations = services.flatMap(doc => [
      { index: { _index: 'services', _id: doc.id } },
      {
        ...doc,
        suggest: {
          input: [doc.name, ...(doc.keywords || [])],
          weight: Math.round(doc.quality_score * 100)
        }
      }
    ]);

    if (operations.length > 0) {
      const bulkResponse = await elastic.bulk({ operations });
      
      if (bulkResponse.errors) {
        logger.error({ errors: bulkResponse.items }, 'Elasticsearch bulk errors');
      }
    }

    return {
      indexed: services.length,
      success: true
    };
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to update search index');
    throw error;
  }
}

/**
 * Run a specific scraper
 */
export async function runScraper({ scraperName, options }) {
  logger.info({ scraperName, options }, 'Running scraper');
  
  try {
    let scraper;
    let result;
    
    switch (scraperName) {
      case 'ask_izzy':
        scraper = await createAskIzzyScraper(db, options);
        result = await scraper.scrape();
        break;
        
      case 'qld_open_data':
        scraper = await createQueenslandOpenDataScraper(db, options);
        result = await scraper.scrape();
        break;
        
      default:
        throw new Error(`Unknown scraper: ${scraperName}`);
    }

    return result;
  } catch (error) {
    logger.error({ scraperName, error: error.message }, 'Scraper failed');
    throw error;
  }
}

/**
 * Run quality checks
 */
export async function runQualityChecks() {
  logger.info('Running quality checks');
  
  try {
    // Get all active services
    const services = await db('services')
      .where('status', 'active')
      .select('id', 'name', 'description', 'categories', 'updated_at');

    let qualityIssues = 0;
    
    for (const service of services) {
      const issues = [];
      
      // Check description length
      if (!service.description || service.description.length < 50) {
        issues.push({
          field: 'description',
          issue: 'Description too short',
          severity: 'high'
        });
      }
      
      // Check categories
      if (!service.categories || service.categories.length === 0) {
        issues.push({
          field: 'categories',
          issue: 'No categories assigned',
          severity: 'medium'
        });
      }
      
      // Check freshness
      const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(service.updated_at)) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceUpdate > 180) {
        issues.push({
          field: 'updated_at',
          issue: 'Data is stale (>6 months)',
          severity: 'medium'
        });
      }
      
      if (issues.length > 0) {
        qualityIssues += issues.length;
        
        // Update quality record
        await db('data_quality')
          .insert({
            service_id: service.id,
            quality_issues: JSON.stringify(issues),
            calculated_at: new Date()
          })
          .onConflict('service_id')
          .merge();
      }
    }

    return {
      servicesChecked: services.length,
      qualityIssues
    };
  } catch (error) {
    logger.error({ error: error.message }, 'Quality checks failed');
    throw error;
  }
}

/**
 * Get service by ID
 */
export async function getService(serviceId) {
  try {
    return await db('services')
      .where('id', serviceId)
      .first();
  } catch (error) {
    logger.error({ serviceId, error: error.message }, 'Failed to get service');
    throw error;
  }
}

/**
 * Verify contact information
 */
export async function verifyContactInfo({ phone, email, website }) {
  const verification = {
    phone: false,
    email: false,
    website: false
  };
  
  try {
    // Verify phone (in production, use a phone verification service)
    if (phone) {
      // Basic format check for now
      verification.phone = /^[\d\s\-\+\(\)]+$/.test(phone);
    }
    
    // Verify email (basic check)
    if (email) {
      verification.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    // Verify website
    if (website) {
      try {
        const response = await fetch(website, { 
          method: 'HEAD',
          timeout: 10000 
        });
        verification.website = response.ok;
      } catch {
        verification.website = false;
      }
    }
    
    return Object.values(verification).some(v => v);
  } catch (error) {
    logger.error({ error: error.message }, 'Contact verification failed');
    return false;
  }
}

/**
 * Verify location
 */
export async function verifyLocation({ address, coordinates }) {
  try {
    if (coordinates?.lat && coordinates?.lng) {
      // Verify coordinates are in Queensland
      const inQueensland = 
        coordinates.lat >= -29.18 && coordinates.lat <= -9.14 &&
        coordinates.lng >= 138.03 && coordinates.lng <= 153.55;
      
      return inQueensland;
    }
    
    if (address) {
      // Geocode and verify
      const geocoded = await geocodeUtil(address);
      return geocoded && geocoded.state === 'QLD';
    }
    
    return false;
  } catch (error) {
    logger.error({ error: error.message }, 'Location verification failed');
    return false;
  }
}

/**
 * Update service verification status
 */
export async function updateServiceVerification({ serviceId, verified, verificationType, verifiedAt }) {
  try {
    await db('services')
      .where('id', serviceId)
      .update({
        verification_status: verified ? 'verified' : 'rejected',
        last_verified_at: verifiedAt,
        updated_at: new Date()
      });

    // Log verification
    await db('service_history')
      .insert({
        service_id: serviceId,
        change_type: 'verify',
        changed_fields: JSON.stringify(['verification_status']),
        previous_values: JSON.stringify({}),
        new_values: JSON.stringify({ 
          verification_status: verified ? 'verified' : 'rejected',
          verification_type: verificationType
        }),
        changed_by: 'system',
        changed_at: new Date()
      });

    return { success: true };
  } catch (error) {
    logger.error({ serviceId, error: error.message }, 'Failed to update verification');
    throw error;
  }
}

/**
 * Get services needing improvement
 */
export async function getServicesNeedingImprovement({ minScore, limit }) {
  try {
    return await db('services as s')
      .leftJoin('data_quality as dq', 's.id', 'dq.service_id')
      .where('s.status', 'active')
      .where(function() {
        this.where('dq.overall_score', '<', minScore)
          .orWhereNull('dq.overall_score');
      })
      .select('s.*', 'dq.quality_issues', 'dq.overall_score')
      .limit(limit);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get low quality services');
    throw error;
  }
}

/**
 * Send notification
 */
export async function sendNotification({ type, results }) {
  try {
    const recipients = process.env.NOTIFICATION_EMAILS?.split(',') || [];
    
    if (recipients.length === 0) {
      logger.warn('No notification recipients configured');
      return;
    }

    const subject = `Youth Justice Service Finder - ${type}`;
    const body = formatNotificationBody(type, results);
    
    for (const recipient of recipients) {
      await sendEmail({
        to: recipient,
        subject,
        body
      });
    }

    return { sent: recipients.length };
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to send notification');
    throw error;
  }
}

// Helper functions

async function analyzeIfServiceDirectory(url) {
  try {
    const result = await firecrawl.scrapeUrl(url);
    
    if (!result.success || !result.data?.content) {
      return false;
    }
    
    const content = result.data.content.toLowerCase();
    const indicators = [
      'service directory',
      'find services',
      'service finder',
      'search services',
      'list of services',
      'service providers',
      'support services'
    ];
    
    const score = indicators.filter(ind => content.includes(ind)).length;
    return score >= 2;
  } catch {
    return false;
  }
}

function determineDirectoryType(result) {
  const url = result.url.toLowerCase();
  const title = result.title.toLowerCase();
  
  if (url.includes('gov.au') || title.includes('government')) {
    return 'government';
  } else if (title.includes('community')) {
    return 'community';
  } else if (title.includes('health')) {
    return 'health';
  } else {
    return 'general';
  }
}

function calculatePriority(result) {
  let priority = 5;
  
  // Government sites get higher priority
  if (result.url.includes('gov.au')) priority += 3;
  
  // Queensland-specific sites
  if (result.url.includes('qld') || result.title.includes('Queensland')) priority += 2;
  
  // Youth-specific
  if (result.title.toLowerCase().includes('youth')) priority += 2;
  
  return Math.min(priority, 10);
}

async function genericServiceScrape(url) {
  const result = await firecrawl.crawlWebsite(url, {
    maxDepth: 3,
    limit: 100,
    includePatterns: ['service', 'program', 'support'],
    excludePatterns: ['news', 'blog', 'careers']
  });

  let servicesFound = 0;
  let errors = 0;

  for (const page of result.pages) {
    try {
      // Extract services from page
      const services = await extractServicesFromPage(page);
      servicesFound += services.length;
      
      // Save to database
      for (const service of services) {
        await saveServiceToDb(service);
      }
    } catch (error) {
      errors++;
      logger.error({ page: page.url, error: error.message }, 'Failed to process page');
    }
  }

  return { servicesFound, errors };
}

async function deduplicateServices() {
  // Find potential duplicates
  const duplicates = await db.raw(`
    SELECT s1.id as id1, s2.id as id2, s1.name, s2.name as name2
    FROM services s1
    JOIN services s2 ON s1.id < s2.id
    WHERE s1.status = 'active' AND s2.status = 'active'
    AND (
      similarity(s1.name, s2.name) > 0.8
      OR (s1.organization_id = s2.organization_id AND similarity(s1.name, s2.name) > 0.6)
    )
  `);

  let duplicatesRemoved = 0;
  
  for (const pair of duplicates.rows) {
    // Keep the one with better quality score
    const quality1 = await getServiceQuality(pair.id1);
    const quality2 = await getServiceQuality(pair.id2);
    
    const keepId = quality1 >= quality2 ? pair.id1 : pair.id2;
    const removeId = keepId === pair.id1 ? pair.id2 : pair.id1;
    
    // Mark as duplicate
    await db('services')
      .where('id', removeId)
      .update({
        status: 'inactive',
        updated_at: new Date()
      });
    
    duplicatesRemoved++;
  }

  return { duplicatesRemoved };
}

async function calculateQualityScores() {
  const services = await db('services')
    .where('status', 'active')
    .whereRaw('updated_at > NOW() - INTERVAL \'1 day\'');

  for (const service of services) {
    const quality = await calculateServiceQuality(service);
    
    await db('data_quality')
      .insert({
        service_id: service.id,
        ...quality,
        calculated_at: new Date()
      })
      .onConflict('service_id')
      .merge();
  }
}

async function getServiceQuality(serviceId) {
  const quality = await db('data_quality')
    .where('service_id', serviceId)
    .first();
  
  return quality?.overall_score || 0;
}

async function calculateServiceQuality(service) {
  const hasDescription = !!service.description && service.description.length > 50;
  const hasContact = !!(service.contact?.phone || service.contact?.email);
  const hasLocation = !!service.location;
  const hasHours = !!service.hours;
  const hasEligibility = !!service.eligibility;
  const hasCategories = service.categories?.length > 0;
  
  const descriptionLength = service.description?.length || 0;
  const contactMethodsCount = 
    (service.contact?.phone ? 1 : 0) + 
    (service.contact?.email ? 1 : 0) +
    (service.url ? 1 : 0);
  
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(service.updated_at)) / (1000 * 60 * 60 * 24)
  );
  
  const completenessScore = [
    hasDescription ? 0.3 : 0,
    hasContact ? 0.2 : 0,
    hasLocation ? 0.2 : 0,
    hasHours ? 0.1 : 0,
    hasEligibility ? 0.1 : 0,
    hasCategories ? 0.1 : 0
  ].reduce((a, b) => a + b, 0);
  
  const freshnessScore = Math.max(0, 1 - (daysSinceUpdate / 365));
  
  const overallScore = (completenessScore * 0.7) + (freshnessScore * 0.3);
  
  return {
    has_description: hasDescription,
    has_contact: hasContact,
    has_location: hasLocation,
    has_hours: hasHours,
    has_eligibility: hasEligibility,
    has_categories: hasCategories,
    description_length: descriptionLength,
    contact_methods_count: contactMethodsCount,
    days_since_update: daysSinceUpdate,
    days_since_verification: null,
    completeness_score: completenessScore,
    freshness_score: freshnessScore,
    overall_score: overallScore
  };
}

function formatNotificationBody(type, results) {
  switch (type) {
    case 'scraping_complete':
      return `
Scraping Summary:
${results.map(r => `- ${r.source}: ${r.success ? 'Success' : 'Failed'}`).join('\n')}

Total services processed: ${results.filter(r => r.success).reduce((sum, r) => sum + (r.stats?.servicesProcessed || 0), 0)}
      `;
    
    default:
      return JSON.stringify(results, null, 2);
  }
}

async function extractServicesFromPage(page) {
  // This would use AI to extract services
  // For now, return empty array
  return [];
}

async function saveServiceToDb(service) {
  // Implementation would save service to database
  logger.info({ service: service.name }, 'Would save service to database');
}