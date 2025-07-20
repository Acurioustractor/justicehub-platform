import db from '../config/database.js';
import pino from 'pino';

const logger = pino();

class DatabasePerformanceService {
  constructor() {
    this.slowQueryThreshold = 1000; // 1 second
    this.queryCache = new Map();
    this.enableQueryLogging = process.env.NODE_ENV !== 'production' || process.env.ENABLE_QUERY_LOGGING === 'true';
  }

  // Wrap database queries with performance monitoring
  wrapQueryWithMonitoring(db) {
    const originalRaw = db.raw.bind(db);
    const originalSelect = db.select.bind(db);
    
    db.raw = async (...args) => {
      const startTime = Date.now();
      const queryType = 'raw_query';
      
      try {
        const result = await originalRaw(...args);
        const executionTime = Date.now() - startTime;
        
        await this.logQueryPerformance(queryType, executionTime, args[0]);
        
        return result;
      } catch (error) {
        const executionTime = Date.now() - startTime;
        await this.logQueryPerformance(queryType, executionTime, args[0], error);
        throw error;
      }
    };

    // Wrap knex query builder methods
    const methods = ['select', 'insert', 'update', 'delete'];
    methods.forEach(method => {
      const original = db[method].bind(db);
      db[method] = (...args) => {
        const query = original(...args);
        return this.wrapQueryBuilder(query, method);
      };
    });

    return db;
  }

  wrapQueryBuilder(query, queryType) {
    const originalThen = query.then.bind(query);
    
    query.then = (onResolve, onReject) => {
      const startTime = Date.now();
      
      return originalThen(
        async (result) => {
          const executionTime = Date.now() - startTime;
          await this.logQueryPerformance(queryType, executionTime, query.toString());
          return onResolve ? onResolve(result) : result;
        },
        async (error) => {
          const executionTime = Date.now() - startTime;
          await this.logQueryPerformance(queryType, executionTime, query.toString(), error);
          return onReject ? onReject(error) : Promise.reject(error);
        }
      );
    };

    return query;
  }

  async logQueryPerformance(queryType, executionTime, queryText, error = null) {
    try {
      // Log to console in development
      if (this.enableQueryLogging) {
        const logLevel = executionTime > this.slowQueryThreshold ? 'warn' : 'debug';
        logger[logLevel]({
          type: 'db_query_performance',
          queryType,
          executionTime,
          query: queryText?.substring(0, 200), // First 200 chars
          error: error ? error.message : null,
          slow: executionTime > this.slowQueryThreshold
        });
      }

      // Log to database if available and not in a transaction
      if (db && executionTime > 100) { // Only log queries > 100ms to database
        const queryHash = this.generateQueryHash(queryText);
        
        // Use a separate connection to avoid issues with the main query
        await db.raw(`
          INSERT INTO query_performance_log (query_type, execution_time_ms, query_hash)
          VALUES (?, ?, ?)
        `, [queryType, executionTime, queryHash]).catch(logError => {
          // Silently ignore logging errors to not interfere with main queries
          logger.debug('Failed to log query performance:', logError.message);
        });
      }
    } catch (logError) {
      // Don't let logging errors affect the main application
      logger.debug('Query performance logging error:', logError.message);
    }
  }

