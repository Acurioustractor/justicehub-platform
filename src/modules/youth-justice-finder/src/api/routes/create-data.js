import fs from 'fs';

export default async function createDataRoutes(fastify, options) {
  
  // Import the 603-service dataset immediately
  fastify.post('/load-603-services', async (request, reply) => {
    try {
      // Load the merged dataset
      const mergedFile = 'MERGED-Australian-Services-2025-07-08T02-38-49-673Z.json';
      
      if (!fs.existsSync(mergedFile)) {
        return reply.code(404).send({ 
          error: 'Dataset file not found on server' 
        });
      }

      const data = JSON.parse(fs.readFileSync(mergedFile, 'utf8'));
      const services = data.services || [];

      // Clear existing data
      await request.db('services').del();
      await request.db('organizations').del();
      
      // Import organizations
      const organizations = new Map();
      for (const service of services) {
        if (service.organization && !organizations.has(service.organization.id)) {
          organizations.set(service.organization.id, service.organization);
        }
      }
      
      for (const [id, org] of organizations) {
        await request.db('organizations').insert({
          id: org.id,
          name: org.name || 'Unknown',
          data_source: 'Merged Dataset',
          created_at: new Date(),
          updated_at: new Date()
        }).onConflict('id').ignore();
      }
      
      // Import services in batches
      let imported = 0;
      for (const service of services) {
        try {
          await request.db('services').insert({
            id: service.id,
            name: service.name || 'Unknown Service',
            description: service.description,
            organization_id: service.organization?.id,
            created_at: new Date(),
            updated_at: new Date()
          }).onConflict('id').ignore();
          imported++;
        } catch (error) {
          // Continue on individual errors - just count and move on
        }
      }
      
      const stats = await request.db('services').count('* as total').first();
      
      return {
        success: true,
        imported: imported,
        total_services: parseInt(stats.total),
        organizations: organizations.size,
        message: `${imported} services imported successfully!`
      };
      
    } catch (error) {
      return reply.code(500).send({ error: error.message });
    }
  });
  
  // Create comprehensive test data
  fastify.post('/create-test-data', {
    schema: {
      tags: ['Data'],
      description: 'Create comprehensive test data for the database'
    }
  }, async (request, reply) => {
    try {
      fastify.log.info('🧪 Creating comprehensive test data...');

      // Create test organization
      const orgResult = await request.db('organizations').insert({
        name: 'Brisbane Youth Support Services',
        description: 'Comprehensive youth support services across Brisbane',
        organization_type: 'government',
        data_source: 'test_data'
      }).returning('id');
      
      const orgId = orgResult[0].id;
      fastify.log.info('✅ Created test organization:', orgId);

      // Create multiple test services
      const services = [
        {
          name: 'Youth Legal Aid Brisbane',
          description: 'Free legal assistance for young people aged 10-25 facing court proceedings. Services include representation, advice, and advocacy.',
          categories: ['legal_aid', 'court_support', 'advocacy'],
          keywords: ['legal', 'court', 'lawyer', 'advocacy', 'rights', 'juvenile'],
          min_age: 10,
          max_age: 25
        },
        {
          name: 'Crisis Accommodation Service',
          description: 'Emergency and short-term accommodation for homeless youth and those leaving detention facilities.',
          categories: ['housing', 'crisis_support', 'reintegration'],
          keywords: ['accommodation', 'housing', 'emergency', 'shelter', 'homeless'],
          min_age: 16,
          max_age: 25
        },
        {
          name: 'Aboriginal Youth Mentoring Program',
          description: 'Cultural mentoring and support program specifically designed for Aboriginal and Torres Strait Islander youth.',
          categories: ['cultural_support', 'prevention', 'mentoring'],
          keywords: ['aboriginal', 'indigenous', 'mentoring', 'cultural', 'elders'],
          min_age: 12,
          max_age: 21
        },
        {
          name: 'Family Mediation Services',
          description: 'Mediation services to help resolve family conflicts and improve family relationships for youth at risk.',
          categories: ['family_support', 'mediation', 'prevention'],
          keywords: ['family', 'mediation', 'counseling', 'therapy', 'conflict'],
          min_age: 10,
          max_age: 18
        },
        {
          name: 'Vocational Training Hub',
          description: 'Skills training and employment preparation programs for youth with justice involvement.',
          categories: ['education_training', 'employment', 'reintegration'],
          keywords: ['training', 'employment', 'skills', 'vocational', 'apprenticeship'],
          min_age: 15,
          max_age: 24
        }
      ];

      const createdServices = [];

      for (const service of services) {
        // Create service
        const serviceResult = await request.db('services').insert({
          organization_id: orgId,
          name: service.name,
          description: service.description,
          categories: service.categories,
          keywords: service.keywords,
          minimum_age: service.min_age,
          maximum_age: service.max_age,
          youth_specific: true,
          indigenous_specific: service.categories.includes('cultural_support'),
          data_source: 'test_data',
          status: 'active'
        }).returning('id');

        const serviceId = serviceResult[0].id;
        fastify.log.info('✅ Created service:', service.name);

        // Create location for service
        const locations = [
          { city: 'Brisbane', region: 'brisbane', lat: -27.4698, lng: 153.0251 },
          { city: 'Gold Coast', region: 'gold_coast', lat: -28.0167, lng: 153.4000 },
          { city: 'Townsville', region: 'townsville', lat: -19.2590, lng: 146.8169 }
        ];

        const location = locations[Math.floor(Math.random() * locations.length)];

        await request.db('locations').insert({
          service_id: serviceId,
          name: `${service.name} - ${location.city} Office`,
          address_1: `${Math.floor(Math.random() * 999) + 1} ${location.city} Street`,
          city: location.city,
          postal_code: location.city === 'Brisbane' ? '4000' : location.city === 'Gold Coast' ? '4217' : '4810',
          region: location.region,
          latitude: location.lat,
          longitude: location.lng
        });

        // Create contact
        await request.db('contacts').insert({
          service_id: serviceId,
          name: `${service.name} Coordinator`,
          phone: JSON.stringify([`(07) ${Math.floor(Math.random() * 9000) + 1000} ${Math.floor(Math.random() * 9000) + 1000}`]),
          email: `info@${service.name.toLowerCase().replace(/\s+/g, '')}.qld.gov.au`
        });

        createdServices.push({
          id: serviceId,
          name: service.name,
          location: location.city
        });
      }

      // Record the creation as a scraping job
      await request.db('scraping_jobs').insert({
        source_name: 'test_data_creator',
        source_url: '/create-data/create-test-data',
        job_type: 'test',
        status: 'completed',
        pages_scraped: 1,
        services_found: services.length,
        errors_count: 0,
        started_at: new Date(),
        completed_at: new Date()
      });

      return {
        success: true,
        message: 'Test data created successfully',
        data: {
          organization: {
            id: orgId,
            name: 'Brisbane Youth Support Services'
          },
          services: createdServices,
          total: {
            organizations: 1,
            services: services.length,
            locations: services.length,
            contacts: services.length
          }
        },
        frontend: 'https://frontend-x6ces3z0g-benjamin-knights-projects.vercel.app',
        api: '/services'
      };

    } catch (error) {
      fastify.log.error('Failed to create test data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });
}