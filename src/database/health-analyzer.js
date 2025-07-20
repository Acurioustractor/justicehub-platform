/**
 * Database Health and Scalability Analyzer
 * 
 * Comprehensive analysis tool for assessing database health,
 * performance, scalability, and generating optimization recommendations.
 */

import fs from 'fs/promises';
import { DatabaseManager } from './database-manager.js';

export class DatabaseHealthAnalyzer {
    constructor(config = {}) {
        this.db = new DatabaseManager(config);
        this.healthMetrics = {};
        this.scalabilityAssessment = {};
        this.optimizationRecommendations = [];
    }

    /**
     * Run comprehensive database health analysis
     */
    async analyzeHealth() {
        console.log('🔍 Analyzing Database Health...\n');
        
        try {
            await this.db.initialize();
            
            // Core health checks
            const connectionHealth = await this.analyzeConnections();
            const dataHealth = await this.analyzeDataQuality();
            const performanceHealth = await this.analyzePerformance();
            const schemaHealth = await this.analyzeSchema();
            const indexHealth = await this.analyzeIndexes();
            
            this.healthMetrics = {
                overall: this.calculateOverallHealth(),
                connection: connectionHealth,
                data: dataHealth,
                performance: performanceHealth,
                schema: schemaHealth,
                indexes: indexHealth,
                timestamp: new Date().toISOString()
            };
            
            return this.healthMetrics;
            
        } catch (error) {
            console.error('❌ Health analysis failed:', error);
            throw error;
        }
    }

    /**
     * Analyze database connections
     */
    async analyzeConnections() {
        console.log('🔌 Analyzing database connections...');
        
        const client = await this.db.pool.connect();
        
        try {
            // Get connection stats
            const connectionQuery = `
                SELECT 
                    count(*) as total_connections,
                    count(*) FILTER (WHERE state = 'active') as active_connections,
                    count(*) FILTER (WHERE state = 'idle') as idle_connections,
                    max(now() - backend_start) as max_connection_age
                FROM pg_stat_activity 
                WHERE datname = current_database()
            `;
            
            const result = await client.query(connectionQuery);
            const stats = result.rows[0];
            
            // Database version and settings
            const versionResult = await client.query('SELECT version()');
            const version = versionResult.rows[0].version;
            
            // Max connections setting
            const maxConnResult = await client.query('SHOW max_connections');
            const maxConnections = parseInt(maxConnResult.rows[0].max_connections);
            
            const connectionHealth = {
                status: 'healthy',
                totalConnections: parseInt(stats.total_connections),
                activeConnections: parseInt(stats.active_connections),
                idleConnections: parseInt(stats.idle_connections),
                maxConnections: maxConnections,
                connectionUtilization: (stats.total_connections / maxConnections * 100).toFixed(1),
                maxConnectionAge: stats.max_connection_age,
                databaseVersion: version,
                issues: []
            };
            
            // Check for issues
            if (connectionHealth.connectionUtilization > 80) {
                connectionHealth.status = 'warning';
                connectionHealth.issues.push('High connection utilization (>80%)');
                this.optimizationRecommendations.push({
                    category: 'connections',
                    priority: 'high',
                    issue: 'High connection utilization',
                    recommendation: 'Increase max_connections or implement connection pooling'
                });
            }
            
            if (connectionHealth.idleConnections > connectionHealth.activeConnections * 2) {
                connectionHealth.issues.push('High number of idle connections');
                this.optimizationRecommendations.push({
                    category: 'connections',
                    priority: 'medium',
                    issue: 'Too many idle connections',
                    recommendation: 'Reduce idle timeout or review connection pooling strategy'
                });
            }
            
            console.log(`✅ Connection health: ${connectionHealth.status}`);
            return connectionHealth;
            
        } finally {
            client.release();
        }
    }

