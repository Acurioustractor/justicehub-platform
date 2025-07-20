// Master Australian Youth Services Scraper Orchestrator
import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import db from '../config/database.js';

// Import specialized scrapers
import AustralianGovernmentPortalScraper from './australian-government-portals.js';
import AskIzzyAPIScraper from './ask-izzy-api-scraper.js';
import { ServiceValidator, DataNormalizer } from '../schemas/australian-service-schema.js';

const logger = pino({ name: 'master-australian-scraper' });

export class MasterAustralianScraper {
  constructor(options = {}) {
    this.options = {
      maxConcurrentScrapers: 3,
      deduplicationThreshold: 0.85,
      exportFormats: ['json', 'csv'],
      enableFOIRequests: false,
      respectRateLimits: true,
      ...options
    };

    this.validator = new ServiceValidator();
    this.stats = {
      scrapers_executed: 0,
      total_services_found: 0,
      valid_services: 0,
      duplicates_removed: 0,
      data_quality_scores: [],
      processing_time: 0,
      errors: 0
    };

    this.allServices = [];
    this.serviceHashes = new Map(); // For deduplication
    this.organizations = new Map(); // For organization management
  }

  /**
   * Main orchestration method - execute all scraping strategies
   */
  async executeComprehensiveScraping() {
    const startTime = Date.now();
    logger.info('🚀 Starting comprehensive Australian youth services scraping');

    try {
      // Phase 1: Government Data Portals (High Priority)
      await this.executeGovernmentPortalScraping();

      // Phase 2: Ask Izzy API Integration (High Priority)  
      await this.executeAskIzzyIntegration();

      // Phase 3: Additional Community Directories (Medium Priority)
      await this.executeAdditionalDirectoryScraping();

      // Phase 4: Data Processing and Validation
      await this.processAndValidateData();

      // Phase 5: Deduplication and Quality Assessment
      await this.deduplicateAndAssessQuality();

      // Phase 6: Export and Storage
      await this.exportData();

      this.stats.processing_time = Date.now() - startTime;
      
      logger.info({ 
        stats: this.stats,
        total_services: this.allServices.length,
        processing_time_minutes: Math.round(this.stats.processing_time / 60000)
      }, 'Comprehensive scraping completed');

      return this.generateFinalReport();

    } catch (error) {
      logger.error({ error: error.message }, 'Master scraping failed');
      throw error;
    }
  }

  /**
   * Phase 1: Government Data Portals Scraping
   */
  async executeGovernmentPortalScraping() {
    logger.info('📊 Phase 1: Government Data Portals Scraping');
    
    try {
      const portalScraper = new AustralianGovernmentPortalScraper(db, {
        maxRequestsPerMinute: 20,
        respectRobots: this.options.respectRateLimits
      });

      const results = await portalScraper.scrapeAllPortals();
      
      // Collect services from all portals
      for (const portalResult of results.results) {
        if (portalResult.services) {
          this.addServices(portalResult.services, 'government_portals');
        }
      }

      this.stats.scrapers_executed++;
      logger.info({ 
        portals_scraped: results.stats.portalsScraped,
        services_found: results.stats.servicesExtracted 
      }, 'Government portals scraping completed');

    } catch (error) {
      logger.error({ error: error.message }, 'Government portals scraping failed');
      this.stats.errors++;
    }
  }

  /**
   * Phase 2: Ask Izzy API Integration
   */
  async executeAskIzzyIntegration() {
    logger.info('🔍 Phase 2: Ask Izzy API Integration');
    
    try {
      const askIzzyScraper = new AskIzzyAPIScraper(db, {
        maxRequestsPerMinute: 30,
        respectRobots: this.options.respectRateLimits
      });

      const results = await askIzzyScraper.scrapeAskIzzy();
      
      this.addServices(results.services, 'ask_izzy_api');

      this.stats.scrapers_executed++;
      logger.info({ 
        locations_searched: results.stats.locationsSearched,
        services_found: results.stats.servicesFound,
        services_processed: results.stats.servicesProcessed
      }, 'Ask Izzy integration completed');

    } catch (error) {
      logger.error({ error: error.message }, 'Ask Izzy integration failed');
      this.stats.errors++;
    }
  }

  /**
   * Phase 3: Additional Community Directory Scraping
   */
  async executeAdditionalDirectoryScraping() {
    logger.info('🏘️ Phase 3: Additional Community Directory Scraping');
    
    try {
      // This would include additional scrapers for:
      // - Service Seeker API
      // - State-specific directories
      // - Council websites
      // - Major NGO websites
      
      const additionalServices = await this.scrapeAdditionalDirectories();
      this.addServices(additionalServices, 'additional_directories');

      this.stats.scrapers_executed++;
      logger.info({ 
        additional_services: additionalServices.length 
      }, 'Additional directory scraping completed');

    } catch (error) {
      logger.error({ error: error.message }, 'Additional directory scraping failed');
      this.stats.errors++;
    }
  }

