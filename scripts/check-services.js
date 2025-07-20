#!/usr/bin/env node

import dotenv from 'dotenv';
import db from '../src/config/database.js';

dotenv.config();

async function checkServices() {
  try {
    // Get counts by data source
    const bySource = await db('services')
      .where('status', 'active')
      .select('data_source')
      .count('* as count')
      .groupBy('data_source')
      .orderBy('count', 'desc');

    console.log('\n📊 Services by Data Source:');
    console.log('═══════════════════════════════════════');
    
    let total = 0;
    for (const source of bySource) {
      console.log(`${source.data_source}: ${source.count} services`);
      total += parseInt(source.count);
    }
    
    console.log(`\nTotal active services: ${total}`);

    // Check for new scrapers
    const newScrapers = ['pcyc_qld', 'yac_qld', 'aboriginal_torres_strait'];
    for (const scraper of newScrapers) {
      const found = bySource.find(s => s.data_source === scraper);
      if (found) {
        console.log(`✅ ${scraper}: ${found.count} services added`);
      } else {
        console.log(`❌ ${scraper}: No services found`);
      }
    }

    // Get sample services from new scrapers
    console.log('\n🔍 Sample Services from New Scrapers:');
    console.log('═══════════════════════════════════════');
    
    const samples = await db('services as s')
      .join('organizations as o', 's.organization_id', 'o.id')
      .leftJoin('locations as l', 'l.service_id', 's.id')
      .where('s.status', 'active')
      .whereIn('s.data_source', newScrapers)
      .select(
        's.name',
        's.data_source',
        'o.name as org_name',
        'l.city',
        'l.region'
      )
      .orderBy('s.data_source')
      .limit(10);

    samples.forEach(service => {
      console.log(`\n- ${service.name}`);
      console.log(`  Organization: ${service.org_name}`);
      console.log(`  Location: ${service.city}, ${service.region}`);
      console.log(`  Source: ${service.data_source}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.destroy();
  }
}

checkServices();