    /**
     * Analyze data quality and completeness
     */
    async analyzeDataQuality() {
        console.log('📊 Analyzing data quality...');
        
        const client = await this.db.pool.connect();
        
        try {
            // Check if tables exist
            const tableExistsQuery = `
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'services'
                )
            `;
            
            const tableExists = await client.query(tableExistsQuery);
            
            if (!tableExists.rows[0].exists) {
                return {
                    status: 'critical',
                    message: 'Services table does not exist',
                    totalRecords: 0,
                    issues: ['Services table missing']
                };
            }
            
            // Get data quality metrics
            const dataQualityQuery = `
                SELECT 
                    count(*) as total_services,
                    count(*) FILTER (WHERE name IS NOT NULL AND name != '') as services_with_names,
                    count(*) FILTER (WHERE description IS NOT NULL AND description != '') as services_with_descriptions,
                    count(*) FILTER (WHERE completeness_score >= 0.7) as high_quality_services,
                    count(*) FILTER (WHERE verification_status = 'verified') as verified_services,
                    count(*) FILTER (WHERE youth_specific = true) as youth_specific_services,
                    count(*) FILTER (WHERE status = 'active') as active_services,
                    avg(completeness_score) as avg_completeness_score,
                    min(created_at) as oldest_record,
                    max(updated_at) as newest_record
                FROM services
            `;
            
            const result = await client.query(dataQualityQuery);
            const stats = result.rows[0];
            
            // Data source distribution
            const sourceQuery = `
                SELECT 
                    data_source,
                    count(*) as count,
                    avg(completeness_score) as avg_quality
                FROM services 
                GROUP BY data_source 
                ORDER BY count DESC
            `;
            
            const sourceResult = await client.query(sourceQuery);
            const dataSources = sourceResult.rows;
            
            const dataHealth = {
                status: 'healthy',
                totalServices: parseInt(stats.total_services),
                servicesWithNames: parseInt(stats.services_with_names),
                servicesWithDescriptions: parseInt(stats.services_with_descriptions),
                highQualityServices: parseInt(stats.high_quality_services),
                verifiedServices: parseInt(stats.verified_services),
                youthSpecificServices: parseInt(stats.youth_specific_services),
                activeServices: parseInt(stats.active_services),
                avgCompletenessScore: parseFloat(stats.avg_completeness_score || 0),
                oldestRecord: stats.oldest_record,
                newestRecord: stats.newest_record,
                dataSources: dataSources,
                completenessRate: (stats.services_with_names / stats.total_services * 100).toFixed(1),
                qualityRate: (stats.high_quality_services / stats.total_services * 100).toFixed(1),
                verificationRate: (stats.verified_services / stats.total_services * 100).toFixed(1),
                issues: []
            };
            
            // Check for data quality issues
            if (dataHealth.completenessRate < 90) {
                dataHealth.status = 'warning';
                dataHealth.issues.push('Low data completeness rate (<90%)');
                this.optimizationRecommendations.push({
                    category: 'data_quality',
                    priority: 'high',
                    issue: 'Incomplete service records',
                    recommendation: 'Implement data validation and enrichment processes'
                });
            }
            
            if (dataHealth.verificationRate < 50) {
                dataHealth.issues.push('Low verification rate (<50%)');
                this.optimizationRecommendations.push({
                    category: 'data_quality',
                    priority: 'medium',
                    issue: 'Low verification rate',
                    recommendation: 'Implement automated verification processes'
                });
            }
            
            if (dataHealth.totalServices < 100) {
                dataHealth.issues.push('Low service count');
                this.optimizationRecommendations.push({
                    category: 'data_coverage',
                    priority: 'high',
                    issue: 'Limited service coverage',
                    recommendation: 'Expand data sources and improve extraction processes'
                });
            }
            
            console.log(`✅ Data quality: ${dataHealth.status} (${dataHealth.totalServices} services)`);
            return dataHealth;
            
        } finally {
            client.release();
        }
    }

