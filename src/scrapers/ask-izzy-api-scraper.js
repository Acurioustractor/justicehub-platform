// Ask Izzy API Integration Scraper
import axios from 'axios';
import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';
import { LegalComplianceChecker } from '../utils/legal-compliance.js';
import { ServiceValidator, DataNormalizer, StandardizedCategories, AustralianStates } from '../schemas/australian-service-schema.js';

const logger = pino({ name: 'ask-izzy-api-scraper' });

export class AskIzzyAPIScraper {
  constructor(db, options = {}) {
    this.db = db;
    this.complianceChecker = new LegalComplianceChecker();
    this.validator = new ServiceValidator();
    
    this.options = {
      maxRequestsPerMinute: 30,
      respectRobots: true,
      userAgent: 'Youth-Justice-Service-Finder-Bot (+https://github.com/Acurioustractor/Youth-Justice-Service-Finder)',
      ...options
    };

    this.stats = {
      locationsSearched: 0,
      categoriesSearched: 0,
      servicesFound: 0,
      servicesProcessed: 0,
      duplicatesSkipped: 0,
      errors: 0
    };

    // Ask Izzy API configuration
    this.apiConfig = {
      baseUrl: 'https://askizzy.org.au',
      apiUrl: 'https://askizzy.org.au/api/v0/search',
      fallbackApiUrl: 'https://api.serviceseeker.com.au/api/v2/search',
      categories: [
        'legal',
        'mental-health', 
        'housing',
        'support-and-counselling',
        'education-and-training',
        'health',
        'addiction',
        'centrelink',
        'aboriginal-and-torres-strait-islander'
      ]
    };

    // Australian major cities and towns for comprehensive coverage
    this.searchLocations = [
      // Major cities
      { name: 'Sydney', state: 'NSW', lat: -33.8688, lng: 151.2093, priority: 'high' },
      { name: 'Melbourne', state: 'VIC', lat: -37.8136, lng: 144.9631, priority: 'high' },
      { name: 'Brisbane', state: 'QLD', lat: -27.4698, lng: 153.0251, priority: 'high' },
      { name: 'Perth', state: 'WA', lat: -31.9505, lng: 115.8605, priority: 'high' },
      { name: 'Adelaide', state: 'SA', lat: -34.9285, lng: 138.6007, priority: 'high' },
      { name: 'Hobart', state: 'TAS', lat: -42.8821, lng: 147.3272, priority: 'high' },
      { name: 'Darwin', state: 'NT', lat: -12.4634, lng: 130.8456, priority: 'high' },
      { name: 'Canberra', state: 'ACT', lat: -35.2809, lng: 149.1300, priority: 'high' },
      
      // Major regional cities
      { name: 'Gold Coast', state: 'QLD', lat: -28.0167, lng: 153.4000, priority: 'medium' },
      { name: 'Newcastle', state: 'NSW', lat: -32.9283, lng: 151.7817, priority: 'medium' },
      { name: 'Wollongong', state: 'NSW', lat: -34.4241, lng: 150.8933, priority: 'medium' },
      { name: 'Geelong', state: 'VIC', lat: -38.1499, lng: 144.3617, priority: 'medium' },
      { name: 'Townsville', state: 'QLD', lat: -19.2590, lng: 146.8169, priority: 'medium' },
      { name: 'Cairns', state: 'QLD', lat: -16.9186, lng: 145.7781, priority: 'medium' },
      { name: 'Toowoomba', state: 'QLD', lat: -27.5598, lng: 151.9507, priority: 'medium' },
      { name: 'Ballarat', state: 'VIC', lat: -37.5622, lng: 143.8503, priority: 'medium' },
      { name: 'Bendigo', state: 'VIC', lat: -36.7570, lng: 144.2794, priority: 'medium' },
      { name: 'Albury', state: 'NSW', lat: -36.0737, lng: 146.9135, priority: 'medium' },
      { name: 'Launceston', state: 'TAS', lat: -41.4332, lng: 147.1441, priority: 'medium' },
      { name: 'Mackay', state: 'QLD', lat: -21.1411, lng: 149.1860, priority: 'medium' },
      { name: 'Rockhampton', state: 'QLD', lat: -23.3818, lng: 150.5100, priority: 'medium' },
      { name: 'Bunbury', state: 'WA', lat: -33.3266, lng: 115.6414, priority: 'medium' },
      { name: 'Bundaberg', state: 'QLD', lat: -24.8661, lng: 152.3489, priority: 'medium' },
      { name: 'Wagga Wagga', state: 'NSW', lat: -35.1082, lng: 147.3598, priority: 'medium' },
      { name: 'Hervey Bay', state: 'QLD', lat: -25.2882, lng: 152.7667, priority: 'medium' },
      { name: 'Mildura', state: 'VIC', lat: -34.2085, lng: 142.1382, priority: 'medium' },
      { name: 'Shepparton', state: 'VIC', lat: -36.3820, lng: 145.3989, priority: 'medium' },
      { name: 'Port Macquarie', state: 'NSW', lat: -31.4333, lng: 152.9000, priority: 'low' },
      { name: 'Tamworth', state: 'NSW', lat: -31.0893, lng: 150.9295, priority: 'low' },
      { name: 'Orange', state: 'NSW', lat: -33.2839, lng: 149.0988, priority: 'low' },
      { name: 'Dubbo', state: 'NSW', lat: -32.2431, lng: 148.6017, priority: 'low' },
      { name: 'Gladstone', state: 'QLD', lat: -23.8489, lng: 151.2625, priority: 'low' },
      { name: 'Geraldton', state: 'WA', lat: -28.7774, lng: 114.6230, priority: 'low' },
      { name: 'Albany', state: 'WA', lat: -35.0275, lng: 117.8840, priority: 'low' },
      { name: 'Kalgoorlie', state: 'WA', lat: -30.7333, lng: 121.4667, priority: 'low' },
      { name: 'Mount Gambier', state: 'SA', lat: -37.8292, lng: 140.7829, priority: 'low' },
      { name: 'Whyalla', state: 'SA', lat: -33.0262, lng: 137.5837, priority: 'low' },
      { name: 'Devonport', state: 'TAS', lat: -41.1927, lng: 146.3490, priority: 'low' },
      { name: 'Burnie', state: 'TAS', lat: -41.0581, lng: 145.9109, priority: 'low' },
      { name: 'Alice Springs', state: 'NT', lat: -23.6980, lng: 133.8807, priority: 'low' },
      { name: 'Katherine', state: 'NT', lat: -14.4654, lng: 132.2634, priority: 'low' }
    ];

    this.seenServices = new Set(); // For deduplication
  }

