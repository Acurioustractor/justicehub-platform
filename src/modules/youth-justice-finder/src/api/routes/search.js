export default async function searchRoutes(fastify, options) {
  const searchSchema = {
    querystring: {
      type: 'object',
      properties: {
        q: { type: 'string', description: 'Search query' },
        categories: { 
          type: 'string', 
          description: 'Comma-separated categories (legal_aid,mental_health,etc)' 
        },
        regions: { 
          type: 'string', 
          description: 'Comma-separated regions (brisbane,cairns,etc)' 
        },
        min_age: { type: 'integer', minimum: 0, maximum: 99 },
        max_age: { type: 'integer', minimum: 0, maximum: 99 },
        youth_specific: { type: 'boolean' },
        indigenous_specific: { type: 'boolean' },
        lat: { type: 'number', minimum: -90, maximum: 90 },
        lng: { type: 'number', minimum: -180, maximum: 180 },
        radius: { type: 'number', minimum: 0, maximum: 200, description: 'Search radius in kilometers' },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        offset: { type: 'integer', minimum: 0, default: 0 },
        sort: { 
          type: 'string', 
          enum: ['relevance', 'distance', 'name', 'updated'], 
          default: 'relevance' 
        }
      }
    }
  };

  // Main search endpoint
  fastify.get('/', {
    schema: {
      tags: ['Search'],
      description: 'Search youth services with advanced filtering',
      querystring: searchSchema.querystring,
      response: {
        200: {
          type: 'object',
          properties: {
            services: {
              type: 'array',
              items: { $ref: 'ServiceResult#' }
            },
            pagination: { $ref: 'Pagination#' },
            facets: { $ref: 'SearchFacets#' },
            total: { type: 'integer' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const {
      q,
      categories,
      regions,
      min_age,
      max_age,
      youth_specific,
      indigenous_specific,
      lat,
      lng,
      radius = 50,
      limit = 20,
      offset = 0,
      sort = 'relevance'
    } = request.query;

    try {
      // Build base query
      let query = request.db('services as s')
        .leftJoin('organizations as o', 's.organization_id', 'o.id')
        .leftJoin('locations as l', 'l.service_id', 's.id')
        .leftJoin('contacts as c', 'c.service_id', 's.id')
        .where('s.status', 'active');

      // Text search
      if (q) {
        const searchTerms = q.split(' ').filter(term => term.length > 2);
        if (searchTerms.length > 0) {
          query = query.where(function() {
            searchTerms.forEach(term => {
              this.orWhere('s.name', 'ilike', `%${term}%`)
                  .orWhere('s.description', 'ilike', `%${term}%`)
                  .orWhere('o.name', 'ilike', `%${term}%`);
            });
          });
        }
      }

      // Category filter
      if (categories) {
        const categoryList = categories.split(',').map(c => c.trim());
        query = query.where(function() {
          categoryList.forEach(category => {
            // Use Knex's whereJsonSupersetOf for safer JSONB queries
            this.orWhere('s.categories', '@>', JSON.stringify([category]));
          });
        });
      }

      // Region filter
      if (regions) {
        const regionList = regions.split(',').map(r => r.trim());
        query = query.whereIn('l.region', regionList);
      }

      // Age filters
      if (min_age !== undefined) {
        query = query.where(function() {
          this.whereNull('s.minimum_age')
              .orWhere('s.minimum_age', '<=', min_age);
        });
      }

      if (max_age !== undefined) {
        query = query.where(function() {
          this.whereNull('s.maximum_age')
              .orWhere('s.maximum_age', '>=', max_age);
        });
      }

      // Population-specific filters
      if (youth_specific !== undefined) {
        query = query.where('s.youth_specific', youth_specific);
      }

      if (indigenous_specific !== undefined) {
        query = query.where('s.indigenous_specific', indigenous_specific);
      }

      // Geographic search
      if (lat && lng) {
        // Calculate distance using Haversine formula
        query = query.select(
          request.db.raw(`
            s.*, o.name as organization_name, o.organization_type, o.url as organization_url,
            l.*, c.phone, c.email,
            (6371 * acos(cos(radians(?)) * cos(radians(l.latitude)) * 
             cos(radians(l.longitude) - radians(?)) + 
             sin(radians(?)) * sin(radians(l.latitude)))) as distance
          `, [lat, lng, lat])
        );

        if (radius) {
          query = query.having('distance', '<=', radius);
        }
      } else {
        query = query.select(
          's.*', 'o.name as organization_name', 'o.organization_type', 'o.url as organization_url',
          'l.*', 'c.phone', 'c.email'
        );
      }

      // Get total count before pagination
      const countQuery = query.clone().clearSelect().clearOrder().count('s.id as total');
      const countResult = await countQuery;
      const total = countResult[0]?.total || 0;

      // Apply sorting
      switch (sort) {
        case 'distance':
          if (lat && lng) {
            query = query.orderBy('distance');
          } else {
            query = query.orderBy('s.name');
          }
          break;
        case 'name':
          query = query.orderBy('s.name');
          break;
        case 'updated':
          query = query.orderBy('s.updated_at', 'desc');
          break;
        default: // relevance
          if (q) {
            // Basic relevance scoring
            query = query.orderByRaw(`
              CASE 
                WHEN s.name ILIKE ? THEN 1
                WHEN s.description ILIKE ? THEN 2
                ELSE 3
              END, s.name
            `, [`%${q}%`, `%${q}%`]);
          } else {
            query = query.orderBy('s.updated_at', 'desc');
          }
      }

      // Apply pagination
      query = query.limit(limit).offset(offset);

      const services = await query;

      // Get search facets
      const facets = await getSearchFacets(request.db, {
        q, categories, regions, min_age, max_age, youth_specific, indigenous_specific
      });

      // Format results
      const results = services.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description?.substring(0, 300) + (service.description?.length > 300 ? '...' : ''),
        url: service.url,
        email: service.email,
        status: service.status,
        age_range: {
          minimum: service.minimum_age,
          maximum: service.maximum_age
        },
        youth_specific: service.youth_specific,
        indigenous_specific: service.indigenous_specific,
        categories: service.categories,
        keywords: service.keywords,
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
          email: service.email
        },
        distance: service.distance ? parseFloat(service.distance).toFixed(2) : null,
        updated_at: service.updated_at
      }));

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
        facets,
        total: parseInt(total)
      };

    } catch (error) {
      fastify.log.error(error);
      throw new Error('Search failed');
    }
  });

  // Autocomplete endpoint
  fastify.get('/autocomplete', {
    schema: {
      tags: ['Search'],
      description: 'Get autocomplete suggestions for search terms',
      querystring: {
        type: 'object',
        properties: {
          q: { type: 'string', minLength: 2 },
          type: { type: 'string', enum: ['services', 'organizations', 'categories'], default: 'services' }
        },
        required: ['q']
      }
    }
  }, async (request, reply) => {
    const { q, type = 'services' } = request.query;

    try {
      let suggestions = [];

      switch (type) {
        case 'services':
          const services = await request.db('services')
            .where('name', 'ilike', `%${q}%`)
            .where('status', 'active')
            .select('name')
            .distinct()
            .limit(10);
          suggestions = services.map(s => s.name);
          break;

        case 'organizations':
          const orgs = await request.db('organizations')
            .where('name', 'ilike', `%${q}%`)
            .select('name')
            .distinct()
            .limit(10);
          suggestions = orgs.map(o => o.name);
          break;

        case 'categories':
          const categories = await request.db.raw(`
            SELECT DISTINCT unnest(categories) as category
            FROM services
            WHERE unnest(categories) ILIKE ?
            AND status = 'active'
            LIMIT 10
          `, [`%${q}%`]);
          suggestions = categories.rows.map(c => c.category);
          break;
      }

      return { suggestions };
    } catch (error) {
      fastify.log.error(error);
      throw new Error('Autocomplete failed');
    }
  });

  // Nearby services endpoint
  fastify.get('/nearby', {
    schema: {
      tags: ['Search'],
      description: 'Find services near a specific location',
      querystring: {
        type: 'object',
        properties: {
          lat: { type: 'number', minimum: -90, maximum: 90 },
          lng: { type: 'number', minimum: -180, maximum: 180 },
          radius: { type: 'number', minimum: 0, maximum: 200, default: 10 },
          limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 }
        },
        required: ['lat', 'lng']
      }
    }
  }, async (request, reply) => {
    const { lat, lng, radius = 10, limit = 20 } = request.query;

    try {
      const services = await request.db('services as s')
        .leftJoin('organizations as o', 's.organization_id', 'o.id')
        .leftJoin('locations as l', 'l.service_id', 's.id')
        .where('s.status', 'active')
        .whereNotNull('l.latitude')
        .whereNotNull('l.longitude')
        .select(
          's.*', 'o.name as organization_name',
          'l.address_1', 'l.city', 'l.latitude', 'l.longitude',
          request.db.raw(`
            (6371 * acos(cos(radians(?)) * cos(radians(l.latitude)) * 
             cos(radians(l.longitude) - radians(?)) + 
             sin(radians(?)) * sin(radians(l.latitude)))) as distance
          `, [lat, lng, lat])
        )
        .having('distance', '<=', radius)
        .orderBy('distance')
        .limit(limit);

      const results = services.map(service => ({
        id: service.id,
        name: service.name,
        organization: service.organization_name,
        address: service.address_1,
        city: service.city,
        distance: parseFloat(service.distance).toFixed(2),
        coordinates: {
          lat: parseFloat(service.latitude),
          lng: parseFloat(service.longitude)
        }
      }));

      return { services: results };
    } catch (error) {
      fastify.log.error(error);
      throw new Error('Nearby search failed');
    }
  });
}

