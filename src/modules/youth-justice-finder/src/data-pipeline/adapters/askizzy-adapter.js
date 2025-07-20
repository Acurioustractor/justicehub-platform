/**
 * Ask Izzy / Infoxchange Service Directory API Adapter
 * 
 * Integrates with Infoxchange's Service Directory API to access
 * 400,000+ service listings across Australia.
 * 
 * Note: This requires partnership with Infoxchange for API access.
 * Current implementation includes placeholder methods for future integration.
 */

import { BaseAdapter } from './base-adapter.js';
import axios from 'axios';
import crypto from 'crypto';

export class AskIzzyAdapter extends BaseAdapter {
    constructor(config = {}) {
        super({
            name: 'Ask Izzy / Infoxchange Service Directory',
            type: 'api',
            baseUrl: config.baseUrl || 'https://api.infoxchange.org/service-directory/v1',
            apiKey: config.apiKey || null,
            rateLimit: { requests: 60, window: 60 }, // Conservative rate limit
            timeout: 30000,
            ...config
        });
        
        this.axios = axios.create({
            baseURL: this.config.baseUrl,
            timeout: this.config.timeout,
            headers: {
                'User-Agent': this.config.userAgent,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        // Add API key to headers if provided
        if (this.config.apiKey) {
            this.axios.defaults.headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        }
        
        // Set up request interceptor for rate limiting
        this.axios.interceptors.request.use(async (config) => {
            await this.waitForRateLimit();
            return config;
        });
        
        // Set up response interceptor for error handling
        this.axios.interceptors.response.use(
            response => response,
            error => {
                this.updateStats('error', { error: error.message });
                throw error;
            }
        );
    }

    /**
     * Validate API connectivity and authentication
     * @returns {Promise<Object>} Validation result
     */
    async validate() {
        try {
            // Test endpoint - adjust based on actual API documentation
            const response = await this.axios.get('/health');
            
            return {
                isValid: true,
                message: 'API connection successful',
                apiVersion: response.data.version || 'unknown',
                rateLimits: response.headers['x-ratelimit-limit'] || 'unknown'
            };
        } catch (error) {
            return {
                isValid: false,
                message: `API validation failed: ${error.message}`,
                error: error.response?.data || error.message
            };
        }
    }

    /**
     * Get source metadata and statistics
     * @returns {Promise<Object>} Source metadata
     */
    async getMetadata() {
        try {
            // Placeholder - adjust based on actual API endpoints
            const statsResponse = await this.axios.get('/stats');
            
            return {
                name: this.config.name,
                type: this.config.type,
                baseUrl: this.config.baseUrl,
                lastUpdate: new Date().toISOString(),
                isActive: true,
                estimatedRecords: statsResponse.data.totalServices || 400000,
                coverage: 'Australia-wide',
                categories: statsResponse.data.categories || [],
                lastApiUpdate: statsResponse.data.lastUpdate
            };
        } catch (error) {
            return {
                name: this.config.name,
                type: this.config.type,
                baseUrl: this.config.baseUrl,
                lastUpdate: new Date().toISOString(),
                isActive: false,
                estimatedRecords: 400000, // Known estimate
                coverage: 'Australia-wide',
                error: error.message
            };
        }
    }

    /**
     * Extract services from Ask Izzy API
     * @param {Object} options - Extraction options
     * @returns {Promise<Array>} Array of normalized service records
     */
    async extract(options = {}) {
        this.updateStats('start');
        
        const extractedServices = [];
        const {
            limit = 100,
            offset = 0,
            categories = [],
            location = null,
            youthOnly = true,
            includeInactive = false
        } = options;
        
        try {
            // Build query parameters
            const params = {
                limit,
                offset,
                include_inactive: includeInactive
            };
            
            // Add category filters
            if (categories.length > 0) {
                params.categories = categories.join(',');
            }
            
            // Add location filter
            if (location) {
                params.latitude = location.latitude;
                params.longitude = location.longitude;
                params.radius = location.radius || 50; // km
            }
            
            // Youth-specific filtering
            if (youthOnly) {
                params.target_age_min = 10;
                params.target_age_max = 25;
            }
            
            // Make API request
            console.log(`Fetching services from Ask Izzy API: ${JSON.stringify(params)}`);
            const response = await this.axios.get('/services', { params });
            
            const services = response.data.services || response.data.data || [];
            console.log(`Retrieved ${services.length} services from Ask Izzy API`);
            
            // Process each service
            for (const rawService of services) {
                this.updateStats('processed');
                
                try {
                    const normalizedService = this.normalize(rawService);
                    
                    // Validate normalized service
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
                    console.error('Service normalization error:', normalizationError);
                }
            }
            
            // Handle pagination
            const totalServices = response.data.total || response.data.meta?.total;
            const hasMore = totalServices && (offset + limit) < totalServices;
            
            this.updateStats('end');
            
            return {
                services: extractedServices,
                pagination: {
                    total: totalServices,
                    offset,
                    limit,
                    hasMore
                },
                stats: this.getStats()
            };
            
        } catch (error) {
            this.updateStats('error', { error: error.message });
            console.error('Ask Izzy API extraction error:', error);
            
            // Return placeholder data for development/testing
            if (this.config.usePlaceholderData) {
                return this.getPlaceholderData(options);
            }
            
            throw error;
        }
    }

    /**
     * Normalize Ask Izzy service data to unified schema
     * @param {Object} rawService - Raw service from Ask Izzy API
     * @returns {Object} Normalized service record
     */
    normalize(rawService) {
        // Ask Izzy API structure (based on expected format)
        const normalized = super.normalize(rawService);
        
        // Override specific fields based on Ask Izzy schema
        normalized.name = rawService.name || rawService.service_name || 'Unknown Service';
        normalized.description = rawService.description || rawService.service_description || '';
        normalized.url = rawService.website || rawService.url;
        normalized.email = rawService.email || rawService.contact_email;
        
        // Categories (Ask Izzy uses taxonomy IDs)
        normalized.categories = this.extractAskIzzyCategories(rawService);
        
        // Organization
        if (rawService.organization) {
            normalized.organization = {
                ...normalized.organization,
                name: rawService.organization.name || 'Unknown Organization',
                description: rawService.organization.description,
                url: rawService.organization.website,
                organization_type: this.mapAskIzzyOrgType(rawService.organization.type)
            };
        }
        
        // Locations
        if (rawService.locations && rawService.locations.length > 0) {
            normalized.locations = rawService.locations.map(location => ({
                id: crypto.randomUUID(),
                name: location.name,
                address_1: location.address || location.street_address || '',
                address_2: location.address_2,
                city: location.suburb || location.city || location.locality || '',
                state_province: location.state || 'QLD',
                postal_code: location.postcode || location.postal_code || '',
                country: 'AU',
                latitude: location.latitude ? parseFloat(location.latitude) : null,
                longitude: location.longitude ? parseFloat(location.longitude) : null,
                region: this.determineRegion(
                    location.postcode || location.postal_code,
                    location.suburb || location.city,
                    location.state
                ),
                wheelchair_accessible: location.accessibility?.wheelchair === true,
                public_transport_access: location.accessibility?.public_transport === true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }));
        }
        
        // Contacts
        normalized.contacts = this.extractAskIzzyContacts(rawService);
        
        // Youth-specific fields
        if (rawService.eligibility) {
            normalized.minimum_age = rawService.eligibility.age_min;
            normalized.maximum_age = rawService.eligibility.age_max;
        }
        
        // Service status
        normalized.status = rawService.status === 'active' ? 'active' : 'inactive';
        
        // Quality indicators from Ask Izzy
        if (rawService.verification_status) {
            normalized.verification_status = rawService.verification_status;
            normalized.verification_score = rawService.verification_status === 'verified' ? 80 : 40;
        }
        
        // Last updated
        if (rawService.updated_at || rawService.last_modified) {
            normalized.updated_at = rawService.updated_at || rawService.last_modified;
        }
        
        return normalized;
    }

    /**
     * Extract categories from Ask Izzy taxonomy
     * @param {Object} service - Raw service data
     * @returns {Array} Normalized categories
     */
    extractAskIzzyCategories(service) {
        const categories = [];
        
        // Direct categories
        if (service.categories) {
            service.categories.forEach(cat => {
                const normalized = this.mapAskIzzyCategory(cat);
                if (normalized) categories.push(normalized);
            });
        }
        
        // Taxonomy mapping
        if (service.taxonomy_terms) {
            service.taxonomy_terms.forEach(term => {
                const normalized = this.mapAskIzzyTaxonomy(term);
                if (normalized) categories.push(normalized);
            });
        }
        
        return categories.length > 0 ? [...new Set(categories)] : ['general'];
    }

    /**
     * Map Ask Izzy categories to our taxonomy
     * @param {Object|string} category - Ask Izzy category
     * @returns {string} Normalized category
     */
    mapAskIzzyCategory(category) {
        const categoryName = typeof category === 'string' ? category : category.name;
        
        const mapping = {
            'Legal services': 'legal_aid',
            'Court support': 'court_support',
            'Mental health': 'mental_health',
            'Counselling': 'mental_health',
            'Housing': 'housing',
            'Accommodation': 'housing',
            'Crisis support': 'crisis_support',
            'Emergency assistance': 'crisis_support',
            'Education': 'education_support',
            'Training': 'education_support',
            'Alcohol and drug': 'drug_alcohol',
            'Substance abuse': 'drug_alcohol',
            'Family services': 'family_support',
            'Cultural services': 'cultural_support',
            'Aboriginal services': 'cultural_support',
            'Community services': 'community_service',
            'Health services': 'health_services',
            'Employment': 'employment',
            'Youth services': 'youth_development'
        };
        
        return mapping[categoryName] || this.normalizeCategory(categoryName);
    }

    /**
     * Extract contact information from Ask Izzy format
     * @param {Object} service - Raw service data
     * @returns {Array} Contact objects
     */
    extractAskIzzyContacts(service) {
        const contacts = [];
        
        // Main contact
        if (service.contact || service.phone || service.email) {
            const contact = {
                id: crypto.randomUUID(),
                name: service.contact?.name,
                title: service.contact?.title,
                phone: [],
                email: service.email || service.contact?.email,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            // Phone numbers
            if (service.phone) {
                contact.phone.push({
                    number: service.phone,
                    type: 'voice',
                    language: 'en'
                });
            }
            
            if (service.contact?.phone) {
                contact.phone.push({
                    number: service.contact.phone,
                    type: 'voice',
                    language: 'en'
                });
            }
            
            contacts.push(contact);
        }
        
        return contacts;
    }

    /**
     * Validate extracted service meets quality standards
     * @param {Object} service - Normalized service
     * @returns {boolean} True if valid
     */
    validateService(service) {
        // Minimum requirements
        if (!service.name || service.name.length < 3) return false;
        if (!service.description || service.description.length < 10) return false;
        if (!service.categories || service.categories.length === 0) return false;
        
        // Must have either contact or location
        const hasContact = service.contacts && service.contacts.length > 0;
        const hasLocation = service.locations && service.locations.length > 0;
        
        return hasContact || hasLocation;
    }

    /**
     * Get placeholder data for development/testing
     * @param {Object} options - Options
     * @returns {Object} Placeholder response
     */
    getPlaceholderData(options) {
        console.log('Using placeholder data for Ask Izzy integration');
        
        const placeholderServices = [
            {
                name: 'Youth Legal Service - Ask Izzy Demo',
                description: 'Free legal advice and representation for young people aged 10-25. Specializing in youth justice matters.',
                categories: ['legal_aid', 'youth_development'],
                organization: {
                    name: 'Youth Legal Service (Demo)',
                    organization_type: 'community'
                },
                locations: [{
                    address_1: '123 Demo Street',
                    city: 'Brisbane',
                    state_province: 'QLD',
                    postal_code: '4000',
                    region: 'brisbane'
                }],
                contacts: [{
                    phone: [{ number: '07 3000 0000', type: 'voice' }],
                    email: 'demo@youthlegaldemo.org.au'
                }],
                youth_specific: true,
                completeness_score: 0.85,
                data_source: this.config.name,
                verification_status: 'verified'
            }
        ];
        
        return {
            services: placeholderServices,
            pagination: {
                total: placeholderServices.length,
                offset: 0,
                limit: options.limit || 100,
                hasMore: false
            },
            stats: this.getStats()
        };
    }

    /**
     * Helper method to generate UUIDs
     * @returns {string} UUID
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}

export default AskIzzyAdapter;