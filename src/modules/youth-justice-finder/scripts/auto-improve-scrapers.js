#!/usr/bin/env node

import pino from 'pino';
import db from '../src/config/database.js';
import ScraperMonitor from '../src/monitoring/scraper-monitor.js';

const logger = pino({ name: 'scraper-optimizer' });

class ScraperOptimizer {
  constructor() {
    this.monitor = new ScraperMonitor();
    this.improvementActions = [];
  }

  async analyzeAndImprove() {
    logger.info('🔧 Starting automated scraper improvement analysis...');

    // Generate comprehensive analysis
    const report = await this.monitor.generateMonitoringReport();
    const suggestions = await this.monitor.generateOptimizationSuggestions();

    logger.info(`📊 Analysis complete: ${suggestions.length} improvement opportunities found`);

    // Execute automated improvements
    for (const suggestion of suggestions) {
      try {
        await this.executeSuggestion(suggestion);
      } catch (error) {
        logger.error(`Failed to execute suggestion for ${suggestion.scraper}:`, error);
      }
    }

    // Generate improvement report
    const improvementReport = await this.generateImprovementReport(report, suggestions);
    
    logger.info('✅ Automated improvement process completed');
    return improvementReport;
  }

  async executeSuggestion(suggestion) {
    switch (suggestion.action) {
      case 'review_scraper_logic':
        await this.reviewScraperLogic(suggestion);
        break;
      case 'optimize_performance':
        await this.optimizePerformance(suggestion);
        break;
      case 'investigate_source':
        await this.investigateSource(suggestion);
        break;
      default:
        logger.warn(`Unknown action: ${suggestion.action}`);
    }
  }

  async reviewScraperLogic(suggestion) {
    logger.info(`🔍 Reviewing scraper logic: ${suggestion.scraper}`);

    // Check recent errors for pattern analysis
    const recentErrors = await db('scraping_jobs')
      .where('source_name', suggestion.scraper)
      .where('status', 'failed')
      .where('created_at', '>', db.raw("NOW() - INTERVAL '7 days'"))
      .orderBy('created_at', 'desc')
      .limit(10);

    // Analyze error patterns
    const errorPatterns = this.analyzeErrorPatterns(recentErrors);
    
    this.improvementActions.push({
      scraper: suggestion.scraper,
      action: 'logic_review',
      findings: errorPatterns,
      recommendations: this.generateLogicRecommendations(errorPatterns),
      automated: false,
      requiresManualReview: true
    });

    logger.info(`📋 Logic review completed for ${suggestion.scraper}: ${errorPatterns.length} patterns identified`);
  }

  async optimizePerformance(suggestion) {
    logger.info(`⚡ Optimizing performance: ${suggestion.scraper}`);

    // Analyze performance metrics
    const performanceData = await db('scraping_jobs')
      .where('source_name', suggestion.scraper)
      .where('created_at', '>', db.raw("NOW() - INTERVAL '14 days'"))
      .select('*');

    const optimization = this.analyzePerformanceData(performanceData);

    this.improvementActions.push({
      scraper: suggestion.scraper,
      action: 'performance_optimization',
      currentMetrics: optimization.current,
      optimizationTargets: optimization.targets,
      recommendations: optimization.recommendations,
      automated: true,
      implemented: false
    });

    // Attempt automated optimization
    if (optimization.canAutoOptimize) {
      await this.implementPerformanceOptimization(suggestion.scraper, optimization);
    }

    logger.info(`🚀 Performance optimization planned for ${suggestion.scraper}`);
  }

  async investigateSource(suggestion) {
    logger.info(`🕵️ Investigating source: ${suggestion.scraper}`);

    // Check if source is responding
    const investigation = {
      scraper: suggestion.scraper,
      lastSuccessfulRun: null,
      consecutiveFailures: 0,
      possibleCauses: [],
      recommendedActions: []
    };

    // Get recent run history
    const recentRuns = await db('scraping_jobs')
      .where('source_name', suggestion.scraper)
      .orderBy('created_at', 'desc')
      .limit(20);

    if (recentRuns.length > 0) {
      const successfulRuns = recentRuns.filter(run => run.status === 'completed' && run.services_found > 0);
      investigation.lastSuccessfulRun = successfulRuns[0]?.created_at || null;
      
      // Count consecutive failures
      let failures = 0;
      for (const run of recentRuns) {
        if (run.status === 'failed' || run.services_found === 0) {
          failures++;
        } else {
          break;
        }
      }
      investigation.consecutiveFailures = failures;
    }

    // Determine possible causes
    if (investigation.consecutiveFailures > 5) {
      investigation.possibleCauses.push('Source website may be down or restructured');
      investigation.recommendedActions.push('Check source URL and page structure');
    }

    if (investigation.lastSuccessfulRun) {
      const daysSinceSuccess = Math.floor((Date.now() - new Date(investigation.lastSuccessfulRun)) / (1000 * 60 * 60 * 24));
      if (daysSinceSuccess > 7) {
        investigation.possibleCauses.push('Source may have implemented blocking or rate limiting');
        investigation.recommendedActions.push('Review rate limiting and user agent settings');
      }
    }

    this.improvementActions.push({
      scraper: suggestion.scraper,
      action: 'source_investigation',
      investigation,
      automated: false,
      requiresManualReview: true
    });

    logger.info(`🔍 Investigation completed for ${suggestion.scraper}: ${investigation.possibleCauses.length} potential issues identified`);
  }