  /**
   * Main scraping method
   */
  async scrapeAskIzzy() {
    logger.info('🚀 Starting Ask Izzy comprehensive scraping');
    
    const allServices = [];
    
    // Sort locations by priority
    const sortedLocations = this.searchLocations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Search each location and category combination
    for (const location of sortedLocations) {
      for (const category of this.apiConfig.categories) {
        try {
          // Check compliance before making request
          const compliance = await this.complianceChecker.checkCompliance(this.apiConfig.apiUrl, {
            maxRequestsPerMinute: this.options.maxRequestsPerMinute
          });

          if (!compliance.allowed) {
            logger.warn({ 
              location: location.name, 
              category, 
              reason: compliance.reason 
            }, 'Compliance check failed');
            
            if (compliance.waitTime) {
              await this.delay(compliance.waitTime * 1000);
            }
            continue;
          }

          // Search for services
          const services = await this.searchServices(location, category);
          
          // Process and validate services
          for (const service of services) {
            const processedService = this.processService(service, location, category);
            if (processedService && !this.isDuplicate(processedService)) {
              allServices.push(processedService);
              this.stats.servicesProcessed++;
            } else if (processedService) {
              this.stats.duplicatesSkipped++;
            }
          }

          this.stats.locationsSearched++;
          this.stats.categoriesSearched++;
          
          // Rate limiting delay
          await this.delay(2000);

        } catch (error) {
          logger.error({ 
            location: location.name, 
            category, 
            error: error.message 
          }, 'Search failed');
          this.stats.errors++;
          
          // Longer delay on error
          await this.delay(5000);
        }
      }
      
      // Delay between locations
      await this.delay(3000);
    }

    logger.info({ 
      stats: this.stats,
      total_services: allServices.length 
    }, 'Ask Izzy scraping completed');

    return {
      services: allServices,
      stats: this.stats,
      summary: this.generateSummary(allServices)
    };
  }

