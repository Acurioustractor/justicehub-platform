#!/usr/bin/env node

import dotenv from 'dotenv';
import pino from 'pino';
import db from '../src/config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { getFirecrawlClient } from '../src/services/firecrawl-client.js';
import { getDuplicateDetector } from '../src/services/duplicate-detector.js';

dotenv.config();

const logger = pino({ 
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true }
  }
});

console.log(`
╔════════════════════════════════════════════════════╗
║   Youth Justice Service Finder - Demo with Data    ║
╚════════════════════════════════════════════════════╝
`);

async function createSampleData() {
  console.log('📝 Creating sample youth justice services...\n');

  const organizations = [
    {
      id: uuidv4(),
      name: 'Department of Youth Justice',
      organization_type: 'government',
      url: 'https://www.youthjustice.qld.gov.au',
      data_source: 'demo'
    },
    {
      id: uuidv4(),
      name: 'Legal Aid Queensland',
      organization_type: 'government',
      url: 'https://www.legalaid.qld.gov.au',
      data_source: 'demo'
    },
    {
      id: uuidv4(),
      name: 'headspace National Youth Mental Health Foundation',
      organization_type: 'non_profit',
      url: 'https://headspace.org.au',
      data_source: 'demo'
    },
    {
      id: uuidv4(),
      name: 'Youth Advocacy Centre',
      organization_type: 'non_profit',
      url: 'https://yac.net.au',
      data_source: 'demo'
    }
  ];

  // Insert organizations
  for (const org of organizations) {
    await db('organizations').insert(org).onConflict('name').ignore();
  }

  const services = [
    {
      name: 'Brisbane Youth Justice Service Centre',
      description: 'The Brisbane Youth Justice Service Centre provides comprehensive support for young people aged 10-17 who are involved in the youth justice system. Services include bail support, supervised community orders, referrals to programs, court support, and family engagement.',
      organization: 'Department of Youth Justice',
      categories: ['supervision', 'court_support', 'diversion', 'family_support'],
      location: { city: 'Brisbane', region: 'brisbane', lat: -27.4678, lng: 153.0281 },
      contact: { phone: '(07) 3097 1600', email: 'brisbane.yj@justice.qld.gov.au' },
      minimum_age: 10,
      maximum_age: 17
    },
    {
      name: 'Youth Legal Service - Brisbane',
      description: 'Free legal advice and representation for young people under 18. Specializes in criminal law, child protection matters, and education law. Available for court representation and police interviews.',
      organization: 'Legal Aid Queensland',
      categories: ['legal_aid', 'advocacy', 'court_support'],
      location: { city: 'Brisbane', region: 'brisbane', lat: -27.4705, lng: 153.0260 },
      contact: { phone: '1300 651 188', email: 'youthlegal@legalaid.qld.gov.au' },
      minimum_age: 10,
      maximum_age: 17
    },
    {
      name: 'headspace Brisbane',
      description: 'Free mental health support for young people aged 12-25. Services include counselling, psychiatry, alcohol and drug support, and work/study assistance. No referral needed.',
      organization: 'headspace National Youth Mental Health Foundation',
      categories: ['mental_health', 'substance_abuse', 'education_training'],
      location: { city: 'Brisbane', region: 'brisbane', lat: -27.4598, lng: 153.0325 },
      contact: { phone: '(07) 3114 4200', website: 'https://headspace.org.au/headspace-centres/brisbane/' },
      minimum_age: 12,
      maximum_age: 25
    },
    {
      name: 'Youth Advocacy Centre',
      description: 'Free advocacy and support for young people in contact with youth justice, child protection, education, and housing systems. Provides individual advocacy and systemic reform.',
      organization: 'Youth Advocacy Centre',
      categories: ['advocacy', 'legal_aid', 'housing', 'education_training'],
      location: { city: 'Brisbane', region: 'brisbane', lat: -27.4561, lng: 153.0352 },
      contact: { phone: '(07) 3356 1002', email: 'admin@yac.net.au' },
      minimum_age: 10,
      maximum_age: 25
    },
    {
      name: 'Gold Coast Youth Justice Service Centre',
      description: 'Provides supervision and support for young offenders on community-based orders. Offers programs addressing offending behavior, education support, and family engagement.',
      organization: 'Department of Youth Justice',
      categories: ['supervision', 'court_support', 'family_support'],
      location: { city: 'Southport', region: 'gold_coast', lat: -27.9674, lng: 153.4147 },
      contact: { phone: '(07) 5665 5900' },
      minimum_age: 10,
      maximum_age: 17
    },
    {
      name: 'Townsville Youth Justice Service Centre',
      description: 'Youth justice services for North Queensland including bail support, restorative justice conferencing, and connection to cultural programs for Indigenous youth.',
      organization: 'Department of Youth Justice',
      categories: ['supervision', 'diversion', 'cultural_support'],
      location: { city: 'Townsville', region: 'townsville', lat: -19.2590, lng: 146.8169 },
      contact: { phone: '(07) 4760 7600' },
      minimum_age: 10,
      maximum_age: 17,
      indigenous_specific: true
    },
    {
      name: 'headspace Cairns',
      description: 'Youth mental health service providing early intervention for 12-25 year olds. Bulk billed services include counselling, psychiatry, and group programs.',
      organization: 'headspace National Youth Mental Health Foundation',
      categories: ['mental_health', 'substance_abuse'],
      location: { city: 'Cairns', region: 'cairns', lat: -16.9203, lng: 145.7710 },
      contact: { phone: '(07) 4041 6850' },
      minimum_age: 12,
      maximum_age: 25
    },
    {
      name: 'Legal Aid Queensland - Townsville',
      description: 'Legal representation for young people in criminal matters, with specialist youth lawyers available for serious charges and Children\'s Court matters.',
      organization: 'Legal Aid Queensland',
      categories: ['legal_aid', 'court_support'],
      location: { city: 'Townsville', region: 'townsville', lat: -19.2589, lng: 146.8169 },
      contact: { phone: '1300 651 188' },
      minimum_age: 10,
      maximum_age: 17
    },
    // Duplicate service to test deduplication
    {
      name: 'Brisbane Youth Justice Service Centre',
      description: 'Youth justice support services for Brisbane region.',
      organization: 'Department of Youth Justice',
      categories: ['supervision', 'court_support'],
      location: { city: 'Brisbane', region: 'brisbane', lat: -27.4678, lng: 153.0281 },
      contact: { phone: '07 3097 1600' }, // Different format
      minimum_age: 10,
      maximum_age: 17
    }
  ];

  // Save services
  let savedCount = 0;
  for (const serviceData of services) {
    try {
      const org = organizations.find(o => o.name === serviceData.organization);
      if (!org) continue;

      const serviceId = uuidv4();
      
      // Insert service
      await db('services').insert({
        id: serviceId,
        organization_id: org.id,
        name: serviceData.name,
        description: serviceData.description,
        status: 'active',
        minimum_age: serviceData.minimum_age,
        maximum_age: serviceData.maximum_age,
        youth_specific: true,
        indigenous_specific: serviceData.indigenous_specific || false,
        categories: serviceData.categories,
        keywords: serviceData.categories,
        data_source: 'demo',
        created_at: new Date(),
        updated_at: new Date()
      });

      // Insert location
      if (serviceData.location) {
        await db('locations').insert({
          id: uuidv4(),
          service_id: serviceId,
          address_1: '123 Example Street',
          city: serviceData.location.city,
          state_province: 'QLD',
          postal_code: '4000',
          latitude: serviceData.location.lat,
          longitude: serviceData.location.lng,
          region: serviceData.location.region,
          created_at: new Date(),
          updated_at: new Date()
        });
      }

      // Insert contact
      if (serviceData.contact) {
        const phones = [];
        if (serviceData.contact.phone) {
          phones.push({ number: serviceData.contact.phone, type: 'voice' });
        }
        
        await db('contacts').insert({
          id: uuidv4(),
          service_id: serviceId,
          phone: JSON.stringify(phones),
          email: serviceData.contact.email || null,
          created_at: new Date(),
          updated_at: new Date()
        });
      }

      savedCount++;
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to save service');
    }
  }

  console.log(`✅ Created ${savedCount} sample services\n`);
}

