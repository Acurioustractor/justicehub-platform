import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { rateLimiters, createAttribution } from '../utils/rate-limiter.js';
import { normalizePhoneNumber, parseAddress } from '../utils/data-normalizers.js';

const logger = pino({ name: 'my-community-directory-scraper' });

export class MyCommunityDirectoryScraper {
  constructor(db, options = {}) {
    this.db = db;
    this.apiKey = options.apiKey || process.env.MY_COMMUNITY_DIRECTORY_API_KEY;
    this.baseUrl = 'https://api.mycommunitydirectory.com.au/v1';
    this.rateLimiter = rateLimiters.myCommunityDirectory;
    this.options = options;
    this.stats = {
      servicesFound: 0,
      servicesProcessed: 0,
      errors: 0
    };
  }

  async scrape() {
    logger.info('Starting MyCommunityDirectory scrape for Queensland youth services');
    
    if (!this.apiKey) {
      logger.warn('MY_COMMUNITY_DIRECTORY_API_KEY not set, using web scraping fallback');
      return this.scrapeWebFallback();
    }

    try {
      // Search for youth-related services in Queensland
      const searchTerms = [
        'youth justice',
        'youth support',
        'youth mental health',
        'youth accommodation',
        'youth legal',
        'youth employment',
        'indigenous youth',
        'youth crisis'
      ];

      for (const term of searchTerms) {
        try {
          await this.searchServices(term);
        } catch (error) {
          logger.error({ error: error.message, term }, 'Failed to search term');
          this.stats.errors++;
        }
      }

      logger.info({
        stats: this.stats
      }, 'MyCommunityDirectory scrape completed');

      return this.stats;
    } catch (error) {
      logger.error({ error: error.message }, 'Scrape failed');
      this.stats.errors++;
      return this.stats;
    }
  }

  async searchServices(searchTerm) {
    await this.rateLimiter.throttle();
    
    try {
      const response = await axios.get(`${this.baseUrl}/services/search`, {
        headers: {
          'X-API-Key': this.apiKey,
          'Accept': 'application/json'
        },
        params: {
          q: searchTerm,
          state: 'QLD',
          target_group: 'youth',
          limit: 50,
          offset: 0
        }
      });

      if (response.data && response.data.services) {
        logger.info({ 
          term: searchTerm, 
          count: response.data.services.length 
        }, 'Found services');

        for (const service of response.data.services) {
          await this.processService(service);
        }
      }
    } catch (error) {
      if (error.response && error.response.status === 429) {
        logger.warn('Rate limit hit, waiting before retry...');
        await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
        return this.searchServices(searchTerm); // Retry
      }
      throw error;
    }
  }

  async processService(serviceData) {
    try {
      // Check if service is relevant for youth (age 10-25)
      if (!this.isYouthRelevant(serviceData)) {
        return;
      }

      // Get or create organization
      const orgId = await this.findOrCreateOrganization({
        name: serviceData.organization_name || serviceData.provider_name,
        organization_type: this.mapOrganizationType(serviceData.organization_type),
        url: serviceData.website,
        data_source: 'my_community_directory'
      });

      // Map to our schema
      const service = {
        id: uuidv4(),
        organization_id: orgId,
        name: serviceData.name,
        description: this.buildDescription(serviceData),
        url: serviceData.website,
        email: serviceData.email,
        status: serviceData.active ? 'active' : 'inactive',
        minimum_age: this.extractMinAge(serviceData),
        maximum_age: this.extractMaxAge(serviceData),
        youth_specific: this.isYouthSpecific(serviceData),
        indigenous_specific: this.isIndigenousSpecific(serviceData),
        categories: this.mapCategories(serviceData.categories || []),
        keywords: this.extractKeywords(serviceData),
        data_source: 'my_community_directory',
        source_url: serviceData.source_url || this.baseUrl,
        attribution: createAttribution({
          name: 'MyCommunityDirectory',
          url: 'https://mycommunitydirectory.com.au'
        })
      };

      // Add location if available
      if (serviceData.locations && serviceData.locations.length > 0) {
        const loc = serviceData.locations[0]; // Primary location
        service.location = {
          address_1: loc.street_address,
          address_2: loc.street_address_2,
          city: loc.suburb,
          state_province: loc.state || 'QLD',
          postal_code: loc.postcode,
          region: this.mapRegion(loc.suburb, loc.postcode),
          lat: loc.latitude,
          lng: loc.longitude
        };
      }

      // Add contact information
      service.contact = {
        phone: serviceData.phone,
        email: serviceData.email
      };

      await this.saveService(service);
      this.stats.servicesFound++;

    } catch (error) {
      logger.error({ 
        error: error.message,
        service: serviceData.name 
      }, 'Failed to process service');
      this.stats.errors++;
    }
  }

