/**
 * Queensland Open Data Adapter
 * 
 * Integrates with Queensland Government Open Data Portal to extract
 * youth justice centers and community services data.
 * 
 * Primary datasets:
 * - Youth Justice Centre Locations
 * - Community services and programs
 */

import { BaseAdapter } from './base-adapter.js';
import axios from 'axios';
import crypto from 'crypto';

export class QLDDataAdapter extends BaseAdapter {
    constructor(config = {}) {
        super({
            name: 'Queensland Open Data Portal',
            type: 'api',
            baseUrl: config.baseUrl || 'https://data.qld.gov.au/api/3',
            rateLimit: { requests: 100, window: 60 }, // Government API - generous limits
            timeout: 30000,
            respectRobotsTxt: true,
            ...config
        });
        
        this.axios = axios.create({
            baseURL: this.config.baseUrl,
            timeout: this.config.timeout,
            maxRedirects: 5,
            headers: {
                'User-Agent': 'Youth Justice Service Finder - Public Benefit Service',
                'Accept': 'application/json'
            }
        });
        
        // Key datasets for youth services
        this.datasets = {
            youthJusticeCentres: {
                id: 'youth-justice-centre-locations',
                csvUrl: 'https://www.families.qld.gov.au/_media/documents/open-data/youth-justice-centre-locations.csv',
                name: 'Youth Justice Centre Locations',
                description: 'Locations and contact details of Queensland youth justice centres'
            },
            communityServices: {
                // Additional datasets can be added here as discovered
                id: null,
                name: 'Community Services Directory',
                description: 'Queensland community services and programs'
            }
        };
        
        // Service categories relevant to youth justice
        this.serviceTypes = [
            'Youth Justice Centre',
            'Community Service Centre',
            'Family Support Service',
            'Youth Support Program',
            'Legal Aid Service',
            'Mental Health Service',
            'Accommodation Service',
            'Drug and Alcohol Service'
        ];
    }

