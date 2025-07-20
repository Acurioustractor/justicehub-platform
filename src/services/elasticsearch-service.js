import { esClient, indices, refreshIndex } from '../config/elasticsearch.js';
import pino from 'pino';

const logger = pino({ name: 'elasticsearch-service' });

export class ElasticsearchService {
  constructor() {
    this.servicesIndex = indices.services.name;
  }

  // Index a single service
  async indexService(service) {
    try {
      const doc = this.transformServiceForIndex(service);
      
      const response = await esClient.index({
        index: this.servicesIndex,
        id: service.id,
        document: doc
      });

      logger.info({ 
        serviceId: service.id, 
        result: response.result 
      }, 'Service indexed successfully');
      
      return response;
    } catch (error) {
      logger.error({ 
        error: error.message, 
        serviceId: service.id 
      }, 'Failed to index service');
      throw error;
    }
  }

  // Bulk index multiple services
  async bulkIndexServices(services) {
    try {
      const body = [];
      
      services.forEach(service => {
        body.push({
          index: {
            _index: this.servicesIndex,
            _id: service.id
          }
        });
        body.push(this.transformServiceForIndex(service));
      });

      if (body.length === 0) {
        return { indexed: 0, errors: [] };
      }

      const response = await esClient.bulk({ 
        index: this.servicesIndex,
        operations: body
      });
      
      const errors = response.items
        .filter(item => item.index?.error)
        .map(item => item.index.error);

      const indexed = response.items.filter(item => !item.index?.error).length;

      logger.info({ 
        indexed, 
        errors: errors.length,
        total: services.length 
      }, 'Bulk indexing completed');

      return { indexed, errors };
    } catch (error) {
      logger.error({ error: error.message }, 'Bulk indexing failed');
      throw error;
    }
  }

  // Search services with advanced query
  async searchServices(query) {
    try {
      const searchBody = this.buildSearchQuery(query);
      
      const response = await esClient.search({
        index: this.servicesIndex,
        ...searchBody
      });

      return this.transformSearchResponse(response, query);
    } catch (error) {
      logger.error({ error: error.message, query }, 'Search failed');
      throw error;
    }
  }

  // Get autocomplete suggestions
  async getAutocompleteSuggestions(text, type = 'services') {
    try {
      let field;
      switch (type) {
        case 'organizations':
          field = 'organization.name.autocomplete';
          break;
        case 'categories':
          field = 'categories';
          break;
        default:
          field = 'name.autocomplete';
      }

      const response = await esClient.search({
        index: this.servicesIndex,
        size: 10,
        _source: [field.split('.')[0]],
        query: {
          bool: {
            must: [
              {
                match: {
                  [field]: {
                    query: text,
                    operator: 'and'
                  }
                }
              }
            ],
            filter: [
              { term: { status: 'active' } }
            ]
          }
        }
      });

      return this.extractSuggestions(response, type);
    } catch (error) {
      logger.error({ error: error.message, text, type }, 'Autocomplete failed');
      throw error;
    }
  }

  // Get services near a location
  async getNearbyServices(lat, lng, radius = '10km', limit = 20) {
    try {
      const response = await esClient.search({
        index: this.servicesIndex,
        size: limit,
        query: {
          bool: {
            must: [
              { term: { status: 'active' } }
            ],
            filter: [
              {
                geo_distance: {
                  distance: radius,
                  'location.coordinates': { lat, lon: lng }
                }
              }
            ]
          }
        },
        sort: [
          {
            _geo_distance: {
              'location.coordinates': { lat, lon: lng },
              order: 'asc',
              unit: 'km'
            }
          }
        ]
      });

      return response.hits.hits.map(hit => ({
        ...hit._source,
        distance: hit.sort[0] + 'km'
      }));
    } catch (error) {
      logger.error({ error: error.message, lat, lng }, 'Nearby search failed');
      throw error;
    }
  }

  // Get aggregated facets for search filters
  async getSearchFacets(query = {}) {
    try {
      const baseQuery = this.buildBaseQuery(query);
      
      const response = await esClient.search({
        index: this.servicesIndex,
        size: 0,
        query: baseQuery,
        aggs: {
          categories: {
            terms: {
              field: 'categories',
              size: 20
            }
          },
          regions: {
            terms: {
              field: 'location.region',
              size: 15
            }
          },
          organization_types: {
            terms: {
              field: 'organization.type',
              size: 10
            }
          },
          age_ranges: {
            range: {
              field: 'age_range.minimum',
              ranges: [
                { to: 13, key: 'children' },
                { from: 13, to: 18, key: 'youth' },
                { from: 18, to: 26, key: 'young_adults' }
              ]
            }
          }
        }
      });

      return this.transformFacetsResponse(response.aggregations);
    } catch (error) {
      logger.error({ error: error.message }, 'Facets query failed');
      throw error;
    }
  }

