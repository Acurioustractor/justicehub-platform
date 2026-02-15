/**
 * Test Ask Izzy Scraping with Firecrawl
 *
 * Small test with 5 URLs to validate the approach before full scrape
 */

import { firecrawl } from '../../lib/scraping/firecrawl';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Test with 5 diverse URLs
const TEST_URLS = [
  'https://askizzy.org.au/housing/Brisbane-QLD',
  'https://askizzy.org.au/advice-and-advocacy/Sydney-NSW',
  'https://askizzy.org.au/support-and-counselling/Melbourne-VIC',
  'https://askizzy.org.au/housing/Queensland',
  'https://askizzy.org.au/health-and-wellbeing/Adelaide-SA'
];

interface ServiceData {
  name: string;
  organization?: string;
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  hours?: string;
  eligibility?: string;
  categories?: string[];
}

async function testAskIzzyScraping() {
  console.log('🔥 Testing Ask Izzy Scraping with Firecrawl\n');
  console.log('='.repeat(60));
  console.log(`Testing with ${TEST_URLS.length} URLs\n`);

  let totalServicesFound = 0;
  let totalImported = 0;
  let totalDuplicates = 0;
  let totalErrors = 0;

  for (let i = 0; i < TEST_URLS.length; i++) {
    const url = TEST_URLS[i];
    console.log(`\n[${i + 1}/${TEST_URLS.length}] Testing: ${url}`);
    console.log('-'.repeat(60));

    try {
      // Scrape with Firecrawl
      console.log('⏳ Scraping page (waiting for dynamic content)...');

      const result = await firecrawl.scrapeUrl(url, {
        formats: ['extract'],
        extract: {
          prompt: 'Extract ONLY youth justice and youth support services from this page. Focus on services for young people aged 10-25, especially those related to legal aid, court support, housing, mental health, family support, and education.',
          schema: {
            type: 'object',
            properties: {
              services: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', description: 'Service name or title' },
                    organization: { type: 'string', description: 'Organization providing the service' },
                    description: { type: 'string', description: 'Brief description of what the service does' },
                    address: { type: 'string', description: 'Full street address' },
                    phone: { type: 'string', description: 'Phone number' },
                    website: { type: 'string', description: 'Website URL' },
                    email: { type: 'string', description: 'Email address' },
                    hours: { type: 'string', description: 'Opening hours' },
                    eligibility: { type: 'string', description: 'Who can access (age, location, criteria)' },
                    categories: { type: 'array', items: { type: 'string' }, description: 'Service categories' }
                  },
                  required: ['name', 'description']
                }
              }
            }
          }
        },
        waitFor: 5000 // Wait 5 seconds for dynamic content to load
      });

      const services = result.extract?.services || [];
      totalServicesFound += services.length;

      console.log(`✅ Scraped successfully!`);
      console.log(`   Services found: ${services.length}`);

      if (services.length === 0) {
        console.log('   ⚠️  No services extracted - page might be loading differently');
        console.log('   This could mean:');
        console.log('   - Services load too slowly (try increasing waitFor)');
        console.log('   - Page structure is different than expected');
        console.log('   - Location has no services in this category');
        continue;
      }

      // Show first service as example
      if (services.length > 0) {
        console.log('\n   📋 Example service extracted:');
        const example = services[0];
        console.log(`   Name: ${example.name || '(not found)'}`);
        console.log(`   Organization: ${example.organization || '(not found)'}`);
        console.log(`   Description: ${example.description?.substring(0, 80) || '(not found)'}...`);
        console.log(`   Phone: ${example.phone || '(not found)'}`);
        console.log(`   Address: ${example.address || '(not found)'}`);
        console.log(`   Website: ${example.website || '(not found)'}`);
      }

      // Import services to database
      console.log('\n   💾 Importing to database...');

      for (let j = 0; j < services.length; j++) {
        const service = services[j];
        const result = await importService(service, url);

        if (result === 'new') {
          totalImported++;
        } else if (result === 'duplicate') {
          totalDuplicates++;
        } else {
          totalErrors++;
        }

        // Show progress every 10 services
        if ((j + 1) % 10 === 0) {
          console.log(`   Progress: ${j + 1}/${services.length} services processed`);
        }
      }

      console.log(`   ✅ Import complete!`);
      console.log(`      New: ${totalImported} | Duplicates: ${totalDuplicates} | Errors: ${totalErrors}`);

      // Rate limiting between requests
      if (i < TEST_URLS.length - 1) {
        console.log('\n   ⏸️  Waiting 2 seconds (rate limit)...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error: any) {
      console.error(`   ❌ Error scraping: ${error.message}`);
      totalErrors++;
    }
  }

  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('🎉 TEST COMPLETE');
  console.log('='.repeat(60));
  console.log(`URLs tested: ${TEST_URLS.length}`);
  console.log(`Services found: ${totalServicesFound}`);
  console.log(`Services imported: ${totalImported}`);
  console.log(`Duplicates skipped: ${totalDuplicates}`);
  console.log(`Errors: ${totalErrors}`);

  if (totalImported > 0) {
    console.log(`\n✅ Success! Average: ${(totalServicesFound / TEST_URLS.length).toFixed(1)} services per URL`);
    console.log(`\n📊 Estimated full scrape results:`);
    console.log(`   270 URLs × ${(totalServicesFound / TEST_URLS.length).toFixed(1)} services = ${Math.round(270 * totalServicesFound / TEST_URLS.length)} services`);
    console.log(`   Estimated cost: $${(270 * 0.002).toFixed(2)} (Firecrawl)`);
    console.log(`   Estimated time: ${Math.ceil(270 / 60)} hours (1 req/sec)`);

    console.log(`\n🚀 Next steps:`);
    console.log(`   1. Review imported services at http://localhost:3000/services`);
    console.log(`   2. Check data quality with: npx tsx src/scripts/service-data-quality.ts`);
    console.log(`   3. Run full scrape with: npx tsx src/scripts/discovery/scrape-askizzy-comprehensive.ts`);
  } else {
    console.log(`\n⚠️  No services were imported. Possible issues:`);
    console.log(`   - Firecrawl API key not configured`);
    console.log(`   - Ask Izzy page structure changed`);
    console.log(`   - Dynamic loading needs more wait time`);
    console.log(`   - Database connection issues`);
  }
}