async function demonstrateFeatures() {
  // 1. Show Firecrawl search capability
  console.log('🔍 Demonstrating Firecrawl Web Search...');
  const firecrawl = getFirecrawlClient();
  
  try {
    const searchResults = await firecrawl.searchWeb('Queensland youth justice programs', { limit: 3 });
    console.log(`Found ${searchResults.results.length} relevant websites:`);
    searchResults.results.forEach((result, i) => {
      console.log(`  ${i + 1}. ${result.title}`);
      console.log(`     ${result.url}`);
    });
  } catch (error) {
    console.log('  (Firecrawl search skipped)');
  }

  console.log('\n');

  // 2. Demonstrate duplicate detection
  console.log('🔍 Running Duplicate Detection...');
  const detector = getDuplicateDetector();
  const duplicates = await detector.findAllDuplicates({ limit: 100 });
  
  if (duplicates.length > 0) {
    console.log(`Found ${duplicates.length} duplicate group(s):`);
    duplicates.forEach((group, i) => {
      console.log(`  Group ${i + 1}: ${group.services.length} similar services (${Math.round(group.score * 100)}% match)`);
    });
  } else {
    console.log('No duplicates found');
  }

  console.log('\n');

  // 3. Show data quality analysis
  console.log('📊 Analyzing Data Quality...');
  const qualityResults = await db.raw(`
    SELECT 
      AVG(LENGTH(description)) as avg_description_length,
      COUNT(CASE WHEN categories IS NOT NULL AND array_length(categories, 1) > 0 THEN 1 END) as services_with_categories,
      COUNT(*) as total_services
    FROM services
    WHERE status = 'active'
  `);

  const quality = qualityResults.rows[0];
  console.log(`  Average description length: ${Math.round(quality.avg_description_length)} characters`);
  console.log(`  Services with categories: ${quality.services_with_categories}/${quality.total_services}`);
  console.log(`  Data completeness: ${Math.round((quality.services_with_categories / quality.total_services) * 100)}%`);

  console.log('\n');
}

