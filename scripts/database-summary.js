#!/usr/bin/env node

import dotenv from 'dotenv';
import db from '../src/config/database.js';

dotenv.config();

console.log(`
╔════════════════════════════════════════════════════╗
║         Youth Justice Service Finder               ║
║              DATABASE SUMMARY                      ║
╚════════════════════════════════════════════════════╝
`);

async function showSummary() {
  try {
    // Get total counts
    const [services] = await db('services').where('status', 'active').count();
    const [organizations] = await db('organizations').count();
    const [locations] = await db('locations').count();

    console.log('📊 OVERALL STATISTICS');
    console.log('═══════════════════════════════════════');
    console.log(`Total Active Services: ${services.count}`);
    console.log(`Total Organizations: ${organizations.count}`);
    console.log(`Total Locations: ${locations.count}`);

    // Services by organization
    console.log('\n🏢 SERVICES BY ORGANIZATION');
    console.log('═══════════════════════════════════════');
    const byOrg = await db('services as s')
      .join('organizations as o', 's.organization_id', 'o.id')
      .where('s.status', 'active')
      .select('o.name', 'o.organization_type')
      .count('s.id as count')
      .groupBy('o.name', 'o.organization_type')
      .orderBy('count', 'desc');

    byOrg.forEach(org => {
      console.log(`${org.name} (${org.organization_type}): ${org.count} services`);
    });

    // Services by data source
    console.log('\n📦 SERVICES BY DATA SOURCE');
    console.log('═══════════════════════════════════════');
    const bySource = await db('services')
      .where('status', 'active')
      .select('data_source')
      .count('* as count')
      .groupBy('data_source')
      .orderBy('count', 'desc');

    const sourceNames = {
      'qld_youth_justice': 'Queensland Youth Justice',
      'headspace': 'headspace Mental Health',
      'legal_aid_qld': 'Legal Aid Queensland',
      'pcyc_qld': 'PCYC Queensland',
      'yac_qld': 'Youth Advocacy Centre',
      'aboriginal_torres_strait': 'Aboriginal & Torres Strait Islander Services',
      'crisis_support': 'Crisis & Emergency Support',
      'demo': 'Demo Services'
    };

    bySource.forEach(source => {
      const name = sourceNames[source.data_source] || source.data_source;
      console.log(`${name}: ${source.count} services`);
    });

    // Services by category
    console.log('\n🏷️  TOP SERVICE CATEGORIES');
    console.log('═══════════════════════════════════════');
    const categories = await db.raw(`
      SELECT unnest(categories) as category, COUNT(*) as count
      FROM services
      WHERE status = 'active'
      GROUP BY category
      ORDER BY count DESC
      LIMIT 15
    `);

    const categoryNames = {
      'court_support': 'Court Support',
      'legal_aid': 'Legal Aid',
      'mental_health': 'Mental Health',
      'education_training': 'Education & Training',
      'diversion': 'Diversion Programs',
      'cultural_support': 'Cultural Support',
      'family_support': 'Family Support',
      'advocacy': 'Advocacy',
      'substance_abuse': 'Substance Abuse',
      'recreation': 'Recreation',
      'crisis_support': 'Crisis Support',
      'housing': 'Housing',
      'case_management': 'Case Management',
      'supervision': 'Supervision',
      'mentoring': 'Mentoring'
    };

    categories.rows.forEach((cat, i) => {
      const name = categoryNames[cat.category] || cat.category;
      console.log(`${(i + 1).toString().padStart(2)}. ${name}: ${cat.count} services`);
    });

    // Geographic coverage
    console.log('\n🗺️  GEOGRAPHIC COVERAGE');
    console.log('═══════════════════════════════════════');
    const regions = await db('locations')
      .select('region')
      .count('* as count')
      .groupBy('region')
      .orderBy('count', 'desc');

    const regionNames = {
      'brisbane': 'Brisbane Metro',
      'gold_coast': 'Gold Coast',
      'sunshine_coast': 'Sunshine Coast',
      'townsville': 'Townsville',
      'cairns': 'Cairns',
      'toowoomba': 'Toowoomba',
      'mackay': 'Mackay',
      'rockhampton': 'Rockhampton',
      'bundaberg': 'Bundaberg',
      'hervey_bay': 'Hervey Bay',
      'gladstone': 'Gladstone',
      'mount_isa': 'Mount Isa',
      'statewide': 'Statewide Services'
    };

    regions.forEach(region => {
      const name = regionNames[region.region] || region.region;
      console.log(`${name}: ${region.count} locations`);
    });

    // Age group coverage
    console.log('\n👥 AGE GROUP COVERAGE');
    console.log('═══════════════════════════════════════');
    const ageGroups = await db.raw(`
      SELECT 
        COUNT(CASE WHEN minimum_age <= 12 AND (maximum_age >= 12 OR maximum_age IS NULL) THEN 1 END) as "12_and_under",
        COUNT(CASE WHEN minimum_age <= 15 AND (maximum_age >= 15 OR maximum_age IS NULL) THEN 1 END) as "13_to_15",
        COUNT(CASE WHEN minimum_age <= 17 AND (maximum_age >= 17 OR maximum_age IS NULL) THEN 1 END) as "16_to_17",
        COUNT(CASE WHEN minimum_age <= 21 AND (maximum_age >= 21 OR maximum_age IS NULL) THEN 1 END) as "18_to_21",
        COUNT(CASE WHEN minimum_age <= 25 AND (maximum_age >= 25 OR maximum_age IS NULL) THEN 1 END) as "22_to_25"
      FROM services
      WHERE status = 'active'
    `);

    const ages = ageGroups.rows[0];
    console.log(`Services for ages 12 and under: ${ages['12_and_under']}`);
    console.log(`Services for ages 13-15: ${ages['13_to_15']}`);
    console.log(`Services for ages 16-17: ${ages['16_to_17']}`);
    console.log(`Services for ages 18-21: ${ages['18_to_21']}`);
    console.log(`Services for ages 22-25: ${ages['22_to_25']}`);

    // Special populations
    console.log('\n🌟 SPECIAL POPULATIONS');
    console.log('═══════════════════════════════════════');
    const [youthSpecific] = await db('services')
      .where('status', 'active')
      .where('youth_specific', true)
      .count();
    const [indigenousSpecific] = await db('services')
      .where('status', 'active')
      .where('indigenous_specific', true)
      .count();

    console.log(`Youth-specific services: ${youthSpecific.count}`);
    console.log(`Indigenous-specific services: ${indigenousSpecific.count}`);

    // Recent additions
    console.log('\n🆕 RECENTLY ADDED SERVICES (Last 10)');
    console.log('═══════════════════════════════════════');
    const recent = await db('services as s')
      .join('organizations as o', 's.organization_id', 'o.id')
      .leftJoin('locations as l', 'l.service_id', 's.id')
      .where('s.status', 'active')
      .select(
        's.name',
        's.created_at',
        'o.name as org_name',
        'l.city'
      )
      .orderBy('s.created_at', 'desc')
      .limit(10);

    recent.forEach(service => {
      const date = new Date(service.created_at).toLocaleDateString();
      console.log(`- ${service.name} (${service.org_name}) - ${service.city || 'Online'}`);
    });

    console.log('\n✅ Database successfully populated with comprehensive youth justice services!');
    console.log('\n📌 NEXT STEPS:');
    console.log('1. Build the high-performance API with Fastify');
    console.log('2. Set up Elasticsearch for advanced search');
    console.log('3. Create the frontend application');
    console.log('4. Configure Temporal for automated updates');
    console.log('5. Add more Queensland-specific service directories\n');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.destroy();
  }
}

showSummary();