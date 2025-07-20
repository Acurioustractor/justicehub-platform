/**
 * Quality Assessment Engine
 * 
 * Evaluates and scores the quality of service data based on completeness,
 * freshness, source reliability, and other quality indicators.
 */

export class QualityEngine {
    constructor(config = {}) {
        this.config = {
            // Scoring weights (must sum to 1.0)
            weights: {
                completeness: config.weights?.completeness || 0.40,
                sourceReliability: config.weights?.sourceReliability || 0.25,
                dataFreshness: config.weights?.dataFreshness || 0.20,
                contactVerification: config.weights?.contactVerification || 0.10,
                communityValidation: config.weights?.communityValidation || 0.05
            },
            
            // Freshness thresholds (days)
            freshness: {
                excellent: config.freshness?.excellent || 30,
                good: config.freshness?.good || 90,
                fair: config.freshness?.fair || 180,
                poor: config.freshness?.poor || 365
            },
            
            // Source reliability scores
            sourceReliability: {
                government: config.sourceReliability?.government || 1.0,
                verified_ngo: config.sourceReliability?.verified_ngo || 0.9,
                community: config.sourceReliability?.community || 0.7,
                scraped: config.sourceReliability?.scraped || 0.5,
                unknown: config.sourceReliability?.unknown || 0.3
            },
            
            // Quality thresholds
            thresholds: {
                excellent: config.thresholds?.excellent || 0.85,
                good: config.thresholds?.good || 0.70,
                fair: config.thresholds?.fair || 0.55,
                poor: config.thresholds?.poor || 0.40
            },
            
            ...config
        };
        
        this.stats = {
            servicesAssessed: 0,
            averageScore: 0,
            scoreDistribution: {
                excellent: 0,
                good: 0,
                fair: 0,
                poor: 0,
                critical: 0
            },
            commonIssues: new Map()
        };
    }

    /**
     * Assess quality of a single service
     * @param {Object} service - Service record
     * @param {Object} context - Additional context (existing services, etc.)
     * @returns {Object} Quality assessment result
     */
    async assessService(service, context = {}) {
        const assessment = {
            serviceId: service.id,
            serviceName: service.name,
            dataSource: service.data_source,
            assessedAt: new Date().toISOString(),
            
            // Individual scores
            completenessScore: this.calculateCompletenessScore(service),
            freshnessScore: this.calculateFreshnessScore(service),
            sourceReliabilityScore: this.calculateSourceReliabilityScore(service),
            contactVerificationScore: this.calculateContactVerificationScore(service),
            communityValidationScore: this.calculateCommunityValidationScore(service),
            
            // Quality issues
            issues: [],
            recommendations: []
        };
        
        // Calculate overall score
        assessment.overallScore = this.calculateOverallScore(assessment);
        assessment.qualityLevel = this.getQualityLevel(assessment.overallScore);
        
        // Identify issues and recommendations
        assessment.issues = this.identifyQualityIssues(service, assessment);
        assessment.recommendations = this.generateRecommendations(service, assessment);
        
        // Update statistics
        this.updateStats(assessment);
        
        return assessment;
    }

    /**
     * Assess quality of multiple services
     * @param {Array} services - Array of service records
     * @returns {Object} Batch assessment results
     */
    async assessBatch(services) {
        const assessments = [];
        const startTime = Date.now();
        
        console.log(`Starting quality assessment for ${services.length} services`);
        
        for (const service of services) {
            try {
                const assessment = await this.assessService(service);
                assessments.push(assessment);
                
                // Progress logging
                if (assessments.length % 100 === 0) {
                    console.log(`Assessed ${assessments.length}/${services.length} services`);
                }
            } catch (error) {
                console.error(`Quality assessment failed for service ${service.id}:`, error.message);
                assessments.push({
                    serviceId: service.id,
                    error: error.message,
                    overallScore: 0,
                    qualityLevel: 'critical'
                });
            }
        }
        
        const processingTime = Date.now() - startTime;
        
        return {
            assessments,
            summary: this.generateBatchSummary(assessments),
            stats: this.getStats(),
            processingTime
        };
    }

