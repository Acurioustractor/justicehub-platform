// Simplified server for free hosting
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import pino from 'pino';
import db from '../config/database.js';

// Import route handlers
import servicesRoutes from './routes/services.js';
import organizationsRoutes from './routes/organizations.js';
import searchRoutes from './routes/search.js';
import simpleSearchRoutes from './routes/simple-search.js';
import healthRoutes from './routes/health.js';
import statsRoutes from './routes/stats.js';
import monitoringRoutes from './routes/monitoring.js';
import debugRoutes from './routes/debug.js';
import createDataRoutes from './routes/create-data.js';
import dataDownloadRoutes from './routes/data-download.js';
import dataAnalysisRoutes from './routes/data-analysis.js';
import realAnalysisRoutes from './routes/real-analysis.js';
import quickFixRoutes from './routes/quick-fix.js';
import import603ServicesRoutes from './routes/import-603-services.js';
import bulletproofImportRoutes from './routes/bulletproof-import.js';
import workingImportRoutes from './routes/working-import.js';
import budgetIntelligenceRoutes from './routes/budget-intelligence.js';
import debugDbRoutes from './routes/debug-db.js';
import diagnosticSearchRoutes from './routes/diagnostic-search.js';
import { addSchemas } from './schemas.js';
import cachePlugin from './plugins/cache-plugin.js';
import monitoringPlugin from './plugins/monitoring-plugin.js';
import { globalErrorHandler } from '../utils/error-handler.js';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: { colorize: true }
  } : undefined
});

