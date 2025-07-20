#!/usr/bin/env node

import dotenv from 'dotenv';
import { getFirecrawlClient } from '../src/services/firecrawl-client.js';

dotenv.config();

console.log(`
╔════════════════════════════════════════════════════╗
║   Youth Justice Service Finder - Firecrawl Demo    ║
╚════════════════════════════════════════════════════╝
`);

console.log('Testing Firecrawl API with your key...\n');

async function runFirecrawlDemo() {
  try {
    const firecrawl = getFirecrawlClient();
    
    // Test 1: Search for youth services
    console.log('🔍 Searching for Queensland youth justice services...');
    const searchResults = await firecrawl.searchWeb('Queensland youth justice services programs', {
      limit: 5
    });
    
    console.log(`\nFound ${searchResults.results.length} results:`);
    searchResults.results.forEach((result, i) => {
      console.log(`\n${i + 1}. ${result.title}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   ${result.description?.substring(0, 100)}...`);
    });

    // Test 2: Scrape a specific page
    console.log('\n\n📄 Testing page scraping...');
    console.log('Scraping Queensland Government youth justice page...\n');
    
    const pageUrl = 'https://www.cyjma.qld.gov.au/youth-justice/young-people-youth-justice';
    
    const scrapedData = await firecrawl.scrapeUrl(pageUrl);

    if (scrapedData.success) {
      console.log('✅ Successfully scraped page!');
      console.log('\nExtracted content preview:');
      console.log(scrapedData.data?.content?.substring(0, 500) + '...\n');
      
      if (scrapedData.data?.extract?.services) {
        console.log('Services found:', scrapedData.data.extract.services);
      }
    }

    // Test 3: Map a website
    console.log('\n🗺️  Testing website mapping...');
    const siteMapUrl = 'https://www.qld.gov.au/youth';
    console.log(`Mapping ${siteMapUrl}...\n`);
    
    const siteMap = await firecrawl.mapWebsite(siteMapUrl, {
      limit: 20
    });

    if (siteMap.success) {
      console.log(`Found ${siteMap.links.length} pages`);
      console.log(`Service-related pages: ${siteMap.servicePages.length}`);
      
      if (siteMap.servicePages.length > 0) {
        console.log('\nSample service pages:');
        siteMap.servicePages.slice(0, 5).forEach(page => {
          console.log(`  - ${page}`);
        });
      }
    }

    // Show API stats
    const stats = firecrawl.getStats();
    console.log('\n\n📊 Firecrawl Usage Stats:');
    console.log(`  Total requests: ${stats.totalRequests}`);
    console.log(`  Successful: ${stats.successfulRequests}`);
    console.log(`  Failed: ${stats.failedRequests}`);
    console.log(`  Cached responses: ${stats.cachedResponses}`);
    console.log(`  Data processed: ${(stats.totalBytesProcessed / 1024).toFixed(2)} KB`);

    console.log('\n✅ Firecrawl is working correctly with your API key!');
    console.log('\nYou can now:');
    console.log('1. Wait for Docker services to finish downloading');
    console.log('2. Run the full scraper: npm run scrape:demo');
    console.log('3. Or use PostgreSQL directly without Docker\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nPlease check:');
    console.error('1. Your Firecrawl API key is correct');
    console.error('2. You have internet connection');
    console.error('3. Your API key has available credits\n');
  }
}

runFirecrawlDemo();