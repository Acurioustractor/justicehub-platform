import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { rateLimiters, createAttribution } from '../utils/rate-limiter.js';
import { normalizePhoneNumber } from '../utils/data-normalizers.js';

const logger = pino({ name: 'acnc-scraper' });

export class ACNCScraper {
  constructor(db, options = {}) {
    this.db = db;
    this.baseUrl = 'https://data.gov.au/data/api/3/action';
    this.datasetId = 'b050b242-4487-4306-abf5-07ca073e5594'; // ACNC Charity Register
    this.rateLimiter = rateLimiters.governmentApi;
    this.options = options;
    this.stats = {
      servicesFound: 0,
      servicesProcessed: 0,
      errors: 0
    };
  }

  async scrape() {
    logger.info('Starting ACNC charity data scrape for Queensland youth services');
    
    try {
      // First, get dataset metadata
      await this.rateLimiter.throttle();
      const metadataResponse = await axios.get(`${this.baseUrl}/package_show`, {
        params: { id: this.datasetId }
      });

      const dataset = metadataResponse.data.result;
      const csvResource = dataset.resources.find(r => r.format === 'CSV');
      
      if (!csvResource) {
        throw new Error('CSV resource not found in ACNC dataset');
      }

      // Download and process the CSV data
      logger.info({ url: csvResource.url }, 'Downloading ACNC charity data');
      await this.rateLimiter.throttle();
      
      // For large CSV files, we should stream and process in chunks
      // But for this example, we'll search via the CKAN DataStore API
      await this.searchDataStore();

      logger.info({
        stats: this.stats
      }, 'ACNC scrape completed');

      return this.stats;
    } catch (error) {
      logger.error({ error: error.message }, 'Scrape failed');
      this.stats.errors++;
      return this.stats;
    }
  }

  async searchDataStore() {
    // Search for youth-related charities in Queensland
    const searchTerms = [
      'youth',
      'young people',
      'adolescent',
      'children',
      'student'
    ];

    const filters = {
      'Charity_State': 'QLD',
      'Charity_Status': 'Registered'
    };

    for (const term of searchTerms) {
      try {
        await this.searchCharities(term, filters);
      } catch (error) {
        logger.error({ error: error.message, term }, 'Failed to search term');
        this.stats.errors++;
      }
    }
  }

  async searchCharities(searchTerm, filters) {
    await this.rateLimiter.throttle();
    
    try {
      const response = await axios.get(`${this.baseUrl}/datastore_search`, {
        params: {
          resource_id: 'eb1e6be4-5b13-4feb-b28e-388bf7c26f93', // ACNC DataStore resource
          q: searchTerm,
          filters: JSON.stringify(filters),
          limit: 100
        }
      });

      if (response.data.result && response.data.result.records) {
        const records = response.data.result.records;
        logger.info({ 
          term: searchTerm, 
          count: records.length 
        }, 'Found charities');

        for (const charity of records) {
          if (this.isYouthRelevant(charity)) {
            await this.processCharity(charity);
          }
        }

        // Check if there are more results
        if (response.data.result.total > response.data.result.limit) {
          // Implement pagination if needed
          logger.info('More results available, implement pagination');
        }
      }
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to search ACNC DataStore');
      // Fallback to direct CSV processing if DataStore API fails
      await this.processCSVFallback();
    }
  }

  async processCharity(charityData) {
    try {
      // Get or create organization
      const orgId = await this.findOrCreateOrganization({
        name: charityData.Charity_Legal_Name,
        organization_type: 'non_profit',
        abn: charityData.ABN,
        data_source: 'acnc'
      });

      // Map charity activities to our categories
      const categories = this.mapCharityActivities(charityData);
      
      // Only process if it has relevant categories
      if (categories.length === 0) {
        return;
      }

      const service = {
        id: uuidv4(),
        organization_id: orgId,
        name: this.buildServiceName(charityData),
        description: this.buildDescription(charityData),
        status: 'active',
        minimum_age: null, // Will need to infer from activities
        maximum_age: 25, // Default for youth services
        youth_specific: this.isYouthSpecific(charityData),
        indigenous_specific: this.hasIndigenousFocus(charityData),
        categories: categories,
        keywords: this.extractKeywords(charityData),
        data_source: 'acnc',
        source_url: `https://www.acnc.gov.au/charity/charities/${charityData.ABN}`,
        attribution: createAttribution({
          name: 'Australian Charities and Not-for-profits Commission',
          url: 'https://data.gov.au/dataset/acnc-register'
        }, 'CC-BY 3.0 AU')
      };

      // Add location
      if (charityData.Charity_Address_Line_1) {
        service.location = {
          address_1: charityData.Charity_Address_Line_1,
          address_2: charityData.Charity_Address_Line_2,
          city: charityData.Charity_Town,
          state_province: charityData.Charity_State,
          postal_code: charityData.Charity_Postcode,
          region: this.mapPostcodeToRegion(charityData.Charity_Postcode)
        };
      }

      // Contact details are limited in ACNC data
      service.contact = {
        // ACNC doesn't provide phone/email in public data
      };

      await this.saveService(service);
      this.stats.servicesFound++;

    } catch (error) {
      logger.error({ 
        error: error.message,
        charity: charityData.Charity_Legal_Name 
      }, 'Failed to process charity');
      this.stats.errors++;
    }
  }

  async processCSVFallback() {
    logger.info('Using CSV fallback method for ACNC data');
    
    // In a production environment, we would:
    // 1. Download the CSV file
    // 2. Parse it with a streaming CSV parser
    // 3. Filter for Queensland youth charities
    // 4. Process each relevant record
    
    // For now, we'll note this as requiring implementation
    logger.warn('CSV processing not yet implemented - use DataStore API');
  }

