#!/usr/bin/env node

import dotenv from 'dotenv';
import db from '../src/config/database.js';
import { createCrisisSupportScraper } from '../src/scrapers/crisis-support-scraper.js';

dotenv.config();

console.log('Adding Crisis and Emergency Support Services...\n');

async function addCrisisSupport() {
  try {
    const scraper = await createCrisisSupportScraper(db);
    const result = await scraper.scrape();
    
    console.log(`\n✅ Completed!`);
    console.log(`   Services found: ${result.servicesFound}`);
    console.log(`   Services processed: ${result.servicesProcessed}`);
    console.log(`   Errors: ${result.errors}`);
    
    // Show total services in database
    const [total] = await db('services').where('status', 'active').count();
    console.log(`\n📊 Total services in database: ${total.count}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.destroy();
  }
}

addCrisisSupport();