import axios from 'axios';
import { parse } from 'csv-parse';
import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';
import { getFirecrawlClient } from '../services/firecrawl-client.js';
import { validateService } from '../utils/validators.js';
import { normalizePhoneNumber, parseAddress, normalizeOrganizationName } from '../utils/data-normalizers.js';

const logger = pino({ name: 'qld-open-data-scraper' });

export class QueenslandOpenDataScraper {
  constructor(db, options = {}) {
    this.db = db;
    this.firecrawl = getFirecrawlClient();
    
    this.options = {
      dataPortalUrl: 'https://www.data.qld.gov.au',
      apiBaseUrl: 'https://www.data.qld.gov.au/api/3',
      datasets: [
        {
          id: 'youth-justice-service-centres',
          name: 'Youth Justice Service Centres',
          resourceId: null, // Will be discovered
          format: 'csv'
        },
        {
          id: 'community-support-services',
          name: 'Community Support Services Directory',
          resourceId: null,
          format: 'csv'
        },
        {
          id: 'child-safety-services',
          name: 'Child Safety Service Centres',
          resourceId: null,
          format: 'csv'
        },
        {
          id: 'legal-aid-offices',
          name: 'Legal Aid Queensland Offices',
          resourceId: null,
          format: 'csv'
        },
        {
          id: 'mental-health-services',
          name: 'Mental Health Services',
          resourceId: null,
          format: 'json'
        }
      ],
      ...options
    };

    this.stats = {
      datasetsProcessed: 0,
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
    logger.info('Starting Queensland Open Data scrape');
    
    try {
      // First, discover available datasets
      await this.discoverDatasets();
      
      // Process each dataset
      for (const dataset of this.options.datasets) {
        try {
          await this.processDataset(dataset);
          this.stats.datasetsProcessed++;
        } catch (error) {
          logger.error({ 
            dataset: dataset.name,
            error: error.message 
          }, 'Failed to process dataset');
          this.stats.errors++;
        }
      }

      // Search for additional youth-related datasets
      await this.searchForYouthDatasets();

      logger.info({
        stats: this.stats
      }, 'Queensland Open Data scrape completed');

      return this.stats;
    } catch (error) {
      logger.error({ error: error.message }, 'Queensland Open Data scrape failed');
      throw error;
    }
  }

  /**
   * Discover dataset resource IDs
   */
  async discoverDatasets() {
    logger.info('Discovering datasets from Queensland Open Data Portal');

    try {
      // Search for youth and justice related datasets
      const searchTerms = ['youth justice', 'youth services', 'community services', 'legal aid'];
      
      for (const term of searchTerms) {
        const response = await axios.get(`${this.options.apiBaseUrl}/action/package_search`, {
          params: {
            q: term,
            rows: 100,
            include_private: false
          }
        });

        if (response.data?.success && response.data?.result?.results) {
          for (const pkg of response.data.result.results) {
            await this.analyzeDatasetPackage(pkg);
          }
        }
      }
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to discover datasets');
    }
  }

  /**
   * Analyze a dataset package for relevant resources
   */
  async analyzeDatasetPackage(pkg) {
    logger.debug({ 
      name: pkg.name,
      title: pkg.title 
    }, 'Analyzing dataset package');

    // Check if it's youth-related
    const youthKeywords = ['youth', 'juvenile', 'child', 'student', 'young'];
    const isYouthRelated = youthKeywords.some(keyword => 
      pkg.title.toLowerCase().includes(keyword) ||
      pkg.notes?.toLowerCase().includes(keyword)
    );

    if (!isYouthRelated) return;

    // Process resources
    for (const resource of pkg.resources || []) {
      if (resource.format?.toLowerCase() === 'csv' || resource.format?.toLowerCase() === 'json') {
        // Check if we already have this dataset configured
        const existing = this.options.datasets.find(d => 
          d.name.toLowerCase().includes(pkg.name.toLowerCase()) ||
          pkg.title.toLowerCase().includes(d.name.toLowerCase())
        );

        if (existing && !existing.resourceId) {
          existing.resourceId = resource.id;
          existing.url = resource.url;
          logger.info({ 
            dataset: existing.name,
            resourceId: resource.id 
          }, 'Found resource ID for dataset');
        } else if (!existing) {
          // Add as new dataset
          this.options.datasets.push({
            id: pkg.name,
            name: pkg.title,
            resourceId: resource.id,
            url: resource.url,
            format: resource.format.toLowerCase()
          });
          logger.info({ 
            dataset: pkg.title 
          }, 'Added new youth-related dataset');
        }
      }
    }
  }

  /**
   * Process a single dataset
   */
  async processDataset(dataset) {
    logger.info({ dataset: dataset.name }, 'Processing dataset');

    if (!dataset.resourceId && !dataset.url) {
      logger.warn({ dataset: dataset.name }, 'No resource ID or URL found, skipping');
      return;
    }

    try {
      let data;
      
      if (dataset.format === 'csv') {
        data = await this.fetchCSVData(dataset);
      } else if (dataset.format === 'json') {
        data = await this.fetchJSONData(dataset);
      } else {
        logger.warn({ format: dataset.format }, 'Unsupported format');
        return;
      }

      // Process the data based on dataset type
      await this.processDatasetRecords(data, dataset);
      
    } catch (error) {
      logger.error({ 
        dataset: dataset.name,
        error: error.message 
      }, 'Failed to process dataset');
      throw error;
    }
  }

  /**
   * Fetch CSV data from URL or API
   */
  async fetchCSVData(dataset) {
    let csvData;
    
    if (dataset.url) {
      // Direct download
      const response = await axios.get(dataset.url, {
        responseType: 'stream',
        timeout: 60000
      });
      csvData = response.data;
    } else if (dataset.resourceId) {
      // API fetch
      const response = await axios.get(
        `${this.options.apiBaseUrl}/action/datastore_search`,
        {
          params: {
            resource_id: dataset.resourceId,
            limit: 10000
          }
        }
      );
      
      if (response.data?.success && response.data?.result?.records) {
        return response.data.result.records;
      }
    }

    // Parse CSV
    return new Promise((resolve, reject) => {
      const records = [];
      const parser = parse({
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      parser.on('readable', function() {
        let record;
        while (record = parser.read()) {
          records.push(record);
        }
      });

      parser.on('error', reject);
      parser.on('end', () => resolve(records));

      if (csvData) {
        csvData.pipe(parser);
      } else {
        reject(new Error('No CSV data available'));
      }
    });
  }

  /**
   * Fetch JSON data
   */
  async fetchJSONData(dataset) {
    if (dataset.url) {
      const response = await axios.get(dataset.url, {
        timeout: 60000
      });
      return response.data;
    } else if (dataset.resourceId) {
      const response = await axios.get(
        `${this.options.apiBaseUrl}/action/datastore_search`,
        {
          params: {
            resource_id: dataset.resourceId,
            limit: 10000
          }
        }
      );
      
      if (response.data?.success && response.data?.result?.records) {
        return response.data.result.records;
      }
    }
    
    return [];
  }

  /**
   * Process dataset records based on type
   */
  async processDatasetRecords(records, dataset) {
    logger.info({ 
      dataset: dataset.name,
      recordCount: records.length 
    }, 'Processing dataset records');

    this.stats.servicesFound += records.length;

    for (const record of records) {
      try {
        let service;
        
        // Handle different dataset types
        if (dataset.id === 'youth-justice-service-centres') {
          service = await this.transformYouthJusticeRecord(record);
        } else if (dataset.id === 'legal-aid-offices') {
          service = await this.transformLegalAidRecord(record);
        } else if (dataset.id === 'mental-health-services') {
          service = await this.transformMentalHealthRecord(record);
        } else {
          // Generic transformation
          service = await this.transformGenericRecord(record, dataset);
        }

        if (service) {
          await this.saveService(service);
          this.stats.servicesProcessed++;
        }
      } catch (error) {
        logger.error({ 
          error: error.message,
          record 
        }, 'Failed to process record');
        this.stats.errors++;
      }
    }
  }

  /**
   * Transform Youth Justice Service Centre record
   */
  async transformYouthJusticeRecord(record) {
    // Map column names (these vary by dataset)
    const name = record['Service Centre Name'] || record['Name'] || record['service_name'];
    const address = record['Address'] || record['Street Address'] || record['address'];
    const phone = record['Phone'] || record['Contact Number'] || record['phone'];
    const email = record['Email'] || record['email'];
    
    if (!name) return null;

    const serviceId = uuidv4();
    
    // Create or find organization (all YJ centres are government)
    const orgId = await this.findOrCreateOrganization({
      name: 'Department of Youth Justice',
      type: 'government',
      url: 'https://www.cyjma.qld.gov.au',
      data_source: 'qld_open_data'
    });

    // Parse address
    const parsedAddress = parseAddress(address);
    
    return {
      id: serviceId,
      organization_id: orgId,
      name: `${name} - Youth Justice Service Centre`,
      description: `Youth Justice Service Centre providing supervision, programs and support for young people in the youth justice system. Services include bail support, supervised orders, referrals to programs, and family support.`,
      status: 'active',
      minimum_age: 10,
      maximum_age: 17,
      youth_specific: true,
      indigenous_specific: false,
      categories: ['supervision', 'court_support', 'diversion', 'family_support'],
      keywords: ['youth justice', 'bail', 'supervision', 'court orders', 'programs'],
      data_source: 'qld_open_data',
      source_url: 'https://www.cyjma.qld.gov.au/contact-us/youth-justice-service-centres',
      contact: {
        phone: normalizePhoneNumber(phone),
        email: email
      },
      location: {
        address_1: parsedAddress.street,
        city: parsedAddress.suburb,
        state_province: 'QLD',
        postal_code: parsedAddress.postcode,
        region: this.determineRegion(parsedAddress.suburb),
        lat: parseFloat(record['Latitude'] || record['lat']) || null,
        lng: parseFloat(record['Longitude'] || record['lng'] || record['lon']) || null
      }
    };
  }

  /**
   * Transform Legal Aid record
   */
  async transformLegalAidRecord(record) {
    const name = record['Office Name'] || record['Name'];
    const address = record['Address'] || record['Location'];
    const phone = record['Phone'] || record['Contact'];
    
    if (!name) return null;

    const serviceId = uuidv4();
    
    const orgId = await this.findOrCreateOrganization({
      name: 'Legal Aid Queensland',
      type: 'government',
      url: 'https://www.legalaid.qld.gov.au',
      data_source: 'qld_open_data'
    });

    const parsedAddress = parseAddress(address);
    
    return {
      id: serviceId,
      organization_id: orgId,
      name: `Legal Aid Queensland - ${name}`,
      description: `Free legal help for young people including representation in court, legal advice, and information about rights. Specialist youth legal services available.`,
      status: 'active',
      minimum_age: 10,
      maximum_age: 25, // Legal Aid often helps up to 25
      youth_specific: false, // They serve all ages but have youth programs
      categories: ['legal_aid', 'advocacy'],
      keywords: ['legal', 'lawyer', 'court', 'free legal help', 'youth lawyer'],
      data_source: 'qld_open_data',
      fees: 'Free for eligible clients',
      contact: {
        phone: normalizePhoneNumber(phone)
      },
      location: {
        address_1: parsedAddress.street,
        city: parsedAddress.suburb,
        state_province: 'QLD',
        postal_code: parsedAddress.postcode,
        region: this.determineRegion(parsedAddress.suburb)
      }
    };
  }

  /**
   * Transform Mental Health Service record
   */
  async transformMentalHealthRecord(record) {
    const name = record['Service Name'] || record['Name'];
    const serviceType = record['Service Type'] || record['Type'];
    
    if (!name) return null;

    // Check if it's youth-relevant
    const youthRelevant = this.isYouthMentalHealthService(record);
    if (!youthRelevant) return null;

    const serviceId = uuidv4();
    
    const orgId = await this.findOrCreateOrganization({
      name: record['Provider'] || 'Queensland Health',
      type: 'healthcare',
      data_source: 'qld_open_data'
    });

    return {
      id: serviceId,
      organization_id: orgId,
      name: name,
      description: record['Description'] || `Mental health service providing ${serviceType}`,
      status: 'active',
      minimum_age: record['Min Age'] ? parseInt(record['Min Age']) : null,
      maximum_age: record['Max Age'] ? parseInt(record['Max Age']) : null,
      youth_specific: youthRelevant,
      categories: ['mental_health'],
      keywords: this.extractMentalHealthKeywords(record),
      data_source: 'qld_open_data',
      contact: {
        phone: normalizePhoneNumber(record['Phone']),
        email: record['Email']
      }
    };
  }

  /**
   * Generic record transformation
   */
  async transformGenericRecord(record, dataset) {
    // Try to identify key fields
    const nameFields = ['name', 'service_name', 'organisation', 'provider'];
    const name = nameFields.map(f => record[f] || record[f.toUpperCase()]).find(v => v);
    
    if (!name) return null;

    // Check if youth-relevant
    if (!this.isYouthRelevant(record)) return null;

    const serviceId = uuidv4();
    
    const orgId = await this.findOrCreateOrganization({
      name: normalizeOrganizationName(name),
      type: 'non_profit',
      data_source: 'qld_open_data'
    });

    return {
      id: serviceId,
      organization_id: orgId,
      name: name,
      description: this.extractDescription(record),
      status: 'active',
      youth_specific: this.isYouthRelevant(record),
      categories: this.inferCategories(record),
      keywords: this.extractKeywords(record),
      data_source: 'qld_open_data',
      source_url: dataset.url
    };
  }

  /**
   * Search for additional youth datasets
   */
  async searchForYouthDatasets() {
    logger.info('Searching for additional youth-related datasets');

    try {
      // Use Firecrawl to explore the data portal
      const searchUrl = `${this.options.dataPortalUrl}/dataset?q=youth+OR+juvenile+OR+student&sort=score+desc%2C+metadata_modified+desc`;
      
      const result = await this.firecrawl.scrapeUrl(searchUrl, {
        datasets: [{
          title: 'string',
          description: 'string',
          format: 'string',
          url: 'string',
          lastUpdated: 'string'
        }]
      });

      if (result.data?.extract?.datasets) {
        for (const dataset of result.data.extract.datasets) {
          logger.info({ 
            title: dataset.title 
          }, 'Found potential youth dataset');
          
          // Add to processing queue if relevant
          if (this.isRelevantDataset(dataset)) {
            // Process in next run
            logger.info({ 
              dataset: dataset.title 
            }, 'Marked dataset for future processing');
          }
        }
      }
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to search for datasets');
    }
  }

  /**
   * Determine region from suburb name
   */
  determineRegion(suburb) {
    if (!suburb) return 'brisbane'; // default
    
    const suburbLower = suburb.toLowerCase();
    
    const regionMappings = {
      'brisbane': ['brisbane', 'fortitude valley', 'west end', 'new farm', 'paddington'],
      'gold_coast': ['gold coast', 'southport', 'surfers paradise', 'broadbeach', 'robina'],
      'sunshine_coast': ['sunshine coast', 'maroochydore', 'caloundra', 'noosa', 'nambour'],
      'townsville': ['townsville', 'thuringowa', 'magnetic island'],
      'cairns': ['cairns', 'smithfield', 'gordonvale', 'trinity beach'],
      'toowoomba': ['toowoomba', 'highfields', 'pittsworth'],
      'mackay': ['mackay', 'andergrove', 'walkerston'],
      'rockhampton': ['rockhampton', 'yeppoon', 'gracemere'],
      'bundaberg': ['bundaberg', 'bargara', 'gin gin'],
      'hervey_bay': ['hervey bay', 'maryborough', 'pialba'],
      'gladstone': ['gladstone', 'tannum sands', 'boyne island'],
      'mount_isa': ['mount isa', 'cloncurry', 'camooweal']
    };

    for (const [region, suburbs] of Object.entries(regionMappings)) {
      if (suburbs.some(s => suburbLower.includes(s))) {
        return region;
      }
    }

    return 'remote_queensland';
  }

  /**
   * Check if mental health service is youth-relevant
   */
  isYouthMentalHealthService(record) {
    const youthIndicators = [
      'child', 'youth', 'adolescent', 'school', 'camhs',
      'headspace', 'student', 'young', 'teen'
    ];

    const text = JSON.stringify(record).toLowerCase();
    return youthIndicators.some(indicator => text.includes(indicator));
  }

  /**
   * Extract mental health keywords
   */
  extractMentalHealthKeywords(record) {
    const keywords = ['mental health'];
    
    const serviceTypes = [
      'counselling', 'therapy', 'psychology', 'psychiatry',
      'crisis', 'emergency', 'assessment', 'treatment'
    ];

    const text = JSON.stringify(record).toLowerCase();
    serviceTypes.forEach(type => {
      if (text.includes(type)) keywords.push(type);
    });

    return keywords;
  }

  /**
   * Check if record is youth-relevant
   */
  isYouthRelevant(record) {
    const text = JSON.stringify(record).toLowerCase();
    
    const youthKeywords = [
      'youth', 'young', 'juvenile', 'student', 'child',
      'adolescent', 'teen', 'school'
    ];

    const adultOnlyKeywords = [
      'adult only', '18+', 'over 18', 'seniors', 'aged care'
    ];

    const hasYouthKeyword = youthKeywords.some(k => text.includes(k));
    const isAdultOnly = adultOnlyKeywords.some(k => text.includes(k));

    return hasYouthKeyword && !isAdultOnly;
  }

  /**
   * Extract description from various fields
   */
  extractDescription(record) {
    const descFields = [
      'description', 'service_description', 'about', 'details',
      'services_provided', 'overview'
    ];

    for (const field of descFields) {
      const value = record[field] || record[field.toUpperCase()];
      if (value && value.length > 20) {
        return value;
      }
    }

    // Build from other fields
    const parts = [];
    if (record.service_type) parts.push(`Service type: ${record.service_type}`);
    if (record.target_group) parts.push(`For: ${record.target_group}`);
    if (record.eligibility) parts.push(`Eligibility: ${record.eligibility}`);

    return parts.join('. ') || 'Community service for young people';
  }

  /**
   * Infer categories from record data
   */
  inferCategories(record) {
    const categories = new Set(['youth_services']);
    
    const text = JSON.stringify(record).toLowerCase();
    
    const categoryMappings = {
      'legal_aid': ['legal', 'court', 'lawyer', 'justice'],
      'mental_health': ['mental', 'counselling', 'psychology', 'wellbeing'],
      'education_training': ['education', 'training', 'school', 'tafe'],
      'housing': ['housing', 'accommodation', 'homeless', 'shelter'],
      'substance_abuse': ['drug', 'alcohol', 'substance', 'addiction'],
      'family_support': ['family', 'parent', 'carer', 'relationship']
    };

    for (const [category, keywords] of Object.entries(categoryMappings)) {
      if (keywords.some(k => text.includes(k))) {
        categories.add(category);
      }
    }

    return Array.from(categories);
  }

  /**
   * Extract keywords from record
   */
  extractKeywords(record) {
    const keywords = new Set();
    
    // Add from specific fields
    ['keywords', 'tags', 'service_type'].forEach(field => {
      const value = record[field] || record[field.toUpperCase()];
      if (value) {
        value.split(/[,;]/).forEach(k => keywords.add(k.trim()));
      }
    });

    return Array.from(keywords);
  }

  /**
   * Check if dataset is relevant
   */
  isRelevantDataset(dataset) {
    const relevant = [
      'youth', 'juvenile', 'child', 'student', 'school',
      'community service', 'social service', 'support service'
    ];

    const text = `${dataset.title} ${dataset.description}`.toLowerCase();
    return relevant.some(term => text.includes(term));
  }

  /**
   * Find or create organization
   */
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
      const { location, contact, ...serviceData } = service;
      
      await trx('services').insert({
        ...serviceData,
        created_at: new Date(),
        updated_at: new Date()
      });

      // Insert location
      if (location && location.address_1) {
        await trx('locations').insert({
          id: uuidv4(),
          service_id: service.id,
          ...location,
          coordinates: location.lat && location.lng
            ? trx.raw('ST_MakePoint(?, ?)', [location.lng, location.lat])
            : null,
          created_at: new Date(),
          updated_at: new Date()
        });
      }

      // Insert contact
      if (contact && (contact.phone || contact.email)) {
        await trx('contacts').insert({
          id: uuidv4(),
          service_id: service.id,
          phone: contact.phone
            ? JSON.stringify([{ number: contact.phone, type: 'voice' }])
            : '[]',
          email: contact.email,
          created_at: new Date(),
          updated_at: new Date()
        });
      }

      await trx.commit();
      logger.info({ service: service.name }, 'Service saved');
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

// Scraper factory
export async function createQueenslandOpenDataScraper(db, options) {
  return new QueenslandOpenDataScraper(db, options);
}