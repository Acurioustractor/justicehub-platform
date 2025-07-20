import { Client } from '@elastic/elasticsearch';
import pino from 'pino';

const logger = pino({ name: 'elasticsearch' });

// Elasticsearch configuration
const config = {
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  auth: process.env.ELASTICSEARCH_AUTH ? {
    username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD
  } : undefined,
  requestTimeout: 30000,
  maxRetries: 3,
  resurrectStrategy: 'ping'
};

// Create Elasticsearch client
export const esClient = new Client(config);

// Test connection
export async function testConnection() {
  try {
    const health = await esClient.cluster.health();
    logger.info({ status: health.status }, 'Elasticsearch connected');
    return true;
  } catch (error) {
    logger.error({ error: error.message }, 'Elasticsearch connection failed');
    return false;
  }
}

// Index configurations
export const indices = {
  services: {
    name: process.env.ES_SERVICES_INDEX || 'youth_services',
    settings: {
      number_of_shards: 1,
      number_of_replicas: 1,
      analysis: {
        analyzer: {
          text_analyzer: {
            type: 'custom',
            tokenizer: 'standard',
            filter: [
              'lowercase',
              'stop',
              'snowball',
              'synonym'
            ]
          },
          autocomplete_analyzer: {
            type: 'custom',
            tokenizer: 'standard',
            filter: [
              'lowercase',
              'autocomplete_filter'
            ]
          },
          search_analyzer: {
            type: 'custom',
            tokenizer: 'standard',
            filter: [
              'lowercase'
            ]
          }
        },
        filter: {
          autocomplete_filter: {
            type: 'edge_ngram',
            min_gram: 2,
            max_gram: 20
          },
          synonym: {
            type: 'synonym',
            synonyms: [
              'youth,young people,adolescent,teenager',
              'legal aid,lawyer,attorney,solicitor',
              'mental health,psychology,counselling,therapy',
              'accommodation,housing,shelter',
              'indigenous,aboriginal,torres strait islander,atsi'
            ]
          }
        }
      }
    },
    mappings: {
      properties: {
        id: { type: 'keyword' },
        name: {
          type: 'text',
          analyzer: 'text_analyzer',
          fields: {
            raw: { type: 'keyword' },
            autocomplete: {
              type: 'text',
              analyzer: 'autocomplete_analyzer',
              search_analyzer: 'search_analyzer'
            }
          }
        },
        description: {
          type: 'text',
          analyzer: 'text_analyzer'
        },
        categories: {
          type: 'keyword'
        },
        keywords: {
          type: 'keyword'
        },
        organization: {
          properties: {
            id: { type: 'keyword' },
            name: {
              type: 'text',
              analyzer: 'text_analyzer',
              fields: {
                raw: { type: 'keyword' },
                autocomplete: {
                  type: 'text',
                  analyzer: 'autocomplete_analyzer',
                  search_analyzer: 'search_analyzer'
                }
              }
            },
            type: { type: 'keyword' }
          }
        },
        location: {
          properties: {
            coordinates: { type: 'geo_point' },
            address: { type: 'text' },
            city: { type: 'keyword' },
            region: { type: 'keyword' },
            postcode: { type: 'keyword' }
          }
        },
        contact: {
          properties: {
            phone: { type: 'keyword' },
            email: { type: 'keyword' }
          }
        },
        age_range: {
          properties: {
            minimum: { type: 'integer' },
            maximum: { type: 'integer' }
          }
        },
        youth_specific: { type: 'boolean' },
        indigenous_specific: { type: 'boolean' },
        status: { type: 'keyword' },
        data_source: { type: 'keyword' },
        created_at: { type: 'date' },
        updated_at: { type: 'date' },
        
        // Computed fields for search ranking
        popularity_score: { type: 'float' },
        quality_score: { type: 'float' },
        
        // Full-text search field combining multiple fields
        search_text: {
          type: 'text',
          analyzer: 'text_analyzer'
        }
      }
    }
  }
};

// Create or update index
export async function createIndex(indexName, config) {
  try {
    const exists = await esClient.indices.exists({ index: indexName });
    
    if (exists) {
      logger.info({ index: indexName }, 'Index already exists');
      return true;
    }

    await esClient.indices.create({
      index: indexName,
      body: {
        settings: config.settings,
        mappings: config.mappings
      }
    });

    logger.info({ index: indexName }, 'Index created successfully');
    return true;
  } catch (error) {
    logger.error({ error: error.message, index: indexName }, 'Failed to create index');
    return false;
  }
}

// Update index mapping
export async function updateMapping(indexName, mapping) {
  try {
    await esClient.indices.putMapping({
      index: indexName,
      body: mapping
    });
    
    logger.info({ index: indexName }, 'Mapping updated successfully');
    return true;
  } catch (error) {
    logger.error({ error: error.message, index: indexName }, 'Failed to update mapping');
    return false;
  }
}

// Delete index
export async function deleteIndex(indexName) {
  try {
    const exists = await esClient.indices.exists({ index: indexName });
    
    if (!exists) {
      logger.info({ index: indexName }, 'Index does not exist');
      return true;
    }

    await esClient.indices.delete({ index: indexName });
    logger.info({ index: indexName }, 'Index deleted successfully');
    return true;
  } catch (error) {
    logger.error({ error: error.message, index: indexName }, 'Failed to delete index');
    return false;
  }
}

// Refresh index
export async function refreshIndex(indexName) {
  try {
    await esClient.indices.refresh({ index: indexName });
    return true;
  } catch (error) {
    logger.error({ error: error.message, index: indexName }, 'Failed to refresh index');
    return false;
  }
}