  generateQueryHash(queryText) {
    if (!queryText) return null;
    
    // Simple hash function for query fingerprinting
    let hash = 0;
    for (let i = 0; i < queryText.length; i++) {
      const char = queryText.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  // Get query performance statistics
  async getPerformanceStats() {
    try {
      const stats = await db.raw(`
        SELECT * FROM query_performance_stats
      `);

      const slowQueries = await db.raw(`
        SELECT 
          query_type,
          execution_time_ms,
          query_hash,
          executed_at
        FROM query_performance_log 
        WHERE slow_query = true 
        ORDER BY executed_at DESC 
        LIMIT 10
      `);

      const recentActivity = await db.raw(`
        SELECT 
          DATE_TRUNC('hour', executed_at) as hour,
          COUNT(*) as query_count,
          AVG(execution_time_ms) as avg_execution_time
        FROM query_performance_log
        WHERE executed_at > NOW() - INTERVAL '24 hours'
        GROUP BY DATE_TRUNC('hour', executed_at)
        ORDER BY hour DESC
      `);

      return {
        overall_stats: stats.rows,
        slow_queries: slowQueries.rows,
        recent_activity: recentActivity.rows,
        thresholds: {
          slow_query_ms: this.slowQueryThreshold,
          logged_query_ms: 100
        }
      };
    } catch (error) {
      logger.error('Failed to get performance stats:', error);
      return {
        error: 'Performance stats unavailable',
        overall_stats: [],
        slow_queries: [],
        recent_activity: []
      };
    }
  }

  // Analyze table statistics
  async getTableStats() {
    try {
      const tableStats = await db.raw(`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_rows,
          n_dead_tup as dead_rows,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze,
          vacuum_count,
          autovacuum_count,
          analyze_count,
          autoanalyze_count
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC
      `);

      const indexStats = await db.raw(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_tup_read as index_reads,
          idx_tup_fetch as index_fetches,
          idx_scan as index_scans
        FROM pg_stat_user_indexes
        WHERE idx_scan > 0
        ORDER BY idx_scan DESC
        LIMIT 20
      `);

      const indexUsage = await db.raw(`
        SELECT 
          t.tablename,
          indexname,
          c.reltuples::bigint AS num_rows,
          pg_size_pretty(pg_relation_size(indexrelname::regclass)) AS index_size,
          idx_scan as number_of_scans,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched
        FROM pg_tables t
        LEFT OUTER JOIN pg_class c ON c.relname = t.tablename
        LEFT OUTER JOIN (
          SELECT
            c.relname AS ctablename,
            ipg.relname AS indexname,
            x.indnatts AS number_of_columns,
            idx_scan,
            idx_tup_read,
            idx_tup_fetch,
            indexrelname
          FROM pg_index x
          JOIN pg_class c ON c.oid = x.indrelid
          JOIN pg_class ipg ON ipg.oid = x.indexrelid
          JOIN pg_stat_all_indexes psai ON x.indexrelid = psai.indexrelid
        ) AS foo ON t.tablename = foo.ctablename
        WHERE t.schemaname = 'public'
        ORDER BY number_of_scans DESC
      `);

      return {
        table_stats: tableStats.rows,
        index_stats: indexStats.rows,
        index_usage: indexUsage.rows
      };
    } catch (error) {
      logger.error('Failed to get table stats:', error);
      return {
        error: 'Table stats unavailable',
        table_stats: [],
        index_stats: [],
        index_usage: []
      };
    }
  }

  // Check for missing indexes
  async analyzeMissingIndexes() {
    try {
      const missingIndexes = await db.raw(`
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation,
          most_common_vals
        FROM pg_stats
        WHERE schemaname = 'public'
        AND n_distinct > 100  -- Tables with high cardinality
        AND correlation < 0.1  -- Low correlation (random access pattern)
        ORDER BY n_distinct DESC
      `);

      // Check for sequential scans on large tables
      const sequentialScans = await db.raw(`
        SELECT 
          schemaname,
          tablename,
          seq_scan,
          seq_tup_read,
          idx_scan,
          n_live_tup,
          CASE 
            WHEN seq_scan > 0 
            THEN seq_tup_read / seq_scan 
            ELSE 0 
          END as avg_seq_read
        FROM pg_stat_user_tables
        WHERE n_live_tup > 10000  -- Large tables
        AND seq_scan > idx_scan   -- More sequential than index scans
        ORDER BY seq_tup_read DESC
      `);

      return {
        high_cardinality_columns: missingIndexes.rows,
        large_table_sequential_scans: sequentialScans.rows
      };
    } catch (error) {
      logger.error('Failed to analyze missing indexes:', error);
      return {
        error: 'Index analysis unavailable',
        high_cardinality_columns: [],
        large_table_sequential_scans: []
      };
    }
  }

  // Get database health metrics
  async getDatabaseHealth() {
    try {
      const connectionStats = await db.raw(`
        SELECT 
          state,
          COUNT(*) as count
        FROM pg_stat_activity
        WHERE datname = current_database()
        GROUP BY state
      `);

      const databaseSize = await db.raw(`
        SELECT 
          pg_database.datname,
          pg_size_pretty(pg_database_size(pg_database.datname)) AS size
        FROM pg_database
        WHERE datname = current_database()
      `);

      const lockStats = await db.raw(`
        SELECT 
          mode,
          COUNT(*) as count
        FROM pg_locks
        WHERE database = (SELECT oid FROM pg_database WHERE datname = current_database())
        GROUP BY mode
      `);

      return {
        connections: connectionStats.rows,
        database_size: databaseSize.rows[0],
        locks: lockStats.rows,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get database health:', error);
      return {
        error: 'Database health unavailable',
        connections: [],
        database_size: null,
        locks: []
      };
    }
  }

  // Clean up old performance logs
  async cleanupOldLogs(daysToKeep = 7) {
    try {
      const result = await db.raw(`
        DELETE FROM query_performance_log
        WHERE executed_at < NOW() - INTERVAL '${daysToKeep} days'
      `);

      logger.info(`Cleaned up ${result.rowCount} old performance log entries`);
      return result.rowCount;
    } catch (error) {
      logger.error('Failed to cleanup old logs:', error);
      return 0;
    }
  }
}

export default new DatabasePerformanceService();