  /**
   * Search services for a specific location and category
   */
  async searchServices(location, category) {
    try {
      const searchParams = {
        category: category,
        location: `${location.lat},${location.lng}`,
        q: 'youth',
        'minimum-should-match': 1,
        limit: 100,
        'search-radius': 50000 // 50km radius
      };

      logger.info({ 
        location: location.name, 
        category,
        params: searchParams 
      }, 'Searching Ask Izzy services');

      const response = await axios.get(this.apiConfig.apiUrl, {
        params: searchParams,
        headers: {
          'User-Agent': this.options.userAgent,
          'Accept': 'application/json',
          'Referer': 'https://askizzy.org.au'
        },
        timeout: 15000
      });

      if (response.data && response.data.objects) {
        this.stats.servicesFound += response.data.objects.length;
        
        logger.info({ 
          location: location.name, 
          category,
          found: response.data.objects.length 
        }, 'Services found');
        
        return response.data.objects;
      }

      return [];

    } catch (error) {
      // Try fallback API if main API fails
      if (error.response?.status === 404 || error.response?.status === 403) {
        return await this.searchServicesFallback(location, category);
      }
      
      logger.error({ 
        location: location.name, 
        category, 
        error: error.message 
      }, 'API search failed');
      return [];
    }
  }

  /**
   * Fallback search using alternative API
   */
  async searchServicesFallback(location, category) {
    try {
      const response = await axios.get(this.apiConfig.fallbackApiUrl, {
        params: {
          'client-id': 'ask-izzy',
          'location': `${location.name}, ${location.state}`,
          'category': category.replace(/-/g, ' '),
          'limit': 50
        },
        headers: {
          'User-Agent': this.options.userAgent
        },
        timeout: 15000
      });

      if (response.data && response.data.data) {
        return response.data.data;
      }

      return [];

    } catch (error) {
      logger.error({ 
        location: location.name, 
        category, 
        error: error.message 
      }, 'Fallback API search failed');
      return [];
    }
  }

  /**
   * Process and normalize service data
   */
  processService(rawService, searchLocation, category) {
    try {
      // Extract basic information
      const name = rawService.name || rawService.organisation?.name;
      if (!name || name.length < 3) {
        return null;
      }

      // Skip if not youth-relevant
      if (!this.isYouthRelevant(rawService, category)) {
        return null;
      }

      // Extract location information
      const location = this.extractLocation(rawService, searchLocation);
      if (!location) {
        return null;
      }

      // Create standardized service object
      const service = {
        id: uuidv4(),
        external_id: rawService.id || rawService.slug,
        name: name,
        description: this.extractDescription(rawService),
        url: rawService.web || rawService.website || null,
        status: 'active',
        
        categories: this.mapCategories(category, rawService),
        keywords: this.extractKeywords(rawService, category),
        service_types: this.extractServiceTypes(rawService),
        target_demographics: ['youth'],
        
        age_range: this.extractAgeRange(rawService),
        
        youth_specific: this.isYouthSpecific(rawService),
        indigenous_specific: this.isIndigenousSpecific(rawService, category),
        culturally_specific: this.extractCulturalSpecificity(rawService),
        disability_specific: this.isDisabilitySpecific(rawService),
        lgbti_specific: this.isLGBTISpecific(rawService),
        
        organization: this.extractOrganization(rawService),
        location: location,
        contact: this.extractContact(rawService),
        service_details: this.extractServiceDetails(rawService),
        
        funding: {
          government_funded: this.isGovernmentFunded(rawService),
          funding_sources: this.extractFundingSources(rawService),
          contract_type: null,
          funding_period: null
        },
        
        data_source: {
          source_name: 'Ask Izzy',
          source_type: 'api',
          source_url: this.apiConfig.apiUrl,
          extraction_method: 'automated_api',
          last_verified: new Date(),
          data_quality_score: null,
          verification_status: 'unverified'
        },
        
        metadata: {
          created_at: new Date(),
          updated_at: new Date(),
          last_scraped: new Date(),
          scraping_notes: `Category: ${category}, Location: ${searchLocation.name}`,
          duplicate_check: {
            potential_duplicates: [],
            similarity_score: 0
          },
          data_completeness: null
        }
      };

      // Validate service
      const validation = this.validator.validate(service);
      if (!validation.valid) {
        logger.debug({ 
          service: name, 
          errors: validation.errors 
        }, 'Service validation failed');
        return null;
      }

      service.data_source.data_quality_score = validation.score;
      return service;

    } catch (error) {
      logger.error({ 
        service: rawService.name, 
        error: error.message 
      }, 'Service processing failed');
      return null;
    }
  }