    /**
     * Validate API connectivity
     * @returns {Promise<Object>} Validation result
     */
    async validate() {
        try {
            const response = await this.axios.get('/action/package_list', {
                params: { q: 'youth' }
            });
            
            return {
                isValid: true,
                message: 'Queensland Open Data API connection successful',
                datasetsAvailable: response.data.result?.length || 0,
                rateLimit: 'Government API - No restrictions'
            };
        } catch (error) {
            return {
                isValid: false,
                message: `Queensland Open Data API validation failed: ${error.message}`,
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
            // Get metadata for youth justice centres dataset
            let packageData = null;
            if (this.datasets.youthJusticeCentres.id) {
                const packageResponse = await this.axios.get('/action/package_show', {
                    params: { id: this.datasets.youthJusticeCentres.id }
                });
                packageData = packageResponse.data.result;
            }
            
            return {
                name: this.config.name,
                type: this.config.type,
                baseUrl: this.config.baseUrl,
                lastUpdate: packageData?.metadata_modified || new Date().toISOString(),
                isActive: true,
                estimatedRecords: 50, // Conservative estimate for Queensland
                coverage: 'Queensland, Australia',
                dataQuality: 'Government-verified (Queensland Government)',
                updateFrequency: 'Annually',
                licensing: 'Creative Commons Attribution 4.0',
                categories: this.serviceTypes,
                datasets: Object.keys(this.datasets).length
            };
        } catch (error) {
            return {
                name: this.config.name,
                type: this.config.type,
                baseUrl: this.config.baseUrl,
                lastUpdate: new Date().toISOString(),
                isActive: false,
                estimatedRecords: 50,
                coverage: 'Queensland, Australia',
                error: error.message
            };
        }
    }

    /**
     * Extract youth services and justice centre data
     * @param {Object} options - Extraction options
     * @returns {Promise<Array>} Array of normalized service records
     */
    async extract(options = {}) {
        this.updateStats('start');
        
        const {
            limit = 100,
            offset = 0,
            datasets = ['youthJusticeCentres'], // Which datasets to extract from
            regions = [], // Specific Queensland regions
            serviceTypes = this.serviceTypes
        } = options;
        
        const extractedServices = [];
        
        try {
            console.log(`Extracting data from Queensland Open Data Portal...`);
            
            // Extract from each requested dataset
            for (const datasetKey of datasets) {
                const dataset = this.datasets[datasetKey];
                if (!dataset || !dataset.id) {
                    console.log(`Skipping dataset ${datasetKey} - no ID configured`);
                    continue;
                }
                
                console.log(`Processing dataset: ${dataset.name}`);
                
                try {
                    // Use direct CSV URL if available, otherwise use API package system
                    let csvUrl = dataset.csvUrl;
                    
                    if (!csvUrl) {
                        // Fallback to package API
                        const packageResponse = await this.axios.get('/action/package_show', {
                            params: { id: dataset.id }
                        });
                        
                        const resources = packageResponse.data.result.resources;
                        const csvResource = resources.find(r => 
                            r.format === 'CSV' || 
                            r.url.includes('.csv') ||
                            r.mimetype === 'text/csv'
                        );
                        
                        if (!csvResource) {
                            console.log(`No CSV resource found for ${dataset.name}`);
                            continue;
                        }
                        
                        csvUrl = csvResource.url;
                    }
                    
                    console.log(`Fetching data from: ${csvUrl}`);
                    
                    // Fetch CSV data
                    const csvResponse = await axios.get(csvUrl, {
                        responseType: 'text',
                        timeout: 60000,
                        maxRedirects: 5,
                        headers: {
                            'User-Agent': 'Youth Justice Service Finder - Public Benefit Service'
                        }
                    });
                    
                    const records = this.parseQLDCSV(csvResponse.data, dataset);
                    console.log(`Parsed ${records.length} records from ${dataset.name}`);
                    
                    // Filter and process records
                    const filteredRecords = records
                        .filter(record => this.isRelevantService(record, serviceTypes, regions))
                        .slice(offset, offset + limit);
                    
                    console.log(`Filtered to ${filteredRecords.length} relevant services`);
                    
                    // Convert to normalized services
                    for (const record of filteredRecords) {
                        this.updateStats('processed');
                        
                        try {
                            const normalizedService = this.normalizeQLDRecord(record, dataset);
                            
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
                    
                } catch (datasetError) {
                    console.error(`Error processing dataset ${dataset.name}:`, datasetError.message);
                    this.updateStats('error', { error: datasetError.message });
                }
            }
            
            this.updateStats('end');
            
            return {
                services: extractedServices,
                pagination: {
                    total: extractedServices.length,
                    offset,
                    limit,
                    hasMore: false // CSV datasets are complete
                },
                stats: this.getStats()
            };
            
        } catch (error) {
            this.updateStats('error', { error: error.message });
            console.error('Queensland Open Data extraction error:', error);
            throw error;
        }
    }

    /**
     * Parse Queensland CSV data
     * @param {string} csvData - Raw CSV content
     * @param {Object} dataset - Dataset metadata
     * @returns {Array} Parsed records
     */
    parseQLDCSV(csvData, dataset) {
        const lines = csvData.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const records = [];
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = this.parseCSVLine(line);
            if (values.length !== headers.length) continue;
            
            const record = { dataset: dataset.name };
            headers.forEach((header, index) => {
                record[this.normalizeHeader(header)] = values[index]?.trim().replace(/"/g, '') || '';
            });
            
            records.push(record);
        }
        
        return records;
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
     * Check if record is relevant to youth services
     * @param {Object} record - Service record
     * @param {Array} serviceTypes - Allowed service types
     * @param {Array} regions - Allowed regions
     * @returns {boolean} True if relevant
     */
    isRelevantService(record, serviceTypes, regions) {
        // Check service type relevance
        const recordText = JSON.stringify(record).toLowerCase();
        const hasRelevantType = serviceTypes.some(type => 
            recordText.includes(type.toLowerCase()) ||
            recordText.includes('youth') ||
            recordText.includes('justice') ||
            recordText.includes('community') ||
            recordText.includes('family') ||
            recordText.includes('support')
        );
        
        // Check regional filter
        if (regions.length > 0) {
            const hasRelevantRegion = regions.some(region =>
                recordText.includes(region.toLowerCase())
            );
            return hasRelevantType && hasRelevantRegion;
        }
        
        return hasRelevantType;
    }

    /**
     * Normalize Queensland record to service schema
     * @param {Object} record - Raw Queensland data
     * @param {Object} dataset - Dataset metadata
     * @returns {Object} Normalized service
     */
    normalizeQLDRecord(record, dataset) {
        const service = {
            id: crypto.randomUUID(),
            name: record.title || record.name || record.facility_name || record.centre_name || 'Queensland Service',
            description: this.buildServiceDescription(record, dataset),
            status: 'active', // Queensland open data represents active services
            categories: this.mapServiceCategories(record, dataset),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            data_source: this.config.name,
            source_url: `https://data.qld.gov.au/dataset/${dataset.id}`,
            verification_status: 'verified', // Government data = verified
            verification_score: 85, // High score for government source
            
            // Organization info
            organization: {
                id: crypto.randomUUID(),
                name: record.agency || record.organisation || 'Department of Youth Justice',
                description: `Queensland Government Service - ${dataset.name}`,
                organization_type: 'government',
                legal_status: 'Government Agency',
                url: record.website || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                data_source: this.config.name,
                verification_status: 'verified'
            },
            
            // Location info
            locations: this.extractServiceLocations(record),
            
            // Contact info
            contacts: this.extractServiceContacts(record),
            
            // Queensland-specific detection
            youth_specific: this.isYouthSpecificService(record),
            indigenous_specific: this.isIndigenousService(record),
            
            // Additional Queensland fields
            qld_dataset: dataset.name,
            qld_service_type: record.service_type || record.type,
            qld_operating_hours: record.operating_hours || record.hours
        };
        
        // Calculate quality score
        service.completeness_score = this.calculateCompletenessScore(service);
        
        return service;
    }

    /**
     * Build service description from Queensland data
     * @param {Object} record - Service record
     * @param {Object} dataset - Dataset metadata
     * @returns {string} Service description
     */
    buildServiceDescription(record, dataset) {
        const parts = [];
        
        parts.push(`${dataset.name} service`);
        
        if (record.description) {
            parts.push(record.description);
        }
        
        if (record.services_provided) {
            parts.push(`Services: ${record.services_provided}`);
        }
        
        if (record.target_audience) {
            parts.push(`Target audience: ${record.target_audience}`);
        }
        
        parts.push('Verified Queensland Government service');
        
        return parts.join('. ') || 'Queensland Government community service.';
    }

    /**
     * Map service categories to our taxonomy
     * @param {Object} record - Service record
     * @param {Object} dataset - Dataset metadata
     * @returns {Array} Service categories
     */
    mapServiceCategories(record, dataset) {
        const categories = [];
        
        // Map based on dataset type
        if (dataset.name.includes('Youth Justice')) {
            categories.push('youth_justice');
            categories.push('government_service');
        }
        
        // Map based on service type
        const serviceType = (record.service_type || record.type || '').toLowerCase();
        const description = (record.description || '').toLowerCase();
        
        if (serviceType.includes('family') || description.includes('family')) {
            categories.push('family_support');
        }
        
        if (serviceType.includes('legal') || description.includes('legal')) {
            categories.push('legal_aid');
        }
        
        if (serviceType.includes('health') || description.includes('health')) {
            categories.push('health_services');
        }
        
        if (serviceType.includes('housing') || description.includes('housing')) {
            categories.push('housing');
        }
        
        if (serviceType.includes('education') || description.includes('education')) {
            categories.push('education_support');
        }
        
        if (serviceType.includes('mental') || description.includes('mental')) {
            categories.push('mental_health');
        }
        
        return categories.length > 0 ? categories : ['community_service'];
    }

    /**
     * Extract location information from record
     * @param {Object} record - Service record
     * @returns {Array} Location objects
     */
    extractServiceLocations(record) {
        const locations = [];
        
        if (record.address_1 || record.suburb || record.location) {
            locations.push({
                id: crypto.randomUUID(),
                name: record.title || record.name || 'Queensland Service Location',
                address_1: record.address_1 || record.address || '',
                address_2: record.address_2 || '',
                city: record.suburb || record.city || record.locality || '',
                state_province: 'QLD',
                postal_code: record.postcode || '',
                country: 'AU',
                region: this.determineQLDRegion(record),
                latitude: parseFloat(record.latitude) || null,
                longitude: parseFloat(record.longitude) || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        }
        
        return locations;
    }

    /**
     * Extract contact information from record
     * @param {Object} record - Service record
     * @returns {Array} Contact objects
     */
    extractServiceContacts(record) {
        const contacts = [];
        
        if (record.phone || record.email || record.contact) {
            const phones = [];
            if (record.phone) phones.push(record.phone);
            if (record.telephone) phones.push(record.telephone);
            
            contacts.push({
                id: crypto.randomUUID(),
                name: `${record.name || 'Service'} Contact`,
                email: record.email || null,
                phone: phones,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        }
        
        return contacts;
    }

    /**
     * Check if service is youth-specific
     * @param {Object} record - Service record
     * @returns {boolean} True if youth-specific
     */
    isYouthSpecificService(record) {
        const text = JSON.stringify(record).toLowerCase();
        const youthKeywords = ['youth', 'young', 'teen', 'adolescent', 'juvenile', 'child'];
        return youthKeywords.some(keyword => text.includes(keyword));
    }

    /**
     * Check if service is Indigenous-specific
     * @param {Object} record - Service record
     * @returns {boolean} True if Indigenous-specific
     */
    isIndigenousService(record) {
        const text = JSON.stringify(record).toLowerCase();
        const indigenousKeywords = ['aboriginal', 'indigenous', 'torres strait', 'first nations', 'atsi'];
        return indigenousKeywords.some(keyword => text.includes(keyword));
    }

    /**
     * Determine Queensland region from record data
     * @param {Object} record - Service record
     * @returns {string} Region classification
     */
    determineQLDRegion(record) {
        const location = `${record.suburb || ''} ${record.city || ''} ${record.locality || ''}`.toLowerCase();
        
        // Major cities
        if (location.includes('brisbane') || location.includes('gold coast') || location.includes('sunshine coast')) {
            return 'metro_queensland';
        }
        
        // Regional centers
        if (location.includes('townsville') || location.includes('cairns') || location.includes('toowoomba') || 
            location.includes('rockhampton') || location.includes('mackay')) {
            return 'regional_queensland';
        }
        
        return 'remote_queensland';
    }

    /**
     * Validate service meets minimum requirements
     * @param {Object} service - Normalized service
     * @returns {boolean} True if valid
     */
    validateService(service) {
        return service.name && 
               service.name.length >= 3 && 
               service.locations?.length > 0 && // Must have location
               service.categories?.length > 0;
    }
}

export default QLDDataAdapter;