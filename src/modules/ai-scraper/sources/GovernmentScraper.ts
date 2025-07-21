/**
 * Government Data Source Scraper
 * 
 * Specialized scraper for Australian government databases and service directories
 */

import { BaseScraper } from '../core/BaseScraper';
import type {
  OrganizationProfile,
  QualityFlag,
  DataSource,
  ServiceCategory,
  TargetDemographic,
  AgeRange
} from '../types';

export class GovernmentScraper extends BaseScraper {
  
  /**
   * Discover organization URLs from government data sources
   */
  async discoverOrganizationUrls(): Promise<string[]> {
    const urls: string[] = [];

    switch (this.dataSource.name) {
      case 'data.gov.au':
        urls.push(...await this.discoverFromDataGovAu());
        break;
      case 'NSW Community Services':
        urls.push(...await this.discoverFromNSWServices());
        break;
      case 'QLD Youth Justice':
        urls.push(...await this.discoverFromQLDYouthJustice());
        break;
      case 'VIC Human Services':
        urls.push(...await this.discoverFromVICServices());
        break;
      case 'Legal Aid Directories':
        urls.push(...await this.discoverFromLegalAid());
        break;
      default:
        urls.push(...await this.discoverGenericGovernment());
    }

    return [...new Set(urls)]; // Remove duplicates
  }

  /**
   * Extract organization data from government websites
   */
  async extractOrganizationData(url: string): Promise<Partial<OrganizationProfile>> {
    try {
      // Extract content using Firecrawl for intelligent parsing
      const { content, metadata } = await this.extractContentWithFirecrawl(url);
      
      // Use AI to extract structured data with government-specific prompts
      const extractionResult = await this.extractWithAI(
        content,
        [
          'organization_profile',
          'service_catalog',
          'contact_information',
          'geographical_coverage',
          'target_demographics'
        ],
        'auto'
      );

      // Post-process for government-specific data patterns
      const processedData = this.postProcessGovernmentData(extractionResult.extracted_data, url, metadata);
      
      return {
        ...processedData,
        metadata: {
          source_type: this.dataSource.type,
          discovery_method: 'direct_crawl',
          extraction_method: 'ai_guided',
          scraping_timestamp: new Date(),
          ai_processing_version: '1.0',
          confidence_scores: extractionResult.confidence_scores,
          validation_status: 'ai_validated',
          data_lineage: [{
            source_url: url,
            extraction_timestamp: new Date(),
            ai_model_used: extractionResult.ai_model_used,
            human_validated: false
          }]
        }
      };

    } catch (error) {
      console.error(`Failed to extract data from ${url}:`, error);
      throw error;
    }
  }

  /**
   * Validate extracted data with government-specific rules
   */
  async validateExtractedData(data: Partial<OrganizationProfile>): Promise<QualityFlag[]> {
    const flags: QualityFlag[] = [];

    // Government organization validation rules
    
    // 1. Name validation
    if (!data.name || data.name.length < 3) {
      flags.push({
        type: 'completeness',
        severity: 'critical',
        description: 'Organization name is missing or too short',
        suggested_action: 'Manual review required',
        auto_resolvable: false
      });
    }

    // 2. Government domain validation
    if (data.website_url && !this.isGovernmentDomain(data.website_url)) {
      flags.push({
        type: 'accuracy',
        severity: 'medium',
        description: 'Website URL does not appear to be an official government domain',
        suggested_action: 'Verify official status',
        auto_resolvable: false
      });
    }

    // 3. Contact information validation
    if (!data.email && !data.phone) {
      flags.push({
        type: 'completeness',
        severity: 'high',
        description: 'No contact information (email or phone) found',
        suggested_action: 'Search for contact details on main website',
        auto_resolvable: true
      });
    }

    // 4. Service relevance validation
    if (!data.services || data.services.length === 0) {
      flags.push({
        type: 'relevance',
        severity: 'medium',
        description: 'No services identified for youth justice context',
        suggested_action: 'Review organization relevance',
        auto_resolvable: false
      });
    }

    // 5. Government-specific service categories
    if (data.services) {
      const youthJusticeServices = data.services.filter(service => 
        this.isYouthJusticeRelevant(service.description || '')
      );
      
      if (youthJusticeServices.length === 0) {
        flags.push({
          type: 'relevance',
          severity: 'high',
          description: 'No youth justice relevant services identified',
          suggested_action: 'Verify organization focus area',
          auto_resolvable: false
        });
      }
    }

    // 6. Address and geographical coverage
    if (!data.address && !data.geographical_coverage) {
      flags.push({
        type: 'completeness',
        severity: 'medium',
        description: 'No geographical information found',
        suggested_action: 'Extract location data from website',
        auto_resolvable: true
      });
    }

    return flags;
  }

