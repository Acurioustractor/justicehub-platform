import pino from 'pino';
import db from '../config/database.js';
import { createHash } from 'crypto';

const logger = pino({ name: 'scraper-monitor' });

export class ScraperMonitor {
  constructor() {
    this.metrics = new Map();
    this.alerts = [];
    this.qualityThresholds = {
      minSuccessRate: 0.8,
      maxErrorRate: 0.2,
      minDataQuality: 0.7,
      maxDuplicateRate: 0.1
    };
  }

  // Real-time scraper performance tracking
  async trackScraperRun(scraperName, result) {
    const timestamp = new Date();
    
    const metrics = {
      scraper: scraperName,
      timestamp,
      success: result.success || false,
      servicesFound: result.servicesFound || 0,
      servicesProcessed: result.servicesProcessed || 0,
      errors: result.errors || 0,
      duration: result.duration || 0,
      successRate: result.servicesFound > 0 ? result.servicesProcessed / result.servicesFound : 0,
      errorRate: result.servicesFound > 0 ? result.errors / result.servicesFound : 0
    };

    // Store in database
    await this.storeMetrics(metrics);
    
    // Check for alerts
    await this.checkAlerts(metrics);
    
    // Update running averages
    this.updateRunningMetrics(scraperName, metrics);

    logger.info(`📊 ${scraperName}: ${metrics.servicesProcessed} services, ${(metrics.successRate * 100).toFixed(1)}% success, ${metrics.duration}ms`);
    
    return metrics;
  }

  async storeMetrics(metrics) {
    try {
      await db('scraping_jobs').insert({
        id: this.generateId(),
        source_name: metrics.scraper,
        source_url: 'monitoring',
        job_type: 'scrape',
        status: metrics.success ? 'completed' : 'failed',
        pages_scraped: 1,
        services_found: metrics.servicesFound,
        errors_count: metrics.errors,
        started_at: metrics.timestamp,
        completed_at: metrics.timestamp,
        created_at: metrics.timestamp,
        updated_at: metrics.timestamp
      });
    } catch (error) {
      logger.error('Failed to store metrics:', error);
    }
  }

  async checkAlerts(metrics) {
    const alerts = [];

    // Success rate too low
    if (metrics.successRate < this.qualityThresholds.minSuccessRate) {
      alerts.push({
        type: 'LOW_SUCCESS_RATE',
        scraper: metrics.scraper,
        value: metrics.successRate,
        threshold: this.qualityThresholds.minSuccessRate,
        severity: 'high',
        message: `${metrics.scraper} success rate ${(metrics.successRate * 100).toFixed(1)}% below threshold ${(this.qualityThresholds.minSuccessRate * 100)}%`
      });
    }

    // Error rate too high
    if (metrics.errorRate > this.qualityThresholds.maxErrorRate) {
      alerts.push({
        type: 'HIGH_ERROR_RATE',
        scraper: metrics.scraper,
        value: metrics.errorRate,
        threshold: this.qualityThresholds.maxErrorRate,
        severity: 'medium',
        message: `${metrics.scraper} error rate ${(metrics.errorRate * 100).toFixed(1)}% above threshold ${(this.qualityThresholds.maxErrorRate * 100)}%`
      });
    }

    // No services found (potential source down)
    if (metrics.servicesFound === 0) {
      alerts.push({
        type: 'NO_SERVICES_FOUND',
        scraper: metrics.scraper,
        value: 0,
        severity: 'high',
        message: `${metrics.scraper} found no services - source may be down or changed`
      });
    }

    // Store and log alerts
    for (const alert of alerts) {
      this.alerts.push({ ...alert, timestamp: new Date() });
      logger.warn(alert, `🚨 ALERT: ${alert.message}`);
    }

    return alerts;
  }

  // Data quality monitoring
  async analyzeDataQuality() {
    logger.info('🔍 Analyzing data quality...');

    const qualityReport = {
      totalServices: 0,
      completeness: {},
      duplicates: {},
      freshness: {},
      accuracy: {},
      coverage: {}
    };

    // Total services
    const [total] = await db('services').count('* as count');
    qualityReport.totalServices = parseInt(total.count);

    // Completeness analysis
    qualityReport.completeness = await this.analyzeCompleteness();
    
    // Duplicate detection
    qualityReport.duplicates = await this.detectDuplicates();
    
    // Data freshness
    qualityReport.freshness = await this.analyzeFreshness();
    
    // Geographic coverage
    qualityReport.coverage = await this.analyzeCoverage();

    // Overall quality score
    qualityReport.overallScore = this.calculateQualityScore(qualityReport);

    logger.info(`📈 Data Quality Score: ${(qualityReport.overallScore * 100).toFixed(1)}%`);
    
    return qualityReport;
  }

