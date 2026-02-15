/**
 * Test Firecrawl Integration
 *
 * Quick test script to validate Firecrawl setup and API key
 */

import { firecrawl, scrapeServicePage, testConnection } from '../lib/scraping/firecrawl';

async function testFirecrawl() {
  console.log('🔥 Testing Firecrawl Integration\n');
  console.log('================================\n');

  // Test 1: Connection
  console.log('Test 1: Testing API connection...');
  const connectionOk = await testConnection();

  if (!connectionOk) {
    console.error('❌ Failed to connect to Firecrawl API');
    console.error('   Check your FIRECRAWL_API_KEY in .env');
    console.error('   Get an API key at https://firecrawl.dev\n');
    process.exit(1);
  }

  console.log('✅ API connection successful!\n');

  // Test 2: Scrape a simple example
  console.log('Test 2: Scraping example service page...');
  console.log('URL: https://headspace.org.au/headspace-centres/');

  try {
    const result = await scrapeServicePage('https://headspace.org.au/headspace-centres/');

    if (result) {
      console.log('✅ Successfully scraped service page!\n');
      console.log('Extracted data:');
      console.log('- Name:', result.name || '(not found)');
      console.log('- Description:', result.description?.substring(0, 100) + '...' || '(not found)');
      console.log('- Phone:', result.phone || '(not found)');
      console.log('- Email:', result.email || '(not found)');
      console.log('- Website:', result.website || '(not found)');
      console.log('- Categories:', result.categories?.join(', ') || '(not found)');
    } else {
      console.log('⚠️  Scraping returned no data (this might be normal for some pages)\n');
    }
  } catch (error: any) {
    console.error('❌ Failed to scrape test page:', error.message, '\n');
  }

  // Test 3: Test with Legal Aid NSW
  console.log('\nTest 3: Scraping NSW Legal Aid...');
  console.log('URL: https://www.legalaid.nsw.gov.au/contact-us');

  try {
    const result = await scrapeServicePage('https://www.legalaid.nsw.gov.au/contact-us');

    if (result) {
      console.log('✅ Successfully scraped Legal Aid NSW!\n');
      console.log('Extracted data:');
      console.log('- Name:', result.name || '(not found)');
      console.log('- Phone:', result.phone || '(not found)');
      console.log('- Email:', result.email || '(not found)');
      console.log('- Address:', result.address || '(not found)');
    }
  } catch (error: any) {
    console.error('❌ Failed:', error.message);
  }

  console.log('\n================================');
  console.log('🎉 Firecrawl test complete!');
  console.log('================================\n');
  console.log('Next steps:');
  console.log('1. Review docs/API_INTEGRATION_PLAN.md');
  console.log('2. Run: npx tsx src/scripts/discovery/scrape-nsw-services.ts');
  console.log('3. Check results in database\n');
}

testFirecrawl()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
