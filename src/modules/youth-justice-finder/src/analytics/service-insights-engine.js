/**
 * Service Insights and Connection Mapping Engine
 * 
 * Advanced analytics system for discovering service relationships,
 * identifying gaps, and generating actionable insights for youth justice services.
 */

import fs from 'fs/promises';
import crypto from 'crypto';

export class ServiceInsightsEngine {
    constructor(config = {}) {
        this.config = {
            similarityThreshold: config.similarityThreshold || 0.7,
            gapAnalysisRadius: config.gapAnalysisRadius || 50, // km
            clusterMinSize: config.clusterMinSize || 3,
            ...config
        };
        
        this.services = [];
        this.insights = {};
        this.connections = [];
        this.serviceGaps = [];
        this.recommendations = [];
    }

    /**
     * Load services data for analysis
     */
    async loadServicesData(servicesData) {
        console.log('📊 Loading services data for analysis...');
        
        this.services = Array.isArray(servicesData) ? servicesData : servicesData.services || [];
        
        if (this.services.length === 0) {
            throw new Error('No services data provided for analysis');
        }
        
        console.log(`✅ Loaded ${this.services.length} services for analysis`);
        return this.services.length;
    }

    /**
     * Run comprehensive service insights analysis
     */
    async generateInsights() {
        console.log('🧠 Generating comprehensive service insights...\n');
        
        try {
            // Core analysis modules
            const serviceConnections = await this.mapServiceConnections();
            const geographicAnalysis = await this.analyzeGeographicDistribution();
            const categoryAnalysis = await this.analyzeCategoryDistribution();
            const qualityAnalysis = await this.analyzeServiceQuality();
            const gapAnalysis = await this.identifyServiceGaps();
            const networkAnalysis = await this.analyzeServiceNetworks();
            const youthFocusAnalysis = await this.analyzeYouthFocus();
            
            this.insights = {
                metadata: {
                    timestamp: new Date().toISOString(),
                    totalServices: this.services.length,
                    analysisVersion: '1.0.0'
                },
                connections: serviceConnections,
                geographic: geographicAnalysis,
                categories: categoryAnalysis,
                quality: qualityAnalysis,
                gaps: gapAnalysis,
                networks: networkAnalysis,
                youthFocus: youthFocusAnalysis,
                recommendations: this.generateRecommendations()
            };
            
            return this.insights;
            
        } catch (error) {
            console.error('❌ Insights generation failed:', error);
            throw error;
        }
    }

    /**
     * Map connections between services
     */
    async mapServiceConnections() {
        console.log('🔗 Mapping service connections...');
        
        const connections = [];
        const organizationGroups = {};
        const locationClusters = {};
        const categoryOverlaps = {};
        
        // Group by organization
        this.services.forEach(service => {
            const orgName = service.organization?.name || 'Unknown';
            if (!organizationGroups[orgName]) {
                organizationGroups[orgName] = [];
            }
            organizationGroups[orgName].push(service);
        });
        
        // Identify organization-based connections
        Object.entries(organizationGroups).forEach(([orgName, services]) => {
            if (services.length > 1) {
                // All services from same organization are connected
                for (let i = 0; i < services.length; i++) {
                    for (let j = i + 1; j < services.length; j++) {
                        connections.push({
                            type: 'organizational',
                            serviceA: services[i].id,
                            serviceB: services[j].id,
                            strength: 0.9,
                            reason: `Both operated by ${orgName}`,
                            organization: orgName
                        });
                    }
                }
            }
        });
        
        // Identify location-based connections
        this.services.forEach((serviceA, i) => {
            this.services.slice(i + 1).forEach(serviceB => {
                if (this.areServicesNearby(serviceA, serviceB)) {
                    connections.push({
                        type: 'geographic',
                        serviceA: serviceA.id,
                        serviceB: serviceB.id,
                        strength: 0.6,
                        reason: 'Services located in same area',
                        location: this.getCommonLocation(serviceA, serviceB)
                    });
                }
            });
        });
        
        // Identify category-based connections
        this.services.forEach((serviceA, i) => {
            this.services.slice(i + 1).forEach(serviceB => {
                const overlap = this.calculateCategoryOverlap(serviceA, serviceB);
                if (overlap > 0.5) {
                    connections.push({
                        type: 'categorical',
                        serviceA: serviceA.id,
                        serviceB: serviceB.id,
                        strength: overlap,
                        reason: 'Similar service categories',
                        sharedCategories: this.getSharedCategories(serviceA, serviceB)
                    });
                }
            });
        });
        
        this.connections = connections;
        
        console.log(`✅ Found ${connections.length} service connections`);
        
        return {
            totalConnections: connections.length,
            connectionTypes: {
                organizational: connections.filter(c => c.type === 'organizational').length,
                geographic: connections.filter(c => c.type === 'geographic').length,
                categorical: connections.filter(c => c.type === 'categorical').length
            },
            organizationGroups: Object.keys(organizationGroups).length,
            averageConnectionsPerService: (connections.length * 2 / this.services.length).toFixed(2),
            topConnectedOrganizations: Object.entries(organizationGroups)
                .filter(([_, services]) => services.length > 1)
                .sort(([_, a], [__, b]) => b.length - a.length)
                .slice(0, 10)
                .map(([org, services]) => ({ organization: org, serviceCount: services.length })),
            connections: connections
        };
    }