  // Delete a service from index
  async deleteService(serviceId) {
    try {
      const response = await esClient.delete({
        index: this.servicesIndex,
        id: serviceId
      });

      logger.info({ serviceId, result: response.result }, 'Service deleted from index');
      return response;
    } catch (error) {
      if (error.meta?.statusCode === 404) {
        logger.warn({ serviceId }, 'Service not found in index');
        return null;
      }
      logger.error({ error: error.message, serviceId }, 'Failed to delete service');
      throw error;
    }
  }

  // Transform service data for Elasticsearch indexing
  transformServiceForIndex(service) {
    const searchText = [
      service.name,
      service.description,
      service.organization?.name,
      service.categories?.join(' '),
      service.keywords?.join(' ')
    ].filter(Boolean).join(' ');

    return {
      id: service.id,
      name: service.name,
      description: service.description,
      categories: service.categories || [],
      keywords: service.keywords || [],
      organization: {
        id: service.organization?.id,
        name: service.organization?.name,
        type: service.organization?.type
      },
      location: service.location ? {
        coordinates: service.location.coordinates ? {
          lat: service.location.coordinates.lat,
          lon: service.location.coordinates.lng
        } : null,
        address: service.location.address,
        city: service.location.city,
        region: service.location.region,
        postcode: service.location.postcode
      } : null,
      contact: {
        phone: service.contact?.phone?.[0]?.number,
        email: service.contact?.email
      },
      age_range: {
        minimum: service.age_range?.minimum,
        maximum: service.age_range?.maximum
      },
      youth_specific: service.youth_specific,
      indigenous_specific: service.indigenous_specific,
      status: service.status,
      data_source: service.data_source,
      created_at: service.created_at,
      updated_at: service.updated_at,
      search_text: searchText,
      popularity_score: this.calculatePopularityScore(service),
      quality_score: this.calculateQualityScore(service)
    };
  }

  // Build Elasticsearch search query
  buildSearchQuery(query) {
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
      radius = '50km',
      limit = 20,
      offset = 0,
      sort = 'relevance'
    } = query;

    const mustQueries = [];
    const filterQueries = [
      { term: { status: 'active' } }
    ];

    // Text search with multi-match
    if (q) {
      mustQueries.push({
        multi_match: {
          query: q,
          fields: [
            'name^3',
            'name.autocomplete^2',
            'description^1.5',
            'organization.name^2',
            'search_text^1'
          ],
          type: 'best_fields',
          fuzziness: 'AUTO',
          prefix_length: 2
        }
      });
    }

    // Category filters
    if (categories) {
      const categoryList = categories.split(',').map(c => c.trim());
      filterQueries.push({
        terms: { categories: categoryList }
      });
    }

    // Region filters
    if (regions) {
      const regionList = regions.split(',').map(r => r.trim());
      filterQueries.push({
        terms: { 'location.region': regionList }
      });
    }

    // Age range filters
    if (min_age !== undefined || max_age !== undefined) {
      const ageQuery = { bool: { should: [] } };
      
      if (min_age !== undefined) {
        ageQuery.bool.should.push({
          bool: {
            should: [
              { bool: { must_not: { exists: { field: 'age_range.minimum' } } } },
              { range: { 'age_range.minimum': { lte: min_age } } }
            ]
          }
        });
      }
      
      if (max_age !== undefined) {
        ageQuery.bool.should.push({
          bool: {
            should: [
              { bool: { must_not: { exists: { field: 'age_range.maximum' } } } },
              { range: { 'age_range.maximum': { gte: max_age } } }
            ]
          }
        });
      }
      
      filterQueries.push(ageQuery);
    }

    // Population-specific filters
    if (youth_specific !== undefined) {
      filterQueries.push({ term: { youth_specific } });
    }

    if (indigenous_specific !== undefined) {
      filterQueries.push({ term: { indigenous_specific } });
    }

    // Geographic filter
    if (lat && lng) {
      filterQueries.push({
        geo_distance: {
          distance: radius,
          'location.coordinates': { lat, lon: lng }
        }
      });
    }

    const baseQuery = {
      bool: {
        must: mustQueries.length > 0 ? mustQueries : [{ match_all: {} }],
        filter: filterQueries
      }
    };

    // Build sort configuration
    const sortConfig = this.buildSortConfig(sort, lat, lng, q);

