/**
 * Deduplication Engine
 * 
 * Identifies and manages duplicate service records across multiple data sources
 * using fuzzy matching algorithms and confidence scoring.
 */

import { distance } from 'fastest-levenshtein';
import crypto from 'crypto';

export class DeduplicationEngine {
    constructor(config = {}) {
        this.config = {
            // Similarity thresholds (0-1)
            nameThreshold: config.nameThreshold || 0.85,
            organizationThreshold: config.organizationThreshold || 0.80,
            locationThreshold: config.locationThreshold || 0.90,
            
            // Distance thresholds
            maxLocationDistance: config.maxLocationDistance || 2000, // meters
            
            // Confidence levels
            highConfidenceThreshold: config.highConfidenceThreshold || 0.90,
            mediumConfidenceThreshold: config.mediumConfidenceThreshold || 0.70,
            
            // Auto-merge settings
            autoMergeThreshold: config.autoMergeThreshold || 0.95,
            requireManualReview: config.requireManualReview !== false,
            
            ...config
        };
        
        this.duplicatePairs = [];
        this.mergedServices = new Map();
        this.stats = {
            totalChecked: 0,
            duplicatesFound: 0,
            autoMerged: 0,
            pendingReview: 0,
            processingTime: 0
        };
    }

    /**
     * Find duplicates in a batch of services
     * @param {Array} services - Array of service records
     * @param {Array} existingServices - Existing services to check against
     * @returns {Object} Deduplication results
     */
    async findDuplicates(services, existingServices = []) {
        const startTime = Date.now();
        this.duplicatePairs = [];
        this.stats.totalChecked = 0;
        this.stats.duplicatesFound = 0;
        
        console.log(`Starting deduplication for ${services.length} services against ${existingServices.length} existing services`);
        
        // Check new services against existing services
        for (const service of services) {
            for (const existing of existingServices) {
                await this.checkPair(service, existing, 'existing');
            }
        }
        
        // Check new services against each other
        for (let i = 0; i < services.length; i++) {
            for (let j = i + 1; j < services.length; j++) {
                await this.checkPair(services[i], services[j], 'new');
            }
            
            this.stats.totalChecked++;
            
            // Progress logging
            if (this.stats.totalChecked % 100 === 0) {
                console.log(`Checked ${this.stats.totalChecked}/${services.length} services for duplicates`);
            }
        }
        
        this.stats.processingTime = Date.now() - startTime;
        
        console.log(`Deduplication complete: Found ${this.stats.duplicatesFound} potential duplicates in ${this.stats.processingTime}ms`);
        
        return {
            duplicatePairs: this.duplicatePairs,
            stats: this.stats,
            autoMergedServices: Array.from(this.mergedServices.values())
        };
    }

    /**
     * Check if two services are duplicates
     * @param {Object} service1 - First service
     * @param {Object} service2 - Second service
     * @param {string} type - Comparison type ('existing' or 'new')
     * @returns {Promise<Object|null>} Duplicate match info or null
     */
    async checkPair(service1, service2, type = 'new') {
        // Skip if same service
        if (service1.id === service2.id) {
            return null;
        }
        
        // Calculate various similarity scores
        const scores = {
            name: this.calculateNameSimilarity(service1, service2),
            organization: this.calculateOrganizationSimilarity(service1, service2),
            location: this.calculateLocationSimilarity(service1, service2),
            contact: this.calculateContactSimilarity(service1, service2),
            abn: this.calculateABNSimilarity(service1, service2)
        };
        
        // Determine match type and confidence
        const match = this.evaluateMatch(scores, service1, service2);
        
        if (match) {
            const duplicateInfo = {
                id: crypto.randomUUID(),
                service1: {
                    id: service1.id,
                    name: service1.name,
                    organization: service1.organization?.name,
                    source: service1.data_source
                },
                service2: {
                    id: service2.id,
                    name: service2.name,
                    organization: service2.organization?.name,
                    source: service2.data_source
                },
                scores,
                matchType: match.type,
                confidence: match.confidence,
                autoMerge: match.confidence >= this.config.autoMergeThreshold,
                comparisonType: type,
                foundAt: new Date().toISOString()
            };
            
            this.duplicatePairs.push(duplicateInfo);
            this.stats.duplicatesFound++;
            
            // Auto-merge if confidence is high enough
            if (duplicateInfo.autoMerge && !this.config.requireManualReview) {
                const mergedService = this.mergeServices(service1, service2, match);
                this.mergedServices.set(mergedService.id, mergedService);
                this.stats.autoMerged++;
            } else {
                this.stats.pendingReview++;
            }
            
            return duplicateInfo;
        }
        
        return null;
    }