  /**
   * Additional directory scraping implementation
   */
  async scrapeAdditionalDirectories() {
    // Placeholder for additional scraping logic
    // Would implement scrapers for:
    // - Service Seeker
    // - State health directories
    // - Legal aid directories
    // - Mental health organization directories
    
    return []; // Return empty array for now
  }

  /**
   * Phase 4: Data Processing and Validation
   */
  async processAndValidateData() {
    logger.info('✅ Phase 4: Data Processing and Validation');
    
    const validatedServices = [];
    const invalidServices = [];

    for (const service of this.allServices) {
      try {
        // Validate service data
        const validation = this.validator.validate(service);
        
        if (validation.valid) {
          // Update data quality score
          service.data_source.data_quality_score = validation.score;
          service.metadata.data_completeness = this.calculateCompleteness(service);
          
          validatedServices.push(service);
          this.stats.data_quality_scores.push(validation.score);
        } else {
          invalidServices.push({
            service: service.name,
            errors: validation.errors,
            warnings: validation.warnings
          });
        }

      } catch (error) {
        logger.error({ 
          service: service.name, 
          error: error.message 
        }, 'Service validation failed');
        this.stats.errors++;
      }
    }

    this.allServices = validatedServices;
    this.stats.valid_services = validatedServices.length;

    logger.info({ 
      valid_services: validatedServices.length,
      invalid_services: invalidServices.length,
      avg_quality_score: this.calculateAverageQuality()
    }, 'Data validation completed');

    // Save validation report
    if (invalidServices.length > 0) {
      fs.writeFileSync('validation-report.json', JSON.stringify({
        timestamp: new Date().toISOString(),
        invalid_services: invalidServices,
        summary: {
          total_invalid: invalidServices.length,
          common_errors: this.analyzeCommonErrors(invalidServices)
        }
      }, null, 2));
    }
  }

  /**
   * Phase 5: Deduplication and Quality Assessment
   */
  async deduplicateAndAssessQuality() {
    logger.info('🔍 Phase 5: Deduplication and Quality Assessment');
    
    const uniqueServices = [];
    const duplicateGroups = [];

    // Create similarity hash for each service
    for (const service of this.allServices) {
      const hash = this.createServiceHash(service);
      const existing = this.serviceHashes.get(hash);

      if (existing) {
        // Found potential duplicate
        const similarity = this.calculateSimilarity(existing, service);
        
        if (similarity >= this.options.deduplicationThreshold) {
          // Merge services, keeping the one with higher quality
          const mergedService = this.mergeServices(existing, service);
          
          // Replace existing service with merged version
          const existingIndex = uniqueServices.findIndex(s => s.id === existing.id);
          if (existingIndex >= 0) {
            uniqueServices[existingIndex] = mergedService;
          }
          
          duplicateGroups.push({
            merged_service: mergedService.name,
            sources: [existing.data_source.source_name, service.data_source.source_name],
            similarity_score: similarity
          });
          
          this.stats.duplicates_removed++;
        } else {
          uniqueServices.push(service);
          this.serviceHashes.set(hash, service);
        }
      } else {
        uniqueServices.push(service);
        this.serviceHashes.set(hash, service);
      }
    }

    this.allServices = uniqueServices;

    logger.info({ 
      unique_services: uniqueServices.length,
      duplicates_removed: this.stats.duplicates_removed,
      duplicate_groups: duplicateGroups.length
    }, 'Deduplication completed');

    // Save deduplication report
    if (duplicateGroups.length > 0) {
      fs.writeFileSync('deduplication-report.json', JSON.stringify({
        timestamp: new Date().toISOString(),
        duplicate_groups: duplicateGroups,
        summary: {
          total_duplicates_removed: this.stats.duplicates_removed,
          deduplication_threshold: this.options.deduplicationThreshold
        }
      }, null, 2));
    }
  }

