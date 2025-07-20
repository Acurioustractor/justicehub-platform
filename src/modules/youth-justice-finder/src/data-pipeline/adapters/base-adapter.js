/**
 * Base Data Source Adapter
 * 
 * Abstract base class for all data source adapters.
 * Provides common functionality and interface for data extraction,
 * normalization, and quality assessment.
 */

import crypto from 'crypto';
import { RateLimiter } from '../utils/rate-limiter.js';
import { ErrorHandler } from '../utils/error-handler.js';

export class BaseAdapter {
    constructor(config = {}) {
        this.config = {
            name: config.name || 'Unknown Source',
            type: config.type || 'unknown', // 'api', 'scraper', 'file', 'database'
            baseUrl: config.baseUrl || null,
            apiKey: config.apiKey || null,
            rateLimit: config.rateLimit || { requests: 60, window: 60 }, // per minute
            timeout: config.timeout || 30000,
            retryAttempts: config.retryAttempts || 3,
            retryDelay: config.retryDelay || 1000,
            userAgent: config.userAgent || 'Youth Justice Service Finder Bot 1.0',
            respectRobotsTxt: config.respectRobotsTxt !== false,
            ...config
        };

        this.rateLimiter = new RateLimiter(
            this.config.rateLimit.requests, 
            this.config.rateLimit.window * 1000
        );
        
        this.errorHandler = new ErrorHandler();
        this.stats = this.initializeStats();
    }

    initializeStats() {
        return {
            jobId: crypto.randomUUID(),
            startTime: null,
            endTime: null,
            recordsProcessed: 0,
            recordsExtracted: 0,
            recordsSkipped: 0,
            errorsCount: 0,
            duplicatesFound: 0,
            qualityIssues: [],
            averageQualityScore: 0
        };
    }

    /**
     * Main extraction method - must be implemented by subclasses
     * @param {Object} options - Extraction options
     * @returns {Promise<Array>} Array of normalized service records
     */
    async extract(options = {}) {
        throw new Error('extract() method must be implemented by subclass');
    }

    /**
     * Validate source connectivity and configuration
     * @returns {Promise<Object>} Validation result
     */
    async validate() {
        throw new Error('validate() method must be implemented by subclass');
    }

    /**
     * Get source metadata and statistics
     * @returns {Promise<Object>} Source metadata
     */
    async getMetadata() {
        return {
            name: this.config.name,
            type: this.config.type,
            baseUrl: this.config.baseUrl,
            lastUpdate: new Date().toISOString(),
            isActive: true,
            estimatedRecords: null
        };
    }

    /**
     * Normalize raw data to unified schema
     * @param {Object} rawData - Raw data from source
     * @returns {Object} Normalized service record
     */
    normalize(rawData) {
        const normalized = {
            id: crypto.randomUUID(),
            name: this.extractField(rawData, 'name') || 'Unknown Service',
            description: this.extractField(rawData, 'description') || '',
            status: 'active',
            categories: this.extractCategories(rawData),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            data_source: this.config.name,
            source_url: this.extractField(rawData, 'url'),
            verification_status: 'unverified',
            completeness_score: 0,
            verification_score: 0,
            
            // Organization info
            organization: this.extractOrganization(rawData),
            
            // Location info
            locations: this.extractLocations(rawData),
            
            // Contact info
            contacts: this.extractContacts(rawData),
            
            // Additional fields
            email: this.extractField(rawData, 'email'),
            url: this.extractField(rawData, 'website'),
            phone: this.extractField(rawData, 'phone'),
            address: this.extractField(rawData, 'address'),
            
            // Youth-specific
            minimum_age: this.extractField(rawData, 'min_age'),
            maximum_age: this.extractField(rawData, 'max_age'),
            youth_specific: this.isYouthSpecific(rawData),
            indigenous_specific: this.isIndigenousSpecific(rawData),
            
            // Raw data for debugging
            _raw: this.config.includeRawData ? rawData : undefined
        };

        // Calculate quality score
        normalized.completeness_score = this.calculateCompletenessScore(normalized);
        
        return normalized;
    }

    /**
     * Extract field value with multiple possible field names
     * @param {Object} data - Source data
     * @param {string|Array} fieldNames - Field name or array of possible names
     * @returns {*} Field value
     */
    extractField(data, fieldNames) {
        if (!data) return null;
        
        const names = Array.isArray(fieldNames) ? fieldNames : [fieldNames];
        
        for (const name of names) {
            if (data[name] !== undefined && data[name] !== null && data[name] !== '') {
                return data[name];
            }
        }
        
        return null;
    }

    /**
     * Extract and normalize categories
     * @param {Object} data - Source data
     * @returns {Array} Array of category strings
     */
    extractCategories(data) {
        const categories = this.extractField(data, [
            'categories', 'category', 'service_type', 'type', 'services'
        ]);
        
        if (!categories) return ['general'];
        
        if (Array.isArray(categories)) {
            return categories.map(cat => this.normalizeCategory(cat)).filter(Boolean);
        }
        
        if (typeof categories === 'string') {
            return [this.normalizeCategory(categories)].filter(Boolean);
        }
        
        return ['general'];
    }