    /**
     * Calculate name similarity between two services
     * @param {Object} service1 - First service
     * @param {Object} service2 - Second service
     * @returns {number} Similarity score (0-1)
     */
    calculateNameSimilarity(service1, service2) {
        const name1 = this.normalizeText(service1.name || '');
        const name2 = this.normalizeText(service2.name || '');
        
        if (!name1 || !name2) return 0;
        
        // Exact match
        if (name1 === name2) return 1;
        
        // Levenshtein distance similarity
        const maxLength = Math.max(name1.length, name2.length);
        const levenshteinScore = 1 - (distance(name1, name2) / maxLength);
        
        // Jaccard similarity (word overlap)
        const words1 = new Set(name1.split(/\s+/));
        const words2 = new Set(name2.split(/\s+/));
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        const jaccardScore = intersection.size / union.size;
        
        // Weighted combination
        return (levenshteinScore * 0.6) + (jaccardScore * 0.4);
    }

    /**
     * Calculate organization similarity
     * @param {Object} service1 - First service
     * @param {Object} service2 - Second service
     * @returns {number} Similarity score (0-1)
     */
    calculateOrganizationSimilarity(service1, service2) {
        const org1 = this.normalizeText(service1.organization?.name || '');
        const org2 = this.normalizeText(service2.organization?.name || '');
        
        if (!org1 || !org2) return 0;
        
        // Exact match
        if (org1 === org2) return 1;
        
        // Remove common organizational suffixes for comparison
        const cleanOrg1 = this.removeOrgSuffixes(org1);
        const cleanOrg2 = this.removeOrgSuffixes(org2);
        
        if (cleanOrg1 === cleanOrg2) return 0.95;
        
        // Levenshtein similarity
        const maxLength = Math.max(cleanOrg1.length, cleanOrg2.length);
        return 1 - (distance(cleanOrg1, cleanOrg2) / maxLength);
    }

    /**
     * Calculate location similarity
     * @param {Object} service1 - First service
     * @param {Object} service2 - Second service
     * @returns {number} Similarity score (0-1)
     */
    calculateLocationSimilarity(service1, service2) {
        const locations1 = service1.locations || [];
        const locations2 = service2.locations || [];
        
        if (locations1.length === 0 || locations2.length === 0) return 0;
        
        let maxSimilarity = 0;
        
        // Compare all location pairs
        for (const loc1 of locations1) {
            for (const loc2 of locations2) {
                const similarity = this.compareLocations(loc1, loc2);
                maxSimilarity = Math.max(maxSimilarity, similarity);
            }
        }
        
        return maxSimilarity;
    }

    /**
     * Compare two location objects
     * @param {Object} loc1 - First location
     * @param {Object} loc2 - Second location
     * @returns {number} Similarity score (0-1)
     */
    compareLocations(loc1, loc2) {
        let score = 0;
        let maxScore = 0;
        
        // Address similarity
        if (loc1.address_1 && loc2.address_1) {
            const addressSim = this.calculateTextSimilarity(loc1.address_1, loc2.address_1);
            score += addressSim * 0.4;
            maxScore += 0.4;
        }
        
        // City similarity
        if (loc1.city && loc2.city) {
            const citySim = this.calculateTextSimilarity(loc1.city, loc2.city);
            score += citySim * 0.2;
            maxScore += 0.2;
        }
        
        // Postal code exact match
        if (loc1.postal_code && loc2.postal_code) {
            if (loc1.postal_code === loc2.postal_code) {
                score += 0.2;
            }
            maxScore += 0.2;
        }
        
        // Geographic distance
        if (loc1.latitude && loc1.longitude && loc2.latitude && loc2.longitude) {
            const distanceMeters = this.calculateDistance(
                loc1.latitude, loc1.longitude,
                loc2.latitude, loc2.longitude
            );
            
            let distanceScore = 0;
            if (distanceMeters < 100) {
                distanceScore = 1;
            } else if (distanceMeters < this.config.maxLocationDistance) {
                distanceScore = 1 - (distanceMeters / this.config.maxLocationDistance);
            }
            
            score += distanceScore * 0.2;
            maxScore += 0.2;
        }
        
        return maxScore > 0 ? score / maxScore : 0;
    }