  async analyzeCompleteness() {
    const completeness = {};
    
    // Essential field completeness
    const fields = {
      name: 'name IS NOT NULL AND name != \'\'',
      description: 'description IS NOT NULL AND length(description) > 50',
      phone: 'EXISTS(SELECT 1 FROM contacts c WHERE c.service_id = s.id AND c.phone IS NOT NULL)',
      email: 'EXISTS(SELECT 1 FROM contacts c WHERE c.service_id = s.id AND c.email IS NOT NULL)',
      address: 'EXISTS(SELECT 1 FROM locations l WHERE l.service_id = s.id AND l.address_1 IS NOT NULL)',
      coordinates: 'EXISTS(SELECT 1 FROM locations l WHERE l.service_id = s.id AND l.latitude IS NOT NULL AND l.longitude IS NOT NULL)',
      categories: 'array_length(categories, 1) > 0',
      age_range: 'minimum_age IS NOT NULL OR maximum_age IS NOT NULL'
    };

    for (const [field, condition] of Object.entries(fields)) {
      const [result] = await db('services as s')
        .whereRaw(condition)
        .count('* as count');
      
      const [total] = await db('services').count('* as count');
      
      completeness[field] = {
        complete: parseInt(result.count),
        total: parseInt(total.count),
        percentage: parseInt(result.count) / parseInt(total.count)
      };
    }

    return completeness;
  }

  async detectDuplicates() {
    // Find potential duplicates by name similarity and location
    const duplicates = await db.raw(`
      SELECT 
        s1.id as service1_id,
        s1.name as service1_name,
        s2.id as service2_id, 
        s2.name as service2_name,
        similarity(s1.name, s2.name) as name_similarity
      FROM services s1
      JOIN services s2 ON s1.id < s2.id
      WHERE similarity(s1.name, s2.name) > 0.8
      ORDER BY name_similarity DESC
      LIMIT 100
    `);

    return {
      potentialDuplicates: duplicates.rows.length,
      examples: duplicates.rows.slice(0, 10)
    };
  }

  async analyzeFreshness() {
    const freshness = await db.raw(`
      SELECT 
        COUNT(CASE WHEN updated_at > NOW() - INTERVAL '7 days' THEN 1 END) as updated_last_week,
        COUNT(CASE WHEN updated_at > NOW() - INTERVAL '30 days' THEN 1 END) as updated_last_month,
        COUNT(CASE WHEN updated_at > NOW() - INTERVAL '90 days' THEN 1 END) as updated_last_quarter,
        COUNT(*) as total,
        AVG(EXTRACT(EPOCH FROM (NOW() - updated_at)) / 86400) as avg_days_since_update
      FROM services
    `);

    return freshness.rows[0];
  }

  async analyzeCoverage() {
    // Geographic coverage analysis
    const coverage = await db.raw(`
      SELECT 
        l.region,
        COUNT(DISTINCT s.id) as service_count,
        COUNT(DISTINCT s.organization_id) as organization_count,
        array_agg(DISTINCT unnest(s.categories)) as categories_covered
      FROM services s
      JOIN locations l ON l.service_id = s.id
      WHERE s.status = 'active'
      GROUP BY l.region
      ORDER BY service_count DESC
    `);

    return {
      byRegion: coverage.rows,
      totalRegions: coverage.rows.length
    };
  }

  calculateQualityScore(report) {
    let score = 0;
    let factors = 0;

    // Completeness score (40% of total)
    if (report.completeness) {
      const avgCompleteness = Object.values(report.completeness)
        .reduce((sum, field) => sum + field.percentage, 0) / Object.keys(report.completeness).length;
      score += avgCompleteness * 0.4;
      factors += 0.4;
    }

    // Freshness score (30% of total)
    if (report.freshness && report.freshness.total > 0) {
      const recentUpdates = report.freshness.updated_last_month / report.freshness.total;
      score += recentUpdates * 0.3;
      factors += 0.3;
    }

    // Coverage score (20% of total)
    if (report.coverage && report.coverage.totalRegions > 0) {
      const coverageScore = Math.min(report.coverage.totalRegions / 13, 1); // 13 regions in Queensland
      score += coverageScore * 0.2;
      factors += 0.2;
    }

    // Duplicate penalty (10% of total)
    if (report.duplicates && report.totalServices > 0) {
      const duplicateRate = report.duplicates.potentialDuplicates / report.totalServices;
      const duplicateScore = Math.max(0, 1 - duplicateRate * 2); // Penalty for duplicates
      score += duplicateScore * 0.1;
      factors += 0.1;
    }

    return factors > 0 ? score / factors : 0;
  }