    /**
     * Normalize category to standard taxonomy
     * @param {string} category - Raw category
     * @returns {string} Normalized category
     */
    normalizeCategory(category) {
        if (!category || typeof category !== 'string') return null;
        
        const normalized = category.toLowerCase().trim();
        
        // Category mapping
        const categoryMap = {
            'legal': 'legal_aid',
            'law': 'legal_aid',
            'court': 'court_support',
            'mental health': 'mental_health',
            'psychology': 'mental_health',
            'counselling': 'mental_health',
            'housing': 'housing',
            'accommodation': 'housing',
            'crisis': 'crisis_support',
            'emergency': 'crisis_support',
            'education': 'education_support',
            'training': 'education_support',
            'drug': 'drug_alcohol',
            'alcohol': 'drug_alcohol',
            'substance': 'drug_alcohol',
            'family': 'family_support',
            'cultural': 'cultural_support',
            'indigenous': 'cultural_support',
            'community': 'community_service',
            'health': 'health_services',
            'employment': 'employment'
        };
        
        // Check for exact matches
        if (categoryMap[normalized]) {
            return categoryMap[normalized];
        }
        
        // Check for partial matches
        for (const [key, value] of Object.entries(categoryMap)) {
            if (normalized.includes(key)) {
                return value;
            }
        }
        
        return normalized.replace(/[^a-z0-9_]/g, '_');
    }

    /**
     * Extract organization information
     * @param {Object} data - Source data
     * @returns {Object} Organization object
     */
    extractOrganization(data) {
        return {
            id: crypto.randomUUID(),
            name: this.extractField(data, [
                'organization', 'org_name', 'provider', 'agency', 'department'
            ]) || 'Unknown Organization',
            description: this.extractField(data, ['org_description', 'agency_description']),
            organization_type: this.determineOrganizationType(data),
            email: this.extractField(data, ['org_email', 'contact_email']),
            url: this.extractField(data, ['org_website', 'website']),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            data_source: this.config.name,
            verification_status: 'unverified'
        };
    }

    /**
     * Determine organization type from data
     * @param {Object} data - Source data
     * @returns {string} Organization type
     */
    determineOrganizationType(data) {
        const orgName = (this.extractField(data, [
            'organization', 'org_name', 'provider'
        ]) || '').toLowerCase();
        
        if (orgName.includes('government') || orgName.includes('department') || 
            orgName.includes('ministry') || orgName.includes('.gov.')) {
            return 'government';
        }
        
        if (orgName.includes('aboriginal') || orgName.includes('indigenous') || 
            orgName.includes('torres strait')) {
            return 'indigenous';
        }
        
        if (orgName.includes('church') || orgName.includes('religious') || 
            orgName.includes('faith')) {
            return 'religious';
        }
        
        if (orgName.includes('university') || orgName.includes('college') || 
            orgName.includes('school')) {
            return 'educational';
        }
        
        if (orgName.includes('hospital') || orgName.includes('health') || 
            orgName.includes('medical')) {
            return 'healthcare';
        }
        
        return 'community';
    }

    /**
     * Extract location information
     * @param {Object} data - Source data
     * @returns {Array} Array of location objects
     */
    extractLocations(data) {
        const address = this.extractField(data, ['address', 'location', 'street_address']);
        const city = this.extractField(data, ['city', 'suburb', 'locality']);
        const state = this.extractField(data, ['state', 'state_province']) || 'QLD';
        const postcode = this.extractField(data, ['postcode', 'postal_code', 'zip']);
        const latitude = this.extractField(data, ['latitude', 'lat']);
        const longitude = this.extractField(data, ['longitude', 'lng', 'lon']);
        
        if (!address && !city) {
            return [];
        }
        
        return [{
            id: crypto.randomUUID(),
            name: this.extractField(data, ['location_name', 'site_name']),
            address_1: address || '',
            city: city || '',
            state_province: state,
            postal_code: postcode || '',
            country: 'AU',
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            region: this.determineRegion(postcode, city, state),
            wheelchair_accessible: this.extractField(data, 'wheelchair_accessible') === true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }];
    }

    /**
     * Determine Queensland region from location data
     * @param {string} postcode - Postal code
     * @param {string} city - City name
     * @param {string} state - State
     * @returns {string} Region identifier
     */
    determineRegion(postcode, city, state) {
        if (state !== 'QLD' && state !== 'Queensland') {
            return 'remote_queensland'; // Default for non-QLD
        }
        
        const pc = postcode ? parseInt(postcode) : 0;
        const cityLower = (city || '').toLowerCase();
        
        // Brisbane metro
        if ((pc >= 4000 && pc <= 4179) || cityLower.includes('brisbane')) {
            return 'brisbane';
        }
        
        // Gold Coast
        if ((pc >= 4200 && pc <= 4299) || cityLower.includes('gold coast')) {
            return 'gold_coast';
        }
        
        // Sunshine Coast
        if ((pc >= 4550 && pc <= 4579) || cityLower.includes('sunshine coast')) {
            return 'sunshine_coast';
        }
        
        // Townsville
        if ((pc >= 4810 && pc <= 4819) || cityLower.includes('townsville')) {
            return 'townsville';
        }
        
        // Cairns
        if ((pc >= 4870 && pc <= 4879) || cityLower.includes('cairns')) {
            return 'cairns';
        }
        
        // Toowoomba
        if ((pc >= 4350 && pc <= 4359) || cityLower.includes('toowoomba')) {
            return 'toowoomba';
        }
        
        // Default regional
        return 'remote_queensland';
    }