  /**
   * Government data source discovery methods
   */
  
  private async discoverFromDataGovAu(): Promise<string[]> {
    const urls: string[] = [];
    
    // Search data.gov.au for youth justice datasets
    const searchTerms = [
      'youth justice',
      'legal aid',
      'community services',
      'juvenile justice',
      'youth programs',
      'criminal justice services'
    ];

    for (const term of searchTerms) {
      try {
        const searchUrl = `https://data.gov.au/data/dataset?q=${encodeURIComponent(term)}&sort=extras_harvest_portal+asc%2C+score+desc`;
        const { content } = await this.extractContentWithFirecrawl(searchUrl);
        
        // Extract dataset URLs that might contain organization information
        const datasetUrls = this.extractDatasetUrls(content);
        urls.push(...datasetUrls);
        
      } catch (error) {
        console.error(`Failed to search data.gov.au for term: ${term}`, error);
      }
    }

    return urls;
  }

  private async discoverFromNSWServices(): Promise<string[]> {
    const baseUrls = [
      'https://www.facs.nsw.gov.au/families/Protecting-kids/child-protection/Pages/community-services.aspx',
      'https://www.dcj.nsw.gov.au/service-providers',
      'https://www.legalaid.nsw.gov.au/get-legal-help',
      'https://www.youthlaw.asn.au/nsw-resources'
    ];

    const urls: string[] = [];
    
    for (const baseUrl of baseUrls) {
      try {
        const { content } = await this.extractContentWithFirecrawl(baseUrl);
        
        // Extract service provider and organization links
        const orgUrls = this.extractOrganizationUrls(content, 'NSW');
        urls.push(...orgUrls);
        
      } catch (error) {
        console.error(`Failed to discover from NSW services: ${baseUrl}`, error);
      }
    }

    return urls;
  }

  private async discoverFromQLDYouthJustice(): Promise<string[]> {
    const baseUrls = [
      'https://www.youthjustice.qld.gov.au/about-us/our-partners',
      'https://www.csyw.qld.gov.au/youth/youth-justice',
      'https://www.legalaid.qld.gov.au/Find-legal-help',
      'https://www.qld.gov.au/community/getting-support-health-social-issue/support-victims-crime'
    ];

    const urls: string[] = [];
    
    for (const baseUrl of baseUrls) {
      try {
        const { content } = await this.extractContentWithFirecrawl(baseUrl);
        const orgUrls = this.extractOrganizationUrls(content, 'QLD');
        urls.push(...orgUrls);
      } catch (error) {
        console.error(`Failed to discover from QLD youth justice: ${baseUrl}`, error);
      }
    }

    return urls;
  }

  private async discoverFromVICServices(): Promise<string[]> {
    const baseUrls = [
      'https://services.dhhs.vic.gov.au/youth-justice',
      'https://www.legalaid.vic.gov.au/find-legal-answers',
      'https://www.vic.gov.au/youth-services',
      'https://www.dffh.vic.gov.au/youth-justice-community-support'
    ];

    const urls: string[] = [];
    
    for (const baseUrl of baseUrls) {
      try {
        const { content } = await this.extractContentWithFirecrawl(baseUrl);
        const orgUrls = this.extractOrganizationUrls(content, 'VIC');
        urls.push(...orgUrls);
      } catch (error) {
        console.error(`Failed to discover from VIC services: ${baseUrl}`, error);
      }
    }

    return urls;
  }