    /**
     * Analyze database performance
     */
    async analyzePerformance() {
        console.log('⚡ Analyzing performance...');
        
        const client = await this.db.pool.connect();
        
        try {
            // Query performance stats
            const performanceQuery = `
                SELECT 
                    schemaname,
                    tablename,
                    seq_scan,
                    seq_tup_read,
                    idx_scan,
                    idx_tup_fetch,
                    n_tup_ins,
                    n_tup_upd,
                    n_tup_del,
                    n_live_tup,
                    n_dead_tup
                FROM pg_stat_user_tables
                WHERE tablename IN ('services', 'organizations', 'locations')
            `;
            
            const result = await client.query(performanceQuery);
            const tableStats = result.rows;
            
            // Database size
            const sizeQuery = `
                SELECT 
                    pg_size_pretty(pg_database_size(current_database())) as database_size,
                    pg_database_size(current_database()) as database_size_bytes
            `;
            
            const sizeResult = await client.query(sizeQuery);
            const dbSize = sizeResult.rows[0];
            
            // Index usage
            const indexQuery = `
                SELECT 
                    schemaname,
                    tablename,
                    indexname,
                    idx_scan,
                    idx_tup_read,
                    idx_tup_fetch
                FROM pg_stat_user_indexes
                WHERE schemaname = 'public'
                ORDER BY idx_scan DESC
            `;
            
            const indexResult = await client.query(indexQuery);
            const indexStats = indexResult.rows;
            
            const performanceHealth = {
                status: 'healthy',
                databaseSize: dbSize.database_size,
                databaseSizeBytes: parseInt(dbSize.database_size_bytes),
                tableStats: tableStats,
                indexStats: indexStats,
                issues: []
            };
            
            // Analyze performance issues
            tableStats.forEach(table => {
                const seqScanRatio = table.seq_scan / (table.seq_scan + (table.idx_scan || 1));
                
                if (seqScanRatio > 0.5 && table.n_live_tup > 1000) {
                    performanceHealth.status = 'warning';
                    performanceHealth.issues.push(`High sequential scan ratio for ${table.tablename}`);
                    this.optimizationRecommendations.push({
                        category: 'performance',
                        priority: 'high',
                        issue: `High sequential scans on ${table.tablename}`,
                        recommendation: 'Review and optimize indexes for common queries'
                    });
                }
                
                if (table.n_dead_tup > table.n_live_tup * 0.1) {
                    performanceHealth.issues.push(`High dead tuple count for ${table.tablename}`);
                    this.optimizationRecommendations.push({
                        category: 'maintenance',
                        priority: 'medium',
                        issue: `High dead tuple count on ${table.tablename}`,
                        recommendation: 'Schedule regular VACUUM operations'
                    });
                }
            });
            
            console.log(`✅ Performance health: ${performanceHealth.status}`);
            return performanceHealth;
            
        } finally {
            client.release();
        }
    }