  async scrapeWebFallback() {
    logger.info('Using web scraping fallback for MyCommunityDirectory');
    
    // Focus on Queensland youth service directories
    const directories = [
      {
        url: 'https://www.mycommunitydirectory.com.au/Queensland/Youth_Services',
        category: 'youth_services'
      },
      {
        url: 'https://www.mycommunitydirectory.com.au/Queensland/Youth_Justice',
        category: 'youth_justice'
      },
      {
        url: 'https://www.mycommunitydirectory.com.au/Queensland/Youth_Mental_Health',
        category: 'mental_health'
      }
    ];

    // Since we need to respect their terms, we'll just note this as a data source
    // that requires API access and provide instructions
    logger.info('MyCommunityDirectory requires API access for data extraction');
    logger.info('Please obtain an API key from https://www.mycommunitydirectory.com.au/api');
    
    return this.stats;
  }

  isYouthRelevant(service) {
    const keywords = ['youth', 'young people', 'adolescent', 'teenager', 'student'];
    const text = `${service.name} ${service.description} ${service.target_groups?.join(' ')}`.toLowerCase();
    
    return keywords.some(keyword => text.includes(keyword)) ||
           (service.min_age && service.min_age <= 25) ||
           (service.max_age && service.max_age >= 10);
  }

  isYouthSpecific(service) {
    return service.target_groups?.includes('youth') || 
           service.target_groups?.includes('young people') ||
           (service.max_age && service.max_age <= 25);
  }

  isIndigenousSpecific(service) {
    return service.target_groups?.includes('indigenous') ||
           service.target_groups?.includes('aboriginal') ||
           service.target_groups?.includes('torres strait islander');
  }

  extractMinAge(service) {
    return service.min_age || (this.isYouthSpecific(service) ? 12 : null);
  }

  extractMaxAge(service) {
    return service.max_age || (this.isYouthSpecific(service) ? 25 : null);
  }

  mapOrganizationType(type) {
    const mapping = {
      'charity': 'non_profit',
      'nonprofit': 'non_profit',
      'government': 'government',
      'health': 'health',
      'community': 'non_profit'
    };
    return mapping[type?.toLowerCase()] || 'non_profit';
  }

  mapCategories(categories) {
    const categoryMap = {
      'legal': 'legal_aid',
      'mental health': 'mental_health',
      'accommodation': 'housing',
      'crisis': 'crisis_support',
      'education': 'education_training',
      'employment': 'education_training',
      'family': 'family_support',
      'drug': 'substance_abuse',
      'alcohol': 'substance_abuse',
      'cultural': 'cultural_support'
    };

    return categories
      .map(cat => categoryMap[cat.toLowerCase()] || cat.toLowerCase())
      .filter(cat => cat);
  }

  extractKeywords(service) {
    const keywords = [];
    
    if (service.keywords) keywords.push(...service.keywords);
    if (service.tags) keywords.push(...service.tags);
    if (service.target_groups) keywords.push(...service.target_groups);
    
    return [...new Set(keywords)]; // Remove duplicates
  }