    /**
     * Calculate contact similarity
     * @param {Object} service1 - First service
     * @param {Object} service2 - Second service
     * @returns {number} Similarity score (0-1)
     */
    calculateContactSimilarity(service1, service2) {
        let score = 0;
        let checks = 0;
        
        // Email comparison
        const email1 = service1.email || service1.contacts?.[0]?.email;
        const email2 = service2.email || service2.contacts?.[0]?.email;
        
        if (email1 && email2) {
            score += email1.toLowerCase() === email2.toLowerCase() ? 1 : 0;
            checks++;
        }
        
        // Phone comparison
        const phone1 = this.extractPhone(service1);
        const phone2 = this.extractPhone(service2);
        
        if (phone1 && phone2) {
            score += this.comparePhoneNumbers(phone1, phone2) ? 1 : 0;
            checks++;
        }
        
        // Website comparison
        if (service1.url && service2.url) {
            const domain1 = this.extractDomain(service1.url);
            const domain2 = this.extractDomain(service2.url);
            score += domain1 === domain2 ? 1 : 0;
            checks++;
        }
        
        return checks > 0 ? score / checks : 0;
    }

    /**
     * Calculate ABN/ACN similarity
     * @param {Object} service1 - First service
     * @param {Object} service2 - Second service
     * @returns {number} Similarity score (0-1)
     */
    calculateABNSimilarity(service1, service2) {
        const abn1 = service1.organization?.tax_id || service1.abn;
        const abn2 = service2.organization?.tax_id || service2.abn;
        
        if (!abn1 || !abn2) return 0;
        
        // Clean ABNs (remove spaces, hyphens)
        const cleanABN1 = abn1.replace(/\D/g, '');
        const cleanABN2 = abn2.replace(/\D/g, '');
        
        return cleanABN1 === cleanABN2 ? 1 : 0;
    }

    /**
     * Evaluate match based on similarity scores
     * @param {Object} scores - Similarity scores
     * @param {Object} service1 - First service
     * @param {Object} service2 - Second service
     * @returns {Object|null} Match evaluation
     */
    evaluateMatch(scores, service1, service2) {
        // Exact ABN match = certain duplicate
        if (scores.abn === 1) {
            return {
                type: 'abn_match',
                confidence: 1.0,
                reason: 'Identical ABN/ACN'
            };
        }
        
        // High confidence contact match
        if (scores.contact >= 0.8 && scores.name >= 0.7) {
            return {
                type: 'contact_match',
                confidence: (scores.contact * 0.6) + (scores.name * 0.4),
                reason: 'Strong contact and name similarity'
            };
        }
        
        // High confidence location + name match
        if (scores.location >= 0.9 && scores.name >= 0.8) {
            return {
                type: 'location_name_match',
                confidence: (scores.location * 0.5) + (scores.name * 0.5),
                reason: 'Same location with similar name'
            };
        }
        
        // Organization + name match
        if (scores.organization >= 0.85 && scores.name >= 0.75) {
            return {
                type: 'organization_match',
                confidence: (scores.organization * 0.6) + (scores.name * 0.4),
                reason: 'Same organization with similar service name'
            };
        }
        
        // Fuzzy name match with supporting evidence
        if (scores.name >= this.config.nameThreshold) {
            let supportingEvidence = 0;
            let confidence = scores.name * 0.5;
            
            if (scores.organization >= 0.7) {
                supportingEvidence++;
                confidence += scores.organization * 0.2;
            }
            
            if (scores.location >= 0.7) {
                supportingEvidence++;
                confidence += scores.location * 0.2;
            }
            
            if (scores.contact >= 0.7) {
                supportingEvidence++;
                confidence += scores.contact * 0.1;
            }
            
            if (supportingEvidence >= 1) {
                return {
                    type: 'fuzzy_match',
                    confidence: Math.min(confidence, 1.0),
                    reason: `Name similarity with ${supportingEvidence} supporting factors`
                };
            }
        }
        
        return null;
    }

