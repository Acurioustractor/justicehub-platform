// Debug database endpoint for production troubleshooting
export default async function debugDbRoutes(fastify, options) {
  
  // Ultra basic test
  fastify.get('/basic', async (request, reply) => {
    try {
      return { message: 'Route works', timestamp: new Date().toISOString() };
    } catch (error) {
      return reply.status(500).send({ error: error.message });
    }
  });
  
  // Test database hook
  fastify.get('/db-hook', async (request, reply) => {
    try {
      const hasDb = !!request.db;
      return { 
        message: 'DB hook test', 
        hasDatabase: hasDb,
        dbType: hasDb ? typeof request.db : 'undefined'
      };
    } catch (error) {
      return reply.status(500).send({ error: error.message });
    }
  });
  
  // Test returning actual service data step by step
  fastify.get('/service-data', async (request, reply) => {
    try {
      // Get one service with minimal fields
      const service = await request.db('services')
        .select('id', 'name', 'status')
        .where('status', 'active')
        .first();
      
      if (!service) {
        return { error: 'No services found' };
      }
      
      return {
        test: 'single service',
        service: {
          id: service.id,
          name: service.name,
          status: service.status
        }
      };
      
    } catch (error) {
      fastify.log.error('Service data test failed:', error);
      return reply.status(500).send({
        error: {
          message: 'Service data test failed',
          details: error.message
        }
      });
    }
  });
  
  // Test ultra simple search
  fastify.get('/ultra-search', async (request, reply) => {
    try {
      const services = await request.db('services')
        .select('id', 'name')
        .where('status', 'active')
        .limit(3);
      
      return {
        count: services.length,
        services: services.map(s => ({ id: s.id, name: s.name }))
      };
      
    } catch (error) {
      return reply.status(500).send({
        error: 'Ultra search failed: ' + error.message
      });
    }
  });
  
  // Simple database test
  fastify.get('/test', async (request, reply) => {
    try {
      // Test basic connection
      const result = await request.db.raw('SELECT 1 as test');
      
      // Test services table existence
      const tables = await request.db.raw(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'services'
      `);
      
      let serviceCount = 0;
      let sampleService = null;
      
      if (tables.rows.length > 0) {
        // Test services count
        const count = await request.db('services').count('* as total');
        serviceCount = count[0].total;
        
        // Get sample service
        const sample = await request.db('services').select('id', 'name', 'status').limit(1);
        sampleService = sample[0] || null;
      }
      
      return {
        database_connection: 'working',
        services_table_exists: tables.rows.length > 0,
        service_count: serviceCount,
        sample_service: sampleService,
        environment: process.env.NODE_ENV,
        database_url_configured: !!process.env.DATABASE_URL,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      fastify.log.error('Database debug test failed:', error);
      return reply.status(500).send({
        error: {
          message: 'Database test failed',
          details: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
      });
    }
  });
  
  // Test simplified working-search logic
  fastify.get('/test-search', async (request, reply) => {
    try {
      const { limit = 2, offset = 0 } = request.query;
      
      fastify.log.info('Testing simplified search logic...', { query: request.query });
      
      // Test count first
      const total = await request.db('services')
        .where('status', 'active')
        .count('id as count')
        .first();
      
      fastify.log.info('Count query successful', { total: total.count });
      
      // Test services query with limited fields first
      const services = await request.db('services')
        .select('id', 'name', 'status', 'description')
        .where('status', 'active')
        .limit(parseInt(limit))
        .offset(parseInt(offset));
      
      fastify.log.info('Services query successful', { count: services.length });
      
      // Try to serialize each service individually to find problematic ones
      const safeServices = [];
      for (const service of services) {
        try {
          JSON.stringify(service);
          safeServices.push({
            id: service.id,
            name: service.name,
            status: service.status,
            description: service.description ? service.description.substring(0, 100) + '...' : null
          });
        } catch (serializeError) {
          fastify.log.error('Service serialization failed:', { 
            serviceId: service.id, 
            error: serializeError.message 
          });
          safeServices.push({
            id: service.id,
            name: 'Serialization Error',
            status: service.status,
            description: 'This service has data that cannot be serialized'
          });
        }
      }
      
      // Build minimal response
      const response = {
        services: safeServices,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: parseInt(total.count)
        },
        total: parseInt(total.count),
        debug: true
      };
      
      fastify.log.info('Search test building response...', { 
        servicesCount: safeServices.length, 
        total: total.count 
      });
      
      return response;
      
    } catch (error) {
      fastify.log.error('Search test failed:', {
        error: error.message,
        stack: error.stack
      });
      return reply.status(500).send({
        error: {
          message: 'Search test failed',
          details: error.message,
          type: error.constructor.name
        }
      });
    }
  });

  // Test services query specifically
  fastify.get('/services-query', async (request, reply) => {
    try {
      fastify.log.info('Testing services query...');
      
      // Test the exact query that working-search uses
      const services = await request.db('services')
        .select('*')
        .where('status', 'active')
        .limit(2);
      
      const count = await request.db('services')
        .where('status', 'active')
        .count('id as count')
        .first();
      
      return {
        query_successful: true,
        services_returned: services.length,
        total_active: parseInt(count.count),
        sample_keys: services.length > 0 ? Object.keys(services[0]) : [],
        environment: process.env.NODE_ENV
      };
      
    } catch (error) {
      fastify.log.error('Services query test failed:', error);
      return reply.status(500).send({
        error: {
          message: 'Services query test failed',
          details: error.message,
          query_attempted: 'SELECT * FROM services WHERE status = \'active\' LIMIT 2'
        }
      });
    }
  });
}