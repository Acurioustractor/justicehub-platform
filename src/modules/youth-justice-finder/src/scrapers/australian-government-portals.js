// Australian Government Data Portal Scraper System
import axios from 'axios';
import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';
import { LegalComplianceChecker } from '../utils/legal-compliance.js';
import { ServiceValidator, DataNormalizer, StandardizedCategories, AustralianStates } from '../schemas/australian-service-schema.js';

const logger = pino({ name: 'australian-gov-portals' });

export class AustralianGovernmentPortalScraper {
  constructor(db, options = {}) {
    this.db = db;
    this.complianceChecker = new LegalComplianceChecker();
    this.validator = new ServiceValidator();
    
    this.options = {
      maxRequestsPerMinute: 20,
      respectRobots: true,
      userAgent: 'Youth-Justice-Service-Finder-Bot (+https://github.com/Acurioustractor/Youth-Justice-Service-Finder)',
      ...options
    };

    this.stats = {
      portalsScraped: 0,
      datasetsFound: 0,
      servicesExtracted: 0,
      servicesProcessed: 0,
      errors: 0,
      complianceIssues: 0
    };

    // Government data portals configuration
    this.portals = [
      {
        name: 'Data.gov.au',
        baseUrl: 'https://data.gov.au',
        apiUrl: 'https://data.gov.au/api/3/action/package_search',
        searchTerms: ['youth services', 'community services', 'social services', 'legal aid', 'mental health'],
        state: 'ALL',
        priority: 'high'
      },
      {
        name: 'Data.NSW',
        baseUrl: 'https://data.nsw.gov.au',
        apiUrl: 'https://data.nsw.gov.au/api/3/action/package_search',
        searchTerms: ['youth', 'community services', 'health services', 'legal services'],
        state: 'NSW',
        priority: 'high'
      },
      {
        name: 'Data.VIC',
        baseUrl: 'https://www.data.vic.gov.au',
        apiUrl: 'https://www.data.vic.gov.au/api/3/action/package_search',
        searchTerms: ['youth services', 'community services', 'family services'],
        state: 'VIC',
        priority: 'high'
      },
      {
        name: 'DataWA',
        baseUrl: 'https://www.data.wa.gov.au',
        apiUrl: 'https://www.data.wa.gov.au/api/3/action/package_search',
        searchTerms: ['youth', 'community', 'health', 'justice'],
        state: 'WA',
        priority: 'medium'
      },
      {
        name: 'Data.SA',
        baseUrl: 'https://data.sa.gov.au',
        apiUrl: 'https://data.sa.gov.au/api/3/action/package_search',
        searchTerms: ['youth services', 'community services'],
        state: 'SA',
        priority: 'medium'
      },
      {
        name: 'Data.ACT',
        baseUrl: 'https://www.data.act.gov.au',
        apiUrl: 'https://www.data.act.gov.au/api/3/action/package_search',
        searchTerms: ['youth', 'community', 'services'],
        state: 'ACT',
        priority: 'medium'
      },
      {
        name: 'NT Open Data',
        baseUrl: 'https://data.nt.gov.au',
        apiUrl: 'https://data.nt.gov.au/api/3/action/package_search',
        searchTerms: ['youth', 'community services', 'health'],
        state: 'NT',
        priority: 'low'
      },
      {
        name: 'LIST Tasmania',
        baseUrl: 'https://data.gov.au',
        apiUrl: 'https://data.gov.au/api/3/action/package_search',
        searchTerms: ['tasmania youth', 'tasmania community services'],
        state: 'TAS',
        priority: 'low'
      }
    ];
  }