async function importService(service: ServiceData, sourceUrl: string): Promise<'new' | 'duplicate' | 'error'> {
  try {
    // Use organization name if available, otherwise use service name
    const orgName = service.organization || service.name;

    if (!orgName || !service.name) {
      return 'error';
    }

    // Check if organization exists
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', orgName)
      .single();

    let orgId: string;

    if (existingOrg) {
      orgId = existingOrg.id;
    } else {
      // Create organization
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgName,
          description: service.description || null,
          website_url: service.website || null,
          phone: service.phone || null
        })
        .select('id')
        .single();

      if (orgError || !newOrg) {
        return 'error';
      }

      orgId = newOrg.id;
    }

    // Check if service already exists
    const { data: existingService } = await supabase
      .from('services')
      .select('id')
      .eq('organization_id', orgId)
      .eq('name', service.name)
      .single();

    if (existingService) {
      return 'duplicate';
    }

    // Create service
    const { error: serviceError } = await supabase
      .from('services')
      .insert({
        name: service.name,
        description: service.description || `Service provided by ${orgName}`,
        organization_id: orgId,
        phone: service.phone || null,
        email: service.email || null,
        address: service.address || null,
        location: extractLocation(sourceUrl),
        categories: mapCategories(service.categories || []),
        hours: service.hours || null,
        eligibility_criteria: service.eligibility ? [service.eligibility] : [],
        data_source: 'Ask Izzy (Infoxchange)',
        data_source_url: sourceUrl,
        verification_status: 'pending'
      });

    if (serviceError) {
      return 'error';
    }

    return 'new';

  } catch (error: any) {
    return 'error';
  }
}

function extractLocation(url: string): string {
  // Extract location from URL: /housing/Brisbane-QLD -> Brisbane, QLD
  const match = url.match(/\/([^\/]+)$/);
  if (match) {
    const location = match[1];

    // Convert URL format to display format
    if (location.includes('-')) {
      return location.replace(/-/g, ', ');
    }

    return location;
  }
  return 'Australia';
}

function mapCategories(categories: string[] = []): string[] {
  const categoryMap: Record<string, string> = {
    'housing': 'housing',
    'accommodation': 'housing',
    'emergency accommodation': 'housing',
    'legal': 'legal_aid',
    'advice': 'advocacy',
    'advocacy': 'advocacy',
    'counselling': 'mental_health',
    'counseling': 'mental_health',
    'mental health': 'mental_health',
    'psychology': 'mental_health',
    'family violence': 'family_support',
    'domestic violence': 'family_support',
    'family support': 'family_support',
    'education': 'education_training',
    'training': 'education_training',
    'employment': 'education_training',
    'health': 'mental_health',
    'wellbeing': 'mental_health',
    'drug': 'substance_abuse',
    'alcohol': 'substance_abuse',
    'substance': 'substance_abuse',
    'crisis': 'crisis_support',
    'emergency': 'crisis_support'
  };

  const mapped = new Set<string>();

  for (const category of categories) {
    const lower = category.toLowerCase();
    for (const [key, value] of Object.entries(categoryMap)) {
      if (lower.includes(key)) {
        mapped.add(value);
      }
    }
  }

  // If no categories mapped, use 'support' as default
  return mapped.size > 0 ? Array.from(mapped) : ['support'];
}

testAskIzzyScraping()
  .then(() => {
    console.log('\n✅ Test script complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