    return {
      size: limit,
      from: offset,
      query: baseQuery,
      sort: sortConfig,
      highlight: {
        fields: {
          name: {},
          description: { fragment_size: 100 },
          'organization.name': {}
        }
      }
    };
  }

  // Build base query for facets
  buildBaseQuery(query) {
    return {
      bool: {
        filter: [
          { term: { status: 'active' } }
        ]
      }
    };
  }

  // Build sort configuration
  buildSortConfig(sort, lat, lng, query) {
    switch (sort) {
      case 'distance':
        if (lat && lng) {
          return [
            {
              _geo_distance: {
                'location.coordinates': { lat, lon: lng },
                order: 'asc',
                unit: 'km'
              }
            }
          ];
        }
        return [{ 'name.raw': 'asc' }];
      
      case 'name':
        return [{ 'name.raw': 'asc' }];
      
      case 'updated':
        return [{ updated_at: 'desc' }];
      
      case 'popularity':
        return [{ popularity_score: 'desc' }, { _score: 'desc' }];
      
      default: // relevance
        if (query) {
          return [
            { _score: 'desc' },
            { quality_score: 'desc' },
            { updated_at: 'desc' }
          ];
        }
        return [{ updated_at: 'desc' }];
    }
  }

  // Transform Elasticsearch response
  transformSearchResponse(response, query) {
    const services = response.hits.hits.map(hit => {
      const service = hit._source;
      const result = {
        id: service.id,
        name: service.name,
        description: service.description,
        organization: service.organization,
        location: service.location,
        contact: service.contact,
        categories: service.categories,
        age_range: service.age_range,
        youth_specific: service.youth_specific,
        indigenous_specific: service.indigenous_specific,
        score: hit._score
      };

      // Add highlighting
      if (hit.highlight) {
        result.highlight = hit.highlight;
      }

      // Add distance if geo search
      if (hit.sort && query.lat && query.lng) {
        result.distance = hit.sort[0] + 'km';
      }

      return result;
    });

    return {
      services,
      total: response.hits.total.value,
      max_score: response.hits.max_score
    };
  }

  // Extract autocomplete suggestions
  extractSuggestions(response, type) {
    const suggestions = new Set();
    
    response.hits.hits.forEach(hit => {
      switch (type) {
        case 'organizations':
          if (hit._source.organization?.name) {
            suggestions.add(hit._source.organization.name);
          }
          break;
        case 'categories':
          if (hit._source.categories) {
            hit._source.categories.forEach(cat => suggestions.add(cat));
          }
          break;
        default:
          if (hit._source.name) {
            suggestions.add(hit._source.name);
          }
      }
    });

    return Array.from(suggestions).slice(0, 10);
  }

  // Transform aggregations response
  transformFacetsResponse(aggregations) {
    return {
      categories: aggregations.categories.buckets.map(bucket => ({
        value: bucket.key,
        label: bucket.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count: bucket.doc_count
      })),
      regions: aggregations.regions.buckets.map(bucket => ({
        value: bucket.key,
        label: bucket.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count: bucket.doc_count
      })),
      organization_types: aggregations.organization_types.buckets.map(bucket => ({
        value: bucket.key,
        label: bucket.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count: bucket.doc_count
      })),
      age_ranges: aggregations.age_ranges.buckets.map(bucket => ({
        key: bucket.key,
        count: bucket.doc_count
      }))
    };
  }

  // Calculate popularity score based on various factors
  calculatePopularityScore(service) {
    let score = 1.0;
    
    // Boost government services
    if (service.organization?.type === 'government') {
      score += 0.3;
    }
    
    // Boost youth-specific services
    if (service.youth_specific) {
      score += 0.2;
    }
    
    // Boost services with contact information
    if (service.contact?.phone || service.contact?.email) {
      score += 0.1;
    }
    
    // Boost services with location
    if (service.location?.coordinates) {
      score += 0.1;
    }
    
    return score;
  }

  // Calculate quality score based on completeness
  calculateQualityScore(service) {
    let score = 0;
    
    // Basic information completeness
    if (service.name) score += 1;
    if (service.description && service.description.length > 50) score += 1;
    if (service.categories && service.categories.length > 0) score += 1;
    
    // Contact information
    if (service.contact?.phone) score += 1;
    if (service.contact?.email) score += 1;
    
    // Location information
    if (service.location?.address) score += 1;
    if (service.location?.coordinates) score += 1;
    
    // Organization information
    if (service.organization?.name) score += 1;
    
    // Age range specified
    if (service.age_range?.minimum || service.age_range?.maximum) score += 1;
    
    return score / 9; // Normalize to 0-1
  }
}

// Export singleton instance
export const elasticsearchService = new ElasticsearchService();