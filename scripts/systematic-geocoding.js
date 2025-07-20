#!/usr/bin/env node

/**
 * Systematic Geocoding Script
 * 
 * This script geocodes all services in the database to improve map coverage
 * from the current 20 locations to potentially hundreds of accurate locations.
 */

import { Pool } from 'pg';
import pino from 'pino';
import { geocodeAddress, batchGeocodeAddresses, getGeocodingStats } from '../src/services/geocoding-service.js';

const logger = pino({ 
  name: 'systematic-geocoding',
  level: process.env.LOG_LEVEL || 'info'
});

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function getServicesWithoutCoordinates() {
  logger.info('Fetching services without coordinates...');
  
  const query = `
    SELECT 
      s.id,
      s.name,
      s.location,
      o.name as organization_name
    FROM services s
    LEFT JOIN organizations o ON s.organization_id = o.id
    WHERE 
      s.location IS NOT NULL 
      AND (
        (s.location->>'coordinates') IS NULL 
        OR (s.location->'coordinates'->>'lat') IS NULL 
        OR (s.location->'coordinates'->>'lng') IS NULL
        OR (s.location->'coordinates'->>'lat')::text = ''
        OR (s.location->'coordinates'->>'lng')::text = ''
      )
    ORDER BY s.id
  `;
  
  const result = await pool.query(query);
  logger.info({ count: result.rows.length }, 'Found services without coordinates');
  
  return result.rows;
}

async function getAllServices() {
  logger.info('Fetching all services for geocoding analysis...');
  
  const query = `
    SELECT 
      s.id,
      s.name,
      s.location,
      o.name as organization_name
    FROM services s
    LEFT JOIN organizations o ON s.organization_id = o.id
    WHERE s.location IS NOT NULL
    ORDER BY s.id
  `;
  
  const result = await pool.query(query);
  logger.info({ count: result.rows.length }, 'Found total services');
  
  return result.rows;
}

async function updateServiceCoordinates(serviceId, coordinates) {
  const query = `
    UPDATE services 
    SET location = jsonb_set(
      location, 
      '{coordinates}', 
      $2::jsonb
    )
    WHERE id = $1
  `;
  
  await pool.query(query, [serviceId, JSON.stringify(coordinates)]);
}

async function geocodeService(service) {
  try {
    logger.debug({ serviceId: service.id }, 'Geocoding service');
    
    // Extract address from location object
    const location = service.location;
    if (!location) {
      logger.warn({ serviceId: service.id }, 'Service has no location data');
      return null;
    }
    
    // Build address object for geocoding
    const addressObj = {
      address_1: location.address || location.address_1,
      address_2: location.address_2,
      suburb: location.suburb || location.city,
      city: location.city,
      state: location.state,
      postcode: location.postcode
    };
    
    // Skip if no meaningful address data
    if (!addressObj.address_1 && !addressObj.suburb && !addressObj.city && !addressObj.postcode) {
      logger.warn({ serviceId: service.id }, 'Service has no meaningful address data');
      return null;
    }
    
    const result = await geocodeAddress(addressObj);
    
    if (result) {
      logger.info({ 
        serviceId: service.id, 
        confidence: result.confidence, 
        method: result.geocoding_method,
        city: result.city,
        state: result.state
      }, 'Successfully geocoded service');
      
      return {
        lat: result.lat,
        lng: result.lng,
        formatted_address: result.formatted_address,
        city: result.city,
        state: result.state,
        postcode: result.postcode,
        confidence: result.confidence,
        geocoding_method: result.geocoding_method,
        geocoded_at: new Date().toISOString()
      };
    }
    
    return null;
  } catch (error) {
    logger.error({ serviceId: service.id, error: error.message }, 'Failed to geocode service');
    return null;
  }
}