  private async discoverFromLegalAid(): Promise<string[]> {
    const legalAidUrls = [
      'https://www.legalaid.nsw.gov.au/',
      'https://www.legalaid.qld.gov.au/',
      'https://www.legalaid.vic.gov.au/',
      'https://www.legalaidwa.org.au/',
      'https://www.legalaidsa.org.au/',
      'https://www.legalaid.tas.gov.au/',
      'https://www.legalaidact.org.au/',
      'https://www.ntlac.nt.gov.au/'
    ];

    const urls: string[] = [];
    
    for (const legalAidUrl of legalAidUrls) {
      try {
        const { content } = await this.extractContentWithFirecrawl(legalAidUrl);
        
        // Look for youth-specific services and referral networks
        const youthServiceUrls = this.extractYouthLegalServiceUrls(content);
        urls.push(...youthServiceUrls);
        
      } catch (error) {
        console.error(`Failed to discover from legal aid: ${legalAidUrl}`, error);
      }
    }

    return urls;
  }

  private async discoverGenericGovernment(): Promise<string[]> {
    // Fallback discovery for other government sources
    const searchPatterns = [
      '/youth-services',
      '/community-services',
      '/legal-services',
      '/support-services',
      '/service-providers'
    ];

    const urls: string[] = [];
    const baseUrl = new URL(this.dataSource.base_url);
    
    for (const pattern of searchPatterns) {
      try {
        const testUrl = `${baseUrl.origin}${pattern}`;
        const { content } = await this.extractContentWithFirecrawl(testUrl);
        
        if (content.length > 1000) { // Assume meaningful content
          const orgUrls = this.extractOrganizationUrls(content);
          urls.push(...orgUrls);
        }
        
      } catch (error) {
        // Silently fail for pattern testing
      }
    }

    return urls;
  }

  /**
   * Content extraction utilities
   */
  