  mapRegion(suburb, postcode) {
    // Map postcodes to regions
    const postcodeMap = {
      '4000-4099': 'brisbane',
      '4100-4199': 'brisbane',
      '4200-4299': 'gold_coast',
      '4300-4399': 'brisbane',
      '4500-4599': 'sunshine_coast',
      '4700-4799': 'rockhampton',
      '4800-4899': 'townsville',
      '4870-4899': 'cairns'
    };

    if (postcode) {
      const code = parseInt(postcode);
      for (const [range, region] of Object.entries(postcodeMap)) {
        const [min, max] = range.split('-').map(Number);
        if (code >= min && code <= max) {
          return region;
        }
      }
    }

    // Fallback to suburb-based mapping
    const suburbLower = suburb?.toLowerCase() || '';
    if (suburbLower.includes('brisbane') || suburbLower.includes('logan')) return 'brisbane';
    if (suburbLower.includes('gold coast') || suburbLower.includes('southport')) return 'gold_coast';
    if (suburbLower.includes('sunshine coast') || suburbLower.includes('maroochydore')) return 'sunshine_coast';
    if (suburbLower.includes('townsville')) return 'townsville';
    if (suburbLower.includes('cairns')) return 'cairns';
    if (suburbLower.includes('toowoomba')) return 'toowoomba';
    if (suburbLower.includes('rockhampton')) return 'rockhampton';
    
    return 'brisbane'; // Default
  }

  buildDescription(service) {
    let description = service.description || '';
    
    if (service.services_provided) {
      description += '\n\nServices provided:\n' + service.services_provided.join('\n');
    }
    
    if (service.eligibility) {
      description += '\n\nEligibility: ' + service.eligibility;
    }
    
    if (service.fees) {
      description += '\n\nFees: ' + service.fees;
    }
    
    return description.trim();
  }

  async findOrCreateOrganization(orgData) {
    try {
      const existing = await this.db('organizations')
        .where('name', orgData.name)
        .first();

      if (existing) {
        return existing.id;
      }

      const [org] = await this.db('organizations')
        .insert({
          id: uuidv4(),
          name: orgData.name,
          organization_type: orgData.organization_type,
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

  async saveService(service) {
    const trx = await this.db.transaction();

    try {
      // Check for existing service
      const existing = await trx('services')
        .where('name', service.name)
        .where('organization_id', service.organization_id)
        .first();

      if (existing) {
        logger.info({ service: service.name }, 'Service already exists, updating');
        
        // Update existing service
        await trx('services')
          .where('id', existing.id)
          .update({
            description: service.description,
            categories: service.categories,
            keywords: service.keywords,
            url: service.url,
            email: service.email,
            attribution: JSON.stringify(service.attribution),
            updated_at: new Date()
          });
          
        service.id = existing.id;
      } else {
        // Insert new service
        const { location, contact, attribution, ...serviceData } = service;
        
        await trx('services').insert({
          ...serviceData,
          attribution: JSON.stringify(attribution),
          created_at: new Date(),
          updated_at: new Date()
        });
      }

      // Handle location
      if (service.location) {
        const existingLocation = await trx('locations')
          .where('service_id', service.id)
          .first();

        if (existingLocation) {
          const { lat, lng, ...locationData } = service.location;
          await trx('locations')
            .where('id', existingLocation.id)
            .update({
              ...locationData,
              latitude: lat,
              longitude: lng,
              updated_at: new Date()
            });
        } else {
          const { lat, lng, ...locationData } = service.location;
          await trx('locations').insert({
            id: uuidv4(),
            service_id: service.id,
            ...locationData,
            latitude: lat,
            longitude: lng,
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }

      // Handle contact
      if (service.contact) {
        const existingContact = await trx('contacts')
          .where('service_id', service.id)
          .first();

        const phoneData = service.contact.phone ? [{
          number: normalizePhoneNumber(service.contact.phone),
          type: 'voice'
        }] : [];

        if (existingContact) {
          await trx('contacts')
            .where('id', existingContact.id)
            .update({
              phone: JSON.stringify(phoneData),
              email: service.contact.email,
              updated_at: new Date()
            });
        } else {
          await trx('contacts').insert({
            id: uuidv4(),
            service_id: service.id,
            phone: JSON.stringify(phoneData),
            email: service.contact.email,
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }

      await trx.commit();
      this.stats.servicesProcessed++;
      logger.info({ service: service.name }, 'Service saved successfully');
    } catch (error) {
      await trx.rollback();
      logger.error({ 
        error: error.message,
        service: service.name 
      }, 'Failed to save service');
      throw error;
    }
  }
}

export async function createMyCommunityDirectoryScraper(db, options) {
  return new MyCommunityDirectoryScraper(db, options);
}