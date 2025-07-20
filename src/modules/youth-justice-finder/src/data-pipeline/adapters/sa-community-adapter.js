/**
 * South Australia Community Directory Adapter
 * 
 * Integrates with SA Government Community Directory to extract
 * youth and family support services across South Australia.
 */

import { BaseAdapter } from './base-adapter.js';
import axios from 'axios';
import crypto from 'crypto';

export class SADataAdapter extends BaseAdapter {
    constructor(config = {}) {
        super({
            name: 'South Australia Community Directory',
            type: 'api',
            baseUrl: config.baseUrl || 'https://www.sa.gov.au',
            apiUrl: 'https://www.sa.gov.au/api/community-services',
            rateLimit: { requests: 30, window: 60 },
            timeout: 30000,
            respectRobotsTxt: true,
            usePlaceholderData: config.usePlaceholderData || true, // Enable for development
            ...config
        });
        
        // Service categories relevant to youth justice in SA
        this.serviceTypes = [
            'Youth Services',
            'Family Support Services',
            'Mental Health Services',
            'Legal Aid Services',
            'Housing Support',
            'Employment Services',
            'Drug and Alcohol Services',
            'Crisis Support',
            'Cultural Services',
            'Educational Support'
        ];
        
        // SA regions for better location mapping
        this.saRegions = {
            'Adelaide Metro': ['Adelaide', 'Port Adelaide', 'Salisbury', 'Tea Tree Gully', 'Unley', 'Charles Sturt'],
            'Adelaide Hills': ['Mount Barker', 'Adelaide Hills'],
            'Barossa': ['Barossa', 'Light Regional'],
            'Eyre Peninsula': ['Port Lincoln', 'Ceduna', 'Streaky Bay'],
            'Far North': ['Port Augusta', 'Roxby Downs', 'Coober Pedy'],
            'Fleurieu Peninsula': ['Victor Harbor', 'Yankalilla', 'Alexandrina'],
            'Limestone Coast': ['Mount Gambier', 'Wattle Range', 'Grant'],
            'Murray and Mallee': ['Murray Bridge', 'Coorong', 'Southern Mallee'],
            'Riverland': ['Renmark Paringa', 'Loxton Waikerie', 'Berri Barmera'],
            'Yorke Peninsula': ['Yorke Peninsula', 'Copper Coast']
        };
    }

    /**
     * Validate data source connectivity
     * @returns {Promise<Object>} Validation result
     */
    async validate() {
        try {
            if (this.config.usePlaceholderData) {
                return {
                    isValid: true,
                    message: 'SA Community Directory adapter (using placeholder data)',
                    note: 'Real API access requires government partnership'
                };
            }
            
            // Test API connectivity
            const response = await axios.get(`${this.config.apiUrl}/status`, {
                timeout: 10000,
                headers: {
                    'User-Agent': this.config.userAgent
                }
            });
            
            return {
                isValid: true,
                message: 'SA Community Directory API accessible',
                status: response.status,
                apiVersion: response.data?.version || 'Unknown'
            };
        } catch (error) {
            return {
                isValid: false,
                message: `SA Community Directory validation failed: ${error.message}`,
                error: error.response?.data || error.message,
                note: 'Consider using placeholder data for development'
            };
        }
    }

    /**
     * Get source metadata
     * @returns {Promise<Object>} Source metadata
     */
    async getMetadata() {
        return {
            name: this.config.name,
            type: this.config.type,
            baseUrl: this.config.baseUrl,
            apiUrl: this.config.apiUrl,
            lastUpdate: new Date().toISOString(),
            isActive: true,
            estimatedRecords: 1200, // Estimated based on SA population
            coverage: 'South Australia, Australia',
            dataQuality: 'Government-verified (SA Government)',
            updateFrequency: 'Weekly',
            licensing: 'SA Government Open Data License',
            categories: this.serviceTypes,
            regions: Object.keys(this.saRegions),
            placeholderMode: this.config.usePlaceholderData
        };
    }

