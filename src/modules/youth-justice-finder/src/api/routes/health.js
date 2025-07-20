export default async function healthRoutes(fastify, options) {
  // Basic health check
  fastify.get('/', {
    schema: {
      tags: ['Health'],
      description: 'Basic health check endpoint',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' },
            version: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0'
    };
  });

  // Database health check
  fastify.get('/db', {
    schema: {
      tags: ['Health'],
      description: 'Database connectivity health check'
    }
  }, async (request, reply) => {
    try {
      const start = Date.now();
      const result = await request.db.raw('SELECT 1 as health');
      const duration = Date.now() - start;

      return {
        status: 'healthy',
        database: 'connected',
        response_time_ms: duration,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      fastify.log.error('Database health check failed:', error);
      
      return reply.status(503).send({
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Detailed system health
  fastify.get('/detailed', {
    schema: {
      tags: ['Health'],
      description: 'Detailed system health information'
    }
  }, async (request, reply) => {
    try {
      const start = Date.now();
      
      // Database check
      const dbResult = await request.db.raw('SELECT 1 as health');
      const dbResponseTime = Date.now() - start;

      // Get database statistics
      const [serviceCount] = await request.db('services').where('status', 'active').count();
      const [orgCount] = await request.db('organizations').count();
      
      // Memory usage
      const memUsage = process.memoryUsage();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        system: {
          platform: process.platform,
          arch: process.arch,
          node_version: process.version,
          memory: {
            used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
            total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
            external_mb: Math.round(memUsage.external / 1024 / 1024)
          }
        },
        database: {
          status: 'connected',
          response_time_ms: dbResponseTime,
          services_count: parseInt(serviceCount.count),
          organizations_count: parseInt(orgCount.count)
        }
      };
    } catch (error) {
      fastify.log.error('Detailed health check failed:', error);
      
      return reply.status(503).send({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Data freshness check
  fastify.get('/data', {
    schema: {
      tags: ['Health'],
      description: 'Check data freshness and quality'
    }
  }, async (request, reply) => {
    try {
      // Check last updated services
      const recentServices = await request.db('services')
        .where('status', 'active')
        .where('updated_at', '>', request.db.raw('NOW() - INTERVAL \'7 days\''))
        .count();

      // Check data sources
      const dataSources = await request.db('services')
        .where('status', 'active')
        .select('data_source')
        .count('* as count')
        .groupBy('data_source');

      // Check data quality metrics
      const withContacts = await request.db('contacts as c')
        .join('services as s', 'c.service_id', 's.id')
        .where('s.status', 'active')
        .whereNotNull('c.phone')
        .count();

      const withLocations = await request.db('locations as l')
        .join('services as s', 'l.service_id', 's.id')
        .where('s.status', 'active')
        .whereNotNull('l.latitude')
        .whereNotNull('l.longitude')
        .count();

      const [totalServices] = await request.db('services').where('status', 'active').count();
      const total = parseInt(totalServices.count);

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        data_freshness: {
          recently_updated: parseInt(recentServices[0].count),
          total_services: total,
          update_rate: `${Math.round((parseInt(recentServices[0].count) / total) * 100)}%`
        },
        data_sources: dataSources.map(ds => ({
          source: ds.data_source,
          count: parseInt(ds.count)
        })),
        data_quality: {
          with_contacts: `${Math.round((parseInt(withContacts[0].count) / total) * 100)}%`,
          with_coordinates: `${Math.round((parseInt(withLocations[0].count) / total) * 100)}%`
        }
      };
    } catch (error) {
      fastify.log.error('Data health check failed:', error);
      
      return reply.status(503).send({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
}