  // Performance optimization suggestions
  async generateOptimizationSuggestions() {
    const suggestions = [];
    
    // Analyze scraper performance
    const scraperStats = await this.getScraperPerformanceStats();
    
    for (const [scraper, stats] of Object.entries(scraperStats)) {
      if (stats.avgSuccessRate < 0.8) {
        suggestions.push({
          type: 'PERFORMANCE',
          scraper,
          priority: 'high',
          suggestion: `${scraper} has low success rate (${(stats.avgSuccessRate * 100).toFixed(1)}%). Consider updating selectors or rate limiting.`,
          action: 'review_scraper_logic'
        });
      }

      if (stats.avgDuration > 30000) {
        suggestions.push({
          type: 'PERFORMANCE', 
          scraper,
          priority: 'medium',
          suggestion: `${scraper} is slow (${stats.avgDuration}ms average). Consider optimizing requests or adding parallel processing.`,
          action: 'optimize_performance'
        });
      }

      if (stats.servicesFound === 0) {
        suggestions.push({
          type: 'RELIABILITY',
          scraper,
          priority: 'critical',
          suggestion: `${scraper} hasn't found services recently. Source may have changed or be down.`,
          action: 'investigate_source'
        });
      }
    }

    return suggestions;
  }

  async getScraperPerformanceStats() {
    const stats = await db('scraping_jobs')
      .select('source_name')
      .avg('services_found as avg_services')
      .avg('errors_count as avg_errors')
      .count('* as total_runs')
      .where('created_at', '>', db.raw("NOW() - INTERVAL '7 days'"))
      .groupBy('source_name');

    const result = {};
    for (const stat of stats) {
      result[stat.source_name] = {
        avgServicesFound: parseFloat(stat.avg_services) || 0,
        avgErrors: parseFloat(stat.avg_errors) || 0,
        totalRuns: parseInt(stat.total_runs),
        avgSuccessRate: stat.avg_services > 0 ? (stat.avg_services - stat.avg_errors) / stat.avg_services : 0
      };
    }

    return result;
  }

  // Generate comprehensive monitoring report
  async generateMonitoringReport() {
    logger.info('📊 Generating comprehensive monitoring report...');

    const report = {
      timestamp: new Date(),
      summary: {},
      dataQuality: await this.analyzeDataQuality(),
      scraperPerformance: await this.getScraperPerformanceStats(),
      recentAlerts: this.alerts.slice(-10),
      optimizationSuggestions: await this.generateOptimizationSuggestions(),
      recommendations: []
    };

    // Summary stats
    const [totalServices] = await db('services').count('* as count');
    const [totalOrgs] = await db('organizations').count('* as count');
    const [recentServices] = await db('services')
      .where('created_at', '>', db.raw("NOW() - INTERVAL '24 hours'"))
      .count('* as count');

    report.summary = {
      totalServices: parseInt(totalServices.count),
      totalOrganizations: parseInt(totalOrgs.count),
      servicesAddedLast24h: parseInt(recentServices.count),
      dataQualityScore: report.dataQuality.overallScore,
      activeScrapers: Object.keys(report.scraperPerformance).length
    };

    // Generate recommendations
    if (report.dataQuality.overallScore < 0.7) {
      report.recommendations.push('Data quality below target (70%). Focus on improving completeness and reducing duplicates.');
    }

    if (report.summary.servicesAddedLast24h < 10) {
      report.recommendations.push('Low recent data collection. Check scraper performance and source availability.');
    }

    logger.info(`📈 Report generated: ${report.summary.totalServices} services, ${(report.dataQuality.overallScore * 100).toFixed(1)}% quality`);
    
    return report;
  }

  updateRunningMetrics(scraperName, metrics) {
    if (!this.metrics.has(scraperName)) {
      this.metrics.set(scraperName, {
        runs: 0,
        totalServices: 0,
        totalErrors: 0,
        totalDuration: 0
      });
    }

    const current = this.metrics.get(scraperName);
    current.runs++;
    current.totalServices += metrics.servicesFound;
    current.totalErrors += metrics.errors;
    current.totalDuration += metrics.duration;
    
    this.metrics.set(scraperName, current);
  }

  generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

export default ScraperMonitor;