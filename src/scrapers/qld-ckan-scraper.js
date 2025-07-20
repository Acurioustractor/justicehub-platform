import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { rateLimiters, createAttribution } from '../utils/rate-limiter.js';
import { normalizePhoneNumber } from '../utils/data-normalizers.js';

const logger = pino({ name: 'qld-ckan-scraper' });

export class QLDCKANScraper {
  constructor(db, options = {}) {
    this.db = db;
    this.baseUrl = 'https://www.data.qld.gov.au/api/3/action';
    this.rateLimiter = rateLimiters.ckan;
    this.options = options;
    this.stats = {
      servicesFound: 0,
      servicesProcessed: 0,
      errors: 0
    };
  }

  async scrape() {
    logger.info('Starting Queensland Government CKAN data portal scrape');
    
    try {
      // Search for youth-related datasets
      const searchTerms = [
        'youth services',
        'youth justice',
        'children services',
        'community services',
        'mental health services',
        'family support',
        'social services directory'
      ];

      for (const term of searchTerms) {
        try {
          await this.searchDatasets(term);
        } catch (error) {
          logger.error({ error: error.message, term }, 'Failed to search datasets');
          this.stats.errors++;
        }
      }

      logger.info({
        stats: this.stats
      }, 'Queensland CKAN scrape completed');

      return this.stats;
    } catch (error) {
      logger.error({ error: error.message }, 'Scrape failed');
      this.stats.errors++;
      return this.stats;
    }
  }

  async searchDatasets(searchTerm) {
    await this.rateLimiter.throttle();
    
    try {
      const response = await axios.get(`${this.baseUrl}/package_search`, {
        params: {
          q: searchTerm,
          fq: 'organization:queensland-government',
          rows: 50,
          sort: 'metadata_modified desc'
        }
      });

      if (response.data.result && response.data.result.results) {
        const datasets = response.data.result.results;
        logger.info({ 
          term: searchTerm, 
          count: datasets.length 
        }, 'Found datasets');

        for (const dataset of datasets) {
          if (this.isYouthRelevant(dataset)) {
            await this.processDataset(dataset);
          }
        }
      }
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to search CKAN datasets');
      throw error;
    }
  }

  async processDataset(dataset) {
    try {
      // Look for CSV or JSON resources in the dataset
      const dataResources = dataset.resources.filter(r => 
        ['CSV', 'JSON', 'API'].includes(r.format?.toUpperCase())
      );

      if (dataResources.length === 0) {
        logger.info({ dataset: dataset.name }, 'No processable data resources found');
        return;
      }

      // Process the first available data resource
      const resource = dataResources[0];
      
      if (resource.format?.toUpperCase() === 'CSV') {
        await this.processCSVResource(dataset, resource);
      } else if (resource.format?.toUpperCase() === 'JSON') {
        await this.processJSONResource(dataset, resource);
      } else if (resource.format?.toUpperCase() === 'API') {
        await this.processAPIResource(dataset, resource);
      }

    } catch (error) {
      logger.error({ 
        error: error.message,
        dataset: dataset.name 
      }, 'Failed to process dataset');
      this.stats.errors++;
    }
  }

  async processCSVResource(dataset, resource) {
    // For CSV processing, we would need to:
    // 1. Download the CSV file
    // 2. Parse it with a streaming parser
    // 3. Map columns to our schema
    // 4. Extract youth-relevant services

    logger.info({ 
      dataset: dataset.name,
      resource: resource.name 
    }, 'CSV resource found - would need custom mapping');

    // Create a placeholder service entry indicating this dataset exists
    await this.createDatasetPlaceholder(dataset, resource, 'CSV data requiring custom mapping');
  }