async function getSearchFacets(db, filters) {
  try {
    // Get available categories
    const categories = await db.raw(`
      SELECT unnest(categories) as category, COUNT(*) as count
      FROM services s
      WHERE status = 'active'
      GROUP BY category
      ORDER BY count DESC
      LIMIT 20
    `);

    // Get available regions
    const regions = await db('locations as l')
      .join('services as s', 'l.service_id', 's.id')
      .where('s.status', 'active')
      .select('l.region')
      .count('* as count')
      .groupBy('l.region')
      .orderBy('count', 'desc');

    // Get organization types
    const orgTypes = await db('organizations as o')
      .join('services as s', 's.organization_id', 'o.id')
      .where('s.status', 'active')
      .select('o.organization_type')
      .count('* as count')
      .groupBy('o.organization_type')
      .orderBy('count', 'desc');

    return {
      categories: categories.rows.map(c => ({
        value: c.category,
        label: c.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count: parseInt(c.count)
      })),
      regions: regions.map(r => ({
        value: r.region,
        label: r.region.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count: parseInt(r.count)
      })),
      organization_types: orgTypes.map(t => ({
        value: t.organization_type,
        label: t.organization_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count: parseInt(t.count)
      }))
    };
  } catch (error) {
    return { categories: [], regions: [], organization_types: [] };
  }
}