  /**
   * Check if service is youth-relevant
   */
  isYouthRelevant(service, category) {
    const text = JSON.stringify(service).toLowerCase();
    
    // Exclude obviously non-youth services
    const excludePatterns = [
      'aged care', 'elderly', 'senior', 'retirement',
      'aged', 'over 65', 'pension', 'retiree'
    ];

    for (const pattern of excludePatterns) {
      if (text.includes(pattern)) {
        return false;
      }
    }

    // Include youth-specific indicators
    const includePatterns = [
      'youth', 'young people', 'adolescent', 'teenager', 'teen',
      'under 25', 'under 30', 'junior', 'school', 'student',
      'family', 'child', 'parent'
    ];

    for (const pattern of includePatterns) {
      if (text.includes(pattern)) {
        return true;
      }
    }

    // Include services in youth-relevant categories
    const youthCategories = [
      'legal', 'mental-health', 'education-and-training',
      'support-and-counselling', 'housing'
    ];

    return youthCategories.includes(category);
  }

  /**
   * Extract and normalize location information
   */
  extractLocation(service, searchLocation) {
    const location = service.location;
    if (!location) {
      return null;
    }

    const address = location.street_address || location.address;
    const suburb = location.suburb || location.locality;
    const postcode = location.postcode || location.postal_code;
    const state = location.state || searchLocation.state;

    // Must have at least suburb or address
    if (!address && !suburb) {
      return null;
    }

    return {
      name: service.name,
      address_line_1: address,
      address_line_2: null,
      suburb: suburb,
      city: suburb || searchLocation.name,
      state: DataNormalizer.normalizeState(state),
      postcode: DataNormalizer.normalizePostcode(postcode),
      region: this.normalizeRegion(suburb || searchLocation.name),
      lga: null,
      coordinates: {
        latitude: location.point?.coordinates?.[1] || searchLocation.lat,
        longitude: location.point?.coordinates?.[0] || searchLocation.lng,
        accuracy: address ? 'address' : 'suburb'
      },
      accessibility: {
        wheelchair_accessible: this.extractAccessibility(service, 'wheelchair'),
        public_transport: this.extractAccessibility(service, 'transport'),
        parking_available: this.extractAccessibility(service, 'parking')
      }
    };
  }

  /**
   * Extract organization information
   */
  extractOrganization(service) {
    const org = service.organisation || {};
    
    return {
      id: uuidv4(),
      name: org.name || service.name,
      type: DataNormalizer.normalizeOrganizationType(this.inferOrgType(org, service)),
      abn: org.abn || null,
      registration_type: null,
      parent_organization: org.parent || null,
      website: org.web || service.web || null
    };
  }