    /**
     * Calculate completeness score (0-1)
     * @param {Object} service - Service record
     * @returns {number} Completeness score
     */
    calculateCompletenessScore(service) {
        let score = 0;
        let maxScore = 100;
        
        // Core information (40 points)
        if (service.name && service.name.length >= 3) {
            score += 10;
        }
        
        if (service.description && service.description.length >= 20) {
            score += 15;
            // Bonus for detailed description
            if (service.description.length >= 100) score += 5;
        }
        
        if (service.categories && service.categories.length > 0) {
            score += 10;
        }
        
        // Contact information (25 points)
        const hasEmail = service.email || service.contacts?.[0]?.email;
        const hasPhone = service.phone || service.contacts?.[0]?.phone?.[0]?.number;
        const hasWebsite = service.url;
        
        if (hasEmail) score += 8;
        if (hasPhone) score += 10;
        if (hasWebsite) score += 7;
        
        // Location information (25 points)
        if (service.locations && service.locations.length > 0) {
            const location = service.locations[0];
            if (location.address_1) score += 8;
            if (location.city) score += 5;
            if (location.postal_code) score += 4;
            if (location.latitude && location.longitude) score += 8;
        }
        
        // Organization information (10 points)
        if (service.organization?.name) score += 5;
        if (service.organization?.description) score += 3;
        if (service.organization?.organization_type) score += 2;
        
        return Math.min(score / maxScore, 1.0);
    }

    /**
     * Calculate data freshness score (0-1)
     * @param {Object} service - Service record
     * @returns {number} Freshness score
     */
    calculateFreshnessScore(service) {
        const now = new Date();
        const lastUpdated = new Date(service.updated_at || service.created_at);
        const daysSinceUpdate = Math.floor((now - lastUpdated) / (1000 * 60 * 60 * 24));
        
        if (daysSinceUpdate <= this.config.freshness.excellent) {
            return 1.0;
        } else if (daysSinceUpdate <= this.config.freshness.good) {
            return 0.8;
        } else if (daysSinceUpdate <= this.config.freshness.fair) {
            return 0.6;
        } else if (daysSinceUpdate <= this.config.freshness.poor) {
            return 0.4;
        } else {
            return 0.2;
        }
    }

    /**
     * Calculate source reliability score (0-1)
     * @param {Object} service - Service record
     * @returns {number} Source reliability score
     */
    calculateSourceReliabilityScore(service) {
        const source = service.data_source?.toLowerCase() || '';
        
        // Government sources
        if (source.includes('government') || 
            source.includes('.gov.') || 
            source.includes('queensland') ||
            source.includes('department')) {
            return this.config.sourceReliability.government;
        }
        
        // Verified NGOs and established organizations
        if (source.includes('legal aid') ||
            source.includes('headspace') ||
            source.includes('mission australia') ||
            source.includes('lifeline') ||
            service.verification_status === 'verified') {
            return this.config.sourceReliability.verified_ngo;
        }
        
        // Community organizations
        if (source.includes('community') ||
            source.includes('aboriginal') ||
            source.includes('indigenous')) {
            return this.config.sourceReliability.community;
        }
        
        // Scraped data
        if (source.includes('scraped') || 
            source.includes('crawled')) {
            return this.config.sourceReliability.scraped;
        }
        
        return this.config.sourceReliability.unknown;
    }

    /**
     * Calculate contact verification score (0-1)
     * @param {Object} service - Service record
     * @returns {number} Contact verification score
     */
    calculateContactVerificationScore(service) {
        let score = 0;
        let maxScore = 0;
        
        // Phone verification
        const hasPhone = service.phone || service.contacts?.[0]?.phone?.[0]?.number;
        if (hasPhone) {
            maxScore += 0.5;
            // Check if phone format is valid (Australian)
            const phone = hasPhone.replace(/\D/g, '');
            if (phone.length >= 10 && (phone.startsWith('04') || phone.startsWith('02') || 
                phone.startsWith('03') || phone.startsWith('07') || phone.startsWith('08'))) {
                score += 0.5;
            } else {
                score += 0.25; // Partial credit for having a phone number
            }
        }
        
        // Email verification
        const hasEmail = service.email || service.contacts?.[0]?.email;
        if (hasEmail) {
            maxScore += 0.3;
            // Check email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (emailRegex.test(hasEmail)) {
                score += 0.3;
            } else {
                score += 0.15; // Partial credit for having an email
            }
        }
        
        // Website verification
        if (service.url) {
            maxScore += 0.2;
            try {
                new URL(service.url);
                score += 0.2;
            } catch {
                score += 0.1; // Partial credit for having a URL
            }
        }
        