async function showDatabaseSummary() {
  console.log('📊 DATABASE SUMMARY');
  console.log('═══════════════════════════════════════');

  // Get counts
  const [services] = await db('services').where('status', 'active').count();
  const [organizations] = await db('organizations').count();
  const [locations] = await db('locations').count();

  console.log(`\nTotal Active Services: ${services.count}`);
  console.log(`Total Organizations: ${organizations.count}`);
  console.log(`Total Locations: ${locations.count}`);

  // Services by category
  const categories = await db.raw(`
    SELECT unnest(categories) as category, COUNT(*) as count
    FROM services
    WHERE status = 'active'
    GROUP BY category
    ORDER BY count DESC
  `);

  console.log('\nTop Service Categories:');
  categories.rows.forEach(cat => {
    console.log(`  - ${cat.category}: ${cat.count} services`);
  });

  // Services by region
  const regions = await db('locations')
    .select('region')
    .count('* as count')
    .groupBy('region')
    .orderBy('count', 'desc');

  console.log('\nServices by Region:');
  regions.forEach(region => {
    console.log(`  - ${region.region}: ${region.count} locations`);
  });

  // Sample services
  console.log('\n🔍 SAMPLE SERVICES');
  console.log('═══════════════════════════════════════');
  
  const samples = await db('services as s')
    .join('organizations as o', 's.organization_id', 'o.id')
    .leftJoin('locations as l', 'l.service_id', 's.id')
    .where('s.status', 'active')
    .select(
      's.name',
      's.description',
      's.categories',
      's.minimum_age',
      's.maximum_age',
      'o.name as org_name',
      'l.city',
      'l.region'
    )
    .limit(5);

  samples.forEach((service, i) => {
    console.log(`\n${i + 1}. ${service.name}`);
    console.log(`   Organization: ${service.org_name}`);
    console.log(`   Location: ${service.city}, ${service.region}`);
    console.log(`   Categories: ${service.categories.join(', ')}`);
    console.log(`   Age Range: ${service.minimum_age || 'Any'} - ${service.maximum_age || 'Any'}`);
    console.log(`   Description: ${service.description.substring(0, 150)}...`);
  });

  console.log('\n✅ Demo completed successfully!');
  console.log('\nThe system demonstrates:');
  console.log('- Service data modeling with Open Referral HSDS');
  console.log('- Geographic organization (regions)');
  console.log('- Service categorization');
  console.log('- Age-based eligibility');
  console.log('- Duplicate detection capabilities');
  console.log('- Data quality analysis');
  console.log('- Integration with Firecrawl for web scraping');
  
  console.log('\nTo see the full system in action:');
  console.log('1. Set up Elasticsearch for search');
  console.log('2. Run the API server: npm start');
  console.log('3. Use the API to search and filter services\n');
}

async function runDemo() {
  try {
    await createSampleData();
    await demonstrateFeatures();
    await showDatabaseSummary();
  } catch (error) {
    logger.error({ error: error.message }, 'Demo failed');
  } finally {
    await db.destroy();
  }
}

runDemo();