  /**
   * Main scraping orchestration method
   */
  async scrapeAllPortals() {
    logger.info('🚀 Starting Australian Government Portal scraping');
    
    const results = [];
    
    // Sort by priority
    const sortedPortals = this.portals.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    for (const portal of sortedPortals) {
      try {
        logger.info({ portal: portal.name, state: portal.state }, 'Scraping portal');
        
        const portalResults = await this.scrapePortal(portal);
        results.push({
          portal: portal.name,
          state: portal.state,
          ...portalResults
        });
        
        this.stats.portalsScraped++;
        
        // Delay between portals
        await this.delay(5000);
        
      } catch (error) {
        logger.error({ 
          portal: portal.name, 
          error: error.message 
        }, 'Portal scraping failed');
        this.stats.errors++;
      }
    }

    logger.info({ stats: this.stats }, 'Government portal scraping completed');
    return {
      stats: this.stats,
      results: results,
      summary: this.generateSummary(results)
    };
  }

  /**
   * Scrape individual portal
   */
  async scrapePortal(portal) {
    const services = [];
    let datasets = [];

    for (const searchTerm of portal.searchTerms) {
      try {
        // Check compliance before making request
        const compliance = await this.complianceChecker.checkCompliance(portal.apiUrl, {
          maxRequestsPerMinute: this.options.maxRequestsPerMinute,
          respectRobots: this.options.respectRobots
        });

        if (!compliance.allowed) {
          logger.warn({ 
            portal: portal.name, 
            reason: compliance.reason 
          }, 'Compliance check failed');
          this.stats.complianceIssues++;
          continue;
        }

        // Search for datasets
        const searchResults = await this.searchDatasets(portal, searchTerm);
        datasets = datasets.concat(searchResults);

        // Delay between searches
        await this.delay(2000);

      } catch (error) {
        logger.error({ 
          portal: portal.name, 
          searchTerm, 
          error: error.message 
        }, 'Dataset search failed');
        this.stats.errors++;
      }
    }

    // Process found datasets
    for (const dataset of datasets) {
      try {
        const extractedServices = await this.processDataset(dataset, portal);
        services.push(...extractedServices);
        
        this.stats.datasetsFound++;
        await this.delay(1000);
        
      } catch (error) {
        logger.error({ 
          dataset: dataset.title, 
          error: error.message 
        }, 'Dataset processing failed');
        this.stats.errors++;
      }
    }

    return {
      datasets_found: datasets.length,
      services_extracted: services.length,
      services: services
    };
  }

  /**
   * Search for datasets in a portal
   */
  async searchDatasets(portal, searchTerm) {
    try {
      const response = await axios.get(portal.apiUrl, {
        params: {
          q: searchTerm,
          rows: 50,
          facet: 'organization,tags',
          sort: 'score desc'
        },
        headers: {
          'User-Agent': this.options.userAgent
        },
        timeout: 15000
      });

      if (response.data.success && response.data.result.results) {
        const relevantDatasets = response.data.result.results.filter(dataset => 
          this.isRelevantDataset(dataset, searchTerm)
        );
        
        logger.info({ 
          portal: portal.name, 
          searchTerm, 
          total: response.data.result.count,
          relevant: relevantDatasets.length 
        }, 'Datasets found');
        
        return relevantDatasets.map(dataset => ({
          ...dataset,
          portal_name: portal.name,
          portal_state: portal.state,
          search_term: searchTerm
        }));
      }

      return [];
      
    } catch (error) {
      logger.error({ 
        portal: portal.name, 
        searchTerm, 
        error: error.message 
      }, 'API search failed');
      return [];
    }
  }

  /**
   * Check if dataset is relevant for youth services
   */
  isRelevantDataset(dataset, searchTerm) {
    const title = (dataset.title || '').toLowerCase();
    const description = (dataset.notes || '').toLowerCase();
    const tags = (dataset.tags || []).map(tag => tag.name.toLowerCase());
    
    const youthKeywords = [
      'youth', 'young people', 'adolescent', 'teenager', 'child', 'family',
      'community services', 'social services', 'legal aid', 'mental health',
      'crisis support', 'housing', 'education', 'training', 'employment'
    ];

    const relevantKeywords = youthKeywords.filter(keyword => 
      title.includes(keyword) || 
      description.includes(keyword) || 
      tags.some(tag => tag.includes(keyword))
    );

    // Exclude obviously irrelevant datasets
    const excludeKeywords = [
      'water', 'transport', 'traffic', 'environment', 'planning', 'zoning',
      'business', 'economics', 'agriculture', 'tourism', 'infrastructure'
    ];

    const hasExclusions = excludeKeywords.some(keyword => 
      title.includes(keyword) || description.includes(keyword)
    );

    return relevantKeywords.length > 0 && !hasExclusions;
  }