    /**
     * Analyze geographic distribution of services
     */
    async analyzeGeographicDistribution() {
        console.log('🗺️  Analyzing geographic distribution...');
        
        const stateDistribution = {};
        const regionDistribution = {};
        const cityDistribution = {};
        const remoteServices = [];
        
        this.services.forEach(service => {
            const location = service.locations?.[0];
            if (location) {
                // State distribution
                const state = location.state_province || 'Unknown';
                stateDistribution[state] = (stateDistribution[state] || 0) + 1;
                
                // Region distribution
                const region = location.region || location.city || 'Unknown';
                regionDistribution[region] = (regionDistribution[region] || 0) + 1;
                
                // City distribution
                const city = location.city || 'Unknown';
                cityDistribution[city] = (cityDistribution[city] || 0) + 1;
                
                // Identify remote services
                if (this.isRemoteLocation(location)) {
                    remoteServices.push(service);
                }
            }
        });
        
        // Calculate coverage metrics
        const totalStates = Object.keys(stateDistribution).length;
        const totalRegions = Object.keys(regionDistribution).length;
        const servicesWithLocation = this.services.filter(s => s.locations?.length > 0).length;
        
        // Identify underserved areas
        const underservedAreas = this.identifyUnderservedAreas(stateDistribution, regionDistribution);
        
        console.log(`✅ Geographic analysis: ${totalStates} states, ${totalRegions} regions`);
        
        return {
            coverageMetrics: {
                statesCovered: totalStates,
                regionsCovered: totalRegions,
                servicesWithLocation: servicesWithLocation,
                locationCoverageRate: (servicesWithLocation / this.services.length * 100).toFixed(1),
                remoteServiceCount: remoteServices.length
            },
            distribution: {
                states: this.sortAndLimitDistribution(stateDistribution, 10),
                regions: this.sortAndLimitDistribution(regionDistribution, 15),
                cities: this.sortAndLimitDistribution(cityDistribution, 20)
            },
            underservedAreas: underservedAreas,
            remoteServices: remoteServices.length,
            geographicInsights: this.generateGeographicInsights(stateDistribution, regionDistribution)
        };
    }