        return maxScore > 0 ? score / maxScore : 0;
    }

    /**
     * Calculate community validation score (0-1)
     * @param {Object} service - Service record
     * @returns {number} Community validation score
     */
    calculateCommunityValidationScore(service) {
        let score = 0;
        
        // User ratings
        if (service.community_rating) {
            score += (service.community_rating / 5) * 0.6;
        }
        
        // Verification submissions
        if (service.verification_status === 'verified') {
            score += 0.4;
        } else if (service.verification_status === 'pending') {
            score += 0.2;
        }
        
        return Math.min(score, 1.0);
    }

    /**
     * Calculate overall quality score
     * @param {Object} assessment - Assessment object with individual scores
     * @returns {number} Overall score (0-1)
     */
    calculateOverallScore(assessment) {
        const weights = this.config.weights;
        
        return (
            assessment.completenessScore * weights.completeness +
            assessment.sourceReliabilityScore * weights.sourceReliability +
            assessment.freshnessScore * weights.dataFreshness +
            assessment.contactVerificationScore * weights.contactVerification +
            assessment.communityValidationScore * weights.communityValidation
        );
    }

    /**
     * Get quality level from score
     * @param {number} score - Overall score (0-1)
     * @returns {string} Quality level
     */
    getQualityLevel(score) {
        if (score >= this.config.thresholds.excellent) return 'excellent';
        if (score >= this.config.thresholds.good) return 'good';
        if (score >= this.config.thresholds.fair) return 'fair';
        if (score >= this.config.thresholds.poor) return 'poor';
        return 'critical';
    }

    /**
     * Identify quality issues
     * @param {Object} service - Service record
     * @param {Object} assessment - Quality assessment
     * @returns {Array} Array of quality issues
     */
    identifyQualityIssues(service, assessment) {
        const issues = [];
        
        // Completeness issues
        if (!service.name || service.name.length < 3) {
            issues.push({
                type: 'completeness',
                severity: 'high',
                field: 'name',
                message: 'Service name is missing or too short'
            });
        }
        
        if (!service.description || service.description.length < 20) {
            issues.push({
                type: 'completeness',
                severity: 'high',
                field: 'description',
                message: 'Service description is missing or too brief'
            });
        }
        
        if (!service.categories || service.categories.length === 0) {
            issues.push({
                type: 'completeness',
                severity: 'medium',
                field: 'categories',
                message: 'Service categories are missing'
            });
        }
        
        // Contact issues
        const hasEmail = service.email || service.contacts?.[0]?.email;
        const hasPhone = service.phone || service.contacts?.[0]?.phone?.[0]?.number;
        
        if (!hasEmail && !hasPhone) {
            issues.push({
                type: 'contact',
                severity: 'high',
                field: 'contact_info',
                message: 'No contact information available'
            });
        }
        
        // Location issues
        if (!service.locations || service.locations.length === 0) {
            issues.push({
                type: 'location',
                severity: 'high',
                field: 'locations',
                message: 'Location information is missing'
            });
        } else {
            const location = service.locations[0];
            if (!location.latitude || !location.longitude) {
                issues.push({
                    type: 'location',
                    severity: 'medium',
                    field: 'coordinates',
                    message: 'Geographic coordinates are missing'
                });
            }
        }
        
        // Freshness issues
        if (assessment.freshnessScore < 0.5) {
            issues.push({
                type: 'freshness',
                severity: 'medium',
                field: 'updated_at',
                message: 'Service information may be outdated'
            });
        }
        
        // Data format issues
        if (hasEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(hasEmail)) {
                issues.push({
                    type: 'format',
                    severity: 'low',
                    field: 'email',
                    message: 'Email format appears invalid'
                });
            }
        }
        
        return issues;
    }

    /**
     * Generate improvement recommendations
     * @param {Object} service - Service record
     * @param {Object} assessment - Quality assessment
     * @returns {Array} Array of recommendations
     */
    generateRecommendations(service, assessment) {
        const recommendations = [];
        
        // Completeness recommendations
        if (assessment.completenessScore < 0.7) {
            if (!service.description || service.description.length < 100) {
                recommendations.push({
                    type: 'enhancement',
                    priority: 'high',
                    action: 'Expand service description with eligibility criteria, application process, and outcomes'
                });
            }
            
            if (!service.url) {
                recommendations.push({
                    type: 'enhancement',
                    priority: 'medium',
                    action: 'Add website URL for more information'
                });
            }
        }
        
        // Contact recommendations
        if (assessment.contactVerificationScore < 0.8) {
            recommendations.push({
                type: 'verification',
                priority: 'high',
                action: 'Verify and update contact information'
            });
        }
        
        // Freshness recommendations
        if (assessment.freshnessScore < 0.6) {
            recommendations.push({
                type: 'maintenance',
                priority: 'medium',
                action: 'Contact service provider to verify current information'
            });
        }
        
        // Source reliability recommendations
        if (assessment.sourceReliabilityScore < 0.7) {
            recommendations.push({
                type: 'verification',
                priority: 'medium',
                action: 'Seek verification from authoritative source'
            });
        }
        
        return recommendations;
    }

    /**
     * Update statistics
     * @param {Object} assessment - Quality assessment
     */
    updateStats(assessment) {
        this.stats.servicesAssessed++;
        
        // Update average score
        this.stats.averageScore = (
            (this.stats.averageScore * (this.stats.servicesAssessed - 1)) + 
            assessment.overallScore
        ) / this.stats.servicesAssessed;
        
        // Update distribution
        this.stats.scoreDistribution[assessment.qualityLevel]++;
        
        // Track common issues
        for (const issue of assessment.issues) {
            const issueKey = `${issue.type}:${issue.field}`;
            const currentCount = this.stats.commonIssues.get(issueKey) || 0;
            this.stats.commonIssues.set(issueKey, currentCount + 1);
        }
    }

    /**
     * Generate batch summary
     * @param {Array} assessments - Array of assessments
     * @returns {Object} Summary statistics
     */
    generateBatchSummary(assessments) {
        const summary = {
            totalServices: assessments.length,
            averageScore: 0,
            scoreDistribution: {
                excellent: 0,
                good: 0,
                fair: 0,
                poor: 0,
                critical: 0
            },
            commonIssues: [],
            topRecommendations: []
        };
        
        // Calculate averages and distributions
        let totalScore = 0;
        const issueMap = new Map();
        const recommendationMap = new Map();
        
        for (const assessment of assessments) {
            if (assessment.overallScore !== undefined) {
                totalScore += assessment.overallScore;
                summary.scoreDistribution[assessment.qualityLevel]++;
            }
            
            // Count issues
            if (assessment.issues) {
                for (const issue of assessment.issues) {
                    const key = `${issue.type}:${issue.field}`;
                    issueMap.set(key, (issueMap.get(key) || 0) + 1);
                }
            }
            
            // Count recommendations
            if (assessment.recommendations) {
                for (const rec of assessment.recommendations) {
                    recommendationMap.set(rec.action, (recommendationMap.get(rec.action) || 0) + 1);
                }
            }
        }
        
        summary.averageScore = totalScore / assessments.length;
        
        // Top issues
        summary.commonIssues = Array.from(issueMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([issue, count]) => ({ issue, count, percentage: (count / assessments.length) * 100 }));
        
        // Top recommendations
        summary.topRecommendations = Array.from(recommendationMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([action, count]) => ({ action, count, percentage: (count / assessments.length) * 100 }));
        
        return summary;
    }

    /**
     * Get quality engine statistics
     * @returns {Object} Statistics
     */
    getStats() {
        return {
            ...this.stats,
            commonIssues: Array.from(this.stats.commonIssues.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([issue, count]) => ({ issue, count }))
        };
    }

    /**
     * Reset statistics
     */
    resetStats() {
        this.stats = {
            servicesAssessed: 0,
            averageScore: 0,
            scoreDistribution: {
                excellent: 0,
                good: 0,
                fair: 0,
                poor: 0,
                critical: 0
            },
            commonIssues: new Map()
        };
    }

    /**
     * Export quality report
     * @param {Array} assessments - Quality assessments
     * @param {string} format - Export format ('json' or 'csv')
     * @returns {string} Formatted report
     */
    exportReport(assessments, format = 'json') {
        const summary = this.generateBatchSummary(assessments);
        
        if (format === 'csv') {
            const headers = [
                'Service ID',
                'Service Name',
                'Data Source',
                'Overall Score',
                'Quality Level',
                'Completeness Score',
                'Freshness Score',
                'Source Reliability',
                'Contact Verification',
                'Community Validation',
                'Issues Count',
                'Recommendations Count'
            ];
            
            const rows = assessments.map(assessment => [
                assessment.serviceId,
                assessment.serviceName,
                assessment.dataSource,
                assessment.overallScore?.toFixed(3) || 'N/A',
                assessment.qualityLevel,
                assessment.completenessScore?.toFixed(3) || 'N/A',
                assessment.freshnessScore?.toFixed(3) || 'N/A',
                assessment.sourceReliabilityScore?.toFixed(3) || 'N/A',
                assessment.contactVerificationScore?.toFixed(3) || 'N/A',
                assessment.communityValidationScore?.toFixed(3) || 'N/A',
                assessment.issues?.length || 0,
                assessment.recommendations?.length || 0
            ]);
            
            return [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n');
        }
        
        return JSON.stringify({
            summary,
            assessments,
            generatedAt: new Date().toISOString()
        }, null, 2);
    }
}

export default QualityEngine;