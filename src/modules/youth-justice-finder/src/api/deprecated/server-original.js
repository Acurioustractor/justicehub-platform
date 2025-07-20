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
import elasticsearchSearchRoutes from './routes/elasticsearch-search.js';
import healthRoutes from './routes/health.js';
import statsRoutes from './routes/stats.js';
import dataDownloadRoutes from './routes/data-download.js';
import budgetIntelligenceRoutes from './routes/budget-intelligence.js';
import { addSchemas } from './schemas.js';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: { colorize: true }
  } : undefined
});

export async function createServer(options = {}) {
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

  // CORS
  await fastify.register(cors, {
    origin: process.env.NODE_ENV === 'production' 
      ? (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['https://youthservices.qld.gov.au', 'https://api.youthservices.qld.gov.au'])
      : true,
    credentials: true
  });

  // Rate limiting
  await fastify.register(rateLimit, {
    max: parseInt(process.env.API_RATE_LIMIT) || 100, // requests per timeWindow
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
        title: 'Youth Justice Service Finder API',
        description: 'Comprehensive API for finding youth justice and support services across Queensland, Australia',
        version: '1.0.0',
        contact: {
          name: 'Youth Justice Service Finder',
          email: 'support@youthservices.qld.gov.au'
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT'
        }
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server'
        },
        {
          url: 'https://api.youthservices.qld.gov.au',
          description: 'Production server'
        }
      ],
      tags: [
        { name: 'Services', description: 'Youth service operations' },
        { name: 'Organizations', description: 'Service provider operations' },
        { name: 'Search', description: 'Advanced search operations' },
        { name: 'Health', description: 'API health and monitoring' },
        { name: 'Stats', description: 'Database statistics' },
        { name: 'Data', description: 'Data download operations' },
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

  // Database connection hook
  fastify.addHook('onRequest', async (request, reply) => {
    request.db = db;
  });

  // Error handler
  fastify.setErrorHandler(async (error, request, reply) => {
    const { statusCode = 500 } = error;
    
    fastify.log.error({
      error: error.message,
      stack: error.stack,
      request: {
        method: request.method,
        url: request.url,
        headers: request.headers
      }
    });

    const response = {
      error: {
        message: statusCode >= 500 ? 'Internal Server Error' : error.message,
        statusCode,
        timestamp: new Date().toISOString()
      }
    };

    if (process.env.NODE_ENV === 'development') {
      response.error.stack = error.stack;
    }

    return reply.status(statusCode).send(response);
  });

  // Not found handler
  fastify.setNotFoundHandler((request, reply) => {
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
  await fastify.register(searchRoutes, { prefix: '/search' });
  await fastify.register(elasticsearchSearchRoutes, { prefix: '/search/es' });
  await fastify.register(servicesRoutes, { prefix: '/services' });
  await fastify.register(organizationsRoutes, { prefix: '/organizations' });
  await fastify.register(dataDownloadRoutes, { prefix: '/data' });
  await fastify.register(budgetIntelligenceRoutes, { prefix: '/budget-intelligence' });

  // Root endpoint
  fastify.get('/', async (request, reply) => {
    return {
      name: 'Youth Justice Service Finder API',
      version: '1.0.0',
      description: 'Comprehensive API for finding youth justice and support services',
      documentation: '/docs',
      health: '/health',
      endpoints: {
        services: '/services',
        organizations: '/organizations',
        search: '/search',
        stats: '/stats',
        data: '/data',
        budgetIntelligence: '/budget-intelligence'
      }
    };
  });

  return fastify;
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const start = async () => {
    try {
      const server = await createServer();
      const port = process.env.PORT || 3000;
      const host = process.env.HOST || '0.0.0.0';
      
      await server.listen({ port, host });
      console.log(`🚀 Youth Justice Service Finder API running on http://${host}:${port}`);
      console.log(`📚 API Documentation available at http://${host}:${port}/docs`);
    } catch (err) {
      console.error('Error starting server:', err);
      process.exit(1);
    }
  };
  
  start();
}