    /**
     * Analyze service category distribution and patterns
     */
    async analyzeCategoryDistribution() {
        console.log('📂 Analyzing category distribution...');
        
        const categoryCount = {};
        const categoryCooccurrence = {};
        const categoryGaps = [];
        
        // Count categories and co-occurrences
        this.services.forEach(service => {
            const categories = service.categories || [];
            
            // Count individual categories
            categories.forEach(category => {
                categoryCount[category] = (categoryCount[category] || 0) + 1;
            });
            
            // Count category co-occurrences
            for (let i = 0; i < categories.length; i++) {
                for (let j = i + 1; j < categories.length; j++) {
                    const pair = [categories[i], categories[j]].sort().join('|');
                    categoryCooccurrence[pair] = (categoryCooccurrence[pair] || 0) + 1;
                }
            }
        });
        
        // Identify category gaps
        const expectedCategories = [
            'legal_aid', 'mental_health', 'housing', 'employment', 
            'education_support', 'drug_alcohol', 'crisis_support',
            'family_support', 'cultural_support', 'disability_support'
        ];
        
        expectedCategories.forEach(category => {
            if (!categoryCount[category] || categoryCount[category] < 5) {
                categoryGaps.push({
                    category,
                    currentCount: categoryCount[category] || 0,
                    severity: categoryCount[category] ? 'low' : 'critical'
                });
            }
        });
        
        // Calculate diversity index
        const totalServices = this.services.length;
        const diversityIndex = this.calculateCategoryDiversityIndex(categoryCount, totalServices);
        
        console.log(`✅ Category analysis: ${Object.keys(categoryCount).length} categories found`);
        
        return {
            totalCategories: Object.keys(categoryCount).length,
            categoryDistribution: this.sortAndLimitDistribution(categoryCount, 20),
            topCooccurrences: Object.entries(categoryCooccurrence)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([pair, count]) => ({
                    categories: pair.split('|'),
                    cooccurrenceCount: count,
                    percentage: (count / totalServices * 100).toFixed(1)
                })),
            categoryGaps: categoryGaps,
            diversityIndex: diversityIndex,
            categoryInsights: this.generateCategoryInsights(categoryCount, categoryCooccurrence)
        };
    }

    /**
     * Analyze service quality patterns
     */
    async analyzeServiceQuality() {
        console.log('⭐ Analyzing service quality...');
        
        const qualityMetrics = {
            completeness: [],
            verification: [],
            youthSpecific: 0,
            indigenousSpecific: 0,
            verified: 0,
            unverified: 0
        };
        
        const qualityBySource = {};
        const qualityByCategory = {};
        const qualityByState = {};
        
        this.services.forEach(service => {
            // Collect quality scores
            const completeness = service.completeness_score || 0;
            qualityMetrics.completeness.push(completeness);
            
            const verification = service.verification_score || 0;
            qualityMetrics.verification.push(verification);
            
            // Count specific service types
            if (service.youth_specific) qualityMetrics.youthSpecific++;
            if (service.indigenous_specific) qualityMetrics.indigenousSpecific++;
            if (service.verification_status === 'verified') qualityMetrics.verified++;
            else qualityMetrics.unverified++;
            
            // Quality by data source
            const source = service.data_source || 'Unknown';
            if (!qualityBySource[source]) {
                qualityBySource[source] = { count: 0, totalCompleteness: 0, totalVerification: 0 };
            }
            qualityBySource[source].count++;
            qualityBySource[source].totalCompleteness += completeness;
            qualityBySource[source].totalVerification += verification;
            
            // Quality by category
            (service.categories || []).forEach(category => {
                if (!qualityByCategory[category]) {
                    qualityByCategory[category] = { count: 0, totalCompleteness: 0 };
                }
                qualityByCategory[category].count++;
                qualityByCategory[category].totalCompleteness += completeness;
            });
            
            // Quality by state
            const state = service.locations?.[0]?.state_province || 'Unknown';
            if (!qualityByState[state]) {
                qualityByState[state] = { count: 0, totalCompleteness: 0 };
            }
            qualityByState[state].count++;
            qualityByState[state].totalCompleteness += completeness;
        });
        
        // Calculate averages
        const avgCompleteness = qualityMetrics.completeness.reduce((a, b) => a + b, 0) / qualityMetrics.completeness.length;
        const avgVerification = qualityMetrics.verification.reduce((a, b) => a + b, 0) / qualityMetrics.verification.length;
        
        // Process source quality
        Object.keys(qualityBySource).forEach(source => {
            const data = qualityBySource[source];
            data.avgCompleteness = data.totalCompleteness / data.count;
            data.avgVerification = data.totalVerification / data.count;
        });
        
        console.log(`✅ Quality analysis: ${avgCompleteness.toFixed(2)} avg completeness`);
        
        return {
            overallQuality: {
                averageCompleteness: avgCompleteness,
                averageVerification: avgVerification,
                verificationRate: (qualityMetrics.verified / this.services.length * 100).toFixed(1),
                youthSpecificRate: (qualityMetrics.youthSpecific / this.services.length * 100).toFixed(1),
                indigenousSpecificRate: (qualityMetrics.indigenousSpecific / this.services.length * 100).toFixed(1)
            },
            qualityDistribution: {
                excellent: qualityMetrics.completeness.filter(q => q >= 0.9).length,
                good: qualityMetrics.completeness.filter(q => q >= 0.7 && q < 0.9).length,
                fair: qualityMetrics.completeness.filter(q => q >= 0.5 && q < 0.7).length,
                poor: qualityMetrics.completeness.filter(q => q < 0.5).length
            },
            qualityBySource: Object.entries(qualityBySource)
                .sort(([, a], [, b]) => b.avgCompleteness - a.avgCompleteness)
                .slice(0, 10)
                .map(([source, data]) => ({ source, ...data })),
            qualityTrends: this.analyzeQualityTrends(qualityMetrics),
            qualityIssues: this.identifyQualityIssues(qualityMetrics, qualityBySource)
        };
    }

    /**
     * Identify service gaps and opportunities
     */
    async identifyServiceGaps() {
        console.log('🔍 Identifying service gaps...');
        
        const gaps = [];
        const opportunities = [];
        
        // Geographic gaps
        const stateDistribution = {};
        this.services.forEach(service => {
            const state = service.locations?.[0]?.state_province || 'Unknown';
            stateDistribution[state] = (stateDistribution[state] || 0) + 1;
        });
        
        // Identify underserved states
        const australianStates = ['QLD', 'NSW', 'VIC', 'WA', 'SA', 'TAS', 'NT', 'ACT'];
        australianStates.forEach(state => {
            const serviceCount = stateDistribution[state] || 0;
            const expectedServices = this.calculateExpectedServices(state);
            
            if (serviceCount < expectedServices * 0.5) {
                gaps.push({
                    type: 'geographic',
                    severity: serviceCount === 0 ? 'critical' : 'high',
                    description: `Underserved state: ${state}`,
                    currentServices: serviceCount,
                    expectedServices: expectedServices,
                    gapSize: expectedServices - serviceCount
                });
            }
        });
        
        // Category gaps
        const categoryDistribution = {};
        this.services.forEach(service => {
            (service.categories || []).forEach(category => {
                categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
            });
        });
        
        const essentialCategories = [
            'legal_aid', 'mental_health', 'housing', 'employment',
            'crisis_support', 'family_support'
        ];
        
        essentialCategories.forEach(category => {
            const serviceCount = categoryDistribution[category] || 0;
            const expectedCount = Math.ceil(this.services.length * 0.1); // Expect 10% coverage
            
            if (serviceCount < expectedCount) {
                gaps.push({
                    type: 'categorical',
                    severity: serviceCount === 0 ? 'critical' : 'medium',
                    description: `Limited ${category} services`,
                    currentServices: serviceCount,
                    expectedServices: expectedCount,
                    gapSize: expectedCount - serviceCount
                });
            }
        });
        
        // Age-specific gaps
        const youthServices = this.services.filter(s => s.youth_specific).length;
        if (youthServices < this.services.length * 0.7) {
            gaps.push({
                type: 'demographic',
                severity: 'high',
                description: 'Insufficient youth-specific services',
                currentServices: youthServices,
                expectedServices: Math.ceil(this.services.length * 0.8),
                gapSize: Math.ceil(this.services.length * 0.8) - youthServices
            });
        }
        
        // Identify opportunities
        opportunities.push(...this.identifyGrowthOpportunities(stateDistribution, categoryDistribution));
        
        this.serviceGaps = gaps;
        
        console.log(`✅ Gap analysis: ${gaps.length} gaps identified`);
        
        return {
            totalGaps: gaps.length,
            gapsByType: {
                geographic: gaps.filter(g => g.type === 'geographic').length,
                categorical: gaps.filter(g => g.type === 'categorical').length,
                demographic: gaps.filter(g => g.type === 'demographic').length
            },
            gapsBySeverity: {
                critical: gaps.filter(g => g.severity === 'critical').length,
                high: gaps.filter(g => g.severity === 'high').length,
                medium: gaps.filter(g => g.severity === 'medium').length
            },
            gaps: gaps.slice(0, 20), // Top 20 gaps
            opportunities: opportunities.slice(0, 10), // Top 10 opportunities
            gapAnalysisInsights: this.generateGapInsights(gaps)
        };
    }

    /**
     * Analyze service networks and ecosystems
     */
    async analyzeServiceNetworks() {
        console.log('🕸️  Analyzing service networks...');
        
        const networks = {};
        const hubs = [];
        const isolatedServices = [];
        
        // Identify network hubs (organizations with many services)
        const orgServiceCount = {};
        this.services.forEach(service => {
            const orgName = service.organization?.name || 'Unknown';
            orgServiceCount[orgName] = (orgServiceCount[orgName] || 0) + 1;
        });
        
        Object.entries(orgServiceCount).forEach(([org, count]) => {
            if (count >= 3) {
                hubs.push({
                    organization: org,
                    serviceCount: count,
                    influence: this.calculateNetworkInfluence(org),
                    type: this.determineHubType(org, count)
                });
            }
        });
        
        // Identify isolated services
        this.services.forEach(service => {
            const connectionCount = this.connections.filter(c => 
                c.serviceA === service.id || c.serviceB === service.id
            ).length;
            
            if (connectionCount === 0) {
                isolatedServices.push({
                    id: service.id,
                    name: service.name,
                    organization: service.organization?.name,
                    location: service.locations?.[0]?.city,
                    categories: service.categories
                });
            }
        });
        
        console.log(`✅ Network analysis: ${hubs.length} hubs, ${isolatedServices.length} isolated services`);
        
        return {
            networkMetrics: {
                totalHubs: hubs.length,
                averageHubSize: hubs.length > 0 ? (hubs.reduce((sum, h) => sum + h.serviceCount, 0) / hubs.length).toFixed(1) : 0,
                isolatedServices: isolatedServices.length,
                networkDensity: this.calculateNetworkDensity(),
                clusteringCoefficient: this.calculateClusteringCoefficient()
            },
            majorHubs: hubs.sort((a, b) => b.serviceCount - a.serviceCount).slice(0, 10),
            networkGaps: isolatedServices.slice(0, 20),
            networkOpportunities: this.identifyNetworkOpportunities(hubs, isolatedServices),
            ecosystemHealth: this.assessEcosystemHealth(hubs, isolatedServices)
        };
    }

    /**
     * Analyze youth-specific service focus
     */
    async analyzeYouthFocus() {
        console.log('🎯 Analyzing youth service focus...');
        
        const youthMetrics = {
            youthSpecific: 0,
            ageAppropriate: 0,
            universalAccess: 0,
            transitionalSupport: 0
        };
        
        const ageDistribution = {};
        const youthCategories = {};
        
        this.services.forEach(service => {
            // Youth-specific classification
            if (service.youth_specific) {
                youthMetrics.youthSpecific++;
            }
            
            // Age range analysis
            if (service.minimum_age !== null || service.maximum_age !== null) {
                const minAge = service.minimum_age || 0;
                const maxAge = service.maximum_age || 25;
                
                if (maxAge <= 25) {
                    youthMetrics.ageAppropriate++;
                }
                
                if (minAge <= 12 && maxAge >= 24) {
                    youthMetrics.universalAccess++;
                }
                
                if (minAge <= 18 && maxAge >= 21) {
                    youthMetrics.transitionalSupport++;
                }
                
                const ageRange = `${minAge}-${maxAge}`;
                ageDistribution[ageRange] = (ageDistribution[ageRange] || 0) + 1;
            }
            
            // Youth service categories
            if (service.youth_specific) {
                (service.categories || []).forEach(category => {
                    youthCategories[category] = (youthCategories[category] || 0) + 1;
                });
            }
        });
        
        console.log(`✅ Youth focus analysis: ${youthMetrics.youthSpecific} youth-specific services`);
        
        return {
            youthServiceMetrics: {
                youthSpecificCount: youthMetrics.youthSpecific,
                youthSpecificRate: (youthMetrics.youthSpecific / this.services.length * 100).toFixed(1),
                ageAppropriateCount: youthMetrics.ageAppropriate,
                universalAccessCount: youthMetrics.universalAccess,
                transitionalSupportCount: youthMetrics.transitionalSupport
            },
            ageRangeDistribution: this.sortAndLimitDistribution(ageDistribution, 10),
            youthCategoryDistribution: this.sortAndLimitDistribution(youthCategories, 15),
            youthServiceGaps: this.identifyYouthServiceGaps(youthMetrics, youthCategories),
            youthJusticeAlignment: this.assessYouthJusticeAlignment()
        };
    }

    /**
     * Generate actionable recommendations
     */
    generateRecommendations() {
        console.log('💡 Generating recommendations...');
        
        const recommendations = [];
        
        // Geographic expansion recommendations
        this.serviceGaps.filter(gap => gap.type === 'geographic').forEach(gap => {
            recommendations.push({
                category: 'geographic_expansion',
                priority: gap.severity === 'critical' ? 'high' : 'medium',
                title: `Expand services in ${gap.description.split(': ')[1]}`,
                description: `Establish ${gap.gapSize} new services in underserved areas`,
                estimatedImpact: 'Reach additional vulnerable youth population',
                implementationEffort: 'high',
                timeframe: '6-12 months'
            });
        });
        
        // Category gap recommendations
        this.serviceGaps.filter(gap => gap.type === 'categorical').forEach(gap => {
            recommendations.push({
                category: 'service_diversification',
                priority: 'medium',
                title: `Expand ${gap.description.split(' ')[1]} services`,
                description: `Add ${gap.gapSize} new services in this critical category`,
                estimatedImpact: 'Improve service comprehensiveness',
                implementationEffort: 'medium',
                timeframe: '3-6 months'
            });
        });
        
        // Network strengthening recommendations
        recommendations.push({
            category: 'network_strengthening',
            priority: 'high',
            title: 'Establish Service Partnerships',
            description: 'Connect isolated services with major hubs for referral networks',
            estimatedImpact: 'Improve service coordination and outcomes',
            implementationEffort: 'medium',
            timeframe: '3-6 months'
        });
        
        // Data quality improvements
        recommendations.push({
            category: 'data_quality',
            priority: 'high',
            title: 'Implement Quality Assurance Program',
            description: 'Systematic verification and enhancement of service data',
            estimatedImpact: 'Increase user trust and service utilization',
            implementationEffort: 'low',
            timeframe: '1-3 months'
        });
        
        // Technology enhancements
        recommendations.push({
            category: 'technology',
            priority: 'medium',
            title: 'Develop Mobile Application',
            description: 'Create youth-friendly mobile interface for service discovery',
            estimatedImpact: 'Increase youth engagement and accessibility',
            implementationEffort: 'high',
            timeframe: '6-12 months'
        });
        
        this.recommendations = recommendations;
        
        console.log(`✅ Generated ${recommendations.length} recommendations`);
        
        return recommendations.sort((a, b) => {
            const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    // Helper methods

    areServicesNearby(serviceA, serviceB) {
        const locA = serviceA.locations?.[0];
        const locB = serviceB.locations?.[0];
        
        if (!locA || !locB) return false;
        
        // Simple proximity check (same city or region)
        return locA.city === locB.city || 
               locA.region === locB.region ||
               locA.state_province === locB.state_province;
    }

    calculateCategoryOverlap(serviceA, serviceB) {
        const catsA = new Set(serviceA.categories || []);
        const catsB = new Set(serviceB.categories || []);
        const intersection = new Set([...catsA].filter(x => catsB.has(x)));
        const union = new Set([...catsA, ...catsB]);
        
        return union.size > 0 ? intersection.size / union.size : 0;
    }

    getSharedCategories(serviceA, serviceB) {
        const catsA = new Set(serviceA.categories || []);
        const catsB = new Set(serviceB.categories || []);
        return [...catsA].filter(x => catsB.has(x));
    }

    getCommonLocation(serviceA, serviceB) {
        const locA = serviceA.locations?.[0];
        const locB = serviceB.locations?.[0];
        
        if (locA?.city === locB?.city) return locA.city;
        if (locA?.region === locB?.region) return locA.region;
        return locA?.state_province || 'Same area';
    }

    sortAndLimitDistribution(distribution, limit) {
        return Object.entries(distribution)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([key, count]) => ({ [key]: count }))
            .reduce((acc, obj) => ({ ...acc, ...obj }), {});
    }

    calculateExpectedServices(state) {
        // Rough population-based estimates
        const populations = {
            'NSW': 8200000, 'QLD': 5300000, 'VIC': 6800000, 'WA': 2800000,
            'SA': 1800000, 'TAS': 570000, 'NT': 250000, 'ACT': 440000
        };
        
        const population = populations[state] || 500000;
        return Math.ceil(population / 100000); // 1 service per 100k population
    }

    isRemoteLocation(location) {
        const remoteCities = ['Alice Springs', 'Tennant Creek', 'Katherine', 'Darwin', 'Broome', 'Kalgoorlie'];
        return remoteCities.some(city => location.city?.includes(city));
    }

    identifyUnderservedAreas(stateDistribution, regionDistribution) {
        const underserved = [];
        
        Object.entries(stateDistribution).forEach(([state, count]) => {
            const expected = this.calculateExpectedServices(state);
            if (count < expected * 0.7) {
                underserved.push({
                    area: state,
                    type: 'state',
                    currentServices: count,
                    expectedServices: expected,
                    severity: count < expected * 0.3 ? 'high' : 'medium'
                });
            }
        });
        
        return underserved;
    }

    calculateCategoryDiversityIndex(categoryCount, totalServices) {
        // Shannon diversity index
        const proportions = Object.values(categoryCount).map(count => count / totalServices);
        return -proportions.reduce((sum, p) => sum + (p * Math.log(p)), 0);
    }

    calculateNetworkDensity() {
        const n = this.services.length;
        const maxConnections = n * (n - 1) / 2;
        return maxConnections > 0 ? this.connections.length / maxConnections : 0;
    }

    calculateClusteringCoefficient() {
        // Simplified clustering coefficient
        return this.connections.length > 0 ? 
            this.connections.filter(c => c.strength > 0.7).length / this.connections.length : 0;
    }

    calculateNetworkInfluence(orgName) {
        const orgServices = this.services.filter(s => s.organization?.name === orgName);
        const orgConnections = this.connections.filter(c => 
            orgServices.some(s => s.id === c.serviceA || s.id === c.serviceB)
        );
        
        return orgConnections.length / Math.max(1, orgServices.length);
    }

    determineHubType(orgName, serviceCount) {
        if (serviceCount >= 10) return 'major_hub';
        if (serviceCount >= 5) return 'regional_hub';
        return 'local_hub';
    }

    generateGeographicInsights(stateDistribution, regionDistribution) {
        return [
            `${Object.keys(stateDistribution).length} states/territories covered`,
            `Highest concentration in ${Object.entries(stateDistribution).sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown'}`,
            `${Object.values(stateDistribution).filter(count => count < 5).length} underserved jurisdictions`
        ];
    }

    generateCategoryInsights(categoryCount, categoryCooccurrence) {
        const topCategory = Object.entries(categoryCount).sort(([,a], [,b]) => b - a)[0];
        const totalPairs = Object.keys(categoryCooccurrence).length;
        
        return [
            `Most common category: ${topCategory?.[0]} (${topCategory?.[1]} services)`,
            `${totalPairs} category combinations found`,
            `Average categories per service: ${(Object.values(categoryCount).reduce((a,b) => a+b, 0) / this.services.length).toFixed(1)}`
        ];
    }

    analyzeQualityTrends(qualityMetrics) {
        return {
            completenessDistribution: {
                high: qualityMetrics.completeness.filter(q => q > 0.8).length,
                medium: qualityMetrics.completeness.filter(q => q > 0.5 && q <= 0.8).length,
                low: qualityMetrics.completeness.filter(q => q <= 0.5).length
            },
            verificationTrend: qualityMetrics.verified > qualityMetrics.unverified ? 'positive' : 'needs_improvement'
        };
    }

    identifyQualityIssues(qualityMetrics, qualityBySource) {
        const issues = [];
        
        if (qualityMetrics.verified < this.services.length * 0.7) {
            issues.push('Low verification rate across services');
        }
        
        Object.entries(qualityBySource).forEach(([source, data]) => {
            if (data.avgCompleteness < 0.6) {
                issues.push(`${source} has low data quality`);
            }
        });
        
        return issues;
    }

    identifyGrowthOpportunities(stateDistribution, categoryDistribution) {
        const opportunities = [];
        
        // High-population, low-service areas
        const highPotential = ['NSW', 'VIC', 'QLD'].filter(state => 
            (stateDistribution[state] || 0) < this.calculateExpectedServices(state)
        );
        
        highPotential.forEach(state => {
            opportunities.push({
                type: 'market_expansion',
                description: `High potential for growth in ${state}`,
                estimatedImpact: 'high',
                reasoning: 'Large population with service gaps'
            });
        });
        
        return opportunities;
    }

    identifyNetworkOpportunities(hubs, isolatedServices) {
        return [
            {
                type: 'hub_expansion',
                description: 'Connect isolated services to existing hubs',
                potentialConnections: isolatedServices.length,
                estimatedImpact: 'Improved service coordination'
            },
            {
                type: 'partnership_development',
                description: 'Facilitate partnerships between complementary organizations',
                potentialPartnerships: Math.floor(hubs.length / 2),
                estimatedImpact: 'Enhanced service delivery'
            }
        ];
    }

    assessEcosystemHealth(hubs, isolatedServices) {
        const totalServices = this.services.length;
        const connectedServices = totalServices - isolatedServices.length;
        const healthScore = (connectedServices / totalServices) * 100;
        
        let status = 'healthy';
        if (healthScore < 50) status = 'fragmented';
        else if (healthScore < 70) status = 'developing';
        
        return {
            status,
            healthScore: healthScore.toFixed(1),
            recommendations: status === 'fragmented' ? 
                ['Focus on connecting isolated services', 'Develop regional hubs'] :
                ['Maintain existing connections', 'Expand successful partnerships']
        };
    }

    identifyYouthServiceGaps(youthMetrics, youthCategories) {
        const gaps = [];
        
        if (youthMetrics.youthSpecific < this.services.length * 0.8) {
            gaps.push('Insufficient youth-specific service designation');
        }
        
        if (youthMetrics.transitionalSupport < youthMetrics.youthSpecific * 0.6) {
            gaps.push('Limited transitional support services (18-21 age group)');
        }
        
        const criticalYouthCategories = ['legal_aid', 'mental_health', 'housing', 'employment'];
        criticalYouthCategories.forEach(category => {
            if (!youthCategories[category] || youthCategories[category] < 3) {
                gaps.push(`Limited youth-specific ${category} services`);
            }
        });
        
        return gaps;
    }

    assessYouthJusticeAlignment() {
        const alignmentScore = this.services.filter(service => 
            service.youth_specific && 
            (service.categories?.includes('legal_aid') || 
             service.categories?.includes('youth_justice') ||
             service.categories?.includes('court_support'))
        ).length;
        
        return {
            alignedServices: alignmentScore,
            alignmentRate: (alignmentScore / this.services.length * 100).toFixed(1),
            recommendation: alignmentScore < 10 ? 
                'Increase youth justice specific services' : 
                'Maintain current youth justice focus'
        };
    }

    /**
     * Generate gap analysis insights
     */
    generateGapInsights(gaps) {
        const insights = [];
        
        const criticalGaps = gaps.filter(g => g.severity === 'critical').length;
        const geographicGaps = gaps.filter(g => g.type === 'geographic').length;
        const categoricalGaps = gaps.filter(g => g.type === 'categorical').length;
        
        if (criticalGaps > 0) {
            insights.push(`${criticalGaps} critical service gaps require immediate attention`);
        }
        
        if (geographicGaps > 0) {
            insights.push(`${geographicGaps} states/territories are underserved`);
        }
        
        if (categoricalGaps > 0) {
            insights.push(`${categoricalGaps} service categories need expansion`);
        }
        
        insights.push(`Total gap size: ${gaps.reduce((sum, gap) => sum + (gap.gapSize || 0), 0)} additional services needed`);
        
        return insights;
    }

    /**
     * Save comprehensive insights report
     */
    async saveInsightsReport() {
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `service-insights-report-${timestamp}.json`;
        
        await fs.writeFile(filename, JSON.stringify(this.insights, null, 2));
        
        console.log(`💾 Insights report saved: ${filename}`);
        return filename;
    }
}

export default ServiceInsightsEngine;