  /**
   * Extract contact information
   */
  extractContact(service) {
    const phones = service.phones || [];
    const emails = service.emails || [];
    
    return {
      phone: {
        primary: phones.length > 0 ? DataNormalizer.normalizePhoneNumber(phones[0].number) : null,
        mobile: phones.find(p => p.kind === 'mobile')?.number || null,
        toll_free: phones.find(p => p.number?.includes('1800') || p.number?.includes('1300'))?.number || null,
        crisis_line: phones.find(p => p.kind === 'crisis')?.number || null
      },
      email: {
        primary: emails.length > 0 ? emails[0].email : null,
        intake: emails.find(e => e.kind === 'intake')?.email || null,
        admin: emails.find(e => e.kind === 'admin')?.email || null
      },
      website: service.web || null,
      social_media: {},
      postal_address: null
    };
  }

  /**
   * Extract service details
   */
  extractServiceDetails(service) {
    return {
      availability: {
        hours: this.extractOpeningHours(service),
        after_hours: this.checkAfterHours(service),
        weekends: this.checkWeekends(service),
        public_holidays: null,
        twenty_four_seven: this.check24_7(service)
      },
      cost: {
        free: this.isFree(service),
        fee_for_service: this.hasFees(service),
        bulk_billing: this.hasBulkBilling(service),
        sliding_scale: null,
        cost_description: this.extractCostDescription(service)
      },
      eligibility: {
        age_requirements: this.extractEligibility(service, 'age'),
        geographic_restrictions: this.extractEligibility(service, 'location'),
        referral_required: this.requiresReferral(service),
        appointment_required: this.requiresAppointment(service),
        criteria: this.extractEligibility(service, 'general')
      },
      languages: this.extractLanguages(service),
      capacity: {
        individual: null,
        group: null,
        family: null,
        maximum_clients: null
      }
    };
  }

  /**
   * Map Ask Izzy categories to standardized categories
   */
  mapCategories(askIzzyCategory, service) {
    const categoryMap = {
      'legal': [StandardizedCategories.LEGAL_AID],
      'mental-health': [StandardizedCategories.MENTAL_HEALTH, StandardizedCategories.COUNSELING],
      'housing': [StandardizedCategories.HOUSING],
      'support-and-counselling': [StandardizedCategories.COUNSELING, StandardizedCategories.FAMILY_SUPPORT],
      'education-and-training': [StandardizedCategories.EDUCATION_SUPPORT, StandardizedCategories.TRAINING],
      'health': [StandardizedCategories.HEALTH_SERVICES],
      'addiction': [StandardizedCategories.DRUG_ALCOHOL],
      'centrelink': [StandardizedCategories.FINANCIAL_ASSISTANCE],
      'aboriginal-and-torres-strait-islander': [StandardizedCategories.INDIGENOUS_SERVICES, StandardizedCategories.CULTURAL_SUPPORT]
    };

    const categories = categoryMap[askIzzyCategory] || [StandardizedCategories.COMMUNITY_SERVICE];
    
    // Add additional categories based on service content
    const text = JSON.stringify(service).toLowerCase();
    
    if (text.includes('crisis') || text.includes('emergency')) {
      categories.push(StandardizedCategories.CRISIS_SUPPORT);
    }
    if (text.includes('family') || text.includes('parenting')) {
      categories.push(StandardizedCategories.FAMILY_SUPPORT);
    }
    if (text.includes('employment') || text.includes('job')) {
      categories.push(StandardizedCategories.EMPLOYMENT);
    }

    return [...new Set(categories)]; // Remove duplicates
  }

  /**
   * Check for duplicate services
   */
  isDuplicate(service) {
    const key = `${service.name}-${service.location.address_line_1}-${service.location.suburb}`.toLowerCase().replace(/\s+/g, '');
    
    if (this.seenServices.has(key)) {
      return true;
    }
    
    this.seenServices.add(key);
    return false;
  }

  // Helper methods for data extraction
  extractDescription(service) {
    return service.short_description || 
           service.description || 
           service.details || 
           `${service.name} - Community service providing support`;
  }

