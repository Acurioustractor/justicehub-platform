export default async function servicesRoutes(fastify, options) {
  // Get all services with pagination
  fastify.get('/', {
    schema: {
      tags: ['Services'],
      description: 'Get all youth services with pagination',
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          offset: { type: 'integer', minimum: 0, default: 0 },
          category: { type: 'string', description: 'Filter by category' },
          region: { type: 'string', description: 'Filter by region' },
          organization_type: { type: 'string', description: 'Filter by organization type' },
          youth_specific: { type: 'boolean' },
          indigenous_specific: { type: 'boolean' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            services: {
              type: 'array',
              items: { $ref: 'Service#' }
            },
            pagination: { $ref: 'Pagination#' },
            total: { type: 'integer' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const {
      limit = 20,
      offset = 0,
      category,
      region,
      organization_type,
      youth_specific,
      indigenous_specific
    } = request.query;

    try {
      let query = request.db('services as s')
        .leftJoin('organizations as o', 's.organization_id', 'o.id')
        .leftJoin('locations as l', 'l.service_id', 's.id')
        .leftJoin('contacts as c', 'c.service_id', 's.id')
        .where('s.status', 'active');

      // Apply filters
      if (category) {
        query = query.where('s.categories', '@>', JSON.stringify([category]));
      }

      if (region) {
        query = query.where('l.region', region);
      }

      if (organization_type) {
        query = query.where('o.organization_type', organization_type);
      }

      if (youth_specific !== undefined) {
        query = query.where('s.youth_specific', youth_specific);
      }

      if (indigenous_specific !== undefined) {
        query = query.where('s.indigenous_specific', indigenous_specific);
      }

      // Get total count
      const countQuery = query.clone().clearSelect().count('s.id as total');
      const [{ total }] = await countQuery;

      // Get services with pagination
      const services = await query
        .select(
          's.*',
          'o.name as organization_name',
          'o.organization_type',
          'o.url as organization_url',
          'l.*',
          'c.phone',
          'c.email as contact_email'
        )
        .orderBy('s.updated_at', 'desc')
        .limit(limit)
        .offset(offset);

      const results = services.map(formatService);

      return {
        services: results,
        pagination: {
          limit,
          offset,
          total: parseInt(total),
          pages: Math.ceil(parseInt(total) / limit),
          current_page: Math.floor(offset / limit) + 1,
          has_next: offset + limit < parseInt(total),
          has_prev: offset > 0
        },
        total: parseInt(total)
      };

    } catch (error) {
      fastify.log.error(error);
      throw new Error('Failed to fetch services');
    }
  });

  // Get service by ID
  fastify.get('/:id', {
    schema: {
      tags: ['Services'],
      description: 'Get a specific service by ID',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      },
      response: {
        200: { $ref: 'ServiceDetail#' },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const service = await request.db('services as s')
        .leftJoin('organizations as o', 's.organization_id', 'o.id')
        .leftJoin('locations as l', 'l.service_id', 's.id')
        .leftJoin('contacts as c', 'c.service_id', 's.id')
        .where('s.id', request.params.id)
        .where('s.status', 'active')
        .select(
          's.*',
          'o.name as organization_name',
          'o.organization_type',
          'o.url as organization_url',
          'o.abn',
          'l.*',
          'c.phone',
          'c.email as contact_email'
        )
        .first();

      if (!service) {
        return reply.status(404).send({
          error: 'Service not found'
        });
      }

      // Get related services
      const relatedServices = await getRelatedServices(request.db, service);

      const result = {
        ...formatService(service),
        organization: {
          name: service.organization_name,
          type: service.organization_type,
          url: service.organization_url,
          abn: service.abn
        },
        attribution: service.attribution ? JSON.parse(service.attribution) : null,
        related_services: relatedServices
      };

      return result;

    } catch (error) {
      fastify.log.error(error);
      throw new Error('Failed to fetch service');
    }
  });

  // Get services by category
  fastify.get('/category/:category', {
    schema: {
      tags: ['Services'],
      description: 'Get services by category',
      params: {
        type: 'object',
        properties: {
          category: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
          offset: { type: 'integer', minimum: 0, default: 0 }
        }
      }
    }
  }, async (request, reply) => {
    const { category } = request.params;
    const { limit = 20, offset = 0 } = request.query;

    try {
      const services = await request.db('services as s')
        .leftJoin('organizations as o', 's.organization_id', 'o.id')
        .leftJoin('locations as l', 'l.service_id', 's.id')
        .leftJoin('contacts as c', 'c.service_id', 's.id')
        .where('s.status', 'active')
        .where('s.categories', '@>', JSON.stringify([category]))
        .select(
          's.*',
          'o.name as organization_name',
          'l.city',
          'l.region'
        )
        .orderBy('s.name')
        .limit(limit)
        .offset(offset);

      const results = services.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description?.substring(0, 200) + '...',
        organization: service.organization_name,
        location: {
          city: service.city,
          region: service.region
        },
        categories: service.categories,
        youth_specific: service.youth_specific,
        indigenous_specific: service.indigenous_specific
      }));

      return { services: results };

    } catch (error) {
      fastify.log.error(error);
      throw new Error('Failed to fetch services by category');
    }
  });

  // Get services by region
  fastify.get('/region/:region', {
    schema: {
      tags: ['Services'],
      description: 'Get services by region',
      params: {
        type: 'object',
        properties: {
          region: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { region } = request.params;

    try {
      const services = await request.db('services as s')
        .join('locations as l', 'l.service_id', 's.id')
        .leftJoin('organizations as o', 's.organization_id', 'o.id')
        .where('s.status', 'active')
        .where('l.region', region)
        .select(
          's.id',
          's.name',
          's.description',
          's.categories',
          's.youth_specific',
          'o.name as organization_name',
          'l.city',
          'l.address_1'
        )
        .orderBy('s.name');

      const results = services.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description?.substring(0, 200) + '...',
        organization: service.organization_name,
        location: {
          address: service.address_1,
          city: service.city
        },
        categories: service.categories,
        youth_specific: service.youth_specific
      }));

      return { services: results };

    } catch (error) {
      fastify.log.error(error);
      throw new Error('Failed to fetch services by region');
    }
  });
}