export async function createSimpleServer(options = {}) {
  const fastify = Fastify({
    logger,
    trustProxy: true,
    ...options
  });

  // Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  });

  // CORS - more permissive for free hosting
  await fastify.register(cors, {
    origin: process.env.NODE_ENV === 'production' 
      ? (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : true)
      : true,
    credentials: true
  });

  // Rate limiting - more lenient for free tier
  await fastify.register(rateLimit, {
    max: parseInt(process.env.API_RATE_LIMIT) || 50, // Lower for free tier
    timeWindow: '1 minute',
    errorResponseBuilder: (request, context) => {
      return {
        code: 429,
        error: 'Too Many Requests',
        message: `Rate limit exceeded, retry in ${Math.round(context.ttl / 1000)} seconds`,
        retryAfter: Math.round(context.ttl / 1000)
      };
    }
  });

  // API Documentation
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Youth Justice Service Finder API (Free Tier)',
        description: 'Simplified API for finding youth justice and support services across Queensland, Australia',
        version: '1.0.0',
        contact: {
          name: 'Youth Justice Service Finder',
          url: 'https://github.com/Acurioustractor/Youth-Justice-Service-Finder'
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT'
        }
      },
      servers: [
        {
          url: 'https://youth-justice-api.railway.app',
          description: 'Production server (Railway)'
        },
        {
          url: 'http://localhost:3001',
          description: 'Development server'
        }
      ],
      tags: [
        { name: 'Services', description: 'Youth service operations' },
        { name: 'Organizations', description: 'Service provider operations' },
        { name: 'Search', description: 'Search operations (simplified)' },
        { name: 'Health', description: 'API health and monitoring' },
        { name: 'Stats', description: 'Database statistics' },
        { name: 'Budget Intelligence', description: 'Queensland budget tracking and analysis' }
      ]
    }
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    },
    staticCSP: true,
    transformStaticCSP: (header) => header
  });

  // Add JSON schemas
  addSchemas(fastify);

  // Register cache plugin
  await fastify.register(cachePlugin);

  // Register monitoring plugin
  await fastify.register(monitoringPlugin);

  // Database connection hook
  fastify.addHook('onRequest', async (request, reply) => {
    request.db = db;
  });

  // Centralized error handler
  fastify.setErrorHandler(globalErrorHandler);

  // Not found handler - serves frontend in full-stack mode
  fastify.setNotFoundHandler((request, reply) => {
    // In full-stack mode, serve index.html for non-API routes
    if (options.isFullStack && !request.url.startsWith('/api') && 
        !request.url.startsWith('/health') && !request.url.startsWith('/services') &&
        !request.url.startsWith('/diagnostic-search') && !request.url.startsWith('/stats') &&
        !request.url.startsWith('/organizations') && !request.url.startsWith('/monitoring') &&
        !request.url.startsWith('/docs') && !request.url.startsWith('/debug')) {
      return reply.sendFile('index.html');
    }
    
    // Default API 404 response
    return reply.status(404).send({
      error: {
        message: 'Route not found',
        statusCode: 404,
        url: request.url,
        method: request.method
      }
    });
  });

  // Register routes
  await fastify.register(healthRoutes, { prefix: '/health' });
  await fastify.register(statsRoutes, { prefix: '/stats' });
  // DISABLED: await fastify.register(monitoringRoutes, { prefix: '/monitoring' }); // Conflicts with monitoring plugin
  await fastify.register(debugRoutes, { prefix: '/debug' });
  await fastify.register(createDataRoutes, { prefix: '/create-data' });
  await fastify.register(dataDownloadRoutes, { prefix: '/data' });
  await fastify.register(dataAnalysisRoutes, { prefix: '/analysis' });
  await fastify.register(realAnalysisRoutes, { prefix: '/real-analysis' });
  await fastify.register(quickFixRoutes, { prefix: '/quick-fix' });
  await fastify.register(import603ServicesRoutes, { prefix: '/import' });
  await fastify.register(bulletproofImportRoutes, { prefix: '/bulletproof' });
  await fastify.register(workingImportRoutes, { prefix: '/working-import' });
  
  // MAIN SEARCH - Production-ready diagnostic search (renamed from diagnostic-search)
  await fastify.register(diagnosticSearchRoutes, { prefix: '/diagnostic-search' });
  
  // Register main search routes (handles '/' endpoint) - BROKEN
  // await fastify.register(searchRoutes, { prefix: '/search' });
  
  // Register additional simple search routes ('/simple', '/geo', etc) - BROKEN
  // await fastify.register(simpleSearchRoutes, { prefix: '/search' });
  
  // Keep original search routes but make them optional
  try {
    if (process.env.ELASTICSEARCH_URL) {
      const elasticsearchSearchRoutes = await import('./routes/elasticsearch-search.js').then(m => m.default);
      await fastify.register(elasticsearchSearchRoutes, { prefix: '/search/es' });
    }
  } catch (error) {
    fastify.log.warn('Elasticsearch routes not available, using simple search only');
  }
  
  await fastify.register(servicesRoutes, { prefix: '/services' });
  await fastify.register(organizationsRoutes, { prefix: '/organizations' });
  await fastify.register(budgetIntelligenceRoutes, { prefix: '/budget-intelligence' });
  
  // Debug database routes (temporary for troubleshooting)
  await fastify.register(debugDbRoutes, { prefix: '/debug-db' });

  // Root endpoint - only for API mode, not full-stack mode
  if (!options.isFullStack) {
    fastify.get('/', async (request, reply) => {
      return {
        name: 'Youth Justice Service Finder API (Free Tier)',
      version: '1.0.0',
      description: 'Simplified API for finding youth justice and support services',
      documentation: '/docs',
      health: '/health',
      endpoints: {
        services: '/services',
        organizations: '/organizations',
        search: '/diagnostic-search',
        stats: '/stats',
        monitoring: '/monitoring',
        debug: '/debug',
        budgetIntelligence: '/budget-intelligence'
      },
      features: [
        'Basic text search',
        'Geographic search',
        'Simple autocomplete',
        'Service filtering',
        'PostgreSQL database'
      ],
      upgrade: {
        message: 'For advanced features like Elasticsearch, fuzzy search, and Temporal workflows, upgrade to paid hosting',
        elasticsearch: process.env.ELASTICSEARCH_URL ? 'Available at /search/es/*' : 'Not configured',
        workflows: 'Available in full deployment'
      }
    };
  });
  }

  return fastify;
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const start = async () => {
    try {
      const server = await createSimpleServer();
      const port = process.env.PORT || 3001;
      const host = process.env.HOST || '0.0.0.0';
      
      await server.listen({ port, host });
      console.log(`🚀 Youth Justice Service Finder API (Free Tier) running on http://${host}:${port}`);
      console.log(`📚 API Documentation available at http://${host}:${port}/docs`);
      console.log(`🔍 Simple search available at http://${host}:${port}/search/simple`);
    } catch (err) {
      console.error('Error starting server:', err);
      process.exit(1);
    }
  };
  
  start();
}