  extractKeywords(service, category) {
    const keywords = ['community', 'support', category];
    const text = JSON.stringify(service).toLowerCase();
    
    const keywordPatterns = [
      'youth', 'legal', 'mental health', 'counselling', 'housing',
      'education', 'training', 'family', 'crisis', 'emergency',
      'indigenous', 'aboriginal', 'multicultural'
    ];

    for (const pattern of keywordPatterns) {
      if (text.includes(pattern)) {
        keywords.push(pattern);
      }
    }

    return [...new Set(keywords)];
  }

  extractServiceTypes(service) {
    const types = [];
    const text = JSON.stringify(service).toLowerCase();
    
    if (text.includes('counselling') || text.includes('therapy')) types.push('counselling');
    if (text.includes('legal advice') || text.includes('legal aid')) types.push('legal_advice');
    if (text.includes('accommodation') || text.includes('housing')) types.push('accommodation');
    if (text.includes('emergency') || text.includes('crisis')) types.push('emergency_support');
    if (text.includes('group') || text.includes('program')) types.push('group_programs');
    
    return types;
  }

  extractAgeRange(service) {
    const text = JSON.stringify(service).toLowerCase();
    
    // Look for age patterns
    const ageMatch = text.match(/(\d+)[\s-]*(?:to|-)[\s-]*(\d+)/);
    if (ageMatch) {
      return {
        minimum: parseInt(ageMatch[1]),
        maximum: parseInt(ageMatch[2]),
        description: `Ages ${ageMatch[1]}-${ageMatch[2]}`
      };
    }
    
    // Common age descriptors
    if (text.includes('under 25') || text.includes('youth')) {
      return { minimum: 12, maximum: 25, description: 'Youth services' };
    }
    if (text.includes('young adult')) {
      return { minimum: 18, maximum: 30, description: 'Young adults' };
    }
    
    return { minimum: null, maximum: null, description: 'All ages' };
  }

  isYouthSpecific(service) {
    const text = JSON.stringify(service).toLowerCase();
    return text.includes('youth') || 
           text.includes('young people') || 
           text.includes('adolescent') ||
           text.includes('under 25');
  }

  isIndigenousSpecific(service, category) {
    const text = JSON.stringify(service).toLowerCase();
    return category === 'aboriginal-and-torres-strait-islander' ||
           text.includes('indigenous') || 
           text.includes('aboriginal') || 
           text.includes('torres strait');
  }

  extractCulturalSpecificity(service) {
    const text = JSON.stringify(service).toLowerCase();
    const cultures = [];
    
    if (text.includes('multicultural')) cultures.push('multicultural');
    if (text.includes('refugee')) cultures.push('refugee');
    if (text.includes('migrant')) cultures.push('migrant');
    if (text.includes('ethnic')) cultures.push('ethnic_communities');
    
    return cultures;
  }

  isDisabilitySpecific(service) {
    const text = JSON.stringify(service).toLowerCase();
    return text.includes('disability') || 
           text.includes('disabled') || 
           text.includes('special needs');
  }

  isLGBTISpecific(service) {
    const text = JSON.stringify(service).toLowerCase();
    return text.includes('lgbti') || 
           text.includes('lgbt') || 
           text.includes('rainbow') ||
           text.includes('gender') ||
           text.includes('sexuality');
  }

  // Additional helper methods (placeholder implementations)
  inferOrgType(org, service) {
    const text = JSON.stringify({ org, service }).toLowerCase();
    if (text.includes('government') || text.includes('council')) return 'government';
    if (text.includes('church') || text.includes('faith')) return 'faith_based';
    return 'non_profit';
  }

  normalizeRegion(location) {
    return location ? location.toLowerCase().replace(/\s+/g, '_') : null;
  }

  extractAccessibility(service, type) {
    const text = JSON.stringify(service).toLowerCase();
    if (type === 'wheelchair') return text.includes('wheelchair') || text.includes('accessible');
    if (type === 'transport') return text.includes('public transport') || text.includes('bus') || text.includes('train');
    if (type === 'parking') return text.includes('parking');
    return null;
  }