async function systematicGeocoding(options = {}) {
  const {
    dryRun = false,
    batchSize = 50,
    maxServices = null,
    onlyMissing = true
  } = options;
  
  logger.info({ dryRun, batchSize, maxServices, onlyMissing }, 'Starting systematic geocoding');
  
  try {
    // Get services to geocode
    const services = onlyMissing 
      ? await getServicesWithoutCoordinates()
      : await getAllServices();
    
    if (services.length === 0) {
      logger.info('No services need geocoding');
      return { success: 0, failed: 0, skipped: 0 };
    }
    
    // Limit services if specified
    const servicesToProcess = maxServices 
      ? services.slice(0, maxServices)
      : services;
    
    logger.info({ total: servicesToProcess.length }, 'Processing services');
    
    let successful = 0;
    let failed = 0;
    let skipped = 0;
    const results = [];
    
    // Process in batches
    for (let i = 0; i < servicesToProcess.length; i += batchSize) {
      const batch = servicesToProcess.slice(i, i + batchSize);
      logger.info({ 
        batch: Math.floor(i / batchSize) + 1, 
        totalBatches: Math.ceil(servicesToProcess.length / batchSize),
        progress: `${i + batch.length}/${servicesToProcess.length}`
      }, 'Processing batch');
      
      for (const service of batch) {
        const coordinates = await geocodeService(service);
        
        if (coordinates) {
          results.push(coordinates);
          
          if (!dryRun) {
            try {
              await updateServiceCoordinates(service.id, coordinates);
              successful++;
              logger.debug({ serviceId: service.id }, 'Updated service coordinates');
            } catch (error) {
              logger.error({ serviceId: service.id, error: error.message }, 'Failed to update coordinates');
              failed++;
            }
          } else {
            successful++;
          }
        } else {
          skipped++;
        }
        
        // Small delay to be nice to the system
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      // Progress report
      if (i % (batchSize * 5) === 0 || i + batchSize >= servicesToProcess.length) {
        const stats = getGeocodingStats(results);
        logger.info({ 
          processed: i + batch.length,
          successful,
          failed,
          skipped,
          stats
        }, 'Progress update');
      }
    }
    
    // Final statistics
    const finalStats = getGeocodingStats(results);
    logger.info({
      dryRun,
      totalProcessed: servicesToProcess.length,
      successful,
      failed,
      skipped,
      geocodingStats: finalStats
    }, 'Systematic geocoding completed');
    
    return {
      success: successful,
      failed: failed,
      skipped: skipped,
      stats: finalStats,
      results: results
    };
    
  } catch (error) {
    logger.error({ error: error.message }, 'Systematic geocoding failed');
    throw error;
  }
}

async function analyzeGeocodingCoverage() {
  logger.info('Analyzing current geocoding coverage...');
  
  const query = `
    SELECT 
      COUNT(*) as total_services,
      COUNT(CASE WHEN 
        (location->'coordinates'->>'lat') IS NOT NULL 
        AND (location->'coordinates'->>'lng') IS NOT NULL 
        AND (location->'coordinates'->>'lat')::text != ''
        AND (location->'coordinates'->>'lng')::text != ''
      THEN 1 END) as geocoded_services,
      COUNT(CASE WHEN location IS NOT NULL THEN 1 END) as services_with_location,
      ROUND(
        COUNT(CASE WHEN 
          (location->'coordinates'->>'lat') IS NOT NULL 
          AND (location->'coordinates'->>'lng') IS NOT NULL 
          AND (location->'coordinates'->>'lat')::text != ''
          AND (location->'coordinates'->>'lng')::text != ''
        THEN 1 END) * 100.0 / COUNT(*), 2
      ) as geocoding_percentage
    FROM services
  `;
  
  const result = await pool.query(query);
  const coverage = result.rows[0];
  
  logger.info({
    totalServices: parseInt(coverage.total_services),
    geocodedServices: parseInt(coverage.geocoded_services),
    servicesWithLocation: parseInt(coverage.services_with_location),
    geocodingPercentage: parseFloat(coverage.geocoding_percentage)
  }, 'Current geocoding coverage');
  
  return coverage;
}

// Command line interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const command = args[0] || 'analyze';
  
  const options = {
    dryRun: args.includes('--dry-run'),
    batchSize: parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1]) || 50,
    maxServices: parseInt(args.find(arg => arg.startsWith('--max='))?.split('=')[1]) || null,
    onlyMissing: !args.includes('--all')
  };
  
  async function main() {
    try {
      switch (command) {
        case 'analyze':
          await analyzeGeocodingCoverage();
          break;
          
        case 'geocode':
          logger.info('Starting geocoding process...');
          await systematicGeocoding(options);
          break;
          
        case 'test':
          logger.info('Testing geocoding with sample addresses...');
          const testAddresses = [
            { address_1: '123 Queen St', city: 'Brisbane', state: 'QLD', postcode: '4000' },
            { suburb: 'Fortitude Valley', state: 'QLD' },
            'Sydney NSW 2000',
            { city: 'Melbourne', state: 'VIC' }
          ];
          
          for (const addr of testAddresses) {
            const result = await geocodeAddress(addr);
            logger.info({ address: addr, result }, 'Test geocoding result');
          }
          break;
          
        default:
          logger.info(`
Usage: node systematic-geocoding.js [command] [options]

Commands:
  analyze     - Analyze current geocoding coverage (default)
  geocode     - Perform systematic geocoding
  test        - Test geocoding with sample addresses

Options:
  --dry-run           - Don't update database, just analyze
  --batch-size=N      - Process N services at a time (default: 50)
  --max=N             - Limit to N services
  --all               - Geocode all services, not just missing ones

Examples:
  node systematic-geocoding.js analyze
  node systematic-geocoding.js geocode --dry-run
  node systematic-geocoding.js geocode --batch-size=25 --max=100
  `);
      }
    } catch (error) {
      logger.error({ error: error.message }, 'Command failed');
      process.exit(1);
    } finally {
      await pool.end();
    }
  }
  
  main();
}

export { systematicGeocoding, analyzeGeocodingCoverage, geocodeService };