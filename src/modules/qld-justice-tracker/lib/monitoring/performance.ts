import { getSupabaseAdmin } from '@/lib/supabase/server';

// Performance metrics interface
export interface PerformanceMetrics {
  queryTime: number;
  timestamp: Date;
  operation: string;
  table: string;
  recordCount?: number;
  success: boolean;
  error?: string;
}

// Query performance tracker
class QueryPerformanceTracker {
  private metrics: PerformanceMetrics[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics

  // Track query performance
  async trackQuery<T>(
    operation: string,
    table: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    const timestamp = new Date();

    try {
      const result = await queryFn();
      const queryTime = performance.now() - startTime;

      // Determine record count if result is an array
      const recordCount = Array.isArray(result) ? result.length : undefined;

      this.addMetric({
        queryTime,
        timestamp,
        operation,
        table,
        recordCount,
        success: true,
      });

      // Log slow queries
      if (queryTime > 1000) { // 1 second threshold
        console.warn(`🐌 Slow query detected: ${operation} on ${table} took ${queryTime.toFixed(2)}ms`);
      }

      return result;
    } catch (error) {
      const queryTime = performance.now() - startTime;
      
      this.addMetric({
        queryTime,
        timestamp,
        operation,
        table,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  // Add metric to collection
  private addMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);
    
    // Trim old metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  // Get performance statistics
  getStats(timeRangeMs?: number) {
    const now = Date.now();
    const metrics = timeRangeMs 
      ? this.metrics.filter(m => now - m.timestamp.getTime() <= timeRangeMs)
      : this.metrics;

    if (metrics.length === 0) {
      return null;
    }

    const successful = metrics.filter(m => m.success);
    const failed = metrics.filter(m => !m.success);
    const queryTimes = successful.map(m => m.queryTime);

    return {
      totalQueries: metrics.length,
      successfulQueries: successful.length,
      failedQueries: failed.length,
      successRate: (successful.length / metrics.length) * 100,
      averageQueryTime: queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length,
      minQueryTime: Math.min(...queryTimes),
      maxQueryTime: Math.max(...queryTimes),
      medianQueryTime: this.calculateMedian(queryTimes),
      slowQueries: successful.filter(m => m.queryTime > 1000).length,
      timeRange: timeRangeMs || 'all time',
    };
  }

  // Get stats by table
  getStatsByTable(timeRangeMs?: number) {
    const now = Date.now();
    const metrics = timeRangeMs 
      ? this.metrics.filter(m => now - m.timestamp.getTime() <= timeRangeMs)
      : this.metrics;

    const tableStats = new Map<string, PerformanceMetrics[]>();
    
    for (const metric of metrics) {
      if (!tableStats.has(metric.table)) {
        tableStats.set(metric.table, []);
      }
      tableStats.get(metric.table)!.push(metric);
    }

    const result = new Map<string, any>();
    
    for (const [table, tableMetrics] of tableStats) {
      const successful = tableMetrics.filter(m => m.success);
      const queryTimes = successful.map(m => m.queryTime);
      
      if (queryTimes.length > 0) {
        result.set(table, {
          totalQueries: tableMetrics.length,
          successfulQueries: successful.length,
          averageQueryTime: queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length,
          maxQueryTime: Math.max(...queryTimes),
          slowQueries: successful.filter(m => m.queryTime > 1000).length,
        });
      }
    }

    return result;
  }

  // Get recent slow queries
  getSlowQueries(limit = 10) {
    return this.metrics
      .filter(m => m.success && m.queryTime > 1000)
      .sort((a, b) => b.queryTime - a.queryTime)
      .slice(0, limit)
      .map(m => ({
        operation: m.operation,
        table: m.table,
        queryTime: m.queryTime,
        timestamp: m.timestamp,
        recordCount: m.recordCount,
      }));
  }

  // Calculate median
  private calculateMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }
    
    return sorted[middle];
  }

  // Export metrics for analysis
  exportMetrics() {
    return {
      metrics: this.metrics,
      summary: this.getStats(),
      tableStats: Object.fromEntries(this.getStatsByTable()),
      slowQueries: this.getSlowQueries(),
    };
  }
}

// Global instance
export const queryTracker = new QueryPerformanceTracker();

// Database health checker
export class DatabaseHealthChecker {
  private supabase = getSupabaseAdmin();

  // Check database connectivity
  async checkConnectivity(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
    const startTime = performance.now();
    
    try {
      const { error } = await this.supabase
        .from('youth_statistics')
        .select('count')
        .limit(1)
        .single();

      const latency = performance.now() - startTime;

      if (error) {
        return { healthy: false, error: error.message };
      }

      return { healthy: true, latency };
    } catch (error) {
      const latency = performance.now() - startTime;
      return {
        healthy: false,
        latency,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Check table sizes
  async checkTableSizes() {
    const tables = [
      'youth_statistics',
      'budget_allocations',
      'court_statistics',
      'parliamentary_documents',
      'scraped_content',
      'audit_logs',
    ];

    const tableSizes = new Map<string, number>();

    for (const table of tables) {
      try {
        const { count, error } = await this.supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          tableSizes.set(table, count || 0);
        }
      } catch (error) {
        tableSizes.set(table, -1); // Error indicator
      }
    }

    return tableSizes;
  }

  // Comprehensive health check
  async performHealthCheck() {
    const startTime = Date.now();

    const [connectivity, tableSizes] = await Promise.all([
      this.checkConnectivity(),
      this.checkTableSizes(),
    ]);

    const healthCheck = {
      timestamp: new Date().toISOString(),
      healthy: connectivity.healthy,
      connectivity,
      tableSizes: Object.fromEntries(tableSizes),
      performance: queryTracker.getStats(60000), // Last minute
      duration: Date.now() - startTime,
    };

    return healthCheck;
  }
}

// Performance monitoring middleware for repositories
export function withPerformanceTracking<T extends any[], R>(
  operation: string,
  table: string,
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    return queryTracker.trackQuery(operation, table, () => fn(...args));
  };
}

// Alert system for performance issues
export class PerformanceAlerter {
  private alertThresholds = {
    slowQueryTime: 2000, // 2 seconds
    errorRate: 10, // 10%
    consecutiveFailures: 5,
  };

  private consecutiveFailures = 0;

  // Check if alerts should be triggered
  checkAlerts() {
    const stats = queryTracker.getStats(300000); // Last 5 minutes
    const alerts: any[] = [];

    if (!stats) {
      return alerts;
    }

    // Check error rate
    if (stats.successRate < 100 - this.alertThresholds.errorRate) {
      alerts.push({
        type: 'HIGH_ERROR_RATE',
        message: `Error rate is ${(100 - stats.successRate).toFixed(1)}% (threshold: ${this.alertThresholds.errorRate}%)`,
        severity: 'HIGH',
      });
    }

    // Check for slow queries
    if (stats.slowQueries > 0) {
      alerts.push({
        type: 'SLOW_QUERIES',
        message: `${stats.slowQueries} slow queries detected in the last 5 minutes`,
        severity: 'MEDIUM',
      });
    }

    // Check average query time
    if (stats.averageQueryTime > this.alertThresholds.slowQueryTime) {
      alerts.push({
        type: 'HIGH_AVERAGE_LATENCY',
        message: `Average query time is ${stats.averageQueryTime.toFixed(2)}ms (threshold: ${this.alertThresholds.slowQueryTime}ms)`,
        severity: 'MEDIUM',
      });
    }

    return alerts;
  }

  // Record failure for consecutive failure tracking
  recordFailure() {
    this.consecutiveFailures++;
    
    if (this.consecutiveFailures >= this.alertThresholds.consecutiveFailures) {
      return {
        type: 'CONSECUTIVE_FAILURES',
        message: `${this.consecutiveFailures} consecutive database failures`,
        severity: 'CRITICAL',
      };
    }

    return null;
  }

  // Record success (resets consecutive failures)
  recordSuccess() {
    this.consecutiveFailures = 0;
  }
}

// Global instances
export const healthChecker = new DatabaseHealthChecker();
export const performanceAlerter = new PerformanceAlerter();