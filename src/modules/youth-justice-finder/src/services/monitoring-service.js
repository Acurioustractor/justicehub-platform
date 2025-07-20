import pino from 'pino';
import fs from 'fs';
import path from 'path';

class MonitoringService {
  constructor() {
    this.logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: { colorize: true }
      } : undefined
    });
    
    this.metrics = {
      requests: {
        total: 0,
        errors: 0,
        by_endpoint: new Map(),
        by_status: new Map()
      },
      performance: {
        response_times: [],
        db_query_times: [],
        cache_hits: 0,
        cache_misses: 0
      },
      system: {
        uptime: Date.now(),
        errors: [],
        warnings: []
      }
    };

    // Setup periodic metrics collection
    this.setupMetricsCollection();
  }

  setupMetricsCollection() {
    // Reset counters every hour but keep cumulative totals
    setInterval(() => {
      this.metrics.performance.response_times = [];
      this.metrics.performance.db_query_times = [];
      
      // Keep only last 100 errors
      if (this.metrics.system.errors.length > 100) {
        this.metrics.system.errors = this.metrics.system.errors.slice(-100);
      }
      
      if (this.metrics.system.warnings.length > 100) {
        this.metrics.system.warnings = this.metrics.system.warnings.slice(-100);
      }
    }, 3600000); // 1 hour

    // Export metrics to file every 5 minutes
    setInterval(() => {
      this.exportMetrics();
    }, 300000); // 5 minutes
  }

  // Request tracking
  trackRequest(method, url, statusCode, responseTime, userId = null) {
    this.metrics.requests.total++;
    
    if (statusCode >= 400) {
      this.metrics.requests.errors++;
    }

    // Track by endpoint
    const endpoint = this.normalizeEndpoint(url);
    const endpointKey = `${method} ${endpoint}`;
    const endpointStats = this.metrics.requests.by_endpoint.get(endpointKey) || { count: 0, errors: 0 };
    endpointStats.count++;
    if (statusCode >= 400) endpointStats.errors++;
    this.metrics.requests.by_endpoint.set(endpointKey, endpointStats);

    // Track by status code
    const statusStats = this.metrics.requests.by_status.get(statusCode) || 0;
    this.metrics.requests.by_status.set(statusCode, statusStats + 1);

    // Track response time
    this.metrics.performance.response_times.push(responseTime);

    this.logger.info({
      type: 'request',
      method,
      url,
      statusCode,
      responseTime,
      userId
    });
  }

  // Error tracking
  trackError(error, context = {}) {
    const errorData = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      context,
      severity: this.determineErrorSeverity(error)
    };

    this.metrics.system.errors.push(errorData);
    
    this.logger.error({
      type: 'error',
      error: errorData
    });

    // Alert on critical errors
    if (errorData.severity === 'critical') {
      this.sendAlert('critical_error', errorData);
    }
  }

  // Performance tracking
  trackPerformance(operation, duration, metadata = {}) {
    if (operation === 'db_query') {
      this.metrics.performance.db_query_times.push(duration);
    }

    this.logger.debug({
      type: 'performance',
      operation,
      duration,
      metadata
    });
  }

  // Cache tracking
  trackCacheHit() {
    this.metrics.performance.cache_hits++;
  }

  trackCacheMiss() {
    this.metrics.performance.cache_misses++;
  }

  // System health tracking
  trackWarning(message, context = {}) {
    const warningData = {
      timestamp: new Date().toISOString(),
      message,
      context
    };

    this.metrics.system.warnings.push(warningData);
    
    this.logger.warn({
      type: 'warning',
      warning: warningData
    });
  }

  // Get current metrics
  getMetrics() {
    const now = Date.now();
    const uptimeMs = now - this.metrics.system.uptime;
    
    return {
      ...this.metrics,
      system: {
        ...this.metrics.system,
        uptime_ms: uptimeMs,
        uptime_human: this.formatUptime(uptimeMs),
        memory_usage: process.memoryUsage(),
        cpu_usage: process.cpuUsage()
      },
      performance: {
        ...this.metrics.performance,
        avg_response_time: this.calculateAverage(this.metrics.performance.response_times),
        avg_db_time: this.calculateAverage(this.metrics.performance.db_query_times),
        cache_hit_rate: this.calculateCacheHitRate()
      },
      timestamp: new Date().toISOString()
    };
  }

  // Health check
  getHealthStatus() {
    const metrics = this.getMetrics();
    const errorRate = metrics.requests.total > 0 ? 
      (metrics.requests.errors / metrics.requests.total) : 0;
    
    const avgResponseTime = metrics.performance.avg_response_time || 0;
    
    let status = 'healthy';
    let issues = [];

    if (errorRate > 0.05) { // 5% error rate
      status = 'unhealthy';
      issues.push(`High error rate: ${(errorRate * 100).toFixed(2)}%`);
    }

    if (avgResponseTime > 2000) { // 2 second response time
      status = 'degraded';
      issues.push(`Slow response time: ${avgResponseTime.toFixed(0)}ms`);
    }

    if (metrics.system.errors.length > 50) {
      status = 'degraded';
      issues.push(`High error count: ${metrics.system.errors.length}`);
    }

    return {
      status,
      issues,
      metrics: {
        error_rate: errorRate,
        avg_response_time: avgResponseTime,
        total_requests: metrics.requests.total,
        uptime: metrics.system.uptime_human
      }
    };
  }

  // Helper methods
  normalizeEndpoint(url) {
    // Replace IDs with :id placeholder
    return url.replace(/\/\d+/g, '/:id')
              .replace(/\?.*$/, ''); // Remove query params
  }

  determineErrorSeverity(error) {
    if (error.message.includes('ECONNREFUSED') || 
        error.message.includes('Database') ||
        error.message.includes('Redis')) {
      return 'critical';
    }
    
    if (error.statusCode >= 500) {
      return 'high';
    }
    
    if (error.statusCode >= 400) {
      return 'medium';
    }
    
    return 'low';
  }

  calculateAverage(array) {
    if (array.length === 0) return 0;
    return array.reduce((a, b) => a + b, 0) / array.length;
  }

  calculateCacheHitRate() {
    const total = this.metrics.performance.cache_hits + this.metrics.performance.cache_misses;
    return total > 0 ? (this.metrics.performance.cache_hits / total) : 0;
  }

  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  exportMetrics() {
    try {
      const metricsDir = './monitoring/metrics';
      if (!fs.existsSync(metricsDir)) {
        fs.mkdirSync(metricsDir, { recursive: true });
      }

      const filename = `metrics-${new Date().toISOString().slice(0, 10)}.json`;
      const filepath = path.join(metricsDir, filename);
      
      fs.writeFileSync(filepath, JSON.stringify(this.getMetrics(), null, 2));
    } catch (error) {
      this.logger.error('Failed to export metrics:', error);
    }
  }

  sendAlert(type, data) {
    // In production, this would send to Slack, email, etc.
    this.logger.error({
      type: 'alert',
      alert_type: type,
      data
    });
  }
}

// Create singleton instance
const monitoringService = new MonitoringService();

export default monitoringService;