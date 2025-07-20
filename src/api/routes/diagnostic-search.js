// Diagnostic search to identify production-specific issues
export default async function diagnosticSearchRoutes(fastify, options) {
  
  // Step-by-step diagnostic endpoint
  fastify.get('/', async (request, reply) => {
    const diagnostics = {
      step: '',
      success: false,
      error: null,
      data: null,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDb: !!request.db,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
      }
    };

    try {
      // Step 1: Basic DB connection
      diagnostics.step = 'database_connection';
      await request.db.raw('SELECT 1');
      fastify.log.info('Step 1 passed: Database connection');

      // Step 2: Simple count query
      diagnostics.step = 'count_query';
      const countResult = await request.db('services').where('status', 'active').count('id as count').first();
      fastify.log.info('Step 2 passed: Count query', { count: countResult.count });

      // Step 3: Single service with minimal fields
      diagnostics.step = 'single_service_minimal';
      const singleService = await request.db('services')
        .select('id', 'name', 'status')
        .where('status', 'active')
        .first();
      fastify.log.info('Step 3 passed: Single service minimal fields');

      // Step 4: Single service with all fields
      diagnostics.step = 'single_service_all';
      const fullService = await request.db('services')
        .select('*')
        .where('status', 'active')
        .first();
      fastify.log.info('Step 4 passed: Single service all fields');

      // Step 5: Test JSON serialization
      diagnostics.step = 'json_serialization';
      const testJson = JSON.stringify(fullService);
      fastify.log.info('Step 5 passed: JSON serialization', { length: testJson.length });

      // Step 6: Multiple services with parameters
      diagnostics.step = 'multiple_services';
      const { limit = 20, offset = 0, q = '' } = request.query;
      
      let query = request.db('services')
        .select('id', 'name', 'status', 'categories', 'description')
        .where('status', 'active')
        .limit(Math.min(parseInt(limit), 100))
        .offset(Math.max(parseInt(offset), 0));
      
      // Add search if provided - use full-text search for better performance
      if (q && q.trim()) {
        const searchTerm = q.trim();
        query = query.whereRaw(
          "to_tsvector('english', name || ' ' || coalesce(description, '')) @@ plainto_tsquery('english', ?)",
          [searchTerm]
        );
      }
      
      const multipleServices = await query;
      fastify.log.info('Step 6 passed: Multiple services with parameters');

      // Step 7: Build response object
      diagnostics.step = 'response_building';
      const response = {
        services: multipleServices.map(s => ({
          id: s.id,
          name: s.name,
          status: s.status,
          categories: s.categories || [],
          description: s.description ? s.description.substring(0, 200) + '...' : 'No description',
          youth_specific: Boolean(s.youth_specific)
        })),
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: parseInt(countResult.count),
          pages: Math.ceil(parseInt(countResult.count) / parseInt(limit)),
          current_page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
          has_next: parseInt(offset) + parseInt(limit) < parseInt(countResult.count),
          has_prev: parseInt(offset) > 0
        },
        total: parseInt(countResult.count),
        debug: true
      };
      fastify.log.info('Step 7 passed: Response building');

      diagnostics.success = true;
      diagnostics.data = response;
      
      return {
        diagnostic: diagnostics,
        result: response
      };

    } catch (error) {
      diagnostics.error = {
        message: error.message,
        stack: error.stack,
        code: error.code,
        name: error.name
      };
      
      fastify.log.error('Diagnostic failed at step:', diagnostics.step, error);
      
      return reply.status(500).send({
        diagnostic: diagnostics,
        message: `Failed at step: ${diagnostics.step}`,
        error: error.message
      });
    }
  });

  // Memory diagnostic
  fastify.get('/memory', async (request, reply) => {
    const memInfo = process.memoryUsage();
    const heapUsedMB = Math.round(memInfo.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memInfo.heapTotal / 1024 / 1024);
    
    return {
      memory: {
        heapUsed: `${heapUsedMB} MB`,
        heapTotal: `${heapTotalMB} MB`,
        rss: `${Math.round(memInfo.rss / 1024 / 1024)} MB`,
        external: `${Math.round(memInfo.external / 1024 / 1024)} MB`
      },
      uptime: `${Math.round(process.uptime())} seconds`,
      nodeVersion: process.version
    };
  });
}