    /**
     * Merge two duplicate services
     * @param {Object} service1 - First service (primary)
     * @param {Object} service2 - Second service (secondary)
     * @param {Object} match - Match information
     * @returns {Object} Merged service
     */
    mergeServices(service1, service2, match) {
        // Use the service with higher quality score as primary
        const primary = (service1.completeness_score || 0) >= (service2.completeness_score || 0) 
            ? service1 : service2;
        const secondary = primary === service1 ? service2 : service1;
        
        const merged = {
            ...primary,
            id: primary.id, // Keep primary ID
            
            // Merge descriptions if one is significantly longer
            description: this.mergeFields(
                primary.description, 
                secondary.description, 
                'longest'
            ),
            
            // Merge categories
            categories: [...new Set([
                ...(primary.categories || []),
                ...(secondary.categories || [])
            ])],
            
            // Merge locations
            locations: this.mergeLocations(
                primary.locations || [], 
                secondary.locations || []
            ),
            
            // Merge contacts
            contacts: this.mergeContacts(
                primary.contacts || [], 
                secondary.contacts || []
            ),
            
            // Use best available contact info
            email: primary.email || secondary.email,
            url: primary.url || secondary.url,
            
            // Merge organization info
            organization: this.mergeOrganizations(
                primary.organization, 
                secondary.organization
            ),
            
            // Update metadata
            updated_at: new Date().toISOString(),
            data_source: `${primary.data_source}, ${secondary.data_source}`,
            verification_status: this.getBestVerificationStatus(
                primary.verification_status, 
                secondary.verification_status
            ),
            
            // Store merge info
            _merged: {
                duplicateId: match.id || crypto.randomUUID(),
                primaryServiceId: primary.id,
                secondaryServiceId: secondary.id,
                matchType: match.type,
                confidence: match.confidence,
                mergedAt: new Date().toISOString()
            }
        };
        
        // Recalculate quality scores
        merged.completeness_score = Math.max(
            primary.completeness_score || 0,
            secondary.completeness_score || 0
        );
        
        return merged;
    }

    /**
     * Normalize text for comparison
     * @param {string} text - Text to normalize
     * @returns {string} Normalized text
     */
    normalizeText(text) {
        if (!text) return '';
        
        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
            .replace(/\s+/g, ' ')     // Collapse multiple spaces
            .trim();
    }

    /**
     * Remove common organizational suffixes
     * @param {string} orgName - Organization name
     * @returns {string} Cleaned name
     */
    removeOrgSuffixes(orgName) {
        const suffixes = [
            'inc', 'incorporated', 'ltd', 'limited', 'pty', 'proprietary',
            'llc', 'corp', 'corporation', 'co', 'company', 'association',
            'assoc', 'org', 'organization', 'society', 'foundation'
        ];
        
        let cleaned = orgName;
        for (const suffix of suffixes) {
            const regex = new RegExp(`\\b${suffix}\\b$`, 'i');
            cleaned = cleaned.replace(regex, '').trim();
        }
        
        return cleaned;
    }

    /**
     * Calculate text similarity
     * @param {string} text1 - First text
     * @param {string} text2 - Second text
     * @returns {number} Similarity score (0-1)
     */
    calculateTextSimilarity(text1, text2) {
        const norm1 = this.normalizeText(text1);
        const norm2 = this.normalizeText(text2);
        
        if (!norm1 || !norm2) return 0;
        if (norm1 === norm2) return 1;
        
        const maxLength = Math.max(norm1.length, norm2.length);
        return 1 - (distance(norm1, norm2) / maxLength);
    }

    /**
     * Calculate distance between two coordinates
     * @param {number} lat1 - First latitude
     * @param {number} lon1 - First longitude
     * @param {number} lat2 - Second latitude
     * @param {number} lon2 - Second longitude
     * @returns {number} Distance in meters
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Earth's radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    /**
     * Extract phone number from service
     * @param {Object} service - Service object
     * @returns {string|null} Phone number
     */
    extractPhone(service) {
        if (service.phone) return service.phone;
        if (service.contacts?.[0]?.phone?.[0]?.number) {
            return service.contacts[0].phone[0].number;
        }
        return null;
    }

