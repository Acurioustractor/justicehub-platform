/**
 * Scrape Queensland Youth Justice Services
 * Phase 0: Proof of Concept Scraper
 */

import { WebScraper } from '../lib/scraping/web-scraper';
import { ScraperConfig } from '../lib/scraping/types';
import { createClient } from '@supabase/supabase-js';

// Queensland youth service websites to scrape
// Updated with URLs that have actual service directory listings
const QLD_SOURCES: ScraperConfig[] = [
  {
    name: 'headspace National Centres Directory',
    url: 'https://headspace.org.au/headspace-centres/',
    useAI: true,
    headless: true,
  },
  {
    name: 'Legal Aid QLD Offices',
    url: 'https://www.legalaid.qld.gov.au/About-us/Contact-us',
    useAI: true,
    headless: true,
  },
  {
    name: 'Brisbane Youth Service',
    url: 'https://brisyouth.org/',
    useAI: true,
    headless: true,
  },
];

async function saveToDatabase(services: any[]) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('\n📊 Saving services to database...');

  let savedCount = 0;
  let errorCount = 0;

  for (const service of services) {
    try {
      // First, find or create organization
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('name', service.organization_name)
        .single();

      let organizationId = existingOrg?.id;

      if (!organizationId) {
        // Create new organization
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: service.organization_name,
            type: 'nonprofit',
            is_active: true,
          })
          .select('id')
          .single();

        if (orgError) {
          console.error(`❌ Error creating org ${service.organization_name}:`, orgError.message);
          errorCount++;
          continue;
        }

        organizationId = newOrg.id;
      }

      // Generate slug from service name
      const slug = service.name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 100);

      // Insert service
      const { error: serviceError } = await supabase
        .from('services')
        .insert({
          name: service.name,
          slug: `${slug}-${Date.now()}`, // Make unique with timestamp
          description: service.description,
          organization_id: organizationId,
          categories: service.categories || [],
          keywords: service.keywords || [],
          target_age_min: service.target_age_min,
          target_age_max: service.target_age_max,
          youth_specific: service.youth_specific || false,
          indigenous_specific: service.indigenous_specific || false,
          contact_phone: service.contact_phone,
          contact_email: service.contact_email,
          website_url: service.website_url,
          location_address: service.street_address,
          location_city: service.city || 'Brisbane',
          location_state: service.state || 'QLD',
          location_postcode: service.postcode,
          eligibility_criteria: service.eligibility_criteria || [],
          cost: service.cost || 'unknown',
          delivery_method: service.delivery_method || [],
          operating_hours: service.operating_hours || {},
          data_source: service.data_source,
          data_source_url: service.data_source_url,
          scrape_confidence_score: service.scrape_confidence_score,
          verification_status: service.scrape_confidence_score >= 0.8 ? 'verified' : 'needs_review',
          is_active: true,
          is_accepting_referrals: true,
          program_type: service.categories?.[0] || 'general_support',
          last_scraped_at: new Date().toISOString(),
        });

      if (serviceError) {
        console.error(`❌ Error saving service ${service.name}:`, serviceError.message);
        errorCount++;
      } else {
        savedCount++;
        console.log(`✅ Saved: ${service.name} (confidence: ${service.scrape_confidence_score.toFixed(2)})`);
      }
    } catch (error) {
      console.error(`❌ Unexpected error saving service:`, error);
      errorCount++;
    }
  }

  console.log(`\n📊 Database save complete:`);
  console.log(`   ✅ Saved: ${savedCount} services`);
  console.log(`   ❌ Errors: ${errorCount}`);
}

async function main() {
  console.log('🚀 Queensland Youth Services Scraper - Phase 0');
  console.log('=' .repeat(60));

  const scraper = new WebScraper();

  try {
    // Scrape all sources
    const results = await scraper.scrapeMultiple(QLD_SOURCES);

    // Collect all services
    const allServices = results.flatMap(r => r.services);

    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 SCRAPING SUMMARY');
    console.log('='.repeat(60));
    console.log(`Sources scraped: ${results.length}`);
    console.log(`Total services found: ${allServices.length}`);

    // Show breakdown by source
    results.forEach((result, i) => {
      console.log(`\n${QLD_SOURCES[i].name}:`);
      console.log(`  Found: ${result.services.length} services`);
      console.log(`  Success: ${result.success ? '✅' : '❌'}`);
    });

    if (allServices.length > 0) {
      console.log(`\n📝 Sample services:`);
      allServices.slice(0, 3).forEach((s, i) => {
        console.log(`\n${i + 1}. ${s.name}`);
        console.log(`   Org: ${s.organization_name}`);
        console.log(`   Categories: ${s.categories.join(', ')}`);
        console.log(`   Confidence: ${s.scrape_confidence_score.toFixed(2)}`);
      });

      // Save to database
      await saveToDatabase(allServices);
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await scraper.close();
  }
}

// Run the scraper
main().catch(console.error);
