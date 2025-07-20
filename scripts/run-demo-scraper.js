#!/usr/bin/env node

import dotenv from 'dotenv';
import pino from 'pino';
import { createAskIzzyScraper } from '../src/scrapers/ask-izzy-scraper.js';
import { createQueenslandOpenDataScraper } from '../src/scrapers/queensland-open-data-scraper.js';
import { getDuplicateDetector } from '../src/services/duplicate-detector.js';
import db from '../src/config/database.js';

dotenv.config();

const logger = pino({ 
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

async function runDemoScraper() {
  console.log(`
╔════════════════════════════════════════════════════╗
║     Youth Justice Service Finder - Demo Scraper    ║
╚════════════════════════════════════════════════════╝
`);

  try {
    // Check if Firecrawl API key is set
    if (!process.env.FIRECRAWL_API_KEY || process.env.FIRECRAWL_API_KEY === 'your_firecrawl_api_key_here') {
      console.log(`
⚠️  WARNING: Firecrawl API key not configured!

To use the full scraping capabilities, please:
1. Sign up for a free Firecrawl account at https://firecrawl.dev
2. Copy your API key
3. Create a .env file from .env.example
4. Add your API key to the .env file

For this demo, we'll run with limited functionality.
`);
      
      // Run without Firecrawl
      await runLimitedDemo();
    } else {
      // Run full demo
      await runFullDemo();
    }

  } catch (error) {
    logger.error({ error: error.message }, 'Demo scraper failed');
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

async function runLimitedDemo() {
  console.log('\nRunning LIMITED demo (without Firecrawl)...\n');

  // Create some sample data
  console.log('📝 Creating sample services...');
  
  const sampleServices = [
    {
      name: 'Brisbane Youth Justice Service Centre',
      description: 'Provides supervision, programs and support for young people in the youth justice system.',
      organization: 'Department of Youth Justice',
      categories: ['supervision', 'court_support', 'family_support'],
      location: {
        address_1: '1 William Street',
        city: 'Brisbane',
        postal_code: '4000'
      },
      contact: {
        phone: '(07) 3000 0000',
        email: 'brisbane.youth@justice.qld.gov.au'
      },
      minimum_age: 10,
      maximum_age: 17
    },
    {
      name: 'Youth Legal Aid Queensland',
      description: 'Free legal representation and advice for young people facing court.',
      organization: 'Legal Aid Queensland',
      categories: ['legal_aid', 'advocacy'],
      location: {
        address_1: '44 Herschel Street',
        city: 'Brisbane',
        postal_code: '4000'
      },
      contact: {
        phone: '1300 651 188',
        email: 'info@legalaid.qld.gov.au'
      },
      minimum_age: 10,
      maximum_age: 25
    },
    {
      name: 'headspace Brisbane',
      description: 'Mental health support and counselling for young people aged 12-25.',
      organization: 'headspace National Youth Mental Health Foundation',
      categories: ['mental_health'],
      location: {
        address_1: '201 Wickham Terrace',
        city: 'Brisbane',
        postal_code: '4000'
      },
      contact: {
        phone: '(07) 3114 4200',
        website: 'https://headspace.org.au/headspace-centres/brisbane/'
      },
      minimum_age: 12,
      maximum_age: 25
    }
  ];

  // Save sample services
  for (const serviceData of sampleServices) {
    await saveSampleService(serviceData);
  }

  console.log(`✅ Created ${sampleServices.length} sample services\n`);

  // Run duplicate detection
  console.log('🔍 Running duplicate detection...');
  const detector = getDuplicateDetector();
  const duplicates = await detector.findAllDuplicates({ limit: 100 });
  console.log(`Found ${duplicates.length} duplicate groups\n`);

  // Show summary
  await showSummary();
}

async function runFullDemo() {
  console.log('\nRunning FULL demo with Firecrawl integration...\n');

  // Step 1: Ask Izzy Scraper
  console.log('🌐 Starting Ask Izzy scraper...');
  console.log('  This will search for youth services across Queensland\n');
  
  const askIzzyScraper = await createAskIzzyScraper(db, {
    // Limit for demo
    maxResultsPerSearch: 10,
    categories: ['legal', 'mental-health', 'housing']
  });
  
  const askIzzyResults = await askIzzyScraper.scrape();
  
  console.log(`✅ Ask Izzy scraper completed:`);
  console.log(`   - Services found: ${askIzzyResults.servicesFound}`);
  console.log(`   - Services processed: ${askIzzyResults.servicesProcessed}`);
  console.log(`   - Duplicates skipped: ${askIzzyResults.duplicatesSkipped}`);
  console.log(`   - Errors: ${askIzzyResults.errors}\n`);

  // Step 2: Queensland Open Data Scraper
  console.log('📊 Starting Queensland Open Data scraper...');
  console.log('  This will fetch government service data\n');
  
  const qldDataScraper = await createQueenslandOpenDataScraper(db);
  const qldResults = await qldDataScraper.scrape();
  
  console.log(`✅ Queensland Open Data scraper completed:`);
  console.log(`   - Datasets processed: ${qldResults.datasetsProcessed}`);
  console.log(`   - Services found: ${qldResults.servicesFound}`);
  console.log(`   - Services processed: ${qldResults.servicesProcessed}`);
  console.log(`   - Duplicates skipped: ${qldResults.duplicatesSkipped}`);
  console.log(`   - Errors: ${qldResults.errors}\n`);

  // Step 3: Duplicate Detection
  console.log('🔍 Running duplicate detection...');
  const detector = getDuplicateDetector();
  const duplicates = await detector.findAllDuplicates({ limit: 100 });
  
  console.log(`Found ${duplicates.length} duplicate groups`);
  
  if (duplicates.length > 0) {
    console.log('\nTop duplicate groups:');
    duplicates.slice(0, 3).forEach((group, i) => {
      console.log(`  ${i + 1}. ${group.services.length} services (${Math.round(group.score * 100)}% match)`);
    });
  }

  // Show summary
  await showSummary();
}

async function saveSampleService(serviceData) {
  const { organization, location, contact, ...service } = serviceData;
  
  try {
    // Create organization
    const [org] = await db('organizations')
      .insert({
        id: db.raw('uuid_generate_v4()'),
        name: organization,
        organization_type: 'government',
        data_source: 'demo',
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('id')
      .onConflict('name')
      .merge();

    // Create service
    const [savedService] = await db('services')
      .insert({
        id: db.raw('uuid_generate_v4()'),
        organization_id: org.id,
        ...service,
        status: 'active',
        youth_specific: true,
        data_source: 'demo',
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('id');

    // Create location
    if (location) {
      await db('locations')
        .insert({
          id: db.raw('uuid_generate_v4()'),
          service_id: savedService.id,
          ...location,
          state_province: 'QLD',
          country: 'AU',
          region: 'brisbane',
          coordinates: db.raw('ST_MakePoint(?, ?)', [153.0281, -27.4678]),
          created_at: new Date(),
          updated_at: new Date()
        });
    }

    // Create contact
    if (contact) {
      const phone = contact.phone ? [{
        number: contact.phone,
        type: 'voice'
      }] : [];

      await db('contacts')
        .insert({
          id: db.raw('uuid_generate_v4()'),
          service_id: savedService.id,
          phone: JSON.stringify(phone),
          email: contact.email,
          created_at: new Date(),
          updated_at: new Date()
        });
    }

    logger.debug({ service: service.name }, 'Saved sample service');
  } catch (error) {
    logger.error({ error: error.message, service: service.name }, 'Failed to save service');
  }
}

async function showSummary() {
  console.log('\n📊 DATABASE SUMMARY');
  console.log('═══════════════════════════════════════');

  // Get counts
  const [services] = await db('services').where('status', 'active').count();
  const [organizations] = await db('organizations').count();
  const [locations] = await db('locations').count();
  
  // Get services by category
  const categories = await db.raw(`
    SELECT unnest(categories) as category, COUNT(*) as count
    FROM services
    WHERE status = 'active'
    GROUP BY category
    ORDER BY count DESC
    LIMIT 5
  `);

  // Get services by region
  const regions = await db('locations')
    .select('region')
    .count('* as count')
    .groupBy('region')
    .orderBy('count', 'desc')
    .limit(5);

  console.log(`\nTotal Active Services: ${services.count}`);
  console.log(`Total Organizations: ${organizations.count}`);
  console.log(`Total Locations: ${locations.count}`);

  console.log('\nTop Categories:');
  categories.rows.forEach(cat => {
    console.log(`  - ${cat.category}: ${cat.count} services`);
  });

  console.log('\nServices by Region:');
  regions.forEach(region => {
    console.log(`  - ${region.region}: ${region.count} locations`);
  });

  // Sample services
  console.log('\n🔍 SAMPLE SERVICES');
  console.log('═══════════════════════════════════════');
  
  const samples = await db('services as s')
    .join('organizations as o', 's.organization_id', 'o.id')
    .where('s.status', 'active')
    .select('s.name', 's.categories', 'o.name as org_name', 's.minimum_age', 's.maximum_age')
    .limit(5);

  samples.forEach((service, i) => {
    console.log(`\n${i + 1}. ${service.name}`);
    console.log(`   Organization: ${service.org_name}`);
    console.log(`   Categories: ${service.categories.join(', ')}`);
    console.log(`   Age Range: ${service.minimum_age || 'Any'} - ${service.maximum_age || 'Any'}`);
  });

  console.log('\n✅ Demo completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Set up Elasticsearch for search functionality');
  console.log('2. Run the API server: npm run start');
  console.log('3. Access the API at http://localhost:3000');
  console.log('4. Set up scheduled scraping with Temporal\n');
}

// Run the demo
runDemoScraper();