  extractOpeningHours(service) {
    return service.opening_hours?.join(', ') || null;
  }

  checkAfterHours(service) {
    const hours = JSON.stringify(service.opening_hours || []).toLowerCase();
    return hours.includes('24') || hours.includes('after hours') || hours.includes('on call');
  }

  checkWeekends(service) {
    const hours = JSON.stringify(service.opening_hours || []).toLowerCase();
    return hours.includes('saturday') || hours.includes('sunday') || hours.includes('weekend');
  }

  check24_7(service) {
    const text = JSON.stringify(service).toLowerCase();
    return text.includes('24/7') || text.includes('24 hours') || text.includes('always open');
  }

  isFree(service) {
    const text = JSON.stringify(service).toLowerCase();
    return text.includes('free') || text.includes('no cost') || text.includes('no charge');
  }

  hasFees(service) {
    const text = JSON.stringify(service).toLowerCase();
    return text.includes('fee') || text.includes('cost') || text.includes('charge') || text.includes('payment');
  }

  hasBulkBilling(service) {
    const text = JSON.stringify(service).toLowerCase();
    return text.includes('bulk bill') || text.includes('medicare');
  }

  extractCostDescription(service) {
    const text = JSON.stringify(service).toLowerCase();
    if (text.includes('free')) return 'Free service';
    if (text.includes('bulk bill')) return 'Bulk billing available';
    if (text.includes('sliding scale')) return 'Sliding scale fees';
    return null;
  }

  extractEligibility(service, type) {
    // Placeholder - would need more sophisticated text analysis
    return null;
  }

  requiresReferral(service) {
    const text = JSON.stringify(service).toLowerCase();
    return text.includes('referral required') || text.includes('gp referral');
  }

  requiresAppointment(service) {
    const text = JSON.stringify(service).toLowerCase();
    return text.includes('appointment') || text.includes('book') || text.includes('call first');
  }

  extractLanguages(service) {
    const text = JSON.stringify(service).toLowerCase();
    const languages = [];
    
    if (text.includes('interpreter')) languages.push('interpreter_available');
    if (text.includes('multilingual')) languages.push('multilingual');
    if (text.includes('spanish')) languages.push('spanish');
    if (text.includes('mandarin')) languages.push('mandarin');
    if (text.includes('arabic')) languages.push('arabic');
    
    return languages;
  }

  isGovernmentFunded(service) {
    const text = JSON.stringify(service).toLowerCase();
    return text.includes('government') || 
           text.includes('funded') || 
           text.includes('medicare') ||
           text.includes('department');
  }

  extractFundingSources(service) {
    const sources = [];
    const text = JSON.stringify(service).toLowerCase();
    
    if (text.includes('commonwealth') || text.includes('federal')) sources.push('Commonwealth');
    if (text.includes('state government')) sources.push('State');
    if (text.includes('council') || text.includes('local government')) sources.push('Local');
    if (text.includes('donation') || text.includes('charity')) sources.push('Private');
    
    return sources.length > 0 ? sources : ['Unknown'];
  }

  /**
   * Generate summary of scraping results
   */
  generateSummary(services) {
    const summary = {
      total_services: services.length,
      by_state: {},
      by_category: {},
      top_organizations: {},
      data_quality: {
        high_quality: 0,
        medium_quality: 0,
        low_quality: 0
      }
    };

    for (const service of services) {
      // Count by state
      const state = service.location.state;
      summary.by_state[state] = (summary.by_state[state] || 0) + 1;

      // Count by category
      for (const category of service.categories) {
        summary.by_category[category] = (summary.by_category[category] || 0) + 1;
      }

      // Count by organization
      const orgName = service.organization.name;
      summary.top_organizations[orgName] = (summary.top_organizations[orgName] || 0) + 1;

      // Assess data quality
      const score = service.data_source.data_quality_score || 0;
      if (score >= 0.8) summary.data_quality.high_quality++;
      else if (score >= 0.6) summary.data_quality.medium_quality++;
      else summary.data_quality.low_quality++;
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

export default AskIzzyAPIScraper;