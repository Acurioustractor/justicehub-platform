import fp from 'fastify-plugin';
import monitoringService from '../../services/monitoring-service.js';

async function monitoringPlugin(fastify, options) {
  // Add monitoring service to fastify instance
  fastify.decorate('monitoring', monitoringService);

  // Track request start time
  fastify.addHook('onRequest', async (request, reply) => {
    request.startTime = Date.now();
  });

  // Track all requests
  fastify.addHook('onResponse', async (request, reply) => {
    const responseTime = Date.now() - request.startTime;
    
    monitoringService.trackRequest(
      request.method,
      request.url,
      reply.statusCode,
      responseTime,
      request.user?.id
    );

    // Track cache performance
    const cacheHeader = reply.getHeader('X-Cache');
    if (cacheHeader === 'HIT') {
      monitoringService.trackCacheHit();
    } else if (cacheHeader === 'MISS') {
      monitoringService.trackCacheMiss();
    }
  });

  // Track database query performance
  fastify.addHook('onRequest', async (request, reply) => {
    if (request.db) {
      const originalQuery = request.db.raw.bind(request.db);
      
      request.db.raw = function(...args) {
        const startTime = Date.now();
        const result = originalQuery(...args);
        
        // Handle promise-based queries
        if (result && typeof result.then === 'function') {
          return result.then(data => {
            const queryTime = Date.now() - startTime;
            monitoringService.trackPerformance('db_query', queryTime, {
              query: args[0]?.substring(0, 100) // First 100 chars of query
            });
            return data;
          }).catch(error => {
            const queryTime = Date.now() - startTime;
            monitoringService.trackPerformance('db_query', queryTime, {
              query: args[0]?.substring(0, 100),
              error: true
            });
            throw error;
          });
        }
        
        return result;
      };
    }
  });

  // Global error tracking
  fastify.setErrorHandler(async (error, request, reply) => {
    monitoringService.trackError(error, {
      method: request.method,
      url: request.url,
      headers: request.headers,
      body: request.body,
      query: request.query,
      params: request.params
    });

    // Call the original error handler if it exists
    if (fastify.errorHandler) {
      return fastify.errorHandler(error, request, reply);
    }

    // Default error response
    const statusCode = error.statusCode || 500;
    return reply.status(statusCode).send({
      error: {
        message: statusCode >= 500 ? 'Internal Server Error' : error.message,
        statusCode,
        timestamp: new Date().toISOString()
      }
    });
  });

  // Add monitoring routes
  fastify.get('/monitoring/health', {
    schema: {
      tags: ['Monitoring'],
      description: 'Get system health status'
    }
  }, async (request, reply) => {
    return monitoringService.getHealthStatus();
  });

  fastify.get('/monitoring/metrics', {
    schema: {
      tags: ['Monitoring'],
      description: 'Get detailed system metrics'
    }
  }, async (request, reply) => {
    return monitoringService.getMetrics();
  });

  // Process-level error tracking
  process.on('uncaughtException', (error) => {
    monitoringService.trackError(error, { type: 'uncaught_exception' });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    monitoringService.trackError(new Error(`Unhandled Rejection: ${reason}`), {
      type: 'unhandled_rejection',
      promise: promise.toString()
    });
  });

  // Warning tracking for common issues
  process.on('warning', (warning) => {
    monitoringService.trackWarning(warning.message, {
      name: warning.name,
      stack: warning.stack
    });
  });

  // Graceful shutdown metrics export
  fastify.addHook('onClose', async () => {
    monitoringService.exportMetrics();
  });
}

export default fp(monitoringPlugin, {
  name: 'monitoring-plugin',
  dependencies: []
});