function formatService(service) {
  return {
    id: service.id,
    name: service.name,
    description: service.description,
    url: service.url,
    email: service.email,
    status: service.status,
    age_range: {
      minimum: service.minimum_age,
      maximum: service.maximum_age
    },
    youth_specific: service.youth_specific,
    indigenous_specific: service.indigenous_specific,
    categories: service.categories || [],
    keywords: service.keywords || [],
    data_source: service.data_source,
    organization: {
      name: service.organization_name,
      type: service.organization_type,
      url: service.organization_url
    },
    location: service.address_1 ? {
      address: `${service.address_1}${service.address_2 ? ', ' + service.address_2 : ''}`,
      city: service.city,
      state: service.state_province,
      postcode: service.postal_code,
      region: service.region,
      coordinates: service.latitude && service.longitude ? {
        lat: parseFloat(service.latitude),
        lng: parseFloat(service.longitude)
      } : null
    } : null,
    contact: {
      phone: service.phone ? (typeof service.phone === 'string' ? JSON.parse(service.phone) : service.phone) : null,
      email: service.contact_email
    },
    created_at: service.created_at,
    updated_at: service.updated_at
  };
}

async function getRelatedServices(db, service) {
  try {
    // Find services with similar categories or in the same region
    const related = await db('services as s')
      .leftJoin('organizations as o', 's.organization_id', 'o.id')
      .leftJoin('locations as l', 'l.service_id', 's.id')
      .where('s.status', 'active')
      .where('s.id', '!=', service.id)
      .where(function() {
        // Similar categories
        service.categories?.forEach(category => {
          this.orWhere('s.categories', '@>', `["${category}"]`);
        });
        // Same region
        if (service.region) {
          this.orWhere('l.region', service.region);
        }
      })
      .select(
        's.id',
        's.name',
        's.categories',
        'o.name as organization_name',
        'l.city'
      )
      .limit(5);

    return related.map(r => ({
      id: r.id,
      name: r.name,
      organization: r.organization_name,
      city: r.city,
      categories: r.categories
    }));
  } catch (error) {
    return [];
  }
}