/**
 * ACNC Charity Register Adapter
 * 
 * Integrates with the Australian Charities and Not-for-profits Commission
 * Charity Register via the official government data.gov.au API.
 * 
 * This provides access to ALL 60,000+ registered Australian charities
 * with completely legitimate, unrestricted access.
 */

import { BaseAdapter } from './base-adapter.js';
import axios from 'axios';
import crypto from 'crypto';

export class ACNCAdapter extends BaseAdapter {
    constructor(config = {}) {
        super({
            name: 'ACNC Charity Register',
            type: 'api',
            baseUrl: config.baseUrl || 'https://data.gov.au/api/3',
            rateLimit: { requests: 100, window: 60 }, // Government API - generous limits
            timeout: 30000,
            respectRobotsTxt: true,
            ...config
        });
        
        this.axios = axios.create({
            baseURL: this.config.baseUrl,
            timeout: this.config.timeout,
            maxRedirects: 5, // Follow redirects
            headers: {
                'User-Agent': 'Youth Justice Service Finder - Public Benefit Service',
                'Accept': 'application/json'
            }
        });
        
        // Youth-relevant charity categories
        this.youthCategories = [
            'Youth Services',
            'Social Services',
            'Education and Training',
            'Mental Health and Crisis Intervention',
            'Law and Legal Services',
            'Housing and Homelessness',
            'Family and Children Services',
            'Community Development',
            'Aboriginal and Torres Strait Islander',
            'Disability Services'
        ];
        
        // Activity classifications relevant to youth justice
        this.relevantActivities = [
            'Social Services',
            'Education',
            'Mental Health Services',
            'Legal Services',
            'Housing Services',
            'Family Support',
            'Youth Development',
            'Community Support'
        ];
    }

    /**
     * Validate API connectivity
     * @returns {Promise<Object>} Validation result
     */
    async validate() {
        try {
            const response = await this.axios.get('/action/package_list', {
                params: { q: 'acnc' }
            });
            
            return {
                isValid: true,
                message: 'ACNC API connection successful',
                datasetsAvailable: response.data.result?.length || 0,
                rateLimit: 'Government API - No restrictions'
            };
        } catch (error) {
            return {
                isValid: false,
                message: `ACNC API validation failed: ${error.message}`,
                error: error.response?.data || error.message
            };
        }
    }

    /**
     * Get source metadata
     * @returns {Promise<Object>} Source metadata
     */
    async getMetadata() {
        try {
            const packageResponse = await this.axios.get('/action/package_show', {
                params: { id: 'acnc-register' }
            });
            
            const packageData = packageResponse.data.result;
            
            return {
                name: this.config.name,
                type: this.config.type,
                baseUrl: this.config.baseUrl,
                lastUpdate: packageData.metadata_modified || new Date().toISOString(),
                isActive: true,
                estimatedRecords: 60000, // Known ACNC registry size
                coverage: 'Australia-wide',
                dataQuality: 'Regulatory-grade (government verified)',
                updateFrequency: 'Real-time (charity reporting)',
                licensing: 'Open Government Data License',
                categories: this.youthCategories
            };
        } catch (error) {
            return {
                name: this.config.name,
                type: this.config.type,
                baseUrl: this.config.baseUrl,
                lastUpdate: new Date().toISOString(),
                isActive: false,
                estimatedRecords: 60000,
                coverage: 'Australia-wide',
                error: error.message
            };
        }
    }