  private extractDatasetUrls(content: string): string[] {
    const urls: string[] = [];
    
    // Look for dataset links that might contain organization directories
    const datasetPattern = /href="([^"]*\/dataset\/[^"]*(?:youth|legal|community|justice|service)[^"]*)"/gi;
    let match;
    
    while ((match = datasetPattern.exec(content)) !== null) {
      urls.push(this.normalizeUrl(match[1]));
    }

    return urls;
  }

  private extractOrganizationUrls(content: string, state?: string): string[] {
    const urls: string[] = [];
    
    // Patterns for organization and service provider links
    const patterns = [
      /href="([^"]*(?:service|provider|organization|legal|youth|community)[^"]*)"/gi,
      /href="([^"]*\.(?:org|com|gov)\.au[^"]*)"/gi,
      /href="([^"]*\/contact[^"]*)"/gi,
      /href="([^"]*\/about[^"]*)"/gi,
      /href="([^"]*\/services[^"]*)"/gi
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const url = this.normalizeUrl(match[1]);
        if (this.isRelevantOrganizationUrl(url, state)) {
          urls.push(url);
        }
      }
    }

    return [...new Set(urls)]; // Remove duplicates
  }

  private extractYouthLegalServiceUrls(content: string): string[] {
    const urls: string[] = [];
    
    // Look for youth-specific legal services
    const youthPatterns = [
      /href="([^"]*youth[^"]*)"/gi,
      /href="([^"]*juvenile[^"]*)"/gi,
      /href="([^"]*young[^"]*)"/gi,
      /href="([^"]*children[^"]*)"/gi
    ];

    for (const pattern of youthPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        urls.push(this.normalizeUrl(match[1]));
      }
    }

    return urls;
  }

  /**
   * Data processing utilities
   */
  
  private postProcessGovernmentData(
    data: any,
    sourceUrl: string,
    metadata: any
  ): Partial<OrganizationProfile> {
    
    // Enhance government data with domain-specific processing
    const processed = { ...data };

    // Standardize government organization names
    if (processed.name) {
      processed.name = this.standardizeGovernmentName(processed.name);
    }

    // Categorize services for government context
    if (processed.services) {
      processed.services = processed.services.map((service: any) => ({
        ...service,
        category: this.categorizeGovernmentService(service.description || service.name || ''),
        funding_source: {
          type: 'government',
          source_name: this.extractGovernmentDepartment(sourceUrl)
        }
      }));
    }

    // Set target demographics for government services
    if (!processed.target_demographics) {
      processed.target_demographics = this.inferGovernmentTargetDemographics(processed.services || []);
    }

    // Set geographical coverage based on government level
    if (!processed.geographical_coverage) {
      processed.geographical_coverage = this.inferGovernmentCoverage(sourceUrl);
    }

    // Add government-specific metadata
    processed.funding_sources = processed.funding_sources || [];
    if (!processed.funding_sources.some((f: any) => f.type === 'government')) {
      processed.funding_sources.push({
        type: 'government',
        source_name: this.extractGovernmentDepartment(sourceUrl)
      });
    }

    return processed;
  }

  private standardizeGovernmentName(name: string): string {
    // Remove common government prefixes/suffixes for cleaner names
    return name
      .replace(/^(Department of|Ministry of|Office of|Bureau of)\s+/i, '')
      .replace(/\s+(Department|Ministry|Office|Bureau)$/i, '')
      .replace(/\s+(NSW|QLD|VIC|WA|SA|TAS|ACT|NT)$/i, ' ($1)')
      .trim();
  }

  private categorizeGovernmentService(description: string): ServiceCategory {
    const text = description.toLowerCase();
    
    if (text.includes('legal') || text.includes('court') || text.includes('lawyer')) {
      return ServiceCategory.LEGAL_SUPPORT;
    }
    if (text.includes('housing') || text.includes('accommodation')) {
      return ServiceCategory.HOUSING_SUPPORT;
    }
    if (text.includes('mental health') || text.includes('counselling')) {
      return ServiceCategory.MENTAL_HEALTH;
    }
    if (text.includes('education') || text.includes('training')) {
      return ServiceCategory.EDUCATION_TRAINING;
    }
    if (text.includes('employment') || text.includes('job')) {
      return ServiceCategory.EMPLOYMENT_SUPPORT;
    }
    if (text.includes('family') || text.includes('parent')) {
      return ServiceCategory.FAMILY_SUPPORT;
    }
    if (text.includes('substance') || text.includes('alcohol') || text.includes('drug')) {
      return ServiceCategory.SUBSTANCE_ABUSE;
    }
    if (text.includes('crisis') || text.includes('emergency')) {
      return ServiceCategory.CRISIS_INTERVENTION;
    }
    if (text.includes('advocacy') || text.includes('rights')) {
      return ServiceCategory.ADVOCACY;
    }
    
    return ServiceCategory.LEGAL_SUPPORT; // Default for government services
  }

  private inferGovernmentTargetDemographics(services: any[]): TargetDemographic[] {
    const demographics: TargetDemographic[] = [];
    
    // Analyze services to infer target demographics
    const serviceText = services.map(s => (s.description || '').toLowerCase()).join(' ');
    
    if (serviceText.includes('youth') || serviceText.includes('juvenile') || serviceText.includes('young')) {
      demographics.push({
        age_range: AgeRange.YOUTH,
        legal_status: ['involved_with_justice_system', 'at_risk']
      });
    }

    if (serviceText.includes('indigenous') || serviceText.includes('aboriginal') || serviceText.includes('torres strait')) {
      demographics.push({
        cultural_background: ['Indigenous Australian'],
        age_range: AgeRange.YOUTH
      });
    }

    // Default government service demographics
    if (demographics.length === 0) {
      demographics.push({
        age_range: AgeRange.ALL_AGES,
        legal_status: ['general_public']
      });
    }

    return demographics;
  }

  private inferGovernmentCoverage(sourceUrl: string): any {
    const url = sourceUrl.toLowerCase();
    
    if (url.includes('.gov.au')) {
      if (url.includes('nsw')) {
        return { type: 'state', boundaries: { states: ['NSW'] } };
      }
      if (url.includes('qld')) {
        return { type: 'state', boundaries: { states: ['QLD'] } };
      }
      if (url.includes('vic')) {
        return { type: 'state', boundaries: { states: ['VIC'] } };
      }
      if (url.includes('wa')) {
        return { type: 'state', boundaries: { states: ['WA'] } };
      }
      if (url.includes('sa')) {
        return { type: 'state', boundaries: { states: ['SA'] } };
      }
      if (url.includes('tas')) {
        return { type: 'state', boundaries: { states: ['TAS'] } };
      }
      if (url.includes('act')) {
        return { type: 'state', boundaries: { states: ['ACT'] } };
      }
      if (url.includes('nt')) {
        return { type: 'state', boundaries: { states: ['NT'] } };
      }
      
      // Federal government
      return { type: 'national', boundaries: { states: ['NSW', 'QLD', 'VIC', 'WA', 'SA', 'TAS', 'ACT', 'NT'] } };
    }

    return { type: 'local' };
  }

  private extractGovernmentDepartment(url: string): string {
    const urlParts = new URL(url).hostname.split('.');
    
    // Extract department from subdomain
    if (urlParts.length >= 3) {
      const subdomain = urlParts[0];
      
      // Common government department patterns
      const deptMappings: Record<string, string> = {
        'facs': 'Family and Community Services',
        'dcj': 'Department of Communities and Justice',
        'csyw': 'Child Safety, Youth and Women',
        'dffh': 'Department of Families, Fairness and Housing',
        'dhhs': 'Department of Health and Human Services',
        'youthjustice': 'Youth Justice Department',
        'legalaid': 'Legal Aid Commission'
      };

      return deptMappings[subdomain] || `${subdomain.toUpperCase()} Department`;
    }

    return 'Government Agency';
  }

  /**
   * Validation utilities
   */
  
  private isGovernmentDomain(url: string): boolean {
    try {
      const domain = new URL(url).hostname.toLowerCase();
      return domain.endsWith('.gov.au') || 
             domain.endsWith('.edu.au') ||
             domain.includes('legalaid') ||
             domain.includes('ombudsman') ||
             domain.includes('courts');
    } catch {
      return false;
    }
  }

  private isYouthJusticeRelevant(description: string): boolean {
    const relevantTerms = [
      'youth', 'juvenile', 'young people', 'adolescent',
      'legal aid', 'court', 'justice', 'legal support',
      'criminal law', 'family law', 'child protection',
      'counselling', 'mental health', 'substance abuse',
      'housing support', 'education support', 'employment'
    ];

    const text = description.toLowerCase();
    return relevantTerms.some(term => text.includes(term));
  }

  private isRelevantOrganizationUrl(url: string, state?: string): boolean {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.toLowerCase();
      const domain = urlObj.hostname.toLowerCase();

      // Skip irrelevant paths
      const skipPatterns = [
        '/privacy', '/terms', '/sitemap', '/search',
        '/news', '/media', '/events', '/careers'
      ];

      if (skipPatterns.some(pattern => path.includes(pattern))) {
        return false;
      }

      // Include relevant domains and paths
      const relevantPatterns = [
        'youth', 'legal', 'community', 'service', 'support',
        'justice', 'court', 'aid', 'help', 'contact', 'about'
      ];

      const urlText = `${domain} ${path}`;
      return relevantPatterns.some(pattern => urlText.includes(pattern));

    } catch {
      return false;
    }
  }

  private normalizeUrl(url: string): string {
    try {
      // Handle relative URLs
      if (url.startsWith('/')) {
        const baseUrl = new URL(this.dataSource.base_url);
        return `${baseUrl.origin}${url}`;
      }
      
      // Handle protocol-relative URLs
      if (url.startsWith('//')) {
        return `https:${url}`;
      }
      
      // Return absolute URLs as-is
      if (url.startsWith('http')) {
        return url;
      }
      
      // Handle other relative URLs
      const baseUrl = new URL(this.dataSource.base_url);
      return new URL(url, baseUrl.origin).href;
      
    } catch {
      return url;
    }
  }
}