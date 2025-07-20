export default async function debugRoutes(fastify, options) {
  
  // Debug database tables
  fastify.get('/tables', {
    schema: {
      tags: ['Debug'],
      description: 'Check what tables exist in database'
    }
  }, async (request, reply) => {
    try {
      const tables = await request.db.raw(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      
      const counts = {};
      for (const table of tables.rows) {
        try {
          const [count] = await request.db(table.table_name).count('* as count');
          counts[table.table_name] = parseInt(count.count);
        } catch (error) {
          counts[table.table_name] = `Error: ${error.message}`;
        }
      }
      
      return {
        tables: tables.rows.map(t => t.table_name),
        counts
      };
    } catch (error) {
      fastify.log.error(error);
      return { error: error.message };
    }
  });

  // Debug scraping jobs
  fastify.get('/scraping-jobs', {
    schema: {
      tags: ['Debug'],
      description: 'Check recent scraping job attempts'
    }
  }, async (request, reply) => {
    try {
      const jobs = await request.db('scraping_jobs')
        .orderBy('created_at', 'desc')
        .limit(20)
        .select('*');
      
      return {
        totalJobs: jobs.length,
        jobs: jobs,
        summary: {
          completed: jobs.filter(j => j.status === 'completed').length,
          failed: jobs.filter(j => j.status === 'failed').length,
          totalServicesFound: jobs.reduce((sum, j) => sum + (j.services_found || 0), 0)
        }
      };
    } catch (error) {
      fastify.log.error(error);
      return { error: error.message, tables_exist: false };
    }
  });

  // Debug database connection
  fastify.get('/connection', {
    schema: {
      tags: ['Debug'],
      description: 'Test database connection'
    }
  }, async (request, reply) => {
    try {
      const result = await request.db.raw('SELECT NOW() as current_time, version() as version');
      return {
        connected: true,
        timestamp: result.rows[0].current_time,
        version: result.rows[0].version,
        database_url: process.env.DATABASE_URL ? 'Set' : 'Missing'
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  });

  // Trigger scraper manually for testing
  fastify.post('/trigger-scraper', {
    schema: {
      tags: ['Debug'],
      description: 'Manually trigger a test scraper run'
    }
  }, async (request, reply) => {
    try {
      fastify.log.info('🧪 Manual scraper trigger requested');
      
      // Create a simple test organization and service using proper UUIDs
      const { v4: uuidv4 } = await import('uuid');
      const orgId = uuidv4();
      
      await request.db('organizations').insert({
        id: orgId,
        name: 'Test Organization ' + new Date().toISOString(),
        description: 'Test organization created by debug endpoint',
        organization_type: 'test',
        data_source: 'debug_endpoint'
      });

      const serviceId = uuidv4();
      
      await request.db('services').insert({
        id: serviceId,
        organization_id: orgId,
        name: 'Test Youth Service ' + new Date().toISOString(),
        description: 'Test youth service created by debug endpoint for testing',
        categories: ['test', 'debug'],
        keywords: ['test', 'debug', 'youth'],
        data_source: 'debug_endpoint',
        status: 'active'
      });

      await request.db('locations').insert({
        id: uuidv4(),
        service_id: serviceId,
        name: 'Test Location',
        address_1: '123 Test Street',
        city: 'Brisbane',
        postal_code: '4000',
        region: 'brisbane',
        latitude: -27.4698,
        longitude: 153.0251
      });

      // Record the debug job
      await request.db('scraping_jobs').insert({
        id: uuidv4(),
        source_name: 'debug_endpoint',
        source_url: '/debug/trigger-scraper',
        job_type: 'test',
        status: 'completed',
        pages_scraped: 1,
        services_found: 1,
        errors_count: 0,
        started_at: new Date(),
        completed_at: new Date()
      });

      return {
        success: true,
        message: 'Test service created successfully',
        organizationId: orgId,
        serviceId: serviceId,
        note: 'Check /services endpoint to see the test service'
      };
      
    } catch (error) {
      fastify.log.error('Debug scraper trigger failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // Check logs
  fastify.get('/logs', {
    schema: {
      tags: ['Debug'],
      description: 'Get recent application logs'
    }
  }, async (request, reply) => {
    return {
      message: 'Logs are in Railway dashboard',
      railwayLogs: 'https://railway.app/project/your-project/deployments',
      localLogs: 'Check server console output',
      tip: 'Use Railway CLI: railway logs'
    };
  });

  // IMMEDIATE DATA POPULATION
  fastify.post('/populate-database', {
    schema: {
      tags: ['Debug'],
      description: 'IMMEDIATELY populate database with test services'
    }
  }, async (request, reply) => {
    try {
      fastify.log.info('🚀 IMMEDIATE DATABASE POPULATION');

      // Create organization
      const orgResult = await request.db('organizations').insert({
        name: 'Queensland Youth Justice Services',
        description: 'Government youth justice services across Queensland',
        organization_type: 'government',
        data_source: 'immediate_fix'
      }).returning('id');

      const orgId = orgResult[0].id;

      // Create services directly
      const services = [
        {
          organization_id: orgId,
          name: 'Youth Legal Aid Queensland',
          description: 'Free legal representation for young people aged 10-25',
          categories: ['legal_aid', 'court_support'],
          keywords: ['legal', 'court', 'lawyer'],
          minimum_age: 10,
          maximum_age: 25,
          youth_specific: true,
          data_source: 'immediate_fix',
          status: 'active'
        },
        {
          organization_id: orgId,
          name: 'Crisis Accommodation Brisbane',
          description: 'Emergency housing for homeless youth',
          categories: ['housing', 'crisis_support'],
          keywords: ['housing', 'emergency', 'shelter'],
          minimum_age: 16,
          maximum_age: 25,
          youth_specific: true,
          data_source: 'immediate_fix',
          status: 'active'
        },
        {
          organization_id: orgId,
          name: 'Aboriginal Youth Support',
          description: 'Cultural support for Indigenous youth',
          categories: ['cultural_support', 'mentoring'],
          keywords: ['aboriginal', 'indigenous', 'cultural'],
          minimum_age: 12,
          maximum_age: 25,
          youth_specific: true,
          indigenous_specific: true,
          data_source: 'immediate_fix',
          status: 'active'
        }
      ];

      const serviceResults = await request.db('services').insert(services).returning('id');

      // Create locations
      for (let i = 0; i < serviceResults.length; i++) {
        const serviceId = serviceResults[i].id;
        const serviceName = services[i].name;

        await request.db('locations').insert({
          service_id: serviceId,
          name: `${serviceName} Office`,
          address_1: `${100 + i} Test Street`,
          city: 'Brisbane',
          postal_code: '4000',
          region: 'brisbane',
          latitude: -27.4698,
          longitude: 153.0251
        });

        await request.db('contacts').insert({
          service_id: serviceId,
          name: 'Service Coordinator',
          phone: JSON.stringify([`(07) 300${i} 1234`]),
          email: `contact${i}@youthservices.qld.gov.au`
        });
      }

      // Record job
      await request.db('scraping_jobs').insert({
        source_name: 'immediate_population',
        source_url: '/debug/populate-database',
        job_type: 'immediate',
        status: 'completed',
        services_found: services.length,
        started_at: new Date(),
        completed_at: new Date()
      });

      return {
        success: true,
        message: '🎉 DATABASE POPULATED!',
        services_created: services.length,
        frontend: 'https://frontend-x6ces3z0g-benjamin-knights-projects.vercel.app',
        check_services: '/services',
        check_stats: '/stats'
      };

    } catch (error) {
      fastify.log.error('Population failed:', error);
      return { success: false, error: error.message };
    }
  });

  // Create comprehensive realistic services
  fastify.post('/create-realistic-services', {
    schema: {
      tags: ['Debug'],
      description: 'Create a comprehensive set of realistic Queensland youth services'
    }
  }, async (request, reply) => {
    try {
      const { v4: uuidv4 } = await import('uuid');
      fastify.log.info('🎯 Creating comprehensive realistic youth services for Queensland');

      // Queensland regions for realistic distribution
      const regions = ['brisbane', 'gold_coast', 'sunshine_coast', 'townsville', 'cairns', 'toowoomba', 'rockhampton', 'bundaberg'];
      const coordinates = {
        brisbane: { lat: -27.4698, lng: 153.0251 },
        gold_coast: { lat: -28.0167, lng: 153.4000 },
        sunshine_coast: { lat: -26.6500, lng: 153.0667 },
        townsville: { lat: -19.2590, lng: 146.8169 },
        cairns: { lat: -16.9186, lng: 145.7781 },
        toowoomba: { lat: -27.5598, lng: 151.9507 },
        rockhampton: { lat: -23.3842, lng: 150.5085 },
        bundaberg: { lat: -24.8661, lng: 152.3489 }
      };

      // Create diverse organizations
      const organizations = [
        { name: 'Legal Aid Queensland', type: 'government', description: 'State-funded legal assistance for young people' },
        { name: 'Youth Justice Queensland', type: 'government', description: 'Department of Youth Justice services' },
        { name: 'Salvation Army Youth Services', type: 'non_profit', description: 'Community support for at-risk youth' },
        { name: 'Mission Australia', type: 'non_profit', description: 'National youth support organization' },
        { name: 'Yurra Community Justice Group', type: 'indigenous', description: 'Indigenous-led youth justice initiatives' },
        { name: 'Multicultural Youth Queensland', type: 'community', description: 'Support for culturally diverse young people' }
      ];

      const createdOrgs = [];
      for (const org of organizations) {
        const orgId = uuidv4();
        await request.db('organizations').insert({
          id: orgId,
          name: org.name,
          description: org.description,
          organization_type: org.type,
          data_source: 'realistic_manual'
        });
        createdOrgs.push({ ...org, id: orgId });
      }

      // Comprehensive service types
      const serviceTemplates = [
        {
          name: 'Youth Legal Aid',
          description: 'Free legal representation and advice for young people facing criminal charges',
          categories: ['legal_aid', 'court_support'],
          keywords: ['legal', 'court', 'lawyer', 'criminal', 'charges'],
          min_age: 10, max_age: 25, youth_specific: true
        },
        {
          name: 'Crisis Accommodation',
          description: 'Emergency housing and support for homeless and at-risk youth',
          categories: ['housing', 'crisis_support'],
          keywords: ['housing', 'emergency', 'shelter', 'homeless'],
          min_age: 16, max_age: 25, youth_specific: true
        },
        {
          name: 'Aboriginal Youth Support',
          description: 'Culturally appropriate support services for Indigenous young people',
          categories: ['cultural_support', 'mentoring'],
          keywords: ['aboriginal', 'indigenous', 'cultural', 'elder'],
          min_age: 12, max_age: 25, youth_specific: true, indigenous_specific: true
        },
        {
          name: 'Youth Mental Health Services',
          description: 'Counseling and mental health support for young people',
          categories: ['mental_health', 'counseling'],
          keywords: ['mental', 'health', 'counseling', 'therapy'],
          min_age: 12, max_age: 25, youth_specific: true
        },
        {
          name: 'Education Support Program',
          description: 'Educational assistance and re-engagement for youth justice clients',
          categories: ['education', 'training'],
          keywords: ['education', 'school', 'training', 'learning'],
          min_age: 10, max_age: 25, youth_specific: true
        },
        {
          name: 'Drug and Alcohol Support',
          description: 'Substance abuse counseling and rehabilitation for young people',
          categories: ['substance_abuse', 'rehabilitation'],
          keywords: ['drug', 'alcohol', 'addiction', 'rehab'],
          min_age: 14, max_age: 25, youth_specific: true
        },
        {
          name: 'Family Mediation Services',
          description: 'Family conferencing and mediation for youth justice matters',
          categories: ['family_support', 'mediation'],
          keywords: ['family', 'mediation', 'conference', 'restorative'],
          min_age: 10, max_age: 25, youth_specific: true
        },
        {
          name: 'Community Service Orders',
          description: 'Supervised community service programs for youth offenders',
          categories: ['community_service', 'supervision'],
          keywords: ['community', 'service', 'supervised', 'work'],
          min_age: 16, max_age: 25, youth_specific: true
        }
      ];

      let totalServices = 0;
      
      // Create services across all regions and organizations
      for (const region of regions) {
        for (const template of serviceTemplates) {
          // Assign to appropriate organization
          const org = createdOrgs.find(o => 
            (template.indigenous_specific && o.type === 'indigenous') ||
            (['legal_aid', 'court_support'].some(cat => template.categories.includes(cat)) && o.name.includes('Legal Aid')) ||
            (['housing', 'crisis_support'].some(cat => template.categories.includes(cat)) && o.name.includes('Salvation Army')) ||
            (!template.indigenous_specific && o.type === 'government' && o.name.includes('Youth Justice'))
          ) || createdOrgs[0]; // fallback

          const serviceId = uuidv4();
          const regionName = region.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
          
          await request.db('services').insert({
            id: serviceId,
            organization_id: org.id,
            name: `${template.name} - ${regionName}`,
            description: template.description,
            categories: template.categories,
            keywords: template.keywords,
            minimum_age: template.min_age,
            maximum_age: template.max_age,
            youth_specific: template.youth_specific,
            indigenous_specific: template.indigenous_specific || false,
            data_source: 'realistic_manual',
            status: 'active'
          });

          // Create location
          const coord = coordinates[region];
          await request.db('locations').insert({
            id: uuidv4(),
            service_id: serviceId,
            name: `${template.name} ${regionName} Office`,
            address_1: `${Math.floor(Math.random() * 900) + 100} ${['Queen', 'King', 'Main', 'George', 'Elizabeth'][Math.floor(Math.random() * 5)]} Street`,
            city: regionName,
            state_province: 'QLD',
            postal_code: `${4000 + Math.floor(Math.random() * 999)}`,
            region: region,
            latitude: coord.lat + (Math.random() - 0.5) * 0.1,
            longitude: coord.lng + (Math.random() - 0.5) * 0.1
          });

          // Create contact
          await request.db('contacts').insert({
            id: uuidv4(),
            service_id: serviceId,
            name: 'Service Coordinator',
            phone: JSON.stringify([`(07) ${Math.floor(Math.random() * 9000) + 1000} ${Math.floor(Math.random() * 9000) + 1000}`]),
            email: `${template.name.toLowerCase().replace(/ /g, '.')}@${org.name.toLowerCase().replace(/ /g, '')}.org.au`
          });

          totalServices++;
        }
      }

      // Record the job
      await request.db('scraping_jobs').insert({
        id: uuidv4(),
        source_name: 'realistic_manual_creation',
        source_url: '/debug/create-realistic-services',
        job_type: 'manual',
        status: 'completed',
        services_found: totalServices,
        started_at: new Date(),
        completed_at: new Date()
      });

      return {
        success: true,
        message: '🎉 COMPREHENSIVE REALISTIC SERVICES CREATED!',
        organizations_created: organizations.length,
        services_created: totalServices,
        regions_covered: regions.length,
        service_types: serviceTemplates.length,
        frontend_url: 'https://frontend-snowy-two-53.vercel.app',
        note: 'Check the frontend - you should now see realistic Queensland youth justice services!'
      };

    } catch (error) {
      fastify.log.error('Failed to create realistic services:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // Trigger real scrapers
  fastify.post('/run-scrapers', {
    schema: {
      tags: ['Debug'],
      description: 'Manually trigger the real production scrapers'
    }
  }, async (request, reply) => {
    try {
      fastify.log.info('🚀 Manual production scraper trigger requested');
      
      // Run scrapers in background
      setTimeout(async () => {
        try {
          fastify.log.info('🕷️ Starting real production scrapers...');
          const scraperModule = await import('../../../scripts/run-all-scrapers-production.js');
          const MasterScraper = scraperModule.default;
          const scraper = new MasterScraper();
          const result = await scraper.runAllScrapers();
          fastify.log.info('✅ Production scrapers completed:', result);
        } catch (error) {
          fastify.log.error('❌ Production scrapers failed:', error);
        }
      }, 1000);

      return {
        success: true,
        message: 'Production scrapers started in background',
        status: 'running',
        checkProgress: '/debug/scraping-jobs',
        estimatedTime: '10-15 minutes'
      };
      
    } catch (error) {
      fastify.log.error('Failed to trigger production scrapers:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });
}