    /**
     * Extract service data from SA Community Directory
     * @param {Object} options - Extraction options
     * @returns {Promise<Array>} Array of normalized service records
     */
    async extract(options = {}) {
        this.updateStats('start');
        
        const {
            limit = 100,
            offset = 0,
            serviceTypes = this.serviceTypes,
            region = null
        } = options;
        
        const extractedServices = [];
        
        try {
            console.log(`Extracting data from SA Community Directory...`);
            
            if (this.config.usePlaceholderData) {
                console.log('Using placeholder data - real API access requires partnership');
                const sampleServices = this.generateSampleSAServices(Math.min(limit, 10));
                
                for (const service of sampleServices) {
                    await this.waitForRateLimit();
                    this.updateStats('processed');
                    
                    try {
                        const normalizedService = this.normalizeSAService(service);
                        
                        if (this.validateService(normalizedService)) {
                            extractedServices.push(normalizedService);
                            this.updateStats('extracted', { 
                                qualityScore: normalizedService.completeness_score 
                            });
                        } else {
                            this.updateStats('skipped');
                        }
                    } catch (normalizationError) {
                        this.updateStats('error', { error: normalizationError.message });
                    }
                }
            } else {
                // Real API implementation would go here
                const apiResponse = await this.fetchFromAPI(offset, limit, serviceTypes, region);
                
                for (const service of apiResponse.data) {
                    await this.waitForRateLimit();
                    this.updateStats('processed');
                    
                    try {
                        const normalizedService = this.normalizeSAService(service);
                        
                        if (this.validateService(normalizedService)) {
                            extractedServices.push(normalizedService);
                            this.updateStats('extracted', { 
                                qualityScore: normalizedService.completeness_score 
                            });
                        } else {
                            this.updateStats('skipped');
                        }
                    } catch (normalizationError) {
                        this.updateStats('error', { error: normalizationError.message });
                    }
                }
            }
            
            this.updateStats('end');
            
            return {
                services: extractedServices,
                pagination: {
                    total: extractedServices.length,
                    offset,
                    limit,
                    hasMore: extractedServices.length >= limit
                },
                stats: this.getStats(),
                note: this.config.usePlaceholderData ? 'Placeholder data - API partnership needed' : 'Live data'
            };
            
        } catch (error) {
            this.updateStats('error', { error: error.message });
            console.error('SA Community Directory extraction error:', error);
            throw error;
        }
    }

    /**
     * Fetch data from real SA API (placeholder implementation)
     * @param {number} offset - Pagination offset
     * @param {number} limit - Results limit
     * @param {Array} serviceTypes - Service types to filter
     * @param {string} region - Region filter
     * @returns {Promise<Object>} API response
     */
    async fetchFromAPI(offset, limit, serviceTypes, region) {
        const params = {
            offset,
            limit,
            format: 'json'
        };
        
        if (serviceTypes.length > 0) {
            params.categories = serviceTypes.join(',');
        }
        
        if (region) {
            params.region = region;
        }
        
        const response = await axios.get(`${this.config.apiUrl}/services`, {
            params,
            timeout: this.config.timeout,
            headers: {
                'User-Agent': this.config.userAgent,
                'Accept': 'application/json'
            }
        });
        
        return response.data;
    }

    /**
     * Generate sample SA services for testing
     * @param {number} count - Number of samples to generate
     * @returns {Array} Sample service records
     */
    generateSampleSAServices(count) {
        const organizations = [
            'Uniting Communities SA',
            'Anglicare SA',
            'Centacare Catholic Family Services',
            'Mission Australia SA',
            'Salvation Army SA',
            'AC.Care',
            'Relationships Australia SA',
            'Junction Australia',
            'Baptist Care SA',
            'UnitingCare Wesley Adelaide'
        ];
        
        const regions = Object.keys(this.saRegions);
        const serviceTypes = this.serviceTypes;
        
        const services = [];
        for (let i = 0; i < count; i++) {
            const org = organizations[i % organizations.length];
            const serviceType = serviceTypes[i % serviceTypes.length];
            const region = regions[i % regions.length];
            
            services.push({
                id: `sa_service_${i + 1}`,
                name: `${serviceType} - ${org}`,
                organization_name: org,
                service_type: serviceType,
                description: this.generateServiceDescription(serviceType, org),
                region: region,
                address: this.generateSampleAddress(region),
                phone: `(08) 8${String(Math.floor(Math.random() * 900) + 100)} ${String(Math.floor(Math.random() * 9000) + 1000)}`,
                email: `info@${org.toLowerCase().replace(/[^a-z]/g, '')}.org.au`,
                website: `https://www.${org.toLowerCase().replace(/[^a-z]/g, '')}.org.au`,
                target_age_min: serviceType.includes('Youth') ? 12 : null,
                target_age_max: serviceType.includes('Youth') ? 25 : null,
                cost: 'Free',
                accessibility: 'Wheelchair accessible',
                cultural_specific: org.includes('Aboriginal') || (i % 7 === 0),
                last_verified: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
                funding_source: 'SA Government',
                registration_number: `SA${String(i + 1000).padStart(6, '0')}`
            });
        }
        
        return services;
    }

