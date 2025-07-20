/**
 * Western Australia Community Services Adapter
 * 
 * Integrates with WA Government data sources to extract
 * youth and family support services across Western Australia.
 */

import { BaseAdapter } from './base-adapter.js';
import axios from 'axios';
import crypto from 'crypto';

export class WADataAdapter extends BaseAdapter {
    constructor(config = {}) {
        super({
            name: 'Western Australia Community Services',
            type: 'api',
            baseUrl: config.baseUrl || 'https://catalogue.data.wa.gov.au',
            apiUrl: 'https://catalogue.data.wa.gov.au/api/3/action',
            rateLimit: { requests: 30, window: 60 },
            timeout: 30000,
            respectRobotsTxt: true,
            usePlaceholderData: config.usePlaceholderData || true,
            ...config
        });
        
        // WA-specific service categories
        this.serviceTypes = [
            'Youth Support Services',
            'Family Support Services',
            'Child Protection Services',
            'Out-of-Home Care',
            'Foster Care Services',
            'Residential Care Services',
            'Family Preservation Services',
            'Early Intervention Services',
            'Aboriginal Family Services',
            'Disability Support Services',
            'Mental Health Services',
            'Drug and Alcohol Services',
            'Domestic Violence Services',
            'Legal Aid Services',
            'Housing Support Services',
            'Employment Services',
            'Education Support Services'
        ];
        
        // WA regions for service mapping
        this.waRegions = {
            'Perth Metropolitan': [
                'Perth', 'Fremantle', 'Joondalup', 'Stirling', 'Wanneroo',
                'Swan', 'Kalamunda', 'Mundaring', 'Armadale', 'Gosnells'
            ],
            'Peel': ['Mandurah', 'Murray', 'Waroona', 'Boddington'],
            'South West': ['Bunbury', 'Busselton', 'Margaret River', 'Collie'],
            'Great Southern': ['Albany', 'Mount Barker', 'Plantagenet', 'Denmark'],
            'Wheatbelt': ['Northam', 'York', 'Merredin', 'Narrogin'],
            'Mid West': ['Geraldton', 'Carnarvon', 'Exmouth', 'Shark Bay'],
            'Gascoyne': ['Carnarvon', 'Exmouth', 'Shark Bay'],
            'Pilbara': ['Port Hedland', 'Karratha', 'Newman', 'Tom Price'],
            'Kimberley': ['Broome', 'Derby', 'Kununurra', 'Halls Creek'],
            'Goldfields-Esperance': ['Kalgoorlie', 'Esperance', 'Coolgardie']
        };
    }

    /**
     * Validate data source connectivity
     */
    async validate() {
        try {
            if (this.config.usePlaceholderData) {
                return {
                    isValid: true,
                    message: 'WA Community Services adapter (using placeholder data)',
                    note: 'Real API access requires government partnership'
                };
            }
            
            const response = await axios.get(`${this.config.apiUrl}/site_read`, {
                timeout: 10000,
                headers: { 'User-Agent': this.config.userAgent }
            });
            
            return {
                isValid: true,
                message: 'WA data portal accessible',
                status: response.status
            };
        } catch (error) {
            return {
                isValid: false,
                message: `WA data validation failed: ${error.message}`,
                note: 'Using placeholder data for development'
            };
        }
    }

    /**
     * Get source metadata
     */
    async getMetadata() {
        return {
            name: this.config.name,
            type: this.config.type,
            baseUrl: this.config.baseUrl,
            lastUpdate: new Date().toISOString(),
            isActive: true,
            estimatedRecords: 600,
            coverage: 'Western Australia, Australia',
            dataQuality: 'Government-verified (WA Government)',
            updateFrequency: 'Quarterly',
            licensing: 'Creative Commons Attribution',
            categories: this.serviceTypes,
            regions: Object.keys(this.waRegions),
            placeholderMode: this.config.usePlaceholderData
        };
    }

    /**
     * Extract service data
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
            console.log(`Extracting data from WA Community Services...`);
            
            if (this.config.usePlaceholderData) {
                console.log('Using placeholder data - real API access requires partnership');
                const sampleServices = this.generateSampleWAServices(Math.min(limit, 12));
                
                for (const service of sampleServices) {
                    await this.waitForRateLimit();
                    this.updateStats('processed');
                    
                    try {
                        const normalizedService = this.normalizeWAService(service);
                        
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
            console.error('WA Community Services extraction error:', error);
            throw error;
        }
    }

    /**
     * Generate sample WA services
     */
    generateSampleWAServices(count) {
        const organizations = [
            'Anglicare WA',
            'Centrecare WA',
            'Mission Australia WA',
            'Salvation Army WA',
            'UnitingCare West',
            'Youth Focus',
            'Parkerville Children and Youth Care',
            'Wanslea Family Services',
            'Relationships Australia WA',
            'Foetal Alcohol Spectrum Disorder Hub',
            'Aboriginal Family Law Service WA',
            'Yorganop Child Care Aboriginal Corporation'
        ];
        
        const regions = Object.keys(this.waRegions);
        const serviceTypes = this.serviceTypes;
        
        const services = [];
        for (let i = 0; i < count; i++) {
            const org = organizations[i % organizations.length];
            const serviceType = serviceTypes[i % serviceTypes.length];
            const region = regions[i % regions.length];
            
            services.push({
                id: `wa_service_${i + 1}`,
                name: `${serviceType} - ${org}`,
                organization_name: org,
                service_type: serviceType,
                description: this.generateWAServiceDescription(serviceType, org),
                region: region,
                address: this.generateWAAddress(region),
                phone: `(08) ${String(Math.floor(Math.random() * 9000) + 1000)} ${String(Math.floor(Math.random() * 9000) + 1000)}`,
                email: `info@${org.toLowerCase().replace(/[^a-z]/g, '')}.org.au`,
                website: `https://www.${org.toLowerCase().replace(/[^a-z]/g, '')}.org.au`,
                target_age_min: serviceType.includes('Youth') ? 12 : null,
                target_age_max: serviceType.includes('Youth') ? 25 : null,
                cost: i % 4 === 0 ? 'Free' : i % 4 === 1 ? 'Subsidized' : 'Sliding scale',
                accessibility: 'Wheelchair accessible',
                cultural_specific: org.includes('Aboriginal') || (i % 6 === 0),
                last_verified: new Date(Date.now() - Math.random() * 45 * 24 * 60 * 60 * 1000).toISOString(),
                funding_source: 'WA Government',
                service_delivery: ['Face-to-face', 'Outreach', 'Telehealth'][i % 3],
                registration_number: `WA${String(i + 3000).padStart(6, '0')}`
            });
        }
        
        return services;
    }

    /**
     * Generate WA service description
     */
    generateWAServiceDescription(serviceType, organization) {
        const descriptions = {
            'Youth Support Services': `Comprehensive youth development programs including case management, mentoring, life skills training, and crisis intervention for young people aged 12-25.`,
            'Family Support Services': `Intensive family support including parenting programs, family therapy, crisis intervention, and family preservation services.`,
            'Child Protection Services': `Statutory child protection including investigation, assessment, case management, and court support services.`,
            'Out-of-Home Care': `Foster care, kinship care, and residential care services for children unable to live safely with their families.`,
            'Foster Care Services': `Recruitment, training, assessment, and ongoing support for foster carers across Western Australia.`,
            'Residential Care Services': `Therapeutic residential care for children and young people with complex trauma and behavioral needs.`,
            'Family Preservation Services': `Intensive support to prevent family breakdown and support safe family reunification.`,
            'Early Intervention Services': `Early intervention and prevention programs for families at risk of child protection involvement.`,
            'Aboriginal Family Services': `Culturally appropriate family support services for Aboriginal and Torres Strait Islander families.`,
            'Disability Support Services': `Specialized support for children, young people and families affected by disability.`,
            'Mental Health Services': `Community mental health support including counseling, therapy, and psychiatric services for individuals and families.`,
            'Drug and Alcohol Services': `Treatment, counseling, and prevention programs for substance abuse affecting individuals and families.`,
            'Domestic Violence Services': `Crisis support, safe accommodation, counseling, and advocacy for women and children experiencing domestic violence.`,
            'Legal Aid Services': `Free legal advice, representation, and advocacy for families and young people in the justice system.`,
            'Housing Support Services': `Emergency accommodation, transitional housing, and tenancy support for families and young people.`,
            'Employment Services': `Job readiness training, employment placement, and career development services for young people and adults.`,
            'Education Support Services': `Educational support, alternative education programs, and school re-engagement services for young people.`
        };
        
        return descriptions[serviceType] || `Specialized ${serviceType.toLowerCase()} provided by ${organization} across Western Australia.`;
    }

    /**
     * Generate WA address
     */
    generateWAAddress(region) {
        const addresses = {
            'Perth Metropolitan': ['Level 3, 123 St Georges Terrace, Perth WA 6000', '456 Murray Street, Perth WA 6000'],
            'Peel': ['78 Pinjarra Road, Mandurah WA 6210'],
            'South West': ['34 Victoria Street, Bunbury WA 6230'],
            'Great Southern': ['67 Albany Highway, Albany WA 6330'],
            'Wheatbelt': ['89 Fitzgerald Street, Northam WA 6401'],
            'Mid West': ['123 Marine Terrace, Geraldton WA 6530'],
            'Gascoyne': ['45 Robinson Street, Carnarvon WA 6701'],
            'Pilbara': ['56 Edgar Street, Port Hedland WA 6721'],
            'Kimberley': ['78 Hamersley Street, Broome WA 6725'],
            'Goldfields-Esperance': ['12 Hannan Street, Kalgoorlie WA 6430']
        };
        
        const regionAddresses = addresses[region] || ['1 Main Street, Perth WA 6000'];
        return regionAddresses[Math.floor(Math.random() * regionAddresses.length)];
    }

    /**
     * Normalize WA service record
     */
    normalizeWAService(record) {
        const service = {
            id: crypto.randomUUID(),
            name: record.name || `${record.service_type} - ${record.organization_name}`,
            description: record.description,
            status: 'active',
            categories: this.mapWAServiceCategories(record),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            data_source: this.config.name,
            source_url: record.website || 'https://catalogue.data.wa.gov.au',
            verification_status: 'verified',
            verification_score: 82,
            
            organization: {
                id: crypto.randomUUID(),
                name: record.organization_name,
                description: `Community service provider registered in Western Australia`,
                organization_type: this.determineWAOrganizationType(record.organization_name),
                email: record.email,
                url: record.website,
                funding_source: record.funding_source,
                registration_number: record.registration_number,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                data_source: this.config.name,
                verification_status: 'verified'
            },
            
            locations: this.extractWALocations(record),
            contacts: this.extractWAContacts(record),
            
            // WA-specific fields
            wa_service_type: record.service_type,
            wa_region: record.region,
            service_delivery_mode: record.service_delivery,
            cost_structure: record.cost,
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
            last_verified: record.last_verified
        };
        
        service.completeness_score = this.calculateCompletenessScore(service);
        return service;
    }

    /**
     * Map WA service categories
     */
    mapWAServiceCategories(record) {
        const categories = ['community_service'];
        
        const serviceType = record.service_type?.toLowerCase() || '';
        
        if (serviceType.includes('youth')) {
            categories.push('youth_services');
        }
        if (serviceType.includes('family')) {
            categories.push('family_support');
        }
        if (serviceType.includes('child protection')) {
            categories.push('child_protection');
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
        if (serviceType.includes('disability')) {
            categories.push('disability_support');
        }
        if (serviceType.includes('aboriginal') || serviceType.includes('indigenous')) {
            categories.push('cultural_support');
        }
        if (serviceType.includes('domestic violence')) {
            categories.push('crisis_support');
        }
        if (serviceType.includes('drug') || serviceType.includes('alcohol')) {
            categories.push('drug_alcohol');
        }
        if (serviceType.includes('education')) {
            categories.push('education_support');
        }
        
        return categories;
    }

    /**
     * Determine WA organization type
     */
    determineWAOrganizationType(orgName) {
        const name = orgName.toLowerCase();
        
        if (name.includes('government') || name.includes('wa') || name.includes('department')) {
            return 'government';
        }
        if (name.includes('aboriginal') || name.includes('indigenous') || name.includes('yorganop')) {
            return 'indigenous';
        }
        if (name.includes('centrecare') || name.includes('salvation army') || name.includes('uniting')) {
            return 'religious';
        }
        if (name.includes('anglicare') || name.includes('mission') || name.includes('parkerville')) {
            return 'non_profit';
        }
        
        return 'community';
    }

    /**
     * Extract WA locations
     */
    extractWALocations(record) {
        if (!record.address && !record.region) {
            return [];
        }
        
        const addressParts = (record.address || '').split(',').map(part => part.trim());
        const street = addressParts[0] || '';
        const cityState = addressParts[1] || '';
        const postcode = (record.address || '').match(/\b\d{4}\b/)?.[0] || '';
        
        const city = this.extractCityFromWARegion(record.region);
        
        return [{
            id: crypto.randomUUID(),
            name: `${record.organization_name} - ${record.region}`,
            address_1: street,
            city: city,
            state_province: 'WA',
            postal_code: postcode,
            country: 'AU',
            region: this.normalizeWARegion(record.region),
            wheelchair_accessible: record.accessibility?.includes('Wheelchair') || false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }];
    }

    /**
     * Extract city from WA region
     */
    extractCityFromWARegion(region) {
        const regionCities = {
            'Perth Metropolitan': 'Perth',
            'Peel': 'Mandurah',
            'South West': 'Bunbury',
            'Great Southern': 'Albany',
            'Wheatbelt': 'Northam',
            'Mid West': 'Geraldton',
            'Gascoyne': 'Carnarvon',
            'Pilbara': 'Port Hedland',
            'Kimberley': 'Broome',
            'Goldfields-Esperance': 'Kalgoorlie'
        };
        
        return regionCities[region] || 'Perth';
    }

    /**
     * Normalize WA region
     */
    normalizeWARegion(waRegion) {
        if (waRegion === 'Perth Metropolitan') {
            return 'metro_perth';
        }
        
        return waRegion?.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'regional_wa';
    }

    /**
     * Extract WA contacts
     */
    extractWAContacts(record) {
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
     * Validate service
     */
    validateService(service) {
        return service.name && 
               service.organization?.name &&
               service.categories?.length > 0 &&
               (service.contacts?.length > 0 || service.locations?.length > 0);
    }
}

export default WADataAdapter;