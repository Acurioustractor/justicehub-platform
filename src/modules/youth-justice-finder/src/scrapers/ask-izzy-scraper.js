import axios from 'axios';
import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';
import { getFirecrawlClient, extractionSchemas } from '../services/firecrawl-client.js';
import { validateService } from '../utils/validators.js';
import { normalizePhoneNumber, parseAddress } from '../utils/data-normalizers.js';

const logger = pino({ name: 'ask-izzy-scraper' });

export class AskIzzyScraper {
  constructor(db, options = {}) {
    this.db = db;
    this.firecrawl = getFirecrawlClient();
    
    this.options = {
      baseUrl: 'https://askizzy.org.au',
      apiBaseUrl: 'https://api.serviceseeker.com.au/api/v2',
      searchRadius: 50, // km
      maxResultsPerSearch: 100,
      categories: [
        'legal',
        'education-and-training',
        'mental-health',
        'housing',
        'centrelink',
        'support-and-counselling',
        'addiction',
        'health',
        'aboriginal-and-torres-strait-islander'
      ],
      ...options
    };

    // Queensland major locations for geographic coverage
    this.queenslandLocations = [
      { name: 'Brisbane', lat: -27.4678, lng: 153.0281, region: 'brisbane' },
      { name: 'Gold Coast', lat: -28.0167, lng: 153.4000, region: 'gold_coast' },
      { name: 'Sunshine Coast', lat: -26.6500, lng: 153.0667, region: 'sunshine_coast' },
      { name: 'Townsville', lat: -19.2576, lng: 146.8178, region: 'townsville' },
      { name: 'Cairns', lat: -16.9186, lng: 145.7781, region: 'cairns' },
      { name: 'Toowoomba', lat: -27.5598, lng: 151.9507, region: 'toowoomba' },
      { name: 'Mackay', lat: -21.1411, lng: 149.1860, region: 'mackay' },
      { name: 'Rockhampton', lat: -23.3818, lng: 150.5100, region: 'rockhampton' },
      { name: 'Bundaberg', lat: -24.8661, lng: 152.3489, region: 'bundaberg' },
      { name: 'Hervey Bay', lat: -25.2882, lng: 152.7667, region: 'hervey_bay' },
      { name: 'Gladstone', lat: -23.8489, lng: 151.2625, region: 'gladstone' },
      { name: 'Mount Isa', lat: -20.7256, lng: 139.4927, region: 'mount_isa' }
    ];

    this.stats = {
      servicesFound: 0,
      servicesProcessed: 0,
      duplicatesSkipped: 0,
      errors: 0
    };
  }

  /**
   * Main scraping orchestration
   */
  async scrape() {
    logger.info('Starting Ask Izzy scrape');
    
    try {
      // First, try to use their API if available
      const apiResults = await this.scrapeViaAPI();
      
      if (!apiResults || apiResults.length === 0) {
        logger.info('API scraping failed or returned no results, falling back to web scraping');
        await this.scrapeViaWeb();
      }

      logger.info({
        stats: this.stats
      }, 'Ask Izzy scrape completed');

      return this.stats;
    } catch (error) {
      logger.error({ error: error.message }, 'Ask Izzy scrape failed');
      throw error;
    }
  }

