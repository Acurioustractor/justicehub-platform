#!/usr/bin/env node

import dotenv from 'dotenv';
import db from '../src/config/database.js';
import { createQLDYouthJusticeScraper } from '../src/scrapers/qld-youth-justice-scraper.js';

dotenv.config();

console.log('Adding Queensland Youth Justice Service Centres...\n');

async function addYouthJusticeCentres() {
  try {
    const scraper = await createQLDYouthJusticeScraper(db);
    
    // Since the website scrape failed, we'll directly process the known centres
    const result = await scraper.scrape();
    
    console.log(`\n✅ Completed!`);
    console.log(`   Services found: ${result.servicesFound}`);
    console.log(`   Services processed: ${result.servicesProcessed}`);
    console.log(`   Errors: ${result.errors}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.destroy();
  }
}

addYouthJusticeCentres();