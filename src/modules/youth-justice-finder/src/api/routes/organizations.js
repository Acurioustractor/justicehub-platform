export default async function organizationsRoutes(fastify, options) {
  // Get all organizations
  fastify.get('/', {
    schema: {
      tags: ['Organizations'],
      description: 'Get all organizations',
      querystring: {
        type: 'object',
        properties: {
          type: { type: 'string', description: 'Filter by organization type' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
          offset: { type: 'integer', minimum: 0, default: 0 }
        }
      }
    }
  }, async (request, reply) => {
    const { type, limit = 50, offset = 0 } = request.query;

    try {
      let query = request.db('organizations as o')
        .leftJoin('services as s', 's.organization_id', 'o.id')
        .where('s.status', 'active')
        .select(
          'o.*',
          request.db.raw('COUNT(s.id) as service_count')
        )
        .groupBy('o.id')
        .orderBy('service_count', 'desc');

      if (type) {
        query = query.where('o.organization_type', type);
      }

      const organizations = await query.limit(limit).offset(offset);

      return { organizations };

    } catch (error) {
      fastify.log.error(error);
      throw new Error('Failed to fetch organizations');
    }
  });

  // Get organization by ID
  fastify.get('/:id', {
    schema: {
      tags: ['Organizations'],
      description: 'Get organization details with their services',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const organization = await request.db('organizations')
        .where('id', request.params.id)
        .first();

      if (!organization) {
        return reply.status(404).send({
          error: 'Organization not found'
        });
      }

      // Get organization's services
      const services = await request.db('services as s')
        .leftJoin('locations as l', 'l.service_id', 's.id')
        .where('s.organization_id', request.params.id)
        .where('s.status', 'active')
        .select(
          's.id',
          's.name',
          's.description',
          's.categories',
          's.youth_specific',
          'l.city',
          'l.region'
        )
        .orderBy('s.name');

      // Get regional coverage
      const regions = await request.db('locations as l')
        .join('services as s', 'l.service_id', 's.id')
        .where('s.organization_id', request.params.id)
        .where('s.status', 'active')
        .distinct('l.region')
        .pluck('region');

      return {
        ...organization,
        services: services.map(service => ({
          id: service.id,
          name: service.name,
          description: service.description?.substring(0, 150) + '...',
          categories: service.categories,
          youth_specific: service.youth_specific,
          location: {
            city: service.city,
            region: service.region
          }
        })),
        regions_served: regions,
        service_count: services.length
      };

    } catch (error) {
      fastify.log.error(error);
      throw new Error('Failed to fetch organization');
    }
  });

  // Get organization types
  fastify.get('/types', {
    schema: {
      tags: ['Organizations'],
      description: 'Get all organization types with counts'
    }
  }, async (request, reply) => {
    try {
      const types = await request.db('organizations as o')
        .leftJoin('services as s', 's.organization_id', 'o.id')
        .where('s.status', 'active')
        .select('o.organization_type')
        .count('s.id as service_count')
        .groupBy('o.organization_type')
        .orderBy('service_count', 'desc');

      return { organization_types: types };

    } catch (error) {
      fastify.log.error(error);
      throw new Error('Failed to fetch organization types');
    }
  });
}