    /**
     * Analyze database schema
     */
    async analyzeSchema() {
        console.log('🏗️  Analyzing schema...');
        
        const client = await this.db.pool.connect();
        
        try {
            // Get table information
            const tablesQuery = `
                SELECT 
                    table_name,
                    table_type
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name
            `;
            
            const tablesResult = await client.query(tablesQuery);
            const tables = tablesResult.rows;
            
            // Get column information
            const columnsQuery = `
                SELECT 
                    table_name,
                    column_name,
                    data_type,
                    is_nullable,
                    column_default
                FROM information_schema.columns
                WHERE table_schema = 'public'
                ORDER BY table_name, ordinal_position
            `;
            
            const columnsResult = await client.query(columnsQuery);
            const columns = columnsResult.rows;
            
            // Check for required extensions
            const extensionsQuery = `
                SELECT extname 
                FROM pg_extension 
                WHERE extname IN ('uuid-ossp', 'postgis', 'pg_trgm')
            `;
            
            const extensionsResult = await client.query(extensionsQuery);
            const extensions = extensionsResult.rows.map(row => row.extname);
            
            const schemaHealth = {
                status: 'healthy',
                tables: tables,
                totalTables: tables.length,
                totalColumns: columns.length,
                extensions: extensions,
                issues: []
            };
            
            // Check schema issues
            const requiredExtensions = ['uuid-ossp'];
            const missingExtensions = requiredExtensions.filter(ext => !extensions.includes(ext));
            
            if (missingExtensions.length > 0) {
                schemaHealth.status = 'warning';
                schemaHealth.issues.push(`Missing extensions: ${missingExtensions.join(', ')}`);
                this.optimizationRecommendations.push({
                    category: 'schema',
                    priority: 'high',
                    issue: 'Missing required extensions',
                    recommendation: `Install extensions: ${missingExtensions.join(', ')}`
                });
            }
            
            // Check for essential tables
            const tableNames = tables.map(t => t.table_name);
            const essentialTables = ['services'];
            const missingTables = essentialTables.filter(table => !tableNames.includes(table));
            
            if (missingTables.length > 0) {
                schemaHealth.status = 'critical';
                schemaHealth.issues.push(`Missing essential tables: ${missingTables.join(', ')}`);
            }
            
            console.log(`✅ Schema health: ${schemaHealth.status} (${tables.length} tables)`);
            return schemaHealth;
            
        } finally {
            client.release();
        }
    }