    /**
     * Extract contact information
     * @param {Object} data - Source data
     * @returns {Array} Array of contact objects
     */
    extractContacts(data) {
        const contacts = [];
        
        const phone = this.extractField(data, ['phone', 'telephone', 'contact_phone']);
        const email = this.extractField(data, ['email', 'contact_email']);
        
        if (phone || email) {
            contacts.push({
                id: crypto.randomUUID(),
                name: this.extractField(data, ['contact_name', 'contact_person']),
                phone: phone ? [{
                    number: phone,
                    type: 'voice',
                    language: 'en'
                }] : [],
                email: email,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        }
        
        return contacts;
    }

    /**
     * Determine if service is youth-specific
     * @param {Object} data - Source data
     * @returns {boolean} True if youth-specific
     */
    isYouthSpecific(data) {
        const text = JSON.stringify(data).toLowerCase();
        const youthKeywords = ['youth', 'young', 'teen', 'adolescent', 'juvenile', 'child'];
        return youthKeywords.some(keyword => text.includes(keyword));
    }

    /**
     * Determine if service is Indigenous-specific
     * @param {Object} data - Source data
     * @returns {boolean} True if Indigenous-specific
     */
    isIndigenousSpecific(data) {
        const text = JSON.stringify(data).toLowerCase();
        const indigenousKeywords = ['aboriginal', 'indigenous', 'torres strait', 'first nations', 'atsi'];
        return indigenousKeywords.some(keyword => text.includes(keyword));
    }

    /**
     * Calculate completeness score for a service record
     * @param {Object} service - Service record
     * @returns {number} Completeness score (0-1)
     */
    calculateCompletenessScore(service) {
        let score = 0;
        let maxScore = 100;
        
        // Required fields (40 points)
        if (service.name && service.name.length > 3) score += 10;
        if (service.description && service.description.length > 20) score += 15;
        if (service.categories && service.categories.length > 0) score += 15;
        
        // Contact information (25 points)
        if (service.contacts && service.contacts.length > 0) {
            const contact = service.contacts[0];
            if (contact.phone && contact.phone.length > 0) score += 10;
            if (contact.email) score += 10;
            if (service.url) score += 5;
        }
        
        // Location information (25 points)
        if (service.locations && service.locations.length > 0) {
            const location = service.locations[0];
            if (location.address_1) score += 10;
            if (location.city) score += 5;
            if (location.postal_code) score += 5;
            if (location.latitude && location.longitude) score += 5;
        }
        
        // Additional information (10 points)
        if (service.organization && service.organization.name) score += 5;
        if (service.minimum_age !== null || service.maximum_age !== null) score += 5;
        
        return Math.round((score / maxScore) * 100) / 100;
    }

    /**
     * Update extraction statistics
     * @param {string} action - Action type ('processed', 'extracted', 'skipped', 'error')
     * @param {Object} data - Additional data
     */
    updateStats(action, data = {}) {
        switch (action) {
            case 'start':
                this.stats.startTime = new Date();
                break;
            case 'end':
                this.stats.endTime = new Date();
                break;
            case 'processed':
                this.stats.recordsProcessed++;
                break;
            case 'extracted':
                this.stats.recordsExtracted++;
                if (data.qualityScore) {
                    this.stats.averageQualityScore = 
                        (this.stats.averageQualityScore * (this.stats.recordsExtracted - 1) + data.qualityScore) / 
                        this.stats.recordsExtracted;
                }
                break;
            case 'skipped':
                this.stats.recordsSkipped++;
                break;
            case 'error':
                this.stats.errorsCount++;
                if (data.error) {
                    this.errorHandler.log(data.error, this.config.name);
                }
                break;
            case 'duplicate':
                this.stats.duplicatesFound++;
                break;
            case 'quality_issue':
                if (data.issue) {
                    this.stats.qualityIssues.push(data.issue);
                }
                break;
        }
    }

    /**
     * Get extraction statistics
     * @returns {Object} Statistics object
     */
    getStats() {
        const stats = { ...this.stats };
        if (stats.startTime && stats.endTime) {
            stats.durationMs = stats.endTime.getTime() - stats.startTime.getTime();
            stats.recordsPerSecond = stats.recordsProcessed / (stats.durationMs / 1000);
        }
        return stats;
    }

    /**
     * Rate limit requests
     * @returns {Promise} Promise that resolves when rate limit allows
     */
    async waitForRateLimit() {
        return this.rateLimiter.wait();
    }

    /**
     * Clean up resources
     */
    async cleanup() {
        // Override in subclasses if needed
    }
}