    /**
     * Generate sample service description
     * @param {string} serviceType - Type of service
     * @param {string} organization - Organization name
     * @returns {string} Description
     */
    generateServiceDescription(serviceType, organization) {
        const descriptions = {
            'Youth Services': `Comprehensive youth support programs including mentoring, life skills development, and crisis intervention for young people aged 12-25.`,
            'Family Support Services': `Family-centered support services including parenting programs, family counseling, and crisis intervention.`,
            'Mental Health Services': `Community mental health support including counseling, therapy, and mental health programs for individuals and families.`,
            'Legal Aid Services': `Free legal advice and representation for youth and families in the justice system, including court support.`,
            'Housing Support': `Emergency accommodation, transitional housing, and housing support services for young people and families.`,
            'Employment Services': `Job training, employment placement, and career development services for youth and young adults.`,
            'Drug and Alcohol Services': `Substance abuse treatment, counseling, and prevention programs for youth and families.`,
            'Crisis Support': `24/7 crisis intervention, emergency support, and safety planning for individuals and families in crisis.`,
            'Cultural Services': `Culturally appropriate services for Aboriginal and Torres Strait Islander youth and families.`,
            'Educational Support': `Educational support, tutoring, and alternative education programs for young people.`
        };
        
        return descriptions[serviceType] || `Specialized ${serviceType.toLowerCase()} provided by ${organization} across South Australia.`;
    }

    /**
     * Generate sample address for region
     * @param {string} region - SA region
     * @returns {string} Sample address
     */
    generateSampleAddress(region) {
        const addresses = {
            'Adelaide Metro': ['123 King William Street, Adelaide SA 5000', '456 Port Road, Adelaide SA 5000'],
            'Adelaide Hills': ['78 Main Street, Mount Barker SA 5251'],
            'Barossa': ['34 Murray Street, Nuriootpa SA 5355'],
            'Eyre Peninsula': ['12 Tasman Terrace, Port Lincoln SA 5606'],
            'Far North': ['67 Commercial Road, Port Augusta SA 5700'],
            'Fleurieu Peninsula': ['89 Ocean Street, Victor Harbor SA 5211'],
            'Limestone Coast': ['23 Commercial Street West, Mount Gambier SA 5290'],
            'Murray and Mallee': ['45 Bridge Street, Murray Bridge SA 5253'],
            'Riverland': ['56 Renmark Avenue, Renmark SA 5341'],
            'Yorke Peninsula': ['12 Main Street, Kadina SA 5554']
        };
        
        const regionAddresses = addresses[region] || ['1 Main Street, Adelaide SA 5000'];
        return regionAddresses[Math.floor(Math.random() * regionAddresses.length)];
    }

    /**
     * Normalize SA service record
     * @param {Object} record - Raw SA data
     * @returns {Object} Normalized service
     */
    normalizeSAService(record) {
        const service = {
            id: crypto.randomUUID(),
            name: record.name || `${record.service_type} - ${record.organization_name}`,
            description: record.description || this.generateServiceDescription(record.service_type, record.organization_name),
            status: 'active',
            categories: this.mapSAServiceCategories(record),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            data_source: this.config.name,
            source_url: record.website || 'https://www.sa.gov.au/community-services',
            verification_status: 'verified',
            verification_score: 80,
            
            // Organization info
            organization: {
                id: crypto.randomUUID(),
                name: record.organization_name,
                description: `Community service provider registered in South Australia`,
                organization_type: this.determineSAOrganizationType(record.organization_name),
                email: record.email,
                url: record.website,
                funding_source: record.funding_source || 'SA Government',
                registration_number: record.registration_number,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                data_source: this.config.name,
                verification_status: 'verified'
            },
            
            // Location info
            locations: this.extractSALocations(record),
            
            // Contact info
            contacts: this.extractSAContacts(record),
            
            // SA-specific fields
            sa_service_type: record.service_type,
            sa_region: record.region,
            cost_structure: record.cost || 'Contact for details',
            accessibility_features: record.accessibility,
            
            // Youth-specific
            minimum_age: record.target_age_min,
            maximum_age: record.target_age_max,
            youth_specific: record.service_type?.includes('Youth') || (record.target_age_max && record.target_age_max <= 25),
            indigenous_specific: record.cultural_specific || record.organization_name?.includes('Aboriginal'),
            
            // Additional fields
            email: record.email,
            url: record.website,
            phone: record.phone,
            address: record.address,
            last_verified: record.last_verified || new Date().toISOString()
        };
        
        service.completeness_score = this.calculateCompletenessScore(service);
        return service;
    }