  async processJSONResource(dataset, resource) {
    await this.rateLimiter.throttle();
    
    try {
      const response = await axios.get(resource.url, {
        timeout: 30000,
        maxContentLength: 50 * 1024 * 1024 // 50MB limit
      });

      const data = response.data;
      
      if (Array.isArray(data)) {
        // Process array of services
        for (const item of data.slice(0, 100)) { // Limit to first 100 items
          if (this.isServiceRelevant(item)) {
            await this.createServiceFromJSON(item, dataset);
          }
        }
      } else if (data.services || data.results) {
        // Handle nested structure
        const services = data.services || data.results;
        for (const item of services.slice(0, 100)) {
          if (this.isServiceRelevant(item)) {
            await this.createServiceFromJSON(item, dataset);
          }
        }
      }

    } catch (error) {
      logger.error({ error: error.message }, 'Failed to process JSON resource');
      await this.createDatasetPlaceholder(dataset, resource, 'JSON data processing failed');
    }
  }

  async processAPIResource(dataset, resource) {
    // For API resources, we would need to understand the API structure
    logger.info({ 
      dataset: dataset.name,
      resource: resource.name 
    }, 'API resource found - would need API documentation');

    await this.createDatasetPlaceholder(dataset, resource, 'API endpoint requiring documentation');
  }

  async createDatasetPlaceholder(dataset, resource, note) {
    // Create an entry indicating this dataset is available for processing
    const orgId = await this.findOrCreateOrganization({
      name: dataset.organization?.title || 'Queensland Government',
      organization_type: 'government',
      url: 'https://www.qld.gov.au',
      data_source: 'qld_ckan'
    });

    const service = {
      id: uuidv4(),
      organization_id: orgId,
      name: `${dataset.title} - Data Source`,
      description: `Queensland Government dataset: ${dataset.notes || dataset.title}

${note}

Dataset URL: ${dataset.url || ''}
Resource URL: ${resource.url}
Format: ${resource.format}
Last Updated: ${resource.last_modified || dataset.metadata_modified}

This represents a government data source that could be processed for youth service information with appropriate mapping.`,
      url: resource.url,
      status: 'active',
      minimum_age: null,
      maximum_age: null,
      youth_specific: false,
      indigenous_specific: false,
      categories: ['government_data'],
      keywords: ['government', 'data', 'dataset', ...(dataset.tags?.map(t => t.name) || [])],
      data_source: 'qld_ckan',
      source_url: dataset.url,
      attribution: createAttribution({
        name: 'Queensland Government Open Data Portal',
        url: 'https://www.data.qld.gov.au'
      }, 'CC-BY 4.0')
    };

    await this.saveService(service);
    this.stats.servicesFound++;
  }

  async createServiceFromJSON(serviceData, dataset) {
    // This would need custom mapping based on the actual JSON structure
    // For now, create a generic service entry

    const orgId = await this.findOrCreateOrganization({
      name: serviceData.organization || serviceData.provider || 'Queensland Government',
      organization_type: 'government',
      url: serviceData.website || 'https://www.qld.gov.au',
      data_source: 'qld_ckan'
    });

    const service = {
      id: uuidv4(),
      organization_id: orgId,
      name: serviceData.name || serviceData.title || 'Government Service',
      description: serviceData.description || serviceData.details || 'Queensland Government service',
      url: serviceData.website || serviceData.url,
      email: serviceData.email,
      status: 'active',
      minimum_age: this.extractAge(serviceData, 'min'),
      maximum_age: this.extractAge(serviceData, 'max'),
      youth_specific: this.isYouthSpecific(serviceData),
      indigenous_specific: this.isIndigenousSpecific(serviceData),
      categories: this.mapCategories(serviceData),
      keywords: this.extractKeywords(serviceData),
      data_source: 'qld_ckan',
      source_url: dataset.url,
      attribution: createAttribution({
        name: 'Queensland Government Open Data Portal',
        url: 'https://www.data.qld.gov.au'
      }, 'CC-BY 4.0')
    };

    // Add location if available
    if (serviceData.address || serviceData.location) {
      service.location = {
        address_1: serviceData.address || serviceData.location?.address,
        city: serviceData.suburb || serviceData.location?.suburb,
        state_province: 'QLD',
        postal_code: serviceData.postcode || serviceData.location?.postcode,
        region: this.mapRegion(serviceData.suburb || serviceData.location?.suburb),
        lat: serviceData.latitude || serviceData.location?.lat,
        lng: serviceData.longitude || serviceData.location?.lng
      };
    }

    // Add contact if available
    if (serviceData.phone || serviceData.email) {
      service.contact = {
        phone: serviceData.phone,
        email: serviceData.email
      };
    }

    await this.saveService(service);
    this.stats.servicesFound++;
  }

