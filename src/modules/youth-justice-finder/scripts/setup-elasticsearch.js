#!/usr/bin/env node

import dotenv from 'dotenv';
import { esClient, testConnection, createIndex, indices } from '../src/config/elasticsearch.js';
import { elasticsearchService } from '../src/services/elasticsearch-service.js';
import db from '../src/config/database.js';

dotenv.config();

console.log(`
╔════════════════════════════════════════════════════╗
║            Elasticsearch Setup                     ║
║        Youth Justice Service Finder               ║
╚════════════════════════════════════════════════════╝
`);

async function setupElasticsearch() {
  try {
    // Test Elasticsearch connection
    console.log('🔍 Testing Elasticsearch connection...');
    const connected = await testConnection();
    
    if (!connected) {
      console.log('❌ Elasticsearch is not available');
      console.log('\n📋 To start Elasticsearch:');
      console.log('1. Install Elasticsearch: https://www.elastic.co/downloads/elasticsearch');
      console.log('2. Start with Docker: docker run -d -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" elasticsearch:8.11.0');
      console.log('3. Or use Elastic Cloud: https://cloud.elastic.co/');
      process.exit(1);
    }

    console.log('✅ Elasticsearch connected successfully');

    // Create indices
    console.log('\n🏗️  Creating Elasticsearch indices...');
    
    const servicesIndexCreated = await createIndex(
      indices.services.name,
      indices.services
    );

    if (!servicesIndexCreated) {
      throw new Error('Failed to create services index');
    }

    console.log(`✅ Services index created: ${indices.services.name}`);

    // Index existing services
    console.log('\n📊 Indexing existing services from database...');
    
    const services = await getAllServicesFromDB();
    console.log(`Found ${services.length} services to index`);

    if (services.length === 0) {
      console.log('⚠️  No services found in database');
      console.log('Run the scrapers first to populate the database');
      return;
    }

    // Bulk index services
    const result = await elasticsearchService.bulkIndexServices(services);
    
    console.log(`✅ Indexed ${result.indexed} services`);
    if (result.errors.length > 0) {
      console.log(`⚠️  ${result.errors.length} errors occurred during indexing`);
      result.errors.slice(0, 3).forEach(error => {
        console.log(`   - ${error.reason}`);
      });
    }

    // Test search functionality
    console.log('\n🧪 Testing search functionality...');
    
    const testQueries = [
      { q: 'youth legal', limit: 3 },
      { q: 'mental health', limit: 3 },
      { categories: 'legal_aid', limit: 3 },
      { regions: 'brisbane', limit: 3 }
    ];

    for (const query of testQueries) {
      try {
        const searchResult = await elasticsearchService.searchServices(query);
        console.log(`✅ Search '${JSON.stringify(query)}': ${searchResult.total} results`);
      } catch (error) {
        console.log(`❌ Search '${JSON.stringify(query)}' failed: ${error.message}`);
      }
    }

    // Test autocomplete
    console.log('\n🔍 Testing autocomplete...');
    try {
      const suggestions = await elasticsearchService.getAutocompleteSuggestions('legal');
      console.log(`✅ Autocomplete 'legal': ${suggestions.length} suggestions`);
      suggestions.slice(0, 3).forEach(suggestion => {
        console.log(`   - ${suggestion}`);
      });
    } catch (error) {
      console.log(`❌ Autocomplete failed: ${error.message}`);
    }

    // Test facets
    console.log('\n📊 Testing search facets...');
    try {
      const facets = await elasticsearchService.getSearchFacets();
      console.log(`✅ Facets retrieved:`);
      console.log(`   - Categories: ${facets.categories.length}`);
      console.log(`   - Regions: ${facets.regions.length}`);
      console.log(`   - Organization types: ${facets.organization_types.length}`);
    } catch (error) {
      console.log(`❌ Facets failed: ${error.message}`);
    }

    console.log('\n🎉 Elasticsearch setup completed successfully!');
    console.log('\n📈 Next steps:');
    console.log('1. Update API to use Elasticsearch for search');
    console.log('2. Set up automated indexing for new services');
    console.log('3. Configure search result ranking');
    console.log('4. Add search analytics');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    await db.destroy();
    process.exit(0);
  }
}

async function getAllServicesFromDB() {
  try {
    const services = await db('services as s')
      .leftJoin('organizations as o', 's.organization_id', 'o.id')
      .leftJoin('locations as l', 'l.service_id', 's.id')
      .leftJoin('contacts as c', 'c.service_id', 's.id')
      .where('s.status', 'active')
      .select(
        's.*',
        'o.name as organization_name',
        'o.organization_type',
        'o.url as organization_url',
        'l.address_1',
        'l.address_2',
        'l.city',
        'l.state_province',
        'l.postal_code',
        'l.region',
        'l.latitude',
        'l.longitude',
        'c.phone',
        'c.email as contact_email'
      );

    return services.map(service => ({
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
        id: service.organization_id,
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
    }));
  } catch (error) {
    console.error('Failed to fetch services from database:', error.message);
    return [];
  }
}

setupElasticsearch();