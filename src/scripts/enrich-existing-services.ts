/**
 * Enrich Existing Services Script
 *
 * Takes existing services from the database and enriches them with more details
 * by visiting their websites and extracting additional information.
 */

import { createClient } from '@supabase/supabase-js';
import { WebScraper } from '../lib/scraping/web-scraper';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

async function enrichExistingServices() {
  console.log('🔍 Fetching services that need enrichment...\n');

  // Get services with websites but minimal details
  const { data: services, error } = await supabase
    .from('services')
    .select(`
      id,
      name,
      description,
      contact,
      location,
      organizations (
        name,
        website_url
      )
    `)
    .not('organizations.website_url', 'is', null)
    .limit(10);

  if (error) {
    console.error('❌ Error fetching services:', error);
    return;
  }

  if (!services || services.length === 0) {
    console.log('✅ No services need enrichment');
    return;
  }

  console.log(`📊 Found ${services.length} services with websites to enrich\n`);

  const scraper = new WebScraper();
  let enriched = 0;
  let failed = 0;

  for (const service of services) {
    const org = (service.organizations as any);
    const websiteUrl = org?.website_url;

    if (!websiteUrl) continue;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`Enriching: ${service.name}`);
    console.log(`Website: ${websiteUrl}`);
    console.log(`${'='.repeat(60)}`);

    try {
      // Scrape the organization's website
      const result = await scraper.scrape(websiteUrl, org?.name || service.name);

      if (result.services && result.services.length > 0) {
        // Use the enriched data from their website
        const enrichedService = result.services[0];

        // Update the service with enriched data
        const updates: any = {};

        if (enrichedService.description && enrichedService.description.length > (service.description?.length || 0)) {
          updates.description = enrichedService.description;
        }

        if (enrichedService.contact_phone && !service.contact?.phone) {
          updates.contact = {
            ...(service.contact as any || {}),
            phone: enrichedService.contact_phone
          };
        }

        if (enrichedService.contact_email && !(service.contact as any)?.email) {
          updates.contact = {
            ...(updates.contact || service.contact as any || {}),
            email: enrichedService.contact_email
          };
        }

        if (enrichedService.street_address && !(service.location as any)?.street_address) {
          updates.location = {
            ...(service.location as any || {}),
            street_address: enrichedService.street_address,
            city: enrichedService.city || (service.location as any)?.city,
            state: enrichedService.state || (service.location as any)?.state,
            postcode: enrichedService.postcode || (service.location as any)?.postcode
          };
        }

        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from('services')
            .update(updates)
            .eq('id', service.id);

          if (updateError) {
            console.error(`  ❌ Error updating service:`, updateError.message);
            failed++;
          } else {
            console.log(`  ✅ Enriched with ${Object.keys(updates).length} field(s)`);
            enriched++;
          }
        } else {
          console.log(`  ⏭️  No new information found`);
        }
      } else {
        console.log(`  ⏭️  No services extracted from website`);
      }

      // Wait 5 seconds between requests
      await new Promise(resolve => setTimeout(resolve, 5000));

    } catch (error: any) {
      console.error(`  ❌ Error enriching:`, error.message);
      failed++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('🎉 ENRICHMENT SUMMARY');
  console.log(`${'='.repeat(60)}`);
  console.log(`Services enriched: ${enriched}`);
  console.log(`Services failed: ${failed}`);
  console.log(`Total processed: ${services.length}`);
}

enrichExistingServices()
  .then(() => {
    console.log('\n✅ Enrichment complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Enrichment failed:', error);
    process.exit(1);
  });
