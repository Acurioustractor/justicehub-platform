/**
 * Comprehensive Ask Izzy Scraping
 *
 * Scrapes all 228 URLs with youth justice filtering
 */

import { readFileSync } from 'fs';
import { firecrawl } from '../../lib/scraping/firecrawl';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

interface URLData {
  category: string;
  location: string;
  url: string;
  priority: 'high' | 'medium' | 'low';
}

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

let stats = {
  totalURLs: 0,
  urlsScraped: 0,
  servicesFound: 0,
  servicesImported: 0,
  duplicates: 0,
  errors: 0,
  filteredOut: 0,
  startTime: Date.now()
};

async function scrapeAskIzzyComprehensive() {
  console.log('🔥 Starting Ask Izzy Comprehensive Scraping');
  console.log('='.repeat(60));
  console.log('Focus: Youth justice and youth support services (ages 10-25)\n');

  // Load URLs
  const urlData = JSON.parse(readFileSync('/Users/benknight/Code/JusticeHub/data/askizzy-urls.json', 'utf-8'));
  const urls: URLData[] = urlData.urls;

  stats.totalURLs = urls.length;

  console.log(`📊 URLs to scrape: ${urls.length}`);
  console.log(`⏱️  Estimated time: ${Math.ceil(urls.length / 30)} minutes (2 sec/URL)\n`);

  // Scrape each URL
  for (let i = 0; i < urls.length; i++) {
    const urlInfo = urls[i];

    console.log(`\n[${ i + 1}/${urls.length}] ${urlInfo.category} | ${urlInfo.location}`);
    console.log(`URL: ${urlInfo.url}`);
    console.log('-'.repeat(60));

    try {
      const result = await firecrawl.scrapeUrl(urlInfo.url, {
        formats: ['extract'],
        extract: {
          prompt: `Extract ONLY youth justice and youth support services from this page.

          INCLUDE services for:
          - Young people aged 10-25
          - Youth justice, legal aid, court support
          - Youth housing and crisis accommodation
          - Mental health services for young people
          - Family support and family violence services
          - Education and employment for at-risk youth

          EXCLUDE:
          - Adult-only services (18+, 21+)
          - Aged care, retirement
          - General community services not youth-focused
          - Services without youth or young people focus`,

          schema: {
            type: 'object',
            properties: {
              services: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', description: 'Service name' },
                    organization: { type: 'string', description: 'Organization name' },
                    description: { type: 'string', description: 'Service description' },
                    address: { type: 'string', description: 'Physical address' },
                    phone: { type: 'string', description: 'Phone number' },
                    website: { type: 'string', description: 'Website URL' },
                    email: { type: 'string', description: 'Email address' },
                    hours: { type: 'string', description: 'Opening hours' },
                    eligibility: { type: 'string', description: 'Who can access' },
                    categories: { type: 'array', items: { type: 'string' }, description: 'Service categories' }
                  },
                  required: ['name', 'description']
                }
              }
            }
          }
        },
        waitFor: 5000
      });

      const services = result.extract?.services || [];
      stats.urlsScraped++;
      stats.servicesFound += services.length;

      console.log(`✅ Found ${services.length} youth services`);

      if (services.length === 0) {
        console.log('   No youth services on this page');
      } else {
        // Import each service
        for (const service of services) {
          const importResult = await importService(service, urlInfo);

          if (importResult === 'imported') {
            stats.servicesImported++;
            console.log(`   ✅ ${service.name}`);
          } else if (importResult === 'duplicate') {
            stats.duplicates++;
            console.log(`   ⏭️  ${service.name} (already exists)`);
          } else if (importResult === 'filtered') {
            stats.filteredOut++;
            console.log(`   🔍 ${service.name} (filtered - not youth justice relevant)`);
          } else {
            stats.errors++;
            console.log(`   ❌ ${service.name} (error)`);
          }
        }
      }

      // Progress checkpoint every 25 URLs
      if ((i + 1) % 25 === 0) {
        printProgress();
      }

      // Rate limiting - 2 seconds between requests
      if (i < urls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
      stats.errors++;
    }
  }

  // Final summary
  printFinalSummary();
}

function calculateRelevanceScore(service: ServiceData): number {
  let score = 0;
  const text = `${service.name} ${service.description || ''}`.toLowerCase();

  // HIGH VALUE (+5)
  const highValue = ['youth justice', 'juvenile justice', 'young offenders', 'court support', 'youth legal'];
  if (highValue.some(kw => text.includes(kw))) score += 5;

  // AGE SPECIFIC (+3)
  if (/\b(10-25|12-25|10-18|12-18|under 25|under 18|youth|young people|adolescent)\b/i.test(text)) {
    score += 3;
  }

  // JUSTICE RELATED (+2)
  const justice = ['legal', 'court', 'justice', 'diversion', 'bail', 'detention', 'restorative'];
  if (justice.some(kw => text.includes(kw))) score += 2;

  // SUPPORT CATEGORIES (+2)
  const support = ['crisis', 'emergency', 'housing', 'mental health', 'counseling', 'trauma', 'family violence'];
  if (support.some(kw => text.includes(kw))) score += 2;

  return Math.min(score, 10);
}