  /**
   * Process individual dataset to extract services
   */
  async processDataset(dataset, portal) {
    const services = [];

    if (!dataset.resources || dataset.resources.length === 0) {
      return services;
    }

    for (const resource of dataset.resources) {
      try {
        // Only process CSV and JSON resources
        if (!['CSV', 'JSON', 'XLSX'].includes(resource.format?.toUpperCase())) {
          continue;
        }

        // Check compliance for resource URL
        const compliance = await this.complianceChecker.checkCompliance(resource.url);
        if (!compliance.allowed) {
          continue;
        }

        const extractedServices = await this.extractServicesFromResource(
          resource, 
          dataset, 
          portal
        );
        
        services.push(...extractedServices);
        this.stats.servicesExtracted += extractedServices.length;

      } catch (error) {
        logger.error({ 
          resource: resource.name, 
          error: error.message 
        }, 'Resource processing failed');
        this.stats.errors++;
      }
    }

    return services;
  }

  /**
   * Extract services from data resource
   */
  async extractServicesFromResource(resource, dataset, portal) {
    try {
      const response = await axios.get(resource.url, {
        headers: {
          'User-Agent': this.options.userAgent
        },
        timeout: 30000,
        maxContentLength: 50 * 1024 * 1024 // 50MB limit
      });

      let data;
      if (resource.format?.toUpperCase() === 'JSON') {
        data = response.data;
      } else if (resource.format?.toUpperCase() === 'CSV') {
        data = this.parseCSVData(response.data);
      } else {
        return [];
      }

      return this.extractServicesFromData(data, dataset, portal, resource);

    } catch (error) {
      logger.error({ 
        resource: resource.url, 
        error: error.message 
      }, 'Failed to fetch resource data');
      return [];
    }
  }