  isYouthRelevant(charity) {
    const relevantActivities = [
      'Youth development',
      'Youth welfare', 
      'Children - 6 to under 15',
      'Young adults - 15 to under 25',
      'Students',
      'Juvenile offenders'
    ];

    const activities = [
      charity.Main_Activity,
      charity.Activity_1,
      charity.Activity_2,
      charity.Activity_3
    ].filter(Boolean);

    const beneficiaries = [
      charity.Beneficiary_1,
      charity.Beneficiary_2,
      charity.Beneficiary_3
    ].filter(Boolean);

    const allText = [...activities, ...beneficiaries].join(' ').toLowerCase();
    
    return relevantActivities.some(activity => 
      allText.includes(activity.toLowerCase())
    ) || allText.includes('youth') || allText.includes('young');
  }

  isYouthSpecific(charity) {
    const youthBeneficiaries = [
      'Children - 6 to under 15',
      'Young adults - 15 to under 25',
      'Students',
      'Youth'
    ];

    const beneficiaries = [
      charity.Beneficiary_1,
      charity.Beneficiary_2,
      charity.Beneficiary_3
    ].filter(Boolean);

    return beneficiaries.some(b => 
      youthBeneficiaries.some(yb => b?.includes(yb))
    );
  }

  hasIndigenousFocus(charity) {
    const allText = [
      charity.Charity_Legal_Name,
      charity.Main_Activity,
      charity.Activity_1,
      charity.Activity_2,
      charity.Activity_3,
      charity.Beneficiary_1,
      charity.Beneficiary_2,
      charity.Beneficiary_3
    ].filter(Boolean).join(' ').toLowerCase();

    return allText.includes('aboriginal') || 
           allText.includes('torres strait') ||
           allText.includes('indigenous');
  }

  mapCharityActivities(charity) {
    const activityMap = {
      'Youth development': ['education_training', 'mentoring'],
      'Youth welfare': ['case_management', 'family_support'],
      'Mental health': ['mental_health'],
      'Housing': ['housing'],
      'Legal services': ['legal_aid'],
      'Emergency relief': ['crisis_support'],
      'Education': ['education_training'],
      'Employment': ['education_training'],
      'Social inclusion': ['recreation', 'cultural_support'],
      'Drug rehabilitation': ['substance_abuse'],
      'Family support': ['family_support'],
      'Crime prevention': ['diversion'],
      'Advocacy': ['advocacy']
    };

    const categories = new Set();
    
    const activities = [
      charity.Main_Activity,
      charity.Activity_1,
      charity.Activity_2,
      charity.Activity_3
    ].filter(Boolean);

    activities.forEach(activity => {
      Object.entries(activityMap).forEach(([key, values]) => {
        if (activity?.includes(key)) {
          values.forEach(v => categories.add(v));
        }
      });
    });

    return Array.from(categories);
  }

  buildServiceName(charity) {
    // Extract service focus from activities
    const activities = [
      charity.Main_Activity,
      charity.Activity_1
    ].filter(Boolean);

    if (activities.some(a => a?.includes('Youth'))) {
      return `${charity.Charity_Legal_Name} - Youth Services`;
    }
    
    return charity.Charity_Legal_Name;
  }

  buildDescription(charity) {
    const parts = [`Registered charity providing services in Queensland.`];
    
    if (charity.Main_Activity) {
      parts.push(`\n\nMain activity: ${charity.Main_Activity}`);
    }

    const activities = [
      charity.Activity_1,
      charity.Activity_2,
      charity.Activity_3
    ].filter(Boolean);

    if (activities.length > 0) {
      parts.push(`\nOther activities: ${activities.join(', ')}`);
    }

    const beneficiaries = [
      charity.Beneficiary_1,
      charity.Beneficiary_2,
      charity.Beneficiary_3
    ].filter(Boolean);

    if (beneficiaries.length > 0) {
      parts.push(`\nBeneficiaries: ${beneficiaries.join(', ')}`);
    }

    parts.push(`\n\nFor more information, visit the ACNC website or contact the organization directly.`);
    
    return parts.join('');
  }

  extractKeywords(charity) {
    const keywords = new Set(['charity', 'non-profit']);
    
    // Add activity keywords
    const activities = [
      charity.Main_Activity,
      charity.Activity_1,
      charity.Activity_2,
      charity.Activity_3
    ].filter(Boolean);

    activities.forEach(activity => {
      activity.split(/[\s,]+/).forEach(word => {
        if (word.length > 3) {
          keywords.add(word.toLowerCase());
        }
      });
    });

    return Array.from(keywords);
  }

  mapPostcodeToRegion(postcode) {
    if (!postcode) return 'brisbane';
    
    const code = parseInt(postcode);
    
    // Queensland postcode ranges
    if (code >= 4000 && code <= 4099) return 'brisbane';
    if (code >= 4100 && code <= 4199) return 'brisbane';
    if (code >= 4200 && code <= 4299) return 'gold_coast';
    if (code >= 4300 && code <= 4399) return 'brisbane';
    if (code >= 4500 && code <= 4599) return 'sunshine_coast';
    if (code >= 4600 && code <= 4699) return 'hervey_bay';
    if (code >= 4700 && code <= 4799) return 'rockhampton';
    if (code >= 4800 && code <= 4849) return 'townsville';
    if (code >= 4850 && code <= 4899) return 'cairns';
    
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
          abn: orgData.abn,
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
          await trx('locations')
            .where('id', existingLocation.id)
            .update({
              ...service.location,
              updated_at: new Date()
            });
        } else {
          await trx('locations').insert({
            id: uuidv4(),
            service_id: service.id,
            ...service.location,
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }

      // Handle contact (limited data from ACNC)
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

export async function createACNCScraper(db, options) {
  return new ACNCScraper(db, options);
}