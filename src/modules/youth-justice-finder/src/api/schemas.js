// JSON Schema definitions for API responses

export const schemas = {
  // Service schemas
  Service: {
    $id: 'Service',
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      description: { type: 'string' },
      url: { type: 'string', format: 'uri' },
      email: { type: 'string', format: 'email' },
      status: { type: 'string', enum: ['active', 'inactive'] },
      age_range: {
        type: 'object',
        properties: {
          minimum: { type: ['integer', 'null'] },
          maximum: { type: ['integer', 'null'] }
        }
      },
      youth_specific: { type: 'boolean' },
      indigenous_specific: { type: 'boolean' },
      categories: { type: 'array', items: { type: 'string' } },
      keywords: { type: 'array', items: { type: 'string' } },
      data_source: { type: 'string' },
      organization: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { type: 'string' },
          url: { type: 'string' }
        }
      },
      location: {
        type: ['object', 'null'],
        properties: {
          address: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          postcode: { type: 'string' },
          region: { type: 'string' },
          coordinates: {
            type: ['object', 'null'],
            properties: {
              lat: { type: 'number' },
              lng: { type: 'number' }
            }
          }
        }
      },
      contact: {
        type: 'object',
        properties: {
          phone: { type: ['array', 'null'], items: { type: 'object' } },
          email: { type: ['string', 'null'] }
        }
      },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' }
    }
  },

  ServiceResult: {
    $id: 'ServiceResult',
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      description: { type: 'string' },
      url: { type: ['string', 'null'] },
      email: { type: ['string', 'null'] },
      status: { type: 'string' },
      age_range: {
        type: 'object',
        properties: {
          minimum: { type: ['integer', 'null'] },
          maximum: { type: ['integer', 'null'] }
        }
      },
      youth_specific: { type: 'boolean' },
      indigenous_specific: { type: 'boolean' },
      categories: { type: 'array', items: { type: 'string' } },
      keywords: { type: 'array', items: { type: 'string' } },
      organization: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { type: 'string' },
          url: { type: ['string', 'null'] }
        }
      },
      location: {
        type: ['object', 'null'],
        properties: {
          address: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          postcode: { type: 'string' },
          region: { type: 'string' },
          coordinates: {
            type: ['object', 'null'],
            properties: {
              lat: { type: 'number' },
              lng: { type: 'number' }
            }
          }
        }
      },
      contact: {
        type: 'object',
        properties: {
          phone: { type: ['array', 'null'] },
          email: { type: ['string', 'null'] }
        }
      },
      distance: { type: ['string', 'null'] },
      updated_at: { type: 'string', format: 'date-time' }
    }
  },

  ServiceDetail: {
    $id: 'ServiceDetail',
    allOf: [
      { $ref: 'Service#' },
      {
        type: 'object',
        properties: {
          attribution: {
            type: ['object', 'null'],
            properties: {
              source: { type: 'string' },
              license: { type: 'string' },
              attribution: { type: 'string' },
              sourceUrl: { type: 'string' },
              accessedDate: { type: 'string' }
            }
          },
          related_services: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                organization: { type: 'string' },
                city: { type: 'string' },
                categories: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }
      }
    ]
  },

  // Pagination schema
  Pagination: {
    $id: 'Pagination',
    type: 'object',
    properties: {
      limit: { type: 'integer' },
      offset: { type: 'integer' },
      total: { type: 'integer' },
      pages: { type: 'integer' },
      current_page: { type: 'integer' },
      has_next: { type: 'boolean' },
      has_prev: { type: 'boolean' }
    }
  },

  // Search facets schema
  SearchFacets: {
    $id: 'SearchFacets',
    type: 'object',
    properties: {
      categories: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            value: { type: 'string' },
            label: { type: 'string' },
            count: { type: 'integer' }
          }
        }
      },
      regions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            value: { type: 'string' },
            label: { type: 'string' },
            count: { type: 'integer' }
          }
        }
      },
      organization_types: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            value: { type: 'string' },
            label: { type: 'string' },
            count: { type: 'integer' }
          }
        }
      }
    }
  },

  // Organization schema
  Organization: {
    $id: 'Organization',
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      organization_type: { type: 'string' },
      url: { type: ['string', 'null'] },
      abn: { type: ['string', 'null'] },
      data_source: { type: 'string' },
      service_count: { type: 'integer' },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' }
    }
  },

  // Error schema
  Error: {
    $id: 'Error',
    type: 'object',
    properties: {
      error: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          statusCode: { type: 'integer' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      }
    }
  }
};

export function addSchemas(fastify) {
  Object.values(schemas).forEach(schema => {
    fastify.addSchema(schema);
  });
}