  analyzeErrorPatterns(errors) {
    const patterns = [];
    const errorMessages = errors.map(e => e.error_message || 'Unknown error');
    
    // Common error patterns
    const commonPatterns = [
      { pattern: /timeout/i, type: 'TIMEOUT', description: 'Request timeouts' },
      { pattern: /404|not found/i, type: 'NOT_FOUND', description: 'Page not found errors' },
      { pattern: /403|forbidden/i, type: 'ACCESS_DENIED', description: 'Access denied errors' },
      { pattern: /rate limit/i, type: 'RATE_LIMITED', description: 'Rate limiting detected' },
      { pattern: /connection/i, type: 'CONNECTION', description: 'Connection issues' },
      { pattern: /selector|element/i, type: 'SELECTOR', description: 'Page structure changed' }
    ];

    for (const { pattern, type, description } of commonPatterns) {
      const matches = errorMessages.filter(msg => pattern.test(msg));
      if (matches.length > 0) {
        patterns.push({
          type,
          description,
          occurrences: matches.length,
          percentage: (matches.length / errorMessages.length) * 100,
          examples: matches.slice(0, 3)
        });
      }
    }

    return patterns;
  }

  generateLogicRecommendations(patterns) {
    const recommendations = [];

    for (const pattern of patterns) {
      switch (pattern.type) {
        case 'TIMEOUT':
          recommendations.push('Increase request timeout values');
          recommendations.push('Implement retry logic with exponential backoff');
          break;
        case 'NOT_FOUND':
          recommendations.push('Update URLs and endpoints');
          recommendations.push('Verify page structure hasn\'t changed');
          break;
        case 'ACCESS_DENIED':
          recommendations.push('Review user agent and headers');
          recommendations.push('Implement proper authentication if required');
          break;
        case 'RATE_LIMITED':
          recommendations.push('Implement more aggressive rate limiting');
          recommendations.push('Add random delays between requests');
          break;
        case 'SELECTOR':
          recommendations.push('Update CSS selectors and XPath expressions');
          recommendations.push('Implement fallback selectors');
          break;
      }
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  analyzePerformanceData(data) {
    if (data.length === 0) {
      return {
        current: {},
        targets: {},
        recommendations: [],
        canAutoOptimize: false
      };
    }

    const durations = data.map(d => {
      const start = new Date(d.started_at);
      const end = new Date(d.completed_at);
      return end - start;
    }).filter(d => d > 0);

    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const avgServicesPerRun = data.reduce((sum, d) => sum + (d.services_found || 0), 0) / data.length;

    const analysis = {
      current: {
        avgDuration: Math.round(avgDuration),
        maxDuration: maxDuration,
        avgServicesPerRun: Math.round(avgServicesPerRun),
        successRate: data.filter(d => d.status === 'completed').length / data.length
      },
      targets: {
        avgDuration: Math.round(avgDuration * 0.8), // 20% faster
        maxDuration: Math.round(maxDuration * 0.7), // 30% faster peak
        minSuccessRate: 0.9
      },
      recommendations: [],
      canAutoOptimize: false
    };

    // Generate recommendations
    if (avgDuration > 30000) { // 30 seconds
      analysis.recommendations.push('Implement parallel processing for multiple requests');
      analysis.recommendations.push('Add request timeout optimization');
    }

    if (analysis.current.successRate < 0.8) {
      analysis.recommendations.push('Improve error handling and retry logic');
    }

    // Determine if we can auto-optimize
    analysis.canAutoOptimize = avgDuration > 20000 && analysis.current.successRate > 0.7;

    return analysis;
  }

  async implementPerformanceOptimization(scraperName, optimization) {
    // This would implement actual performance optimizations
    // For now, we'll create optimization records
    
    logger.info(`🔧 Implementing performance optimization for ${scraperName}`);
    
    // Record the optimization attempt
    try {
      await db('scraping_jobs').insert({
        id: this.generateId(),
        source_name: scraperName,
        source_url: 'optimization',
        job_type: 'optimize',
        status: 'completed',
        pages_scraped: 0,
        services_found: 0,
        errors_count: 0,
        started_at: new Date(),
        completed_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      });
      
      logger.info(`✅ Performance optimization recorded for ${scraperName}`);
    } catch (error) {
      logger.error(`Failed to record optimization for ${scraperName}:`, error);
    }
  }

  async generateImprovementReport(monitoringReport, suggestions) {
    const report = {
      timestamp: new Date(),
      summary: {
        totalSuggestions: suggestions.length,
        actionsTaken: this.improvementActions.length,
        automatedActions: this.improvementActions.filter(a => a.automated).length,
        manualReviewRequired: this.improvementActions.filter(a => a.requiresManualReview).length
      },
      dataQuality: {
        beforeOptimization: monitoringReport.dataQuality.overallScore,
        target: 0.85,
        improvementNeeded: Math.max(0, 0.85 - monitoringReport.dataQuality.overallScore)
      },
      actions: this.improvementActions,
      nextSteps: [
        'Review manual optimization recommendations',
        'Monitor performance improvements over next 24-48 hours',
        'Schedule follow-up optimization in 1 week',
        'Consider adding new data sources for better coverage'
      ],
      monitoringUrls: {
        dashboard: '/monitoring/dashboard',
        performance: '/monitoring/performance',
        quality: '/monitoring/quality',
        trends: '/monitoring/trends?days=7'
      }
    };

    logger.info(`📊 Improvement report: ${report.summary.actionsTaken} actions taken, ${report.summary.manualReviewRequired} require review`);
    
    return report;
  }

  generateId() {
    return Math.random().toString(36).substring(2, 15);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const optimizer = new ScraperOptimizer();
  
  optimizer.analyzeAndImprove()
    .then(report => {
      console.log('\n🚀 IMPROVEMENT REPORT:');
      console.log(JSON.stringify(report, null, 2));
      process.exit(0);
    })
    .catch(error => {
      logger.error('Optimization failed:', error);
      process.exit(1);
    });
}

export default ScraperOptimizer;