// Simplified search for free hosting without Elasticsearch
// import { getDuplicateDetector } from '../../services/duplicate-detector.js'

export default async function simpleSearchRoutes(fastify, options) {
  // Basic text search without Elasticsearch
  fastify.get('/simple', async (request, reply) => {
    try {
      const {
        q = '',
        categories = '',
        regions = '',
        youth_specific,
        indigenous_specific,
        min_age,
        max_age,
        limit = 20,
        offset = 0
      } = request.query

      let query = request.db('services as s')
        .leftJoin('organizations as o', 's.organization_id', 'o.id')
        .leftJoin('locations as l', 's.id', 'l.service_id')
        .leftJoin('contacts as c', 's.id', 'c.service_id')
        .select(
          's.*',
          'o.name as organization_name',
          'o.organization_type',
          'o.url as organization_url',
          'l.address_1',
          'l.city',
          'l.state_province',
          'l.postal_code',
          'l.latitude',
          'l.longitude',
          'l.region',
          'c.phone',
          'c.email',
          'c.website'
        )
        .where('s.status', 'active')

      // Text search across multiple fields
      if (q && q.trim()) {
        const searchTerm = `%${q.trim()}%`
        query = query.where(function() {
          this.where('s.name', 'like', searchTerm)
            .orWhere('s.description', 'like', searchTerm)
            .orWhere('o.name', 'like', searchTerm)
            .orWhereRaw('EXISTS (SELECT 1 FROM json_array_elements_text(s.keywords) AS keyword WHERE keyword ILIKE ?)', [searchTerm])
            .orWhereRaw('EXISTS (SELECT 1 FROM json_array_elements_text(s.categories) AS category WHERE category ILIKE ?)', [searchTerm])
        })
      }

      // Category filter
      if (categories) {
        const categoryList = categories.split(',').map(c => c.trim())
        query = query.whereRaw('s.categories ?| array[?]', [categoryList])
      }

      // Region filter
      if (regions) {
        const regionList = regions.split(',').map(r => r.trim())
        query = query.whereIn('l.region', regionList)
      }

      // Youth specific filter
      if (youth_specific === 'true' || youth_specific === true) {
        query = query.where('s.youth_specific', true)
      }

      // Indigenous specific filter
      if (indigenous_specific === 'true' || indigenous_specific === true) {
        query = query.where('s.indigenous_specific', true)
      }

      // Age range filters
      if (min_age) {
        query = query.where(function() {
          this.whereNull('s.minimum_age')
            .orWhere('s.minimum_age', '<=', parseInt(min_age))
        })
      }

      if (max_age) {
        query = query.where(function() {
          this.whereNull('s.maximum_age')
            .orWhere('s.maximum_age', '>=', parseInt(max_age))
        })
      }

      // Get total count
      const countQuery = query.clone()
      const [{ count: total }] = await countQuery.count('s.id as count')

      // Apply pagination
      const services = await query
        .limit(parseInt(limit))
        .offset(parseInt(offset))
        .orderBy('s.name')

      // Process results
      const processedServices = services.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description,
        url: service.url,
        status: service.status,
        minimum_age: service.minimum_age,
        maximum_age: service.maximum_age,
        youth_specific: service.youth_specific,
        indigenous_specific: service.indigenous_specific,
        categories: service.categories || [],
        keywords: service.keywords || [],
        data_source: service.data_source,
        organization: {
          id: service.organization_id,
          name: service.organization_name,
          type: service.organization_type,
          url: service.organization_url
        },
        location: service.latitude && service.longitude ? {
          address_1: service.address_1,
          city: service.city,
          state_province: service.state_province,
          postal_code: service.postal_code,
          region: service.region,
          latitude: parseFloat(service.latitude),
          longitude: parseFloat(service.longitude)
        } : null,
        contact: {
          phone: service.phone ? (typeof service.phone === 'string' ? JSON.parse(service.phone) : service.phone) : null,
          email: service.email,
          website: service.website
        }
      }))

      // Calculate pagination info
      const pages = Math.ceil(total / limit)

      return {
        services: processedServices,
        pagination: {
          total: parseInt(total),
          limit: parseInt(limit),
          offset: parseInt(offset),
          pages
        },
        facets: {
          // Simple facet calculation
          total_services: parseInt(total)
        }
      }

    } catch (error) {
      fastify.log.error({ error: error.message }, 'Simple search failed')
      return reply.status(500).send({
        error: {
          message: 'Search failed',
          statusCode: 500
        }
      })
    }
  })

  // Geographic search (simplified)
  fastify.get('/geo', async (request, reply) => {
    try {
      const {
        lat,
        lng,
        radius = '10km',
        limit = 20
      } = request.query

      if (!lat || !lng) {
        return reply.status(400).send({
          error: {
            message: 'Latitude and longitude are required',
            statusCode: 400
          }
        })
      }

      // Convert radius to numeric (assume km)
      const radiusKm = parseFloat(radius.replace(/[^\d.]/g, ''))

      // Haversine formula for distance calculation in SQL
      const services = await request.db('services as s')
        .leftJoin('organizations as o', 's.organization_id', 'o.id')
        .leftJoin('locations as l', 's.id', 'l.service_id')
        .leftJoin('contacts as c', 's.id', 'c.service_id')
        .select(
          's.*',
          'o.name as organization_name',
          'l.*',
          'c.phone',
          'c.email',
          request.db.raw(`
            (6371 * acos(
              cos(radians(?)) * cos(radians(l.latitude)) * 
              cos(radians(l.longitude) - radians(?)) + 
              sin(radians(?)) * sin(radians(l.latitude))
            )) AS distance
          `, [lat, lng, lat])
        )
        .whereNotNull('l.latitude')
        .whereNotNull('l.longitude')
        .where('s.status', 'active')
        .havingRaw('distance <= ?', [radiusKm])
        .orderBy('distance')
        .limit(parseInt(limit))

      const processedServices = services.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description,
        distance: Math.round(service.distance * 100) / 100, // Round to 2 decimal places
        organization: {
          name: service.organization_name
        },
        location: {
          address_1: service.address_1,
          city: service.city,
          latitude: parseFloat(service.latitude),
          longitude: parseFloat(service.longitude)
        },
        contact: {
          phone: service.phone ? (typeof service.phone === 'string' ? JSON.parse(service.phone) : service.phone) : null,
          email: service.email
        }
      }))

      return {
        services: processedServices,
        query: {
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
          radius: radiusKm
        }
      }

    } catch (error) {
      fastify.log.error({ error: error.message }, 'Geographic search failed')
      return reply.status(500).send({
        error: {
          message: 'Geographic search failed',
          statusCode: 500
        }
      })
    }
  })

  // Simple autocomplete
  fastify.get('/autocomplete', async (request, reply) => {
    try {
      const { q, limit = 10 } = request.query

      if (!q || q.length < 2) {
        return { suggestions: [] }
      }

      const searchTerm = `%${q.trim()}%`

      // Get service name suggestions
      const serviceNames = await request.db('services')
        .select('name')
        .where('name', 'like', searchTerm)
        .where('status', 'active')
        .limit(parseInt(limit) / 2)

      // Get organization name suggestions
      const orgNames = await request.db('organizations')
        .select('name')
        .where('name', 'like', searchTerm)
        .limit(parseInt(limit) / 2)

      const suggestions = [
        ...serviceNames.map(s => ({ type: 'service', text: s.name })),
        ...orgNames.map(o => ({ type: 'organization', text: o.name }))
      ].slice(0, parseInt(limit))

      return { suggestions }

    } catch (error) {
      fastify.log.error({ error: error.message }, 'Autocomplete failed')
      return { suggestions: [] }
    }
  })
}