#!/usr/bin/env node

import dotenv from 'dotenv';
import db from '../src/config/database.js';
import { createMyCommunityDirectoryScraper } from '../src/scrapers/my-community-directory-scraper.js';
import { createACNCScraper } from '../src/scrapers/acnc-scraper.js';
import { createQLDCKANScraper } from '../src/scrapers/qld-ckan-scraper.js';

dotenv.config();

console.log(`
╔════════════════════════════════════════════════════╗
║       Testing Additional Data Sources              ║
║    MyCommunityDirectory, ACNC, QLD Government      ║
╚════════════════════════════════════════════════════╝
`);

async function testDataSources() {
  const results = {
    totalServices: 0,
    totalErrors: 0,
    scrapers: []
  };

  try {
    // Test MyCommunityDirectory scraper
    console.log('\n🌐 Testing MyCommunityDirectory scraper...');
    try {
      const mcdScraper = await createMyCommunityDirectoryScraper(db);
      const mcdResults = await mcdScraper.scrape();
      
      results.scrapers.push({
        name: 'MyCommunityDirectory',
        ...mcdResults
      });
      results.totalServices += mcdResults.servicesProcessed;
      results.totalErrors += mcdResults.errors;
      
      console.log(`   ✅ MyCommunityDirectory: ${mcdResults.servicesFound} found, ${mcdResults.servicesProcessed} processed`);
    } catch (error) {
      console.log(`   ⚠️  MyCommunityDirectory: ${error.message}`);
      results.totalErrors++;
    }

    // Test ACNC scraper
    console.log('\n🏛️  Testing ACNC (Australian Charities) scraper...');
    try {
      const acncScraper = await createACNCScraper(db);
      const acncResults = await acncScraper.scrape();
      
      results.scrapers.push({
        name: 'ACNC Charities',
        ...acncResults
      });
      results.totalServices += acncResults.servicesProcessed;
      results.totalErrors += acncResults.errors;
      
      console.log(`   ✅ ACNC: ${acncResults.servicesFound} found, ${acncResults.servicesProcessed} processed`);
    } catch (error) {
      console.log(`   ⚠️  ACNC: ${error.message}`);
      results.totalErrors++;
    }

    // Test Queensland CKAN scraper
    console.log('\n🏢 Testing Queensland Government CKAN portal...');
    try {
      const ckanScraper = await createQLDCKANScraper(db);
      const ckanResults = await ckanScraper.scrape();
      
      results.scrapers.push({
        name: 'Queensland CKAN',
        ...ckanResults
      });
      results.totalServices += ckanResults.servicesProcessed;
      results.totalErrors += ckanResults.errors;
      
      console.log(`   ✅ QLD CKAN: ${ckanResults.servicesFound} found, ${ckanResults.servicesProcessed} processed`);
    } catch (error) {
      console.log(`   ⚠️  QLD CKAN: ${error.message}`);
      results.totalErrors++;
    }

    // Show updated database summary
    await showUpdatedSummary();
    
    return results;
  } catch (error) {
    console.error('Test failed:', error.message);
    throw error;
  }
}

async function showUpdatedSummary() {
  console.log('\n📊 UPDATED DATABASE SUMMARY');
  console.log('═══════════════════════════════════════');

  // Get counts
  const [services] = await db('services').where('status', 'active').count();
  const [organizations] = await db('organizations').count();

  console.log(`Total Active Services: ${services.count}`);
  console.log(`Total Organizations: ${organizations.count}`);

  // Services by data source
  const bySource = await db('services')
    .where('status', 'active')
    .select('data_source')
    .count('* as count')
    .groupBy('data_source')
    .orderBy('count', 'desc');

  console.log('\nServices by Data Source:');
  bySource.forEach(source => {
    console.log(`  - ${source.data_source}: ${source.count} services`);
  });

  // Check for new data sources
  const newSources = ['my_community_directory', 'acnc', 'qld_ckan'];
  console.log('\n🆕 New Data Sources Status:');
  newSources.forEach(source => {
    const found = bySource.find(s => s.data_source === source);
    if (found) {
      console.log(`  ✅ ${source}: ${found.count} services added`);
    } else {
      console.log(`  ⏳ ${source}: Ready for implementation`);
    }
  });

  // Attribution check
  console.log('\n📜 ATTRIBUTION COMPLIANCE');
  console.log('═══════════════════════════════════════');
  
  const attributed = await db('services')
    .where('status', 'active')
    .whereNotNull('attribution')
    .count();
    
  console.log(`Services with proper attribution: ${attributed[0].count}`);
  
  // Show sample attributions
  const samples = await db('services')
    .where('status', 'active')
    .whereNotNull('attribution')
    .select('name', 'attribution', 'data_source')
    .limit(3);

  if (samples.length > 0) {
    console.log('\nSample attributions:');
    samples.forEach(service => {
      const attr = JSON.parse(service.attribution || '{}');
      console.log(`  - ${service.name}: ${attr.attribution || 'N/A'}`);
    });
  }
}

console.log('\n📋 IMPLEMENTATION NOTES');
console.log('═══════════════════════════════════════');
console.log(`
For production deployment:

1. MyCommunityDirectory:
   - Requires API subscription and key
   - Implement proper rate limiting (5 req/sec)
   - Budget for API call costs

2. ACNC (data.gov.au):
   - Open data under CC-BY 3.0 AU license
   - Must maintain attribution and source links
   - Free to use with proper attribution

3. Queensland Government CKAN:
   - Open data under CC-BY 4.0 license
   - Must maintain copyright notice and link back
   - Free to use with proper attribution

4. Rate Limiting:
   - All scrapers implement rate limiting
   - Configurable limits per data source
   - Exponential backoff for failures

5. Data Quality:
   - Implement data validation pipelines
   - Regular updates via scheduled jobs
   - Duplicate detection across sources
`);

// Run the tests
testDataSources()
  .then(results => {
    console.log('\n📈 Final Test Results:');
    console.log(`Total new services processed: ${results.totalServices}`);
    console.log(`Total errors: ${results.totalErrors}`);
    
    console.log('\n✅ Data source integration testing completed!');
    console.log('\nNext steps:');
    console.log('1. Obtain API keys for MyCommunityDirectory');
    console.log('2. Implement custom data mapping for specific datasets');
    console.log('3. Set up scheduled updates with Temporal');
    console.log('4. Create monitoring for data source health');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  })
  .finally(() => {
    db.destroy();
  });