  /**
   * Phase 6: Export Data
   */
  async exportData() {
    logger.info('💾 Phase 6: Exporting Data');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Export master JSON file
    const masterData = {
      metadata: {
        title: 'Comprehensive Australian Youth Services Database',
        description: 'Australia-wide youth services scraped from government portals and community directories',
        total_services: this.allServices.length,
        generated_at: new Date().toISOString(),
        coverage: 'Australia-wide',
        data_sources: this.getDataSourceSummary(),
        scraping_stats: this.stats
      },
      organizations: this.getOrganizationSummary(),
      services: this.allServices
    };

    const jsonFilename = `MASTER-Australian-Youth-Services-${timestamp}.json`;
    fs.writeFileSync(jsonFilename, JSON.stringify(masterData, null, 2));
    logger.info({ filename: jsonFilename }, 'Master JSON exported');

    // Export CSV format
    if (this.options.exportFormats.includes('csv')) {
      const csvFilename = `MASTER-Australian-Youth-Services-${timestamp}.csv`;
      this.exportCSV(csvFilename);
      logger.info({ filename: csvFilename }, 'Master CSV exported');
    }

    // Export by state
    await this.exportByState(timestamp);

    // Export summary statistics
    const summaryFilename = `Australian-Youth-Services-Summary-${timestamp}.json`;
    fs.writeFileSync(summaryFilename, JSON.stringify(this.generateSummaryReport(), null, 2));
    logger.info({ filename: summaryFilename }, 'Summary report exported');
  }

  /**
   * Add services to collection with source tracking
   */
  addServices(services, source) {
    if (!Array.isArray(services)) {
      return;
    }

    for (const service of services) {
      // Ensure service has required metadata
      if (!service.data_source) {
        service.data_source = { source_name: source };
      }
      if (!service.metadata) {
        service.metadata = { created_at: new Date() };
      }

      this.allServices.push(service);
      this.stats.total_services_found++;

      // Track organization
      if (service.organization?.name) {
        const orgKey = service.organization.name.toLowerCase();
        if (!this.organizations.has(orgKey)) {
          this.organizations.set(orgKey, {
            name: service.organization.name,
            type: service.organization.type,
            services_count: 0,
            states: new Set()
          });
        }
        
        const org = this.organizations.get(orgKey);
        org.services_count++;
        org.states.add(service.location?.state);
      }
    }

    logger.info({ source, count: services.length }, 'Services added to collection');
  }

  /**
   * Create hash for service deduplication
   */
  createServiceHash(service) {
    const hashData = [
      service.name?.toLowerCase().trim(),
      service.location?.address_line_1?.toLowerCase().trim(),
      service.location?.suburb?.toLowerCase().trim(),
      service.location?.postcode,
      service.organization?.name?.toLowerCase().trim()
    ].filter(Boolean).join('|');

    return hashData;
  }

  /**
   * Calculate similarity between two services
   */
  calculateSimilarity(service1, service2) {
    let matches = 0;
    let total = 0;

    // Compare name
    total++;
    if (this.stringSimilarity(service1.name, service2.name) > 0.8) matches++;

    // Compare address
    if (service1.location?.address_line_1 && service2.location?.address_line_1) {
      total++;
      if (this.stringSimilarity(service1.location.address_line_1, service2.location.address_line_1) > 0.8) matches++;
    }

    // Compare postcode
    if (service1.location?.postcode && service2.location?.postcode) {
      total++;
      if (service1.location.postcode === service2.location.postcode) matches++;
    }

    // Compare organization
    if (service1.organization?.name && service2.organization?.name) {
      total++;
      if (this.stringSimilarity(service1.organization.name, service2.organization.name) > 0.8) matches++;
    }

    return total > 0 ? matches / total : 0;
  }

  /**
   * Simple string similarity calculation
   */
  stringSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 1;
    
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 1;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Merge duplicate services, keeping the best data
   */
  mergeServices(existing, duplicate) {
    const merged = { ...existing };

    // Merge contact information
    if (!merged.contact?.phone?.primary && duplicate.contact?.phone?.primary) {
      merged.contact.phone.primary = duplicate.contact.phone.primary;
    }
    if (!merged.contact?.email?.primary && duplicate.contact?.email?.primary) {
      merged.contact.email.primary = duplicate.contact.email.primary;
    }

    // Merge categories and keywords
    if (duplicate.categories) {
      merged.categories = [...new Set([...merged.categories, ...duplicate.categories])];
    }
    if (duplicate.keywords) {
      merged.keywords = [...new Set([...merged.keywords, ...duplicate.keywords])];
    }

    // Keep higher quality data source
    if (duplicate.data_source?.data_quality_score > merged.data_source?.data_quality_score) {
      merged.data_source = duplicate.data_source;
    }

    // Update metadata
    merged.metadata.updated_at = new Date();
    merged.metadata.duplicate_check = {
      potential_duplicates: [duplicate.id],
      similarity_score: this.calculateSimilarity(existing, duplicate)
    };

    return merged;
  }

