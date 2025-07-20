import ScraperMonitor from '../../monitoring/scraper-monitor.js';
import monitoringService from '../../services/monitoring-service.js';
import dbPerformanceService from '../../services/database-performance-service.js';

export default async function monitoringRoutes(fastify, options) {
  const monitor = new ScraperMonitor();

  // Real-time scraper dashboard
  fastify.get('/dashboard', {
    schema: {
      tags: ['Monitoring'],
      description: 'Get real-time scraper monitoring dashboard'
    }
  }, async (request, reply) => {
    try {
      const report = await monitor.generateMonitoringReport();
      
      return {
        status: 'active',
        ...report,
        dashboardUrl: '/monitoring/dashboard',
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      fastify.log.error(error);
      throw new Error('Failed to generate monitoring dashboard');
    }
  });

  // Data quality analysis
  fastify.get('/quality', {
    schema: {
      tags: ['Monitoring'],
      description: 'Analyze data quality metrics'
    }
  }, async (request, reply) => {
    try {
      const quality = await monitor.analyzeDataQuality();
      return quality;
    } catch (error) {
      fastify.log.error(error);
      throw new Error('Failed to analyze data quality');
    }
  });

  // Scraper performance metrics
  fastify.get('/performance', {
    schema: {
      tags: ['Monitoring'],
      description: 'Get scraper performance statistics'
    }
  }, async (request, reply) => {
    try {
      const performance = await monitor.getScraperPerformanceStats();
      return {
        scrapers: performance,
        summary: {
          totalScrapers: Object.keys(performance).length,
          avgSuccessRate: Object.values(performance).reduce((sum, s) => sum + s.avgSuccessRate, 0) / Object.keys(performance).length,
          totalRuns: Object.values(performance).reduce((sum, s) => sum + s.totalRuns, 0)
        }
      };
    } catch (error) {
      fastify.log.error(error);
      throw new Error('Failed to get performance metrics');
    }
  });

  // Optimization suggestions
  fastify.get('/optimize', {
    schema: {
      tags: ['Monitoring'],
      description: 'Get optimization suggestions for scrapers'
    }
  }, async (request, reply) => {
    try {
      const suggestions = await monitor.generateOptimizationSuggestions();
      
      return {
        suggestions,
        totalSuggestions: suggestions.length,
        priorityBreakdown: {
          critical: suggestions.filter(s => s.priority === 'critical').length,
          high: suggestions.filter(s => s.priority === 'high').length,
          medium: suggestions.filter(s => s.priority === 'medium').length,
          low: suggestions.filter(s => s.priority === 'low').length
        }
      };
    } catch (error) {
      fastify.log.error(error);
      throw new Error('Failed to generate optimization suggestions');
    }
  });

  // Historical trends
  fastify.get('/trends', {
    schema: {
      tags: ['Monitoring'],
      description: 'Get historical data collection trends',
      querystring: {
        type: 'object',
        properties: {
          days: { type: 'integer', default: 7, minimum: 1, maximum: 90 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { days = 7 } = request.query;
      
      // Daily service collection trends
      const trends = await request.db.raw(`
        SELECT 
          DATE(created_at) as date,
          source_name,
          SUM(services_found) as services_found,
          SUM(errors_count) as errors,
          COUNT(*) as runs,
          AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration
        FROM scraping_jobs 
        WHERE created_at > NOW() - INTERVAL '${days} days'
        AND status = 'completed'
        GROUP BY DATE(created_at), source_name
        ORDER BY date DESC, source_name
      `);

      // Summary by scraper
      const scraperSummary = await request.db.raw(`
        SELECT 
          source_name,
          SUM(services_found) as total_services,
          SUM(errors_count) as total_errors,
          COUNT(*) as total_runs,
          AVG(services_found) as avg_services_per_run,
          MAX(created_at) as last_run
        FROM scraping_jobs 
        WHERE created_at > NOW() - INTERVAL '${days} days'
        GROUP BY source_name
        ORDER BY total_services DESC
      `);

      return {
        period: `${days} days`,
        dailyTrends: trends.rows,
        scraperSummary: scraperSummary.rows,
        totalServicesCollected: scraperSummary.rows.reduce((sum, row) => sum + parseInt(row.total_services), 0)
      };
    } catch (error) {
      fastify.log.error(error);
      throw new Error('Failed to get historical trends');
    }
  });

  // Manual scraper trigger with monitoring
  fastify.post('/trigger/:scraper', {
    schema: {
      tags: ['Monitoring'],
      description: 'Manually trigger a specific scraper with monitoring',
      params: {
        type: 'object',
        properties: {
          scraper: { type: 'string' }
        },
        required: ['scraper']
      }
    }
  }, async (request, reply) => {
    try {
      const { scraper } = request.params;
      
      fastify.log.info(`🚀 Manual trigger: ${scraper}`);
      
      // This would integrate with your scraper execution system
      // For now, return a tracking ID
      const trackingId = `manual-${Date.now()}`;
      
      return {
        message: `Scraper ${scraper} triggered successfully`,
        trackingId,
        status: 'queued',
        estimatedDuration: '2-5 minutes',
        monitorUrl: `/monitoring/job/${trackingId}`
      };
    } catch (error) {
      fastify.log.error(error);
      throw new Error('Failed to trigger scraper');
    }
  });

  // Live scraper logs
  fastify.get('/logs/:scraper', {
    schema: {
      tags: ['Monitoring'],
      description: 'Get recent logs for a specific scraper',
      params: {
        type: 'object',
        properties: {
          scraper: { type: 'string' }
        },
        required: ['scraper']
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', default: 50, maximum: 500 },
          level: { type: 'string', enum: ['error', 'warn', 'info', 'debug'], default: 'info' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { scraper } = request.params;
      const { limit = 50 } = request.query;
      
      const logs = await request.db('scraping_jobs')
        .where('source_name', scraper)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .select('*');

      return {
        scraper,
        logs,
        totalLogs: logs.length,
        latestRun: logs[0]?.created_at || null
      };
    } catch (error) {
      fastify.log.error(error);
      throw new Error('Failed to get scraper logs');
    }
  });

  // Note: /health route is provided by monitoring plugin at /monitoring/health
  // This duplicate route has been removed to avoid conflicts

  // Frontend error reporting endpoint
  fastify.post('/error', {
    schema: {
      tags: ['Monitoring'],
      description: 'Report frontend errors',
      body: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              stack: { type: 'string' },
              name: { type: 'string' }
            }
          },
          errorInfo: { type: 'object' },
          context: {
            type: 'object',
            properties: {
              url: { type: 'string' },
              userAgent: { type: 'string' },
              timestamp: { type: 'string' }
            }
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            errorId: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { error, errorInfo, context } = request.body;
    
    // Create a proper Error object for tracking
    const frontendError = new Error(error.message);
    frontendError.name = error.name || 'FrontendError';
    frontendError.stack = error.stack;
    
    const fullContext = {
      ...context,
      type: 'frontend_error',
      errorInfo,
      userAgent: request.headers['user-agent'],
      ip: request.ip
    };
    
    monitoringService.trackError(frontendError, fullContext);
    
    const errorId = Date.now().toString(36);
    
    return {
      success: true,
      errorId
    };
  });

  // System metrics endpoint
  fastify.get('/metrics', {
    schema: {
      tags: ['Monitoring'],
      description: 'Get detailed system metrics',
      response: {
        200: { type: 'object' }
      }
    }
  }, async (request, reply) => {
    return monitoringService.getMetrics();
  });

  // System health status
  fastify.get('/system-health', {
    schema: {
      tags: ['Monitoring'],
      description: 'Get system health status',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            issues: { type: 'array', items: { type: 'string' } },
            metrics: { type: 'object' }
          }
        }
      }
    }
  }, async (request, reply) => {
    return monitoringService.getHealthStatus();
  });

  // Database performance endpoints
  fastify.get('/database/performance', {
    schema: {
      tags: ['Database Monitoring'],
      description: 'Get database query performance statistics'
    }
  }, async (request, reply) => {
    return await dbPerformanceService.getPerformanceStats();
  });

  fastify.get('/database/tables', {
    schema: {
      tags: ['Database Monitoring'],
      description: 'Get database table statistics'
    }
  }, async (request, reply) => {
    return await dbPerformanceService.getTableStats();
  });

  fastify.get('/database/indexes', {
    schema: {
      tags: ['Database Monitoring'],
      description: 'Analyze database index usage and missing indexes'
    }
  }, async (request, reply) => {
    return await dbPerformanceService.analyzeMissingIndexes();
  });

  fastify.get('/database/health', {
    schema: {
      tags: ['Database Monitoring'],
      description: 'Get database health metrics'
    }
  }, async (request, reply) => {
    return await dbPerformanceService.getDatabaseHealth();
  });

  fastify.post('/database/cleanup', {
    schema: {
      tags: ['Database Monitoring'],
      description: 'Clean up old performance logs',
      body: {
        type: 'object',
        properties: {
          daysToKeep: { type: 'integer', minimum: 1, maximum: 90, default: 7 }
        }
      }
    }
  }, async (request, reply) => {
    const { daysToKeep = 7 } = request.body || {};
    const deletedRows = await dbPerformanceService.cleanupOldLogs(daysToKeep);
    
    return {
      success: true,
      deletedRows,
      message: `Cleaned up performance logs older than ${daysToKeep} days`
    };
  });
}