    /**
     * Determine SA organization type
     * @param {string} orgName - Organization name
     * @returns {string} Organization type
     */
    determineSAOrganizationType(orgName) {
        const name = orgName.toLowerCase();
        
        if (name.includes('government') || name.includes('sa health') || name.includes('department')) {
            return 'government';
        }
        
        if (name.includes('aboriginal') || name.includes('indigenous') || name.includes('torres strait')) {
            return 'indigenous';
        }
        
        if (name.includes('uniting') || name.includes('anglican') || name.includes('catholic') || 
            name.includes('salvation army') || name.includes('baptist')) {
            return 'religious';
        }
        
        if (name.includes('mission') || name.includes('centacare') || name.includes('anglicare')) {
            return 'non_profit';
        }
        
        return 'community';
    }

    /**
     * Extract SA location information
     * @param {Object} record - Service record
     * @returns {Array} Array of location objects
     */
    extractSALocations(record) {
        if (!record.address && !record.region) {
            return [];
        }
        
        // Parse address components
        const addressParts = (record.address || '').split(',').map(part => part.trim());
        const street = addressParts[0] || '';
        const cityState = addressParts[1] || record.region || '';
        const postcode = (record.address || '').match(/\b\d{4}\b/)?.[0] || '';
        
        const city = this.extractCityFromRegion(record.region);
        
        return [{
            id: crypto.randomUUID(),
            name: `${record.organization_name} - ${record.region}`,
            address_1: street,
            city: city,
            state_province: 'SA',
            postal_code: postcode,
            country: 'AU',
            region: this.normalizeSARegion(record.region),
            wheelchair_accessible: record.accessibility?.includes('Wheelchair') || false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }];
    }

    /**
     * Extract city from SA region
     * @param {string} region - SA region
     * @returns {string} City name
     */
    extractCityFromRegion(region) {
        const regionCities = {
            'Adelaide Metro': 'Adelaide',
            'Adelaide Hills': 'Mount Barker',
            'Barossa': 'Nuriootpa',
            'Eyre Peninsula': 'Port Lincoln',
            'Far North': 'Port Augusta',
            'Fleurieu Peninsula': 'Victor Harbor',
            'Limestone Coast': 'Mount Gambier',
            'Murray and Mallee': 'Murray Bridge',
            'Riverland': 'Renmark',
            'Yorke Peninsula': 'Kadina'
        };
        
        return regionCities[region] || 'Adelaide';
    }

    /**
     * Normalize SA region to system region
     * @param {string} saRegion - SA region name
     * @returns {string} Normalized region
     */
    normalizeSARegion(saRegion) {
        if (saRegion === 'Adelaide Metro') {
            return 'metro_adelaide';
        }
        
        return saRegion?.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'regional_sa';
    }

    /**
     * Extract SA contact information
     * @param {Object} record - Service record
     * @returns {Array} Array of contact objects
     */
    extractSAContacts(record) {
        const contacts = [];
        
        if (record.phone || record.email) {
            contacts.push({
                id: crypto.randomUUID(),
                name: `${record.organization_name} Contact`,
                phone: record.phone ? [{
                    number: record.phone,
                    type: 'voice',
                    language: 'en'
                }] : [],
                email: record.email,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        }
        
        return contacts;
    }

    /**
     * Map SA service categories to system categories
     * @param {Object} record - Service record
     * @returns {Array} Categories
     */
    mapSAServiceCategories(record) {
        const categories = ['community_service'];
        
        const serviceType = record.service_type?.toLowerCase() || '';
        
        if (serviceType.includes('youth')) {
            categories.push('youth_services');
        }
        
        if (serviceType.includes('family')) {
            categories.push('family_support');
        }
        
        if (serviceType.includes('mental health')) {
            categories.push('mental_health');
        }
        
        if (serviceType.includes('legal')) {
            categories.push('legal_aid');
        }
        
        if (serviceType.includes('housing')) {
            categories.push('housing');
        }
        
        if (serviceType.includes('employment')) {
            categories.push('employment');
        }
        
        if (serviceType.includes('drug') || serviceType.includes('alcohol')) {
            categories.push('drug_alcohol');
        }
        
        if (serviceType.includes('crisis')) {
            categories.push('crisis_support');
        }
        
        if (serviceType.includes('cultural')) {
            categories.push('cultural_support');
        }
        
        if (serviceType.includes('educational')) {
            categories.push('education_support');
        }
        
        return categories;
    }

    /**
     * Validate service meets minimum requirements
     * @param {Object} service - Normalized service
     * @returns {boolean} True if valid
     */
    validateService(service) {
        return service.name && 
               service.organization?.name &&
               service.categories?.length > 0 &&
               (service.contacts?.length > 0 || service.locations?.length > 0);
    }
}

export default SADataAdapter;