    /**
     * Compare phone numbers
     * @param {string} phone1 - First phone number
     * @param {string} phone2 - Second phone number
     * @returns {boolean} True if same number
     */
    comparePhoneNumbers(phone1, phone2) {
        // Remove all non-digits
        const clean1 = phone1.replace(/\D/g, '');
        const clean2 = phone2.replace(/\D/g, '');
        
        // Handle Australian numbers (remove country code)
        const normalizeAU = (phone) => {
            if (phone.startsWith('61') && phone.length === 11) {
                return phone.substring(2);
            }
            return phone;
        };
        
        const norm1 = normalizeAU(clean1);
        const norm2 = normalizeAU(clean2);
        
        return norm1 === norm2;
    }

    /**
     * Extract domain from URL
     * @param {string} url - URL
     * @returns {string|null} Domain
     */
    extractDomain(url) {
        try {
            return new URL(url).hostname.toLowerCase();
        } catch {
            return null;
        }
    }

    /**
     * Merge field values
     * @param {*} value1 - First value
     * @param {*} value2 - Second value
     * @param {string} strategy - Merge strategy
     * @returns {*} Merged value
     */
    mergeFields(value1, value2, strategy = 'first') {
        if (!value1) return value2;
        if (!value2) return value1;
        
        switch (strategy) {
            case 'longest':
                return value1.length >= value2.length ? value1 : value2;
            case 'shortest':
                return value1.length <= value2.length ? value1 : value2;
            case 'concat':
                return `${value1} | ${value2}`;
            default:
                return value1;
        }
    }

    /**
     * Merge location arrays
     * @param {Array} locations1 - First locations
     * @param {Array} locations2 - Second locations
     * @returns {Array} Merged locations
     */
    mergeLocations(locations1, locations2) {
        const merged = [...locations1];
        
        for (const loc2 of locations2) {
            const isDuplicate = merged.some(loc1 => 
                this.compareLocations(loc1, loc2) > 0.8
            );
            
            if (!isDuplicate) {
                merged.push(loc2);
            }
        }
        
        return merged;
    }

    /**
     * Merge contact arrays
     * @param {Array} contacts1 - First contacts
     * @param {Array} contacts2 - Second contacts
     * @returns {Array} Merged contacts
     */
    mergeContacts(contacts1, contacts2) {
        const merged = [...contacts1];
        
        for (const contact2 of contacts2) {
            const isDuplicate = merged.some(contact1 => 
                contact1.email === contact2.email ||
                this.comparePhoneNumbers(
                    contact1.phone?.[0]?.number || '',
                    contact2.phone?.[0]?.number || ''
                )
            );
            
            if (!isDuplicate) {
                merged.push(contact2);
            }
        }
        
        return merged;
    }

    /**
     * Merge organization objects
     * @param {Object} org1 - First organization
     * @param {Object} org2 - Second organization
     * @returns {Object} Merged organization
     */
    mergeOrganizations(org1, org2) {
        if (!org1) return org2;
        if (!org2) return org1;
        
        return {
            ...org1,
            description: this.mergeFields(org1.description, org2.description, 'longest'),
            email: org1.email || org2.email,
            url: org1.url || org2.url,
            tax_id: org1.tax_id || org2.tax_id
        };
    }

    /**
     * Get best verification status
     * @param {string} status1 - First status
     * @param {string} status2 - Second status
     * @returns {string} Best status
     */
    getBestVerificationStatus(status1, status2) {
        const statusRank = {
            'verified': 3,
            'pending': 2,
            'unverified': 1,
            'rejected': 0
        };
        
        const rank1 = statusRank[status1] || 0;
        const rank2 = statusRank[status2] || 0;
        
        return rank1 >= rank2 ? status1 : status2;
    }

    /**
     * Get deduplication statistics
     * @returns {Object} Statistics
     */
    getStats() {
        return {
            ...this.stats,
            duplicatePairs: this.duplicatePairs.length,
            mergedServices: this.mergedServices.size,
            averageProcessingTime: this.stats.totalChecked > 0 
                ? this.stats.processingTime / this.stats.totalChecked 
                : 0
        };
    }
}

export default DeduplicationEngine;