import { elasticsearchService } from '../../services/elasticsearch-service.js';

export default async function elasticsearchSearchRoutes(fastify, options) {
  // Enhanced search with Elasticsearch
  fastify.get('/enhanced', {
    schema: {
      tags: ['Search'],
      description: 'Enhanced search using Elasticsearch with fuzzy matching, relevance scoring, and advanced features',
      querystring: {
        type: 'object',
        properties: {
          q: { type: 'string', description: 'Search query with fuzzy matching' },
          categories: { type: 'string', description: 'Comma-separated categories' },
          regions: { type: 'string', description: 'Comma-separated regions' },
          min_age: { type: 'integer', minimum: 0, maximum: 99 },
          max_age: { type: 'integer', minimum: 0, maximum: 99 },
          youth_specific: { type: 'boolean' },
          indigenous_specific: { type: 'boolean' },
          lat: { type: 'number', minimum: -90, maximum: 90 },
          lng: { type: 'number', minimum: -180, maximum: 180 },
          radius: { type: 'string', default: '50km', description: 'Search radius (e.g., 10km, 5mi)' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          offset: { type: 'integer', minimum: 0, default: 0 },
          sort: { 
            type: 'string', 
            enum: ['relevance', 'distance', 'name', 'updated', 'popularity'], 
            default: 'relevance' 
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            services: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  organization: { type: 'object' },
                  location: { type: 'object' },
                  categories: { type: 'array', items: { type: 'string' } },
                  score: { type: 'number' },
                  highlight: { type: 'object' },
                  distance: { type: 'string' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                limit: { type: 'integer' },
                offset: { type: 'integer' },
                pages: { type: 'integer' }
              }
            },
            facets: { type: 'object' },
            max_score: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const result = await elasticsearchService.searchServices(request.query);
      
      return {
        services: result.services,
        pagination: {
          total: result.total,
          limit: parseInt(request.query.limit || 20),
          offset: parseInt(request.query.offset || 0),
          pages: Math.ceil(result.total / (request.query.limit || 20))
        },
        facets: await elasticsearchService.getSearchFacets(request.query),
        max_score: result.max_score
      };
    } catch (error) {
      fastify.log.error({ error: error.message }, 'Enhanced search failed');
      throw new Error('Enhanced search failed');
    }
  });

  // Fuzzy search for handling typos and partial matches
  fastify.get('/fuzzy', {
    schema: {
      tags: ['Search'],
      description: 'Fuzzy search that handles typos and partial matches',
      querystring: {
        type: 'object',
        properties: {
          q: { type: 'string', minLength: 2 },
          fuzziness: { type: 'string', enum: ['0', '1', '2', 'AUTO'], default: 'AUTO' },
          limit: { type: 'integer', minimum: 1, maximum: 50, default: 10 }
        },
        required: ['q']
      }
    }
  }, async (request, reply) => {
    try {
      const { q, fuzziness = 'AUTO', limit = 10 } = request.query;
      
      const result = await elasticsearchService.searchServices({
        q,
        limit,
        fuzziness
      });

      return {
        query: q,
        fuzziness,
        services: result.services.map(service => ({
          id: service.id,
          name: service.name,
          organization: service.organization?.name,
          score: service.score,
          highlight: service.highlight
        })),
        total: result.total
      };
    } catch (error) {
      fastify.log.error({ error: error.message }, 'Fuzzy search failed');
      throw new Error('Fuzzy search failed');
    }
  });

  // Advanced autocomplete with Elasticsearch
  fastify.get('/autocomplete/enhanced', {
    schema: {
      tags: ['Search'],
      description: 'Enhanced autocomplete with Elasticsearch ngram analysis',
      querystring: {
        type: 'object',
        properties: {
          q: { type: 'string', minLength: 2 },
          type: { type: 'string', enum: ['services', 'organizations', 'categories'], default: 'services' },
          limit: { type: 'integer', minimum: 1, maximum: 20, default: 10 }
        },
        required: ['q']
      }
    }
  }, async (request, reply) => {
    try {
      const { q, type = 'services', limit = 10 } = request.query;
      
      const suggestions = await elasticsearchService.getAutocompleteSuggestions(q, type);
      
      return {
        query: q,
        type,
        suggestions: suggestions.slice(0, limit)
      };
    } catch (error) {
      fastify.log.error({ error: error.message }, 'Enhanced autocomplete failed');
      throw new Error('Enhanced autocomplete failed');
    }
  });

  // Geographic search with Elasticsearch
  fastify.get('/geo', {
    schema: {
      tags: ['Search'],
      description: 'Geographic search using Elasticsearch geo-distance queries',
      querystring: {
        type: 'object',
        properties: {
          lat: { type: 'number', minimum: -90, maximum: 90 },
          lng: { type: 'number', minimum: -180, maximum: 180 },
          radius: { type: 'string', default: '10km', description: 'Distance radius (e.g., 10km, 5mi)' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          categories: { type: 'string', description: 'Filter by categories' }
        },
        required: ['lat', 'lng']
      }
    }
  }, async (request, reply) => {
    try {
      const { lat, lng, radius = '10km', limit = 20, categories } = request.query;
      
      let query = { lat, lng, radius, limit };
      if (categories) {
        query.categories = categories;
      }
      
      const services = await elasticsearchService.getNearbyServices(lat, lng, radius, limit);
      
      return {
        location: { lat, lng },
        radius,
        services: services.map(service => ({
          id: service.id,
          name: service.name,
          organization: service.organization?.name,
          location: service.location,
          distance: service.distance,
          categories: service.categories
        })),
        total: services.length
      };
    } catch (error) {
      fastify.log.error({ error: error.message }, 'Geographic search failed');
      throw new Error('Geographic search failed');
    }
  });

  // Search suggestions and recommendations
  fastify.get('/suggestions', {
    schema: {
      tags: ['Search'],
      description: 'Get search suggestions and recommendations based on popular queries',
      querystring: {
        type: 'object',
        properties: {
          context: { type: 'string', description: 'Context for suggestions (age, location, etc.)' },
          limit: { type: 'integer', minimum: 1, maximum: 20, default: 10 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      // Get popular search terms and categories
      const facets = await elasticsearchService.getSearchFacets();
      
      const suggestions = {
        popular_categories: facets.categories.slice(0, 8).map(cat => ({
          label: cat.label,
          query: { categories: cat.value },
          count: cat.count
        })),
        regions: facets.regions.slice(0, 6).map(region => ({
          label: region.label,
          query: { regions: region.value },
          count: region.count
        })),
        quick_searches: [
          { label: 'Youth Legal Services', query: { q: 'legal', youth_specific: true } },
          { label: 'Mental Health Support', query: { categories: 'mental_health' } },
          { label: 'Crisis Support', query: { categories: 'crisis_support' } },
          { label: 'Aboriginal Services', query: { indigenous_specific: true } },
          { label: 'Brisbane Services', query: { regions: 'brisbane' } },
          { label: 'Housing Support', query: { categories: 'housing' } }
        ]
      };
      
      return suggestions;
    } catch (error) {
      fastify.log.error({ error: error.message }, 'Search suggestions failed');
      throw new Error('Search suggestions failed');
    }
  });

  // Search analytics and insights
  fastify.get('/analytics', {
    schema: {
      tags: ['Search'],
      description: 'Get search analytics and insights',
      querystring: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: ['day', 'week', 'month'], default: 'week' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const facets = await elasticsearchService.getSearchFacets();
      
      const analytics = {
        total_services: facets.categories.reduce((sum, cat) => sum + cat.count, 0),
        top_categories: facets.categories.slice(0, 10),
        regional_distribution: facets.regions,
        service_types: facets.organization_types,
        coverage_stats: {
          regions_covered: facets.regions.length,
          categories_available: facets.categories.length,
          organization_types: facets.organization_types.length
        }
      };
      
      return analytics;
    } catch (error) {
      fastify.log.error({ error: error.message }, 'Search analytics failed');
      throw new Error('Search analytics failed');
    }
  });

  // Reindex service (for updating search index)
  fastify.post('/reindex/:serviceId', {
    schema: {
      tags: ['Search'],
      description: 'Reindex a specific service in Elasticsearch',
      params: {
        type: 'object',
        properties: {
          serviceId: { type: 'string', format: 'uuid' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { serviceId } = request.params;
      
      // Get service from database
      const service = await request.db('services as s')
        .leftJoin('organizations as o', 's.organization_id', 'o.id')
        .leftJoin('locations as l', 'l.service_id', 's.id')
        .leftJoin('contacts as c', 'c.service_id', 's.id')
        .where('s.id', serviceId)
        .select(
          's.*',
          'o.name as organization_name',
          'o.organization_type',
          'l.address_1', 'l.city', 'l.region', 'l.latitude', 'l.longitude',
          'c.phone', 'c.email as contact_email'
        )
        .first();

      if (!service) {
        return reply.status(404).send({ error: 'Service not found' });
      }

      // Transform and index service
      const transformedService = {
        id: service.id,
        name: service.name,
        description: service.description,
        categories: service.categories || [],
        keywords: service.keywords || [],
        organization: {
          name: service.organization_name,
          type: service.organization_type
        },
        location: service.latitude && service.longitude ? {
          coordinates: {
            lat: parseFloat(service.latitude),
            lng: parseFloat(service.longitude)
          },
          address: service.address_1,
          city: service.city,
          region: service.region
        } : null,
        contact: {
          phone: service.phone ? JSON.parse(service.phone) : null,
          email: service.contact_email
        },
        age_range: {
          minimum: service.minimum_age,
          maximum: service.maximum_age
        },
        youth_specific: service.youth_specific,
        indigenous_specific: service.indigenous_specific,
        status: service.status,
        updated_at: service.updated_at
      };

      const result = await elasticsearchService.indexService(transformedService);
      
      return {
        serviceId,
        indexed: true,
        result: result.result
      };
    } catch (error) {
      fastify.log.error({ error: error.message }, 'Service reindexing failed');
      throw new Error('Service reindexing failed');
    }
  });
}