  isYouthRelevant(dataset) {
    const text = `${dataset.title} ${dataset.notes} ${dataset.tags?.map(t => t.name).join(' ')}`.toLowerCase();
    
    const youthKeywords = [
      'youth', 'young people', 'children', 'adolescent', 'student',
      'family', 'community services', 'mental health', 'education'
    ];

    return youthKeywords.some(keyword => text.includes(keyword));
  }

  isServiceRelevant(service) {
    const text = JSON.stringify(service).toLowerCase();
    
    const youthKeywords = [
      'youth', 'young', 'children', 'student', 'adolescent'
    ];

    return youthKeywords.some(keyword => text.includes(keyword));
  }

  isYouthSpecific(service) {
    const text = JSON.stringify(service).toLowerCase();
    return text.includes('youth') || text.includes('young people');
  }

  isIndigenousSpecific(service) {
    const text = JSON.stringify(service).toLowerCase();
    return text.includes('aboriginal') || text.includes('torres strait') || text.includes('indigenous');
  }

  extractAge(service, type) {
    // Try to extract age information from various fields
    const ageFields = [
      service.min_age, service.max_age,
      service.age_range, service.eligibility
    ];

    // Simple regex to find age numbers
    const ageText = ageFields.filter(Boolean).join(' ');
    const ageMatch = ageText.match(/(\d+)/);
    
    if (ageMatch) {
      const age = parseInt(ageMatch[1]);
      return type === 'min' ? (age < 18 ? age : null) : (age > 10 ? age : null);
    }

    return null;
  }

  mapCategories(service) {
    const text = JSON.stringify(service).toLowerCase();
    const categories = [];

    if (text.includes('mental health')) categories.push('mental_health');
    if (text.includes('legal')) categories.push('legal_aid');
    if (text.includes('housing') || text.includes('accommodation')) categories.push('housing');
    if (text.includes('education') || text.includes('school')) categories.push('education_training');
    if (text.includes('family')) categories.push('family_support');
    if (text.includes('crisis') || text.includes('emergency')) categories.push('crisis_support');
    if (text.includes('cultural')) categories.push('cultural_support');

    return categories.length > 0 ? categories : ['community_services'];
  }

  extractKeywords(service) {
    const keywords = new Set(['government', 'queensland']);
    
    // Extract from various fields
    const textFields = [
      service.name, service.description, service.category,
      service.service_type, service.target_group
    ];

    textFields.filter(Boolean).forEach(field => {
      field.toString().split(/[\s,]+/).forEach(word => {
        if (word.length > 3) {
          keywords.add(word.toLowerCase());
        }
      });
    });

    return Array.from(keywords);
  }

  mapRegion(suburb) {
    if (!suburb) return 'brisbane';
    
    const suburbLower = suburb.toLowerCase();
    
    if (suburbLower.includes('brisbane') || suburbLower.includes('logan')) return 'brisbane';
    if (suburbLower.includes('gold coast')) return 'gold_coast';
    if (suburbLower.includes('sunshine coast')) return 'sunshine_coast';
    if (suburbLower.includes('townsville')) return 'townsville';
    if (suburbLower.includes('cairns')) return 'cairns';
    if (suburbLower.includes('toowoomba')) return 'toowoomba';
    if (suburbLower.includes('rockhampton')) return 'rockhampton';
    
    return 'brisbane'; // Default
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
      if (service.contact && (service.contact.phone || service.contact.email)) {
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

export async function createQLDCKANScraper(db, options) {
  return new QLDCKANScraper(db, options);
}