    /**
     * Extract charity data relevant to youth services
     * @param {Object} options - Extraction options
     * @returns {Promise<Array>} Array of normalized service records
     */
    async extract(options = {}) {
        this.updateStats('start');
        
        const {
            limit = 100,
            offset = 0,
            states = ['QLD', 'NSW', 'VIC', 'WA', 'SA', 'TAS', 'ACT', 'NT'],
            categories = this.youthCategories,
            youthOnly = true,
            includeInactive = false
        } = options;
        
        const extractedServices = [];
        
        try {
            console.log(`Extracting charity data from ACNC Register...`);
            
            // Get ACNC charity register dataset (using correct dataset ID)
            const resourceResponse = await this.axios.get('/action/package_show', {
                params: { id: 'acnc-register' }
            });
            
            const resources = resourceResponse.data.result.resources;
            const csvResource = resources.find(r => r.format === 'CSV' || r.url.includes('.csv'));
            
            if (!csvResource) {
                throw new Error('ACNC CSV resource not found');
            }
            
            console.log(`Fetching ACNC data from: ${csvResource.url}`);
            
            // Fetch CSV data with proper redirect handling
            const csvResponse = await axios.get(csvResource.url, {
                responseType: 'text',
                timeout: 60000, // Larger file
                maxRedirects: 5, // Follow redirects
                headers: {
                    'User-Agent': 'Youth Justice Service Finder - Public Benefit Service'
                }
            });
            
            const charities = this.parseACNCCSV(csvResponse.data);
            console.log(`Parsed ${charities.length} charities from ACNC register`);
            
            // Filter for youth-relevant services
            const filteredCharities = charities
                .filter(charity => this.isYouthRelevant(charity))
                .filter(charity => !includeInactive || charity.charity_status === 'Registered')
                .filter(charity => states.length === 0 || states.includes(charity.state))
                .slice(offset, offset + limit);
            
            console.log(`Filtered to ${filteredCharities.length} youth-relevant charities`);
            
            // Convert charities to normalized services
            for (const charity of filteredCharities) {
                this.updateStats('processed');
                
                try {
                    const normalizedService = this.normalizeACNCCharity(charity);
                    
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
            
            this.updateStats('end');
            
            return {
                services: extractedServices,
                pagination: {
                    total: filteredCharities.length,
                    offset,
                    limit,
                    hasMore: false // CSV is complete dataset
                },
                stats: this.getStats()
            };
            
        } catch (error) {
            this.updateStats('error', { error: error.message });
            console.error('ACNC extraction error:', error);
            throw error;
        }
    }

    /**
     * Parse ACNC CSV data
     * @param {string} csvData - Raw CSV content
     * @returns {Array} Parsed charity records
     */
    parseACNCCSV(csvData) {
        const lines = csvData.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const charities = [];
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = this.parseCSVLine(line);
            if (values.length !== headers.length) continue;
            
            const charity = {};
            headers.forEach((header, index) => {
                charity[this.normalizeHeader(header)] = values[index]?.trim().replace(/"/g, '') || '';
            });
            
            charities.push(charity);
        }
        
        return charities;
    }

    /**
     * Parse CSV line handling quoted fields
     * @param {string} line - CSV line
     * @returns {Array} Parsed values
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
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current);
        return values;
    }

    /**
     * Normalize CSV header names
     * @param {string} header - Header name
     * @returns {string} Normalized header
     */
    normalizeHeader(header) {
        return header
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^\w]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
    }

    /**
     * Check if charity is relevant to youth services
     * @param {Object} charity - Charity record
     * @returns {boolean} True if youth-relevant
     */
    isYouthRelevant(charity) {
        // First check if explicitly marked as Youth beneficiary
        if (charity.youth === 'Y') {
            return true;
        }
        
        // Check if serves children or early childhood
        if (charity.children === 'Y' || charity.early_childhood === 'Y') {
            return true;
        }
        
        // Check for youth justice relevant purposes
        const isJusticeRelevant = 
            charity.pre_post_release_offenders === 'Y' ||
            charity.victims_of_crime === 'Y' ||
            charity.promoting_or_protecting_human_rights === 'Y';
            
        // Check for support services relevant to youth justice
        const isSupportService = 
            charity.advancing_social_or_public_welfare === 'Y' ||
            charity.people_at_risk_of_homelessness === 'Y' ||
            charity.people_with_disabilities === 'Y' ||
            charity.families === 'Y' ||
            charity.mentally_disadvantaged === 'Y';
        
        // Check text-based keywords as fallback
        const text = JSON.stringify(charity).toLowerCase();
        const hasYouthKeyword = text.includes('youth') || text.includes('young') || text.includes('teen');
        
        return isJusticeRelevant || isSupportService || hasYouthKeyword;
    }

    /**
     * Normalize ACNC charity to service schema
     * @param {Object} charity - Raw charity data
     * @returns {Object} Normalized service
     */
    normalizeACNCCharity(charity) {
        const service = {
            id: crypto.randomUUID(),
            name: charity.charity_legal_name || 'Unknown Charity',
            description: this.buildCharityDescription(charity),
            status: 'active', // All ACNC registered charities are active
            categories: this.mapCharityCategories(charity),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            data_source: this.config.name,
            source_url: `https://www.acnc.gov.au/charity/${charity.abn}`,
            verification_status: 'verified', // Government registered = verified
            verification_score: 90, // High score for government source
            
            // Organization info
            organization: {
                id: crypto.randomUUID(),
                name: charity.charity_legal_name || 'Unknown Organization',
                description: `ACNC Registered Charity - Size: ${charity.charity_size || 'Unknown'}`,
                organization_type: 'non_profit', // All ACNC charities are non-profit
                tax_id: charity.abn,
                legal_status: 'Registered',
                url: charity.charity_website || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                data_source: this.config.name,
                verification_status: 'verified'
            },
            
            // Location info (if available)
            locations: this.extractCharityLocations(charity),
            
            // Contact info (limited in ACNC data)
            contacts: this.extractCharityContacts(charity),
            
            // Youth-specific detection
            youth_specific: this.isYouthSpecificCharity(charity),
            indigenous_specific: this.isIndigenousCharity(charity),
            
            // Additional ACNC fields
            acnc_registration_date: charity.registration_date,
            acnc_size: charity.charity_size,
            acnc_established_date: charity.date_organisation_established
        };
        
        // Calculate quality score
        service.completeness_score = this.calculateCompletenessScore(service);
        
        return service;
    }

    /**
     * Build description from ACNC data
     * @param {Object} charity - Charity data
     * @returns {string} Service description
     */
    buildCharityDescription(charity) {
        const parts = [];
        
        if (charity.charity_type) {
            parts.push(`${charity.charity_type} organization`);
        }
        
        if (charity.operating_states) {
            parts.push(`Operating in: ${charity.operating_states}`);
        }
        
        if (charity.beneficiaries) {
            parts.push(`Beneficiaries: ${charity.beneficiaries}`);
        }
        
        if (charity.activities) {
            parts.push(`Activities: ${charity.activities}`);
        }
        
        parts.push('Registered with Australian Charities and Not-for-profits Commission (ACNC)');
        
        return parts.join('. ') || 'Registered charity providing community services.';
    }

    /**
     * Map charity categories to our taxonomy
     * @param {Object} charity - Charity data
     * @returns {Array} Service categories
     */
    mapCharityCategories(charity) {
        const categories = [];
        
        // Map based on ACNC purpose columns
        if (charity.advancing_health === 'Y') {
            categories.push('health_services');
        }
        
        if (charity.advancing_education === 'Y') {
            categories.push('education_support');
        }
        
        if (charity.advancing_social_or_public_welfare === 'Y') {
            categories.push('community_service');
        }
        
        if (charity.promoting_or_protecting_human_rights === 'Y') {
            categories.push('legal_aid');
        }
        
        if (charity.people_at_risk_of_homelessness === 'Y') {
            categories.push('housing');
        }
        
        if (charity.families === 'Y') {
            categories.push('family_support');
        }
        
        if (charity.aboriginal_or_tsi === 'Y') {
            categories.push('cultural_support');
        }
        
        if (charity.pre_post_release_offenders === 'Y' || charity.victims_of_crime === 'Y') {
            categories.push('justice_support');
        }
        
        if (charity.people_with_disabilities === 'Y') {
            categories.push('disability_support');
        }
        
        if (charity.youth === 'Y' || charity.children === 'Y' || charity.early_childhood === 'Y') {
            categories.push('youth_services');
        }
        
        if (charity.advancing_religion === 'Y') {
            categories.push('spiritual_support');
        }
        
        return categories.length > 0 ? categories : ['community_service'];
    }

    /**
     * Extract location information from charity data
     * @param {Object} charity - Charity data
     * @returns {Array} Location objects
     */
    extractCharityLocations(charity) {
        const locations = [];
        
        if (charity.address_line_1 || charity.town_city) {
            locations.push({
                id: crypto.randomUUID(),
                name: charity.charity_legal_name || 'ACNC Charity Location',
                address_1: charity.address_line_1 || '',
                address_2: charity.address_line_2 || '',
                city: charity.town_city || '',
                state_province: charity.state || '',
                postal_code: charity.postcode || '',
                country: 'AU',
                region: this.determineRegion(charity.postcode, charity.town_city, charity.state),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        }
        
        return locations;
    }

    /**
     * Extract contact information from charity data
     * @param {Object} charity - Charity data
     * @returns {Array} Contact objects
     */
    extractCharityContacts(charity) {
        const contacts = [];
        
        // ACNC data typically doesn't include direct contact info
        // But we can create a basic contact structure
        if (charity.charity_legal_name) {
            contacts.push({
                id: crypto.randomUUID(),
                name: `${charity.charity_legal_name} Contact`,
                email: null, // Not available in ACNC data
                phone: [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        }
        
        return contacts;
    }

    /**
     * Check if charity is youth-specific
     * @param {Object} charity - Charity data
     * @returns {boolean} True if youth-specific
     */
    isYouthSpecificCharity(charity) {
        const text = JSON.stringify(charity).toLowerCase();
        const youthKeywords = ['youth', 'young', 'teen', 'adolescent', 'juvenile', 'children'];
        return youthKeywords.some(keyword => text.includes(keyword));
    }

    /**
     * Check if charity is Indigenous-specific
     * @param {Object} charity - Charity data
     * @returns {boolean} True if Indigenous-specific
     */
    isIndigenousCharity(charity) {
        const text = JSON.stringify(charity).toLowerCase();
        const indigenousKeywords = ['aboriginal', 'indigenous', 'torres strait', 'first nations', 'atsi'];
        return indigenousKeywords.some(keyword => text.includes(keyword));
    }

    /**
     * Map charity type to organization type
     * @param {string} charityType - ACNC charity type
     * @returns {string} Organization type
     */
    mapCharityType(charityType = '') {
        const type = charityType.toLowerCase();
        
        if (type.includes('government') || type.includes('public')) {
            return 'government';
        }
        
        if (type.includes('religious') || type.includes('faith')) {
            return 'religious';
        }
        
        if (type.includes('education') || type.includes('school') || type.includes('university')) {
            return 'educational';
        }
        
        if (type.includes('health') || type.includes('medical')) {
            return 'healthcare';
        }
        
        return 'non_profit'; // Default for registered charities
    }

    /**
     * Validate service meets minimum requirements
     * @param {Object} service - Normalized service
     * @returns {boolean} True if valid
     */
    validateService(service) {
        return service.name && 
               service.name !== 'Unknown Charity' &&
               service.name.length >= 3 && 
               service.organization?.tax_id && // Must have ABN
               service.organization?.tax_id !== '' && // ABN must not be empty
               service.categories?.length > 0;
    }
}

export default ACNCAdapter;