  /**
   * Calculate data completeness score
   */
  calculateCompleteness(service) {
    let score = 0;
    let maxScore = 0;

    // Basic information (40 points)
    maxScore += 40;
    if (service.name) score += 10;
    if (service.description && service.description.length > 50) score += 10;
    if (service.categories && service.categories.length > 0) score += 10;
    if (service.organization?.name) score += 10;

    // Contact information (30 points)
    maxScore += 30;
    if (service.contact?.phone?.primary) score += 15;
    if (service.contact?.email?.primary) score += 10;
    if (service.contact?.website) score += 5;

    // Location information (30 points)
    maxScore += 30;
    if (service.location?.address_line_1) score += 10;
    if (service.location?.suburb) score += 5;
    if (service.location?.postcode) score += 5;
    if (service.location?.state) score += 5;
    if (service.location?.coordinates?.latitude) score += 5;

    return {
      contact_info: this.calculateContactCompleteness(service),
      location_info: this.calculateLocationCompleteness(service),
      service_details: this.calculateServiceDetailsCompleteness(service),
      overall: Math.round((score / maxScore) * 100) / 100
    };
  }

  calculateContactCompleteness(service) {
    let score = 0;
    if (service.contact?.phone?.primary) score += 0.5;
    if (service.contact?.email?.primary) score += 0.5;
    return score;
  }

  calculateLocationCompleteness(service) {
    let score = 0;
    if (service.location?.address_line_1) score += 0.4;
    if (service.location?.suburb) score += 0.2;
    if (service.location?.postcode) score += 0.2;
    if (service.location?.coordinates?.latitude) score += 0.2;
    return score;
  }

  calculateServiceDetailsCompleteness(service) {
    let score = 0;
    if (service.service_details?.availability) score += 0.25;
    if (service.service_details?.cost) score += 0.25;
    if (service.service_details?.eligibility) score += 0.25;
    if (service.age_range?.minimum !== null) score += 0.25;
    return score;
  }

  /**
   * Calculate average quality score
   */
  calculateAverageQuality() {
    if (this.stats.data_quality_scores.length === 0) return 0;
    const sum = this.stats.data_quality_scores.reduce((a, b) => a + b, 0);
    return Math.round((sum / this.stats.data_quality_scores.length) * 100) / 100;
  }

