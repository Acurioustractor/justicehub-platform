import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabaseHelpers } from '../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createSupabaseServer(options = {}) {
  const fastify = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: { colorize: true }
      }
    },
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
    origin: true,
    credentials: true
  });

  // Rate limiting
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
  });

  // API Documentation
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Youth Justice Service Finder (Supabase)',
        description: 'Fast, reliable API powered by Supabase',
        version: '2.0.0'
      }
    }
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    }
  });

  // Health endpoint
  fastify.get('/health', async (request, reply) => {
    try {
      const stats = await supabaseHelpers.getStats();
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'supabase',
        stats
      };
    } catch (error) {
      reply.status(503);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  });

  // Services endpoints
  fastify.get('/services', async (request, reply) => {
    try {
      const { page = 1, limit = 20, search, location } = request.query;
      const filters = {};
      
      if (search) filters.search = search;
      if (location) filters.location = location;
      
      const result = await supabaseHelpers.getServices(
        parseInt(page), 
        parseInt(limit), 
        filters
      );
      
      return {
        success: true,
        data: result.services,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit)
        }
      };
    } catch (error) {
      fastify.log.error('Services endpoint error:', error);
      reply.status(500);
      return {
        success: false,
        error: 'Failed to fetch services',
        message: error.message
      };
    }
  });

  // Search endpoint
  fastify.get('/search', async (request, reply) => {
    try {
      const { q, limit = 50 } = request.query;
      
      if (!q) {
        reply.status(400);
        return {
          success: false,
          error: 'Search query (q) parameter is required'
        };
      }
      
      const results = await supabaseHelpers.searchServices(q, parseInt(limit));
      
      return {
        success: true,
        query: q,
        results: results.length,
        data: results
      };
    } catch (error) {
      fastify.log.error('Search endpoint error:', error);
      reply.status(500);
      return {
        success: false,
        error: 'Search failed',
        message: error.message
      };
    }
  });

  // Get service by ID
  fastify.get('/services/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const service = await supabaseHelpers.getServiceById(id);
      
      if (!service) {
        reply.status(404);
        return {
          success: false,
          error: 'Service not found'
        };
      }
      
      return {
        success: true,
        data: service
      };
    } catch (error) {
      fastify.log.error('Get service endpoint error:', error);
      reply.status(500);
      return {
        success: false,
        error: 'Failed to fetch service',
        message: error.message
      };
    }
  });

  // Database stats endpoint
  fastify.get('/stats', async (request, reply) => {
    try {
      const stats = await supabaseHelpers.getStats();
      return {
        success: true,
        stats,
        database: 'supabase',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      fastify.log.error('Stats endpoint error:', error);
      reply.status(500);
      return {
        success: false,
        error: 'Failed to fetch stats',
        message: error.message
      };
    }
  });

  // Serve static frontend files in full-stack mode
  if (options.isFullStack) {
    const frontendPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
    
    const fastifyStatic = await import('@fastify/static');
    await fastify.register(fastifyStatic.default, {
      root: frontendPath,
      prefix: '/',
      prefixAvoidTrailingSlash: true
    });

    // SPA fallback
    fastify.setNotFoundHandler((request, reply) => {
      if (!request.url.startsWith('/services') && 
          !request.url.startsWith('/search') && 
          !request.url.startsWith('/health') && 
          !request.url.startsWith('/stats') &&
          !request.url.startsWith('/docs')) {
        return reply.sendFile('index.html');
      }
      
      reply.status(404).send({
        success: false,
        error: 'Route not found',
        url: request.url
      });
    });
  }

  // API root endpoint
  if (!options.isFullStack) {
    fastify.get('/', async () => {
      return {
        name: 'Youth Justice Service Finder (Supabase)',
        version: '2.0.0',
        description: 'Fast, reliable API powered by Supabase',
        database: 'supabase',
        endpoints: {
          health: '/health',
          services: '/services',
          search: '/search',
          stats: '/stats',
          docs: '/docs'
        },
        features: [
          'Supabase PostgreSQL database',
          'Real-time capabilities',
          'Auto-scaling',
          'Built-in search',
          'Geographic queries',
          'No local database required'
        ]
      };
    });
  }

  return fastify;
}

async function startSupabaseServer() {
  try {
    const server = await createSupabaseServer({ isFullStack: true });
    
    const port = process.env.PORT || 3000;
    const host = process.env.HOST || '0.0.0.0';
    
    await server.listen({ port, host });
    
    console.log(`🚀 Youth Justice Service Finder (Supabase) running on http://${host}:${port}`);
    console.log(`📚 API Documentation: http://${host}:${port}/docs`);
    console.log(`🌐 Frontend Application: http://${host}:${port}/`);
    console.log(`🔍 Search API: http://${host}:${port}/search`);
    console.log(`❤️ Health Check: http://${host}:${port}/health`);
    console.log(`📊 Database: Supabase (cloud-hosted)`);
    
  } catch (err) {
    console.error('Error starting Supabase server:', err);
    process.exit(1);
  }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startSupabaseServer();
}

export { createSupabaseServer, startSupabaseServer }; 