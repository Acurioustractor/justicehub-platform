#!/usr/bin/env node

import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const { Client } = pg;

async function createTestData() {
  console.log('🧪 Creating test data for Youth Justice Service Finder...');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ Connected to Railway PostgreSQL');

    // Create test organization with database-generated UUID
    const orgResult = await client.query(`
      INSERT INTO organizations (name, description, organization_type, data_source)
      VALUES ('Brisbane Youth Support Services', 'Comprehensive youth support services across Brisbane', 'government', 'test_data')
      RETURNING id
    `);
    
    const orgId = orgResult.rows[0].id;
    console.log('✅ Created test organization:', orgId);

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

    for (const service of services) {
      // Create service
      const serviceResult = await client.query(`
        INSERT INTO services (organization_id, name, description, categories, keywords, minimum_age, maximum_age, youth_specific, indigenous_specific, data_source, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, 'test_data', 'active')
        RETURNING id
      `, [
        orgId, 
        service.name, 
        service.description, 
        service.categories, 
        service.keywords, 
        service.min_age, 
        service.max_age,
        service.categories.includes('cultural_support')
      ]);

      const serviceId = serviceResult.rows[0].id;
      console.log('✅ Created service:', service.name);

      // Create location for service
      const locations = [
        { city: 'Brisbane', region: 'brisbane', lat: -27.4698, lng: 153.0251 },
        { city: 'Gold Coast', region: 'gold_coast', lat: -28.0167, lng: 153.4000 },
        { city: 'Townsville', region: 'townsville', lat: -19.2590, lng: 146.8169 }
      ];

      const location = locations[Math.floor(Math.random() * locations.length)];

      await client.query(`
        INSERT INTO locations (service_id, name, address_1, city, postal_code, region, latitude, longitude)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        serviceId,
        `${service.name} - ${location.city} Office`,
        `${Math.floor(Math.random() * 999) + 1} ${location.city} Street`,
        location.city,
        location.city === 'Brisbane' ? '4000' : location.city === 'Gold Coast' ? '4217' : '4810',
        location.region,
        location.lat,
        location.lng
      ]);

      // Create contact
      await client.query(`
        INSERT INTO contacts (service_id, name, phone, email)
        VALUES ($1, $2, $3, $4)
      `, [
        serviceId,
        `${service.name} Coordinator`,
        JSON.stringify([`(07) ${Math.floor(Math.random() * 9000) + 1000} ${Math.floor(Math.random() * 9000) + 1000}`]),
        `info@${service.name.toLowerCase().replace(/\s+/g, '')}.qld.gov.au`
      ]);
    }

    // Record the creation as a scraping job
    await client.query(`
      INSERT INTO scraping_jobs (source_name, source_url, job_type, status, pages_scraped, services_found, errors_count, started_at, completed_at)
      VALUES ('test_data_creator', '/scripts/create-test-data.js', 'test', 'completed', 1, $1, 0, NOW(), NOW())
    `, [services.length]);

    await client.end();

    console.log(`\n🎉 Test data creation completed successfully!`);
    console.log(`Created: 1 organization, ${services.length} services, ${services.length} locations, ${services.length} contacts`);
    console.log('\n🔍 Check your frontend now - it should show real services!');
    console.log(`Frontend: https://frontend-x6ces3z0g-benjamin-knights-projects.vercel.app`);

  } catch (error) {
    console.error('❌ Error creating test data:', error.message);
    process.exit(1);
  }
}

// Run script
createTestData();