  /**
   * Analyze common validation errors
   */
  analyzeCommonErrors(invalidServices) {
    const errorCounts = {};
    
    for (const invalid of invalidServices) {
      for (const error of invalid.errors) {
        errorCounts[error] = (errorCounts[error] || 0) + 1;
      }
    }

    return Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([error, count]) => ({ error, count }));
  }

  /**
   * Get data source summary
   */
  getDataSourceSummary() {
    const sources = {};
    
    for (const service of this.allServices) {
      const sourceName = service.data_source?.source_name || 'unknown';
      sources[sourceName] = (sources[sourceName] || 0) + 1;
    }

    return sources;
  }

  /**
   * Get organization summary
   */
  getOrganizationSummary() {
    const summary = [];
    
    for (const [key, org] of this.organizations.entries()) {
      summary.push({
        name: org.name,
        type: org.type,
        services_count: org.services_count,
        states_served: Array.from(org.states)
      });
    }

    return summary.sort((a, b) => b.services_count - a.services_count);
  }

  /**
   * Export CSV format
   */
  exportCSV(filename) {
    const headers = [
      'ID', 'Name', 'Description', 'Organization', 'Organization_Type',
      'Address', 'Suburb', 'City', 'State', 'Postcode', 'Region',
      'Phone', 'Email', 'Website', 'Categories', 'Keywords',
      'Min_Age', 'Max_Age', 'Youth_Specific', 'Indigenous_Specific',
      'Data_Source', 'Quality_Score', 'Status'
    ];

    const rows = this.allServices.map(service => [
      service.id || '',
      `"${(service.name || '').replace(/"/g, '""')}"`,
      `"${(service.description || '').replace(/"/g, '""').substring(0, 200)}"`,
      `"${(service.organization?.name || '').replace(/"/g, '""')}"`,
      service.organization?.type || '',
      `"${(service.location?.address_line_1 || '').replace(/"/g, '""')}"`,
      service.location?.suburb || '',
      service.location?.city || '',
      service.location?.state || '',
      service.location?.postcode || '',
      service.location?.region || '',
      service.contact?.phone?.primary || '',
      service.contact?.email?.primary || '',
      service.contact?.website || '',
      service.categories ? `"${service.categories.join(', ')}"` : '',
      service.keywords ? `"${service.keywords.join(', ')}"` : '',
      service.age_range?.minimum || '',
      service.age_range?.maximum || '',
      service.youth_specific || false,
      service.indigenous_specific || false,
      service.data_source?.source_name || '',
      service.data_source?.data_quality_score || '',
      service.status || 'active'
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    fs.writeFileSync(filename, csvContent);
  }

  /**
   * Export data by state
   */
  async exportByState(timestamp) {
    const byState = {};
    
    for (const service of this.allServices) {
      const state = service.location?.state || 'UNKNOWN';
      if (!byState[state]) byState[state] = [];
      byState[state].push(service);
    }

    for (const [state, services] of Object.entries(byState)) {
      const filename = `Australian-Youth-Services-${state}-${timestamp}.json`;
      fs.writeFileSync(filename, JSON.stringify({
        state: state,
        total_services: services.length,
        generated_at: new Date().toISOString(),
        services: services
      }, null, 2));
    }

    logger.info({ states_exported: Object.keys(byState).length }, 'State-wise exports completed');
  }

  /**
   * Generate comprehensive summary report
   */
  generateSummaryReport() {
    return {
      title: 'Australian Youth Services Scraping Summary',
      generated_at: new Date().toISOString(),
      execution_summary: {
        total_scrapers_executed: this.stats.scrapers_executed,
        total_services_found: this.stats.total_services_found,
        valid_services_processed: this.stats.valid_services,
        duplicates_removed: this.stats.duplicates_removed,
        processing_time_minutes: Math.round(this.stats.processing_time / 60000),
        errors_encountered: this.stats.errors
      },
      data_quality: {
        average_quality_score: this.calculateAverageQuality(),
        high_quality_services: this.stats.data_quality_scores.filter(s => s >= 0.8).length,
        medium_quality_services: this.stats.data_quality_scores.filter(s => s >= 0.6 && s < 0.8).length,
        low_quality_services: this.stats.data_quality_scores.filter(s => s < 0.6).length
      },
      coverage: {
        total_services: this.allServices.length,
        data_sources: this.getDataSourceSummary(),
        by_state: this.getStateBreakdown(),
        top_organizations: this.getTopOrganizations()
      },
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Get state breakdown
   */
  getStateBreakdown() {
    const breakdown = {};
    
    for (const service of this.allServices) {
      const state = service.location?.state || 'UNKNOWN';
      breakdown[state] = (breakdown[state] || 0) + 1;
    }

    return breakdown;
  }

  /**
   * Get top organizations by service count
   */
  getTopOrganizations() {
    return this.getOrganizationSummary().slice(0, 10);
  }

  /**
   * Generate recommendations for improvement
   */
  generateRecommendations() {
    const recommendations = [];

    // Data quality recommendations
    const avgQuality = this.calculateAverageQuality();
    if (avgQuality < 0.7) {
      recommendations.push({
        type: 'data_quality',
        priority: 'high',
        message: 'Average data quality is below 70%. Consider improving data validation and enrichment.'
      });
    }

    // Coverage recommendations
    const stateBreakdown = this.getStateBreakdown();
    const lowCoverageStates = Object.entries(stateBreakdown)
      .filter(([state, count]) => count < 50)
      .map(([state]) => state);

    if (lowCoverageStates.length > 0) {
      recommendations.push({
        type: 'coverage',
        priority: 'medium',
        message: `Low service coverage in: ${lowCoverageStates.join(', ')}. Consider additional scraping sources.`
      });
    }

    // Data source recommendations
    const sources = this.getDataSourceSummary();
    if (Object.keys(sources).length < 5) {
      recommendations.push({
        type: 'data_sources',
        priority: 'medium',
        message: 'Limited data sources. Consider integrating additional APIs and directories.'
      });
    }

    return recommendations;
  }

  /**
   * Generate final comprehensive report
   */
  generateFinalReport() {
    return {
      success: true,
      summary: this.generateSummaryReport(),
      files_created: this.getExportedFiles(),
      next_steps: [
        'Review validation report for data quality improvements',
        'Check deduplication report for potential merge opportunities',
        'Implement FOI requests for additional government data',
        'Set up automated scraping schedule',
        'Deploy to production database'
      ]
    };
  }

  /**
   * Get list of exported files
   */
  getExportedFiles() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return [
      `MASTER-Australian-Youth-Services-${timestamp}.json`,
      `MASTER-Australian-Youth-Services-${timestamp}.csv`,
      `Australian-Youth-Services-Summary-${timestamp}.json`,
      'validation-report.json',
      'deduplication-report.json'
    ];
  }
}

export default MasterAustralianScraper;