  /**
   * Parse CSV data into structured format
   */
  parseCSVData(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        rows.push(row);
      }
    }

    return rows;
  }

  /**
   * Parse CSV line handling quoted values
   */
  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current.trim());
    return values;
  }

  /**
   * Extract service information from structured data
   */
  extractServicesFromData(data, dataset, portal, resource) {
    const services = [];

    if (!Array.isArray(data)) {
      return services;
    }

    for (const row of data.slice(0, 100)) { // Limit to 100 records per resource
      try {
        const service = this.createServiceFromRow(row, dataset, portal, resource);
        if (service) {
          const validation = this.validator.validate(service);
          if (validation.valid) {
            services.push(service);
            this.stats.servicesProcessed++;
          }
        }
      } catch (error) {
        logger.debug({ 
          row: Object.keys(row).slice(0, 3), 
          error: error.message 
        }, 'Row processing failed');
      }
    }

    return services;
  }

  /**
   * Create service object from data row
   */
  createServiceFromRow(row, dataset, portal, resource) {
    // Look for common field patterns
    const nameFields = ['name', 'service_name', 'organisation_name', 'provider', 'title'];
    const addressFields = ['address', 'location', 'street_address', 'address_1'];
    const phoneFields = ['phone', 'telephone', 'contact_phone', 'phone_number'];
    const emailFields = ['email', 'contact_email', 'email_address'];
    const suburbFields = ['suburb', 'city', 'locality', 'town'];
    const postcodeFields = ['postcode', 'postal_code', 'zip'];

    const name = this.findFieldValue(row, nameFields);
    const address = this.findFieldValue(row, addressFields);
    const phone = this.findFieldValue(row, phoneFields);
    const email = this.findFieldValue(row, emailFields);
    const suburb = this.findFieldValue(row, suburbFields);
    const postcode = this.findFieldValue(row, postcodeFields);

    // Must have at least a name to be valid
    if (!name || name.length < 3) {
      return null;
    }

    // Must have some location information
    if (!address && !suburb && !postcode) {
      return null;
    }

    return {
      id: uuidv4(),
      external_id: row.id || row.service_id || null,
      name: name,
      description: dataset.notes || `Service from ${dataset.title}`,
      url: row.website || row.url || null,
      status: 'active',
      
      categories: this.inferCategories(name, dataset.title, dataset.tags),
      keywords: this.extractKeywords(name, dataset.title),
      service_types: [],
      target_demographics: ['youth'],
      
      age_range: {
        minimum: null,
        maximum: null,
        description: 'Youth services'
      },
      
      youth_specific: this.isYouthSpecific(name, dataset.title),
      indigenous_specific: this.isIndigenousSpecific(name, dataset.title),
      culturally_specific: [],
      disability_specific: false,
      lgbti_specific: false,
      
      organization: {
        id: uuidv4(),
        name: name, // Use service name as org name for now
        type: DataNormalizer.normalizeOrganizationType(dataset.organization?.title || 'government'),
        abn: null,
        registration_type: null,
        parent_organization: dataset.organization?.title || portal.name,
        website: dataset.organization?.image_url || portal.baseUrl
      },
      
      location: {
        name: name,
        address_line_1: address,
        address_line_2: null,
        suburb: suburb,
        city: suburb,
        state: DataNormalizer.normalizeState(portal.state),
        postcode: DataNormalizer.normalizePostcode(postcode),
        region: suburb ? suburb.toLowerCase().replace(/\s+/g, '_') : null,
        lga: null,
        coordinates: {
          latitude: this.parseCoordinate(row.latitude || row.lat),
          longitude: this.parseCoordinate(row.longitude || row.lng || row.lon),
          accuracy: address ? 'address' : 'suburb'
        },
        accessibility: {
          wheelchair_accessible: null,
          public_transport: null,
          parking_available: null
        }
      },
      
      contact: {
        phone: {
          primary: DataNormalizer.normalizePhoneNumber(phone),
          mobile: null,
          toll_free: null,
          crisis_line: null
        },
        email: {
          primary: email,
          intake: null,
          admin: null
        },
        website: row.website || row.url || null,
        social_media: {},
        postal_address: null
      },
      
      service_details: {
        availability: {
          hours: null,
          after_hours: null,
          weekends: null,
          public_holidays: null,
          twenty_four_seven: null
        },
        cost: {
          free: null,
          fee_for_service: null,
          bulk_billing: null,
          sliding_scale: null,
          cost_description: null
        },
        eligibility: {
          age_requirements: null,
          geographic_restrictions: [portal.state],
          referral_required: null,
          appointment_required: null,
          criteria: null
        },
        languages: [],
        capacity: {
          individual: null,
          group: null,
          family: null,
          maximum_clients: null
        }
      },
      
      funding: {
        government_funded: true,
        funding_sources: ['Government'],
        contract_type: null,
        funding_period: null
      },
      
      data_source: {
        source_name: portal.name,
        source_type: 'government_portal',
        source_url: resource.url,
        extraction_method: 'automated_api',
        last_verified: new Date(),
        data_quality_score: null, // Will be calculated by validator
        verification_status: 'unverified'
      },
      
      metadata: {
        created_at: new Date(),
        updated_at: new Date(),
        last_scraped: new Date(),
        scraping_notes: `Extracted from ${dataset.title}`,
        duplicate_check: {
          potential_duplicates: [],
          similarity_score: 0
        },
        data_completeness: null // Will be calculated by validator
      }
    };
  }

  /**
   * Find field value from row using multiple possible field names
   */
  findFieldValue(row, fieldNames) {
    for (const fieldName of fieldNames) {
      const value = row[fieldName] || row[fieldName.toLowerCase()] || row[fieldName.toUpperCase()];
      if (value && typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }
    return null;
  }

  /**
   * Infer service categories from name and dataset info
   */
  inferCategories(serviceName, datasetTitle, tags = []) {
    const text = `${serviceName} ${datasetTitle}`.toLowerCase();
    const categories = [];

    if (text.includes('legal') || text.includes('law') || text.includes('court')) {
      categories.push(StandardizedCategories.LEGAL_AID);
    }
    if (text.includes('mental health') || text.includes('counselling') || text.includes('psychology')) {
      categories.push(StandardizedCategories.MENTAL_HEALTH);
    }
    if (text.includes('housing') || text.includes('accommodation')) {
      categories.push(StandardizedCategories.HOUSING);
    }
    if (text.includes('education') || text.includes('training') || text.includes('school')) {
      categories.push(StandardizedCategories.EDUCATION_SUPPORT);
    }
    if (text.includes('employment') || text.includes('job') || text.includes('work')) {
      categories.push(StandardizedCategories.EMPLOYMENT);
    }
    if (text.includes('health') && !categories.includes(StandardizedCategories.MENTAL_HEALTH)) {
      categories.push(StandardizedCategories.HEALTH_SERVICES);
    }
    if (text.includes('family') || text.includes('parenting')) {
      categories.push(StandardizedCategories.FAMILY_SUPPORT);
    }
    if (text.includes('crisis') || text.includes('emergency')) {
      categories.push(StandardizedCategories.CRISIS_SUPPORT);
    }

    return categories.length > 0 ? categories : [StandardizedCategories.COMMUNITY_SERVICE];
  }

  /**
   * Extract keywords from text
   */
  extractKeywords(serviceName, datasetTitle) {
    const text = `${serviceName} ${datasetTitle}`.toLowerCase();
    const keywords = ['government', 'community', 'support'];

    const keywordPatterns = [
      'youth', 'young people', 'adolescent', 'teenager',
      'legal', 'court', 'law', 'mental health', 'counselling',
      'housing', 'accommodation', 'education', 'training',
      'employment', 'job', 'family', 'crisis', 'emergency'
    ];

    for (const pattern of keywordPatterns) {
      if (text.includes(pattern)) {
        keywords.push(pattern);
      }
    }

    return keywords;
  }

  /**
   * Check if service is youth-specific
   */
  isYouthSpecific(serviceName, datasetTitle) {
    const text = `${serviceName} ${datasetTitle}`.toLowerCase();
    return text.includes('youth') || 
           text.includes('young people') || 
           text.includes('adolescent') || 
           text.includes('teenager');
  }

  /**
   * Check if service is Indigenous-specific
   */
  isIndigenousSpecific(serviceName, datasetTitle) {
    const text = `${serviceName} ${datasetTitle}`.toLowerCase();
    return text.includes('indigenous') || 
           text.includes('aboriginal') || 
           text.includes('torres strait');
  }

  /**
   * Parse coordinate value
   */
  parseCoordinate(coord) {
    if (!coord) return null;
    const num = parseFloat(coord);
    return isNaN(num) ? null : num;
  }

  /**
   * Generate summary of scraping results
   */
  generateSummary(results) {
    const summary = {
      total_portals: results.length,
      successful_portals: results.filter(r => r.services_extracted > 0).length,
      total_datasets: results.reduce((sum, r) => sum + r.datasets_found, 0),
      total_services: results.reduce((sum, r) => sum + r.services_extracted, 0),
      by_state: {},
      top_portals: results
        .sort((a, b) => b.services_extracted - a.services_extracted)
        .slice(0, 3)
        .map(r => ({ portal: r.portal, services: r.services_extracted }))
    };

    // Group by state
    for (const result of results) {
      summary.by_state[result.state] = (summary.by_state[result.state] || 0) + result.services_extracted;
    }

    return summary;
  }

  /**
   * Utility method for delays
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default AustralianGovernmentPortalScraper;