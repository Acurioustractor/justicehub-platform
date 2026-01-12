#!/usr/bin/env node
/**
 * Test Firecrawl Integration
 * Quick test to verify Firecrawl API is working
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import FirecrawlApp from '@mendable/firecrawl-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Read .env.local
const env = readFileSync(join(root, '.env.local'), 'utf8')
  .split('\n')
  .filter((line) => line && !line.startsWith('#') && line.includes('='))
  .reduce((acc, line) => {
    const [key, ...values] = line.split('=');
    acc[key.trim()] = values.join('=').trim();
    return acc;
  }, {});

console.log('\n🔥 Firecrawl Test\n');

// Initialize Firecrawl
const firecrawl = new FirecrawlApp({
  apiKey: env.FIRECRAWL_API_KEY,
});

console.log('✅ Firecrawl initialized');
console.log(`   API Key: ${env.FIRECRAWL_API_KEY.substring(0, 10)}...`);

// Test scraping a simple page
const testUrl = 'https://www.aihw.gov.au/reports/youth-justice';

console.log(`\n🔍 Scraping: ${testUrl}\n`);

try {
  const result = await firecrawl.scrapeUrl(testUrl, {
    formats: ['markdown'],
    onlyMainContent: true,
  });

  if (result.success) {
    console.log('✅ Scrape successful!');
    console.log(`   Content length: ${result.markdown?.length || 0} characters`);
    console.log(`   Title: ${result.metadata?.title || 'N/A'}`);
    console.log(`   Description: ${result.metadata?.description || 'N/A'}`);

    if (result.markdown) {
      console.log('\n📄 First 500 characters of content:');
      console.log('─'.repeat(80));
      console.log(result.markdown.substring(0, 500));
      console.log('─'.repeat(80));
    }
  } else {
    console.log('❌ Scrape failed');
    console.log(`   Error: ${result.error || 'Unknown error'}`);
  }
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}

console.log('\n✅ Firecrawl is working!\n');