async function importService(service: ServiceData, urlInfo: URLData): Promise<'imported' | 'duplicate' | 'filtered' | 'error'> {
  try {
    // Calculate relevance
    const relevance = calculateRelevanceScore(service);

    // Filter out low relevance (< 5)
    if (relevance < 5) {
      return 'filtered';
    }

    const orgName = service.organization || service.name;

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

    // Check if service exists
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
        description: service.description || `Youth service provided by ${orgName}`,
        organization_id: orgId,
        phone: service.phone || null,
        email: service.email || null,
        address: service.address || null,
        location: urlInfo.location.replace(/-/g, ', '),
        categories: mapCategories(urlInfo.category, service.categories || []),
        hours: service.hours || null,
        eligibility_criteria: service.eligibility ? [service.eligibility] : [],
        data_source: 'Ask Izzy (Infoxchange)',
        data_source_url: urlInfo.url,
        verification_status: 'pending',
        metadata: {
          youth_justice_relevance: relevance,
          askizzy_category: urlInfo.category,
          scraped_date: new Date().toISOString()
        }
      });

    if (serviceError) {
      return 'error';
    }

    return 'imported';

  } catch (error) {
    return 'error';
  }
}

function mapCategories(askIzzyCategory: string, serviceCategories: string[]): string[] {
  const mapped = new Set<string>();

  // Map Ask Izzy category
  const categoryMap: Record<string, string[]> = {
    'housing': ['housing'],
    'advice-and-advocacy': ['legal_aid', 'advocacy'],
    'support-and-counselling': ['mental_health', 'support'],
    'domestic-and-family-violence-help': ['family_support', 'crisis_support'],
    'health-and-wellbeing': ['mental_health', 'substance_abuse'],
    'work-learning-and-things-to-do': ['education_training', 'youth_development']
  };

  if (categoryMap[askIzzyCategory]) {
    categoryMap[askIzzyCategory].forEach(cat => mapped.add(cat));
  }

  // Map service-specific categories
  for (const cat of serviceCategories) {
    const lower = cat.toLowerCase();
    if (lower.includes('legal') || lower.includes('law')) mapped.add('legal_aid');
    if (lower.includes('housing') || lower.includes('accommodation')) mapped.add('housing');
    if (lower.includes('mental') || lower.includes('counseling')) mapped.add('mental_health');
    if (lower.includes('family')) mapped.add('family_support');
    if (lower.includes('education') || lower.includes('training')) mapped.add('education_training');
    if (lower.includes('substance') || lower.includes('drug') || lower.includes('alcohol')) mapped.add('substance_abuse');
  }

  return mapped.size > 0 ? Array.from(mapped) : ['support'];
}

function printProgress() {
  const elapsed = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(1);
  const rate = stats.urlsScraped / (Date.now() - stats.startTime) * 1000;
  const remaining = (stats.totalURLs - stats.urlsScraped) / rate / 60;

  console.log('\n' + '='.repeat(60));
  console.log('📊 PROGRESS CHECKPOINT');
  console.log('='.repeat(60));
  console.log(`URLs scraped: ${stats.urlsScraped}/${stats.totalURLs} (${((stats.urlsScraped/stats.totalURLs)*100).toFixed(1)}%)`);
  console.log(`Services found: ${stats.servicesFound}`);
  console.log(`Services imported: ${stats.servicesImported}`);
  console.log(`Duplicates: ${stats.duplicates}`);
  console.log(`Filtered out: ${stats.filteredOut}`);
  console.log(`Errors: ${stats.errors}`);
  console.log(`Time elapsed: ${elapsed} minutes`);
  console.log(`Estimated remaining: ${remaining.toFixed(1)} minutes`);
  console.log('='.repeat(60) + '\n');
}

function printFinalSummary() {
  const totalTime = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(1);

  console.log('\n' + '='.repeat(60));
  console.log('🎉 SCRAPING COMPLETE!');
  console.log('='.repeat(60));
  console.log(`Total URLs scraped: ${stats.urlsScraped}/${stats.totalURLs}`);
  console.log(`Total services found: ${stats.servicesFound}`);
  console.log(`Services imported: ${stats.servicesImported}`);
  console.log(`Duplicates skipped: ${stats.duplicates}`);
  console.log(`Filtered out (low relevance): ${stats.filteredOut}`);
  console.log(`Errors: ${stats.errors}`);
  console.log(`Success rate: ${((stats.servicesImported / stats.servicesFound) * 100).toFixed(1)}%`);
  console.log(`Filter rate: ${((stats.filteredOut / stats.servicesFound) * 100).toFixed(1)}%`);
  console.log(`Total time: ${totalTime} minutes`);
  console.log('='.repeat(60));

  console.log('\n✅ Next steps:');
  console.log('   1. Check database: npx tsx src/scripts/service-data-quality.ts');
  console.log('   2. View services: http://localhost:3000/services');
  console.log('   3. Review quality: Check youth justice relevance scores');
  console.log('');
}

scrapeAskIzzyComprehensive()
  .then(() => {
    console.log('✅ Scraping script complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Scraping failed:', error);
    process.exit(1);
  });