    /**
     * Analyze database indexes
     */
    async analyzeIndexes() {
        console.log('📇 Analyzing indexes...');
        
        const client = await this.db.pool.connect();
        
        try {
            // Get index information
            const indexQuery = `
                SELECT 
                    schemaname,
                    tablename,
                    indexname,
                    indexdef,
                    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
                    pg_relation_size(indexrelid) as index_size_bytes
                FROM pg_indexes 
                LEFT JOIN pg_stat_user_indexes USING (schemaname, tablename, indexname)
                WHERE schemaname = 'public'
                ORDER BY pg_relation_size(indexrelid) DESC
            `;
            
            const result = await client.query(indexQuery);
            const indexes = result.rows;
            
            // Unused indexes
            const unusedIndexQuery = `
                SELECT 
                    schemaname,
                    tablename,
                    indexname,
                    idx_scan
                FROM pg_stat_user_indexes
                WHERE schemaname = 'public'
                AND idx_scan = 0
                AND indexname NOT LIKE '%_pkey'
            `;
            
            const unusedResult = await client.query(unusedIndexQuery);
            const unusedIndexes = unusedResult.rows;
            
            const indexHealth = {
                status: 'healthy',
                totalIndexes: indexes.length,
                indexes: indexes,
                unusedIndexes: unusedIndexes,
                totalIndexSize: indexes.reduce((sum, idx) => sum + (idx.index_size_bytes || 0), 0),
                issues: []
            };
            
            // Check for index issues
            if (unusedIndexes.length > 0) {
                indexHealth.status = 'warning';
                indexHealth.issues.push(`${unusedIndexes.length} unused indexes found`);
                this.optimizationRecommendations.push({
                    category: 'indexes',
                    priority: 'medium',
                    issue: 'Unused indexes consuming space',
                    recommendation: `Consider dropping unused indexes: ${unusedIndexes.map(i => i.indexname).join(', ')}`
                });
            }
            
            // Check for missing recommended indexes
            const tablesResult = await client.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'services'
            `);
            
            if (tablesResult.rows.length > 0) {
                const existingIndexNames = indexes.map(i => i.indexname.toLowerCase());
                const recommendedIndexes = [
                    'idx_services_status',
                    'idx_services_youth_specific',
                    'idx_services_data_source'
                ];
                
                const missingIndexes = recommendedIndexes.filter(idx => 
                    !existingIndexNames.some(existing => existing.includes(idx.replace('idx_services_', '')))
                );
                
                if (missingIndexes.length > 0) {
                    indexHealth.issues.push(`Missing recommended indexes: ${missingIndexes.join(', ')}`);
                    this.optimizationRecommendations.push({
                        category: 'indexes',
                        priority: 'medium',
                        issue: 'Missing recommended indexes',
                        recommendation: `Create indexes for better query performance: ${missingIndexes.join(', ')}`
                    });
                }
            }
            
            console.log(`✅ Index health: ${indexHealth.status} (${indexes.length} indexes)`);
            return indexHealth;
            
        } finally {
            client.release();
        }
    }

    /**
     * Calculate overall health score
     */
    calculateOverallHealth() {
        const scores = {
            'healthy': 100,
            'warning': 70,
            'critical': 30
        };
        
        const components = [
            this.healthMetrics.connection?.status || 'critical',
            this.healthMetrics.data?.status || 'critical',
            this.healthMetrics.performance?.status || 'critical',
            this.healthMetrics.schema?.status || 'critical',
            this.healthMetrics.indexes?.status || 'critical'
        ];
        
        const avgScore = components.reduce((sum, status) => sum + scores[status], 0) / components.length;
        
        let overallStatus = 'healthy';
        if (avgScore < 50) overallStatus = 'critical';
        else if (avgScore < 80) overallStatus = 'warning';
        
        return {
            status: overallStatus,
            score: Math.round(avgScore),
            componentScores: components.map((status, index) => ({
                component: ['connection', 'data', 'performance', 'schema', 'indexes'][index],
                status,
                score: scores[status]
            }))
        };
    }

    /**
     * Generate scalability assessment
     */
    async assessScalability() {
        console.log('📈 Assessing scalability...');
        
        const currentMetrics = this.healthMetrics;
        
        this.scalabilityAssessment = {
            currentCapacity: {
                services: currentMetrics.data?.totalServices || 0,
                dataSources: currentMetrics.data?.dataSources?.length || 0,
                databaseSize: currentMetrics.performance?.databaseSizeBytes || 0
            },
            projectedCapacity: {
                services: {
                    '6_months': this.projectGrowth(currentMetrics.data?.totalServices || 0, 6),
                    '1_year': this.projectGrowth(currentMetrics.data?.totalServices || 0, 12),
                    '2_years': this.projectGrowth(currentMetrics.data?.totalServices || 0, 24)
                },
                databaseSize: {
                    '6_months': this.projectDatabaseGrowth(currentMetrics.performance?.databaseSizeBytes || 0, 6),
                    '1_year': this.projectDatabaseGrowth(currentMetrics.performance?.databaseSizeBytes || 0, 12),
                    '2_years': this.projectDatabaseGrowth(currentMetrics.performance?.databaseSizeBytes || 0, 24)
                }
            },
            bottlenecks: this.identifyBottlenecks(),
            scalabilityScore: this.calculateScalabilityScore(),
            recommendations: this.generateScalabilityRecommendations()
        };
        
        return this.scalabilityAssessment;
    }

    /**
     * Project service growth
     */
    projectGrowth(currentCount, months) {
        // Assume 20% growth per quarter for youth services sector
        const quarterlyGrowth = 0.20;
        const quarters = months / 3;
        return Math.round(currentCount * Math.pow(1 + quarterlyGrowth, quarters));
    }

    /**
     * Project database size growth
     */
    projectDatabaseGrowth(currentSize, months) {
        // Database grows faster than service count due to additional data
        const monthlyGrowth = 0.15; // 15% monthly growth
        return Math.round(currentSize * Math.pow(1 + monthlyGrowth, months));
    }

    /**
     * Identify scalability bottlenecks
     */
    identifyBottlenecks() {
        const bottlenecks = [];
        const metrics = this.healthMetrics;
        
        // Connection bottlenecks
        if (metrics.connection?.connectionUtilization > 60) {
            bottlenecks.push({
                component: 'connections',
                severity: 'high',
                description: 'High connection utilization may limit concurrent users',
                impact: 'User experience degradation under load'
            });
        }
        
        // Data volume bottlenecks
        if (metrics.data?.totalServices > 50000) {
            bottlenecks.push({
                component: 'data_volume',
                severity: 'medium',
                description: 'Large service dataset may impact query performance',
                impact: 'Slower search and filtering operations'
            });
        }
        
        // Index bottlenecks
        if (metrics.indexes?.unusedIndexes?.length > 5) {
            bottlenecks.push({
                component: 'indexes',
                severity: 'medium',
                description: 'Too many unused indexes consuming resources',
                impact: 'Increased storage costs and slower write operations'
            });
        }
        
        return bottlenecks;
    }

    /**
     * Calculate scalability score
     */
    calculateScalabilityScore() {
        let score = 100;
        
        // Deduct points for bottlenecks
        this.scalabilityAssessment?.bottlenecks?.forEach(bottleneck => {
            if (bottleneck.severity === 'high') score -= 20;
            else if (bottleneck.severity === 'medium') score -= 10;
            else score -= 5;
        });
        
        // Deduct points for high resource utilization
        const connectionUtil = this.healthMetrics.connection?.connectionUtilization || 0;
        if (connectionUtil > 80) score -= 15;
        else if (connectionUtil > 60) score -= 10;
        
        return Math.max(0, score);
    }

    /**
     * Generate scalability recommendations
     */
    generateScalabilityRecommendations() {
        const recommendations = [];
        
        // Connection scaling
        recommendations.push({
            category: 'connection_pooling',
            priority: 'high',
            title: 'Implement Connection Pooling',
            description: 'Use PgBouncer or similar for efficient connection management',
            estimatedImpact: 'Support 5x more concurrent users'
        });
        
        // Read replicas
        recommendations.push({
            category: 'read_scaling',
            priority: 'high',
            title: 'Deploy Read Replicas',
            description: 'Separate read and write operations for better performance',
            estimatedImpact: 'Reduce query latency by 60%'
        });
        
        // Caching layer
        recommendations.push({
            category: 'caching',
            priority: 'medium',
            title: 'Implement Redis Caching',
            description: 'Cache frequently accessed service data and search results',
            estimatedImpact: 'Reduce database load by 40%'
        });
        
        // Search optimization
        recommendations.push({
            category: 'search',
            priority: 'medium',
            title: 'Implement Elasticsearch',
            description: 'Use dedicated search engine for complex service discovery',
            estimatedImpact: 'Improve search performance by 10x'
        });
        
        // Microservices architecture
        recommendations.push({
            category: 'architecture',
            priority: 'low',
            title: 'Consider Microservices',
            description: 'Split into separate services for different domains',
            estimatedImpact: 'Independent scaling of components'
        });
        
        return recommendations;
    }

    /**
     * Generate comprehensive health report
     */
    async generateHealthReport() {
        console.log('\n📋 Generating comprehensive health report...');
        
        const report = {
            metadata: {
                timestamp: new Date().toISOString(),
                analysisVersion: '1.0.0',
                databaseType: 'PostgreSQL'
            },
            healthMetrics: this.healthMetrics,
            scalabilityAssessment: this.scalabilityAssessment,
            optimizationRecommendations: this.optimizationRecommendations,
            summary: {
                overallHealth: this.healthMetrics.overall,
                totalServices: this.healthMetrics.data?.totalServices || 0,
                scalabilityScore: this.scalabilityAssessment?.scalabilityScore || 0,
                criticalIssues: this.optimizationRecommendations.filter(r => r.priority === 'high').length,
                recommendations: this.optimizationRecommendations.length
            }
        };
        
        // Save report
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `database-health-report-${timestamp}.json`;
        
        await fs.writeFile(filename, JSON.stringify(report, null, 2));
        
        console.log(`💾 Health report saved: ${filename}`);
        
        return report;
    }

    /**
     * Close database connections
     */
    async close() {
        if (this.db?.pool) {
            await this.db.pool.end();
        }
    }
}

export default DatabaseHealthAnalyzer;