  /**
   * Attempt to scrape via API (if they have one)
   */
  async scrapeViaAPI() {
    const services = [];

    try {
      for (const location of this.queenslandLocations) {
        for (const category of this.options.categories) {
          logger.info({ 
            location: location.name, 
            category 
          }, 'Searching services');

          const results = await this.searchServices({
            category,
            latitude: location.lat,
            longitude: location.lng,
            radius: this.options.searchRadius
          });

          for (const result of results) {
            if (await this.isYouthRelevant(result)) {
              const service = await this.transformToServiceModel(result, location);
              services.push(service);
            }
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Batch insert services
      await this.saveServices(services);
      
      return services;
    } catch (error) {
      logger.error({ error: error.message }, 'API scraping failed');
      return [];
    }
  }

  /**
   * Fallback web scraping using Firecrawl
   */
  async scrapeViaWeb() {
    // First, map the website to understand structure
    const siteMap = await this.firecrawl.mapWebsite(this.options.baseUrl, {
      limit: 1000,
      search: 'service youth queensland'
    });

    logger.info({ 
      totalPages: siteMap.links?.length,
      servicePages: siteMap.servicePages?.length 
    }, 'Site mapped');

    // Create custom extraction schema for Ask Izzy
    const askIzzySchema = {
      services: [{
        name: 'string',
        organization: 'string',
        description: 'string',
        serviceTypes: ['string'],
        targetGroups: ['string'],
        eligibility: {
          age: { min: 'number', max: 'number' },
          requirements: ['string']
        },
        locations: [{
          address: 'string',
          suburb: 'string',
          state: 'string',
          postcode: 'string',
          accessibility: ['string']
        }],
        contact: {
          phone: ['string'],
          email: 'string',
          website: 'string'
        },
        openingHours: 'string',
        cost: 'string',
        waitTime: 'string',
        languages: ['string']
      }]
    };

    // Scrape service pages in batches
    const servicePages = siteMap.servicePages || [];
    const batchSize = 10;
    
    for (let i = 0; i < servicePages.length; i += batchSize) {
      const batch = servicePages.slice(i, i + batchSize);
      
      const { successful, failed } = await this.firecrawl.batchScrape(
        batch,
        askIzzySchema
      );

      // Process successful scrapes
      for (const result of successful) {
        await this.processScrapedPage(result);
      }

      // Log failures
      if (failed.length > 0) {
        logger.warn({ failed }, 'Some pages failed to scrape');
        this.stats.errors += failed.length;
      }

      // Progress update
      logger.info({ 
        progress: `${i + batch.length}/${servicePages.length}` 
      }, 'Scraping progress');
    }
  }

  /**
   * Search services via API
   */
  async searchServices(params) {
    try {
      const response = await axios.get(`${this.options.apiBaseUrl}/services`, {
        params: {
          category: params.category,
          lat: params.latitude,
          lng: params.longitude,
          radius: params.radius,
          limit: this.options.maxResultsPerSearch,
          youth: true // If they have youth filter
        },
        headers: {
          'User-Agent': 'YouthJusticeServiceFinder/1.0',
          'Accept': 'application/json'
        },
        timeout: 30000
      });

      return response.data?.services || [];
    } catch (error) {
      logger.debug({ 
        error: error.message,
        params 
      }, 'API search failed');
      return [];
    }
  }

  /**
   * Check if service is relevant for youth (10-17 years)
   */
  async isYouthRelevant(service) {
    // Check explicit age ranges
    if (service.ageMin && service.ageMax) {
      const youthAgeRange = { min: 10, max: 17 };
      return (
        service.ageMin <= youthAgeRange.max &&
        service.ageMax >= youthAgeRange.min
      );
    }

    // Check keywords in name and description
    const youthKeywords = [
      'youth', 'young', 'teen', 'adolescent', 'student',
      'juvenile', 'minor', 'child', 'kids', 'school'
    ];

    const text = `${service.name} ${service.description}`.toLowerCase();
    const hasYouthKeyword = youthKeywords.some(keyword => text.includes(keyword));

    // Check if it explicitly excludes youth
    const adultOnlyKeywords = ['adult only', '18+', 'over 18', 'adults only'];
    const isAdultOnly = adultOnlyKeywords.some(keyword => text.includes(keyword));

    return hasYouthKeyword && !isAdultOnly;
  }

  /**
   * Transform Ask Izzy data to our service model
   */
  async transformToServiceModel(askIzzyService, location) {
    const serviceId = uuidv4();
    
    // Find or create organization
    const orgId = await this.findOrCreateOrganization({
      name: askIzzyService.organisation?.name || askIzzyService.provider || 'Unknown',
      type: this.determineOrgType(askIzzyService),
      url: askIzzyService.organisation?.website,
      data_source: 'ask_izzy'
    });

    // Map categories to our taxonomy
    const categories = this.mapCategories(askIzzyService.serviceTypes || []);

    // Build service object
    const service = {
      id: serviceId,
      organization_id: orgId,
      name: askIzzyService.name,
      alternate_name: askIzzyService.aka,
      description: askIzzyService.description || 'No description available',
      url: askIzzyService.website,
      email: askIzzyService.email,
      status: 'active',
      interpretation_services: askIzzyService.interpreters || false,
      application_process: askIzzyService.howToAccess,
      wait_time: askIzzyService.waitTime,
      fees: askIzzyService.cost || 'Free',
      minimum_age: askIzzyService.ageMin,
      maximum_age: askIzzyService.ageMax,
      youth_specific: await this.isYouthRelevant(askIzzyService),
      indigenous_specific: this.isIndigenousSpecific(askIzzyService),
      categories: categories,
      keywords: this.extractKeywords(askIzzyService),
      data_source: 'ask_izzy',
      source_url: askIzzyService.sourceUrl || `${this.options.baseUrl}/service/${askIzzyService.id}`,
      eligibility: {
        description: askIzzyService.eligibility?.description,
        requirements: askIzzyService.eligibility?.requirements || [],
        gender: askIzzyService.targetGender || 'all'
      }
    };

    // Validate before returning
    const validation = validateService(service);
    if (!validation.valid) {
      logger.warn({ 
        service: service.name,
        errors: validation.errors 
      }, 'Service validation failed');
    }

    return service;
  }

  /**
   * Process a scraped web page
   */
  async processScrapedPage(scrapedResult) {
    if (!scrapedResult.data?.extract?.services) {
      return;
    }

    const services = scrapedResult.data.extract.services;
    this.stats.servicesFound += services.length;

    for (const service of services) {
      try {
        // Determine location from address
        const location = await this.geocodeAddress(service.locations?.[0]);
        
        if (!location || location.state !== 'QLD') {
          continue; // Skip non-Queensland services
        }

        const transformed = await this.transformToServiceModel(service, location);
        await this.saveService(transformed);
        
        this.stats.servicesProcessed++;
      } catch (error) {
        logger.error({ 
          error: error.message,
          service: service.name 
        }, 'Failed to process service');
        this.stats.errors++;
      }
    }
  }

  /**
   * Map Ask Izzy categories to our taxonomy
   */
  mapCategories(askIzzyCategories) {
    const categoryMapping = {
      'legal': ['legal_aid'],
      'education-and-training': ['education_training'],
      'mental-health': ['mental_health'],
      'housing': ['housing'],
      'centrelink': ['family_support'],
      'support-and-counselling': ['family_support', 'mental_health'],
      'addiction': ['substance_abuse'],
      'health': ['mental_health'],
      'aboriginal-and-torres-strait-islander': ['cultural_support']
    };

    const mapped = new Set();
    
    for (const category of askIzzyCategories) {
      const mappedCategories = categoryMapping[category.toLowerCase()] || [category];
      mappedCategories.forEach(cat => mapped.add(cat));
    }

    // Add general youth category
    mapped.add('youth_services');

    return Array.from(mapped);
  }

  /**
   * Determine organization type
   */
  determineOrgType(service) {
    const name = (service.organisation?.name || service.provider || '').toLowerCase();
    
    if (name.includes('government') || name.includes('department')) {
      return 'government';
    } else if (name.includes('aboriginal') || name.includes('indigenous')) {
      return 'indigenous';
    } else if (name.includes('church') || name.includes('salvation')) {
      return 'religious';
    } else if (name.includes('health') || name.includes('hospital')) {
      return 'healthcare';
    } else if (name.includes('school') || name.includes('tafe')) {
      return 'educational';
    } else {
      return 'non_profit';
    }
  }

  /**
   * Check if service is indigenous-specific
   */
  isIndigenousSpecific(service) {
    const indigenousKeywords = [
      'aboriginal', 'torres strait', 'indigenous', 'atsi',
      'first nations', 'koori', 'murri'
    ];

    const text = `${service.name} ${service.description} ${service.targetGroup || ''}`.toLowerCase();
    return indigenousKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Extract keywords from service data
   */
  extractKeywords(service) {
    const keywords = new Set();
    
    // Add service types as keywords
    (service.serviceTypes || []).forEach(type => keywords.add(type));
    
    // Add target groups
    (service.targetGroups || []).forEach(group => keywords.add(group));
    
    // Extract from description
    const importantWords = [
      'crisis', 'emergency', 'free', 'confidential', '24/7',
      'online', 'outreach', 'mobile', 'afterhours'
    ];
    
    const text = (service.description || '').toLowerCase();
    importantWords.forEach(word => {
      if (text.includes(word)) keywords.add(word);
    });

    return Array.from(keywords);
  }

  /**
   * Geocode address to get coordinates and region
   */
  async geocodeAddress(location) {
    if (!location?.address) return null;

    try {
      // In production, use a geocoding service
      // For now, match suburb to region
      const suburb = location.suburb?.toLowerCase() || '';
      
      for (const qlLocation of this.queenslandLocations) {
        if (suburb.includes(qlLocation.name.toLowerCase())) {
          return {
            ...location,
            lat: qlLocation.lat,
            lng: qlLocation.lng,
            region: qlLocation.region,
            state: 'QLD'
          };
        }
      }

      // Default to Brisbane if can't determine
      return {
        ...location,
        lat: this.queenslandLocations[0].lat,
        lng: this.queenslandLocations[0].lng,
        region: 'brisbane',
        state: 'QLD'
      };
    } catch (error) {
      logger.error({ error: error.message }, 'Geocoding failed');
      return null;
    }
  }

  /**
   * Find or create organization
   */
  async findOrCreateOrganization(orgData) {
    try {
      // Check if organization exists
      const existing = await this.db('organizations')
        .where('name', orgData.name)
        .first();

      if (existing) {
        return existing.id;
      }

      // Create new organization
      const [org] = await this.db('organizations')
        .insert({
          id: uuidv4(),
          name: orgData.name,
          organization_type: orgData.type,
          url: orgData.url,
          data_source: orgData.data_source,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('id');

      return org.id;
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to find/create organization');
      throw error;
    }
  }

  /**
   * Save service to database
   */
  async saveService(service) {
    const trx = await this.db.transaction();

    try {
      // Check for duplicates
      const duplicate = await trx('services')
        .where('name', service.name)
        .where('organization_id', service.organization_id)
        .first();

      if (duplicate) {
        this.stats.duplicatesSkipped++;
        await trx.rollback();
        return;
      }

      // Insert service
      await trx('services').insert({
        ...service,
        created_at: new Date(),
        updated_at: new Date()
      });

      // Insert locations
      if (service.locations) {
        for (const location of service.locations) {
          await trx('locations').insert({
            id: uuidv4(),
            service_id: service.id,
            ...location,
            coordinates: trx.raw('ST_MakePoint(?, ?)', [location.lng, location.lat]),
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }

      // Insert contacts
      if (service.contact) {
        await trx('contacts').insert({
          id: uuidv4(),
          service_id: service.id,
          phone: JSON.stringify(
            Array.isArray(service.contact.phone)
              ? service.contact.phone.map(p => ({ number: normalizePhoneNumber(p), type: 'voice' }))
              : []
          ),
          email: service.contact.email,
          created_at: new Date(),
          updated_at: new Date()
        });
      }

      await trx.commit();
      logger.info({ service: service.name }, 'Service saved');
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  /**
   * Batch save services
   */
  async saveServices(services) {
    const batchSize = 50;
    
    for (let i = 0; i < services.length; i += batchSize) {
      const batch = services.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(service => this.saveService(service))
      );
      
      logger.info({ 
        progress: `${i + batch.length}/${services.length}` 
      }, 'Batch save progress');
    }
  }
}

// Scraper factory
export async function createAskIzzyScraper(db, options) {
  return new AskIzzyScraper(db, options);
}