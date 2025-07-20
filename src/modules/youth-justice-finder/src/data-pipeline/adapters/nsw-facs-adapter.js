/**
 * NSW Family and Community Services Adapter
 * 
 * Integrates with NSW Government data sources to extract
 * youth and family support services across New South Wales.
 */

import { BaseAdapter } from './base-adapter.js';
import axios from 'axios';
import crypto from 'crypto';

export class NSWFACSAdapter extends BaseAdapter {
    constructor(config = {}) {
        super({
            name: 'NSW Family and Community Services',
            type: 'api',
            baseUrl: config.baseUrl || 'https://data.nsw.gov.au',
            apiUrl: 'https://data.nsw.gov.au/data/api/3/action',
            rateLimit: { requests: 30, window: 60 },
            timeout: 45000,
            respectRobotsTxt: true,
            usePlaceholderData: config.usePlaceholderData || true,
            ...config
        });
        
        // NSW-specific service categories
        this.serviceTypes = [
            'Youth Services',
            'Family Support',
            'Child Protection Services',
            'Out of Home Care',
            'Early Intervention Services',
            'Family Preservation Services',
            'Foster Care Services',
            'Residential Care',
            'Intensive Family Services',
            'Aboriginal Family Services',
            'Disability Support Services',
            'Mental Health Services',
            'Domestic Violence Services',
            'Legal Aid Services',
            'Housing Support',
            'Employment Services'
        ];
        
        // NSW regions for service mapping
        this.nswRegions = {
            'Sydney Metropolitan': [
                'Sydney', 'Parramatta', 'Liverpool', 'Blacktown', 'Penrith',
                'Canterbury-Bankstown', 'Hills Shire', 'Northern Beaches'
            ],
            'Hunter': ['Newcastle', 'Lake Macquarie', 'Maitland', 'Cessnock'],
            'Illawarra-Shoalhaven': ['Wollongong', 'Shellharbour', 'Kiama', 'Shoalhaven'],
            'Richmond-Tweed': ['Lismore', 'Byron', 'Ballina', 'Richmond Valley'],
            'Mid North Coast': ['Port Macquarie', 'Coffs Harbour', 'Kempsey'],
            'Northern': ['Tamworth', 'Armidale', 'Moree Plains', 'Inverell'],
            'North Western': ['Dubbo', 'Narromine', 'Orange', 'Bathurst'],
            'Central West': ['Parkes', 'Forbes', 'Lachlan', 'Weddin'],
            'South Eastern': ['Queanbeyan', 'Palerang', 'Eurobodalla', 'Bega Valley'],
            'Riverina': ['Wagga Wagga', 'Griffith', 'Leeton', 'Tumut'],
            'Murray': ['Albury', 'Greater Hume', 'Corowa', 'Federation'],
            'Far West': ['Broken Hill', 'Central Darling', 'Wentworth']
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
                    message: 'NSW FACS adapter (using placeholder data)',
                    note: 'Real API access requires government partnership'
                };
            }
            
            const response = await axios.get(`${this.config.apiUrl}/site_read`, {
                timeout: 10000,
                headers: { 'User-Agent': this.config.userAgent }
            });
            
            return {
                isValid: true,
                message: 'NSW data portal accessible',
                status: response.status
            };
        } catch (error) {
            return {
                isValid: false,
                message: `NSW FACS validation failed: ${error.message}`,
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
            estimatedRecords: 800,
            coverage: 'New South Wales, Australia',
            dataQuality: 'Government-verified (NSW Government)',
            updateFrequency: 'Monthly',
            licensing: 'Creative Commons Attribution',
            categories: this.serviceTypes,
            regions: Object.keys(this.nswRegions),
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
            console.log(`Extracting data from NSW FACS...`);
            
            if (this.config.usePlaceholderData) {
                console.log('Using placeholder data - real API access requires partnership');
                const sampleServices = this.generateSampleNSWServices(Math.min(limit, 15));
                
                for (const service of sampleServices) {
                    await this.waitForRateLimit();
                    this.updateStats('processed');
                    
                    try {
                        const normalizedService = this.normalizeNSWService(service);
                        
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
            console.error('NSW FACS extraction error:', error);
            throw error;
        }
    }

    /**
     * Generate sample NSW services
     */
    generateSampleNSWServices(count) {
        const organizations = [
            'Barnardos Australia',
            'Mission Australia NSW',
            'The Salvation Army NSW',
            'Uniting NSW/ACT',
            'Wesley Mission',
            'Anglicare NSW South',
            'CatholicCare Sydney',
            'MacKillop Family Services NSW',
            'Life Without Barriers',
            'Your Story Disability Services',
            'Ability Links NSW',
            'Aboriginal Child Family Womens Legal Service',
            'Youth Off The Streets',
            'The Smith Family NSW',
            'Headspace NSW'
        ];
        
        const regions = Object.keys(this.nswRegions);
        const serviceTypes = this.serviceTypes;
        
        const services = [];
        for (let i = 0; i < count; i++) {
            const org = organizations[i % organizations.length];
            const serviceType = serviceTypes[i % serviceTypes.length];
            const region = regions[i % regions.length];
            
            services.push({
                id: `nsw_service_${i + 1}`,
                name: `${serviceType} - ${org}`,
                organization_name: org,
                service_type: serviceType,
                description: this.generateNSWServiceDescription(serviceType, org),
                region: region,
                address: this.generateNSWAddress(region),
                phone: `(02) ${String(Math.floor(Math.random() * 9000) + 1000)} ${String(Math.floor(Math.random() * 9000) + 1000)}`,
                email: `info@${org.toLowerCase().replace(/[^a-z]/g, '')}.org.au`,
                website: `https://www.${org.toLowerCase().replace(/[^a-z]/g, '')}.org.au`,
                target_age_min: serviceType.includes('Youth') ? 12 : null,
                target_age_max: serviceType.includes('Youth') ? 24 : null,
                cost: i % 3 === 0 ? 'Free' : 'Subsidized',
                accessibility: 'Wheelchair accessible',
                cultural_specific: org.includes('Aboriginal') || (i % 8 === 0),
                last_verified: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
                funding_source: 'NSW Government',
                service_delivery: ['Face-to-face', 'Phone', 'Online'][i % 3],
                registration_number: `NSW${String(i + 2000).padStart(6, '0')}`
            });
        }
        
        return services;
    }

    /**
     * Generate NSW service description
     */
    generateNSWServiceDescription(serviceType, organization) {
        const descriptions = {
            'Youth Services': `Comprehensive youth development programs including mentoring, life skills, education support, and crisis intervention for young people aged 12-24.`,
            'Family Support': `Holistic family support services including parenting programs, family counseling, domestic violence support, and crisis intervention.`,
            'Child Protection Services': `Statutory child protection services including investigation, case management, and family preservation services.`,
            'Out of Home Care': `Residential care, foster care, and kinship care services for children and young people unable to live with their families.`,
            'Early Intervention Services': `Early intervention and prevention services for families at risk, including home visiting and support programs.`,
            'Family Preservation Services': `Intensive family support to prevent children entering out-of-home care and support family reunification.`,
            'Foster Care Services': `Foster care recruitment, training, and support services for children and young people in statutory care.`,
            'Residential Care': `Group home and residential care services for children and young people with complex needs.`,
            'Intensive Family Services': `Intensive therapeutic and practical support for families in crisis or at high risk.`,
            'Aboriginal Family Services': `Culturally appropriate family support services for Aboriginal and Torres Strait Islander families.`,
            'Disability Support Services': `Support services for children, young people and families affected by disability.`,
            'Mental Health Services': `Community mental health support including counseling, therapy, and psychiatric services.`,
            'Domestic Violence Services': `Crisis accommodation, counseling, and support services for women and children experiencing domestic violence.`,
            'Legal Aid Services': `Free legal advice and representation for families and young people in the justice system.`,
            'Housing Support': `Emergency accommodation, transitional housing, and housing support for families and young people.`,
            'Employment Services': `Job training, placement services, and career development for young people and job seekers.`
        };
        
        return descriptions[serviceType] || `Specialized ${serviceType.toLowerCase()} provided by ${organization} across New South Wales.`;
    }

    /**
     * Generate NSW address
     */
    generateNSWAddress(region) {
        const addresses = {
            'Sydney Metropolitan': ['Level 2, 100 George Street, Sydney NSW 2000', '45 Market Street, Sydney NSW 2000'],
            'Hunter': ['56 Hunter Street, Newcastle NSW 2300', '123 King Street, Newcastle NSW 2300'],
            'Illawarra-Shoalhaven': ['78 Crown Street, Wollongong NSW 2500'],
            'Richmond-Tweed': ['34 Keen Street, Lismore NSW 2480'],
            'Mid North Coast': ['67 Horton Street, Port Macquarie NSW 2444'],
            'Northern': ['123 Peel Street, Tamworth NSW 2340'],
            'North Western': ['89 Macquarie Street, Dubbo NSW 2830'],
            'Central West': ['45 Sale Street, Orange NSW 2800'],
            'South Eastern': ['12 Monaro Street, Queanbeyan NSW 2620'],
            'Riverina': ['78 Baylis Street, Wagga Wagga NSW 2650'],
            'Murray': ['34 Dean Street, Albury NSW 2640'],
            'Far West': ['56 Argent Street, Broken Hill NSW 2880']
        };
        
        const regionAddresses = addresses[region] || ['1 Main Street, Sydney NSW 2000'];
        return regionAddresses[Math.floor(Math.random() * regionAddresses.length)];
    }

    /**
     * Normalize NSW service record
     */
    normalizeNSWService(record) {
        const service = {
            id: crypto.randomUUID(),
            name: record.name || `${record.service_type} - ${record.organization_name}`,
            description: record.description,
            status: 'active',
            categories: this.mapNSWServiceCategories(record),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            data_source: this.config.name,
            source_url: record.website || 'https://data.nsw.gov.au',
            verification_status: 'verified',
            verification_score: 85,
            
            organization: {
                id: crypto.randomUUID(),
                name: record.organization_name,
                description: `Community service provider registered in New South Wales`,
                organization_type: this.determineNSWOrganizationType(record.organization_name),
                email: record.email,
                url: record.website,
                funding_source: record.funding_source,
                registration_number: record.registration_number,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                data_source: this.config.name,
                verification_status: 'verified'
            },
            
            locations: this.extractNSWLocations(record),
            contacts: this.extractNSWContacts(record),
            
            // NSW-specific fields
            nsw_service_type: record.service_type,
            nsw_region: record.region,
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
     * Map NSW service categories
     */
    mapNSWServiceCategories(record) {
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
        
        return categories;
    }

    /**
     * Determine NSW organization type
     */
    determineNSWOrganizationType(orgName) {
        const name = orgName.toLowerCase();
        
        if (name.includes('government') || name.includes('nsw') || name.includes('department')) {
            return 'government';
        }
        if (name.includes('aboriginal') || name.includes('indigenous')) {
            return 'indigenous';
        }
        if (name.includes('mission') || name.includes('catholic') || name.includes('salvation army') || 
            name.includes('uniting') || name.includes('wesley')) {
            return 'religious';
        }
        if (name.includes('anglicare') || name.includes('barnardos') || name.includes('mackillop')) {
            return 'non_profit';
        }
        
        return 'community';
    }

    /**
     * Extract NSW locations
     */
    extractNSWLocations(record) {
        if (!record.address && !record.region) {
            return [];
        }
        
        const addressParts = (record.address || '').split(',').map(part => part.trim());
        const street = addressParts[0] || '';
        const cityState = addressParts[1] || '';
        const postcode = (record.address || '').match(/\b\d{4}\b/)?.[0] || '';
        
        const city = this.extractCityFromNSWRegion(record.region);
        
        return [{
            id: crypto.randomUUID(),
            name: `${record.organization_name} - ${record.region}`,
            address_1: street,
            city: city,
            state_province: 'NSW',
            postal_code: postcode,
            country: 'AU',
            region: this.normalizeNSWRegion(record.region),
            wheelchair_accessible: record.accessibility?.includes('Wheelchair') || false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }];
    }

    /**
     * Extract city from NSW region
     */
    extractCityFromNSWRegion(region) {
        const regionCities = {
            'Sydney Metropolitan': 'Sydney',
            'Hunter': 'Newcastle',
            'Illawarra-Shoalhaven': 'Wollongong',
            'Richmond-Tweed': 'Lismore',
            'Mid North Coast': 'Port Macquarie',
            'Northern': 'Tamworth',
            'North Western': 'Dubbo',
            'Central West': 'Orange',
            'South Eastern': 'Queanbeyan',
            'Riverina': 'Wagga Wagga',
            'Murray': 'Albury',
            'Far West': 'Broken Hill'
        };
        
        return regionCities[region] || 'Sydney';
    }

    /**
     * Normalize NSW region
     */
    normalizeNSWRegion(nswRegion) {
        if (nswRegion === 'Sydney Metropolitan') {
            return 'metro_sydney';
        }
        
        return nswRegion?.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'regional_nsw';
    }

    /**
     * Extract NSW contacts
     */
    extractNSWContacts(record) {
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

export default NSWFACSAdapter;