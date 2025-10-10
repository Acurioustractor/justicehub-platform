/**
 * Scrape Known Organizations Script
 *
 * Scrapes a curated list of known youth justice organizations
 * to build comprehensive service directory.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { WebScraper } from '../lib/scraping/web-scraper';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

interface OrganizationSource {
  name: string;
  url: string;
  category: string;
  priority: string;
}

async function scrapeKnownOrganizations() {
  console.log('🚀 Scraping Known Youth Justice Organizations');
  console.log('='.repeat(60));

  // Load organizations list
  const configPath = join(process.cwd(), 'data', 'additional-qld-organizations.json');
  const config = JSON.parse(readFileSync(configPath, 'utf-8'));
  const organizations: OrganizationSource[] = config.sources;

  console.log(`📋 Loaded ${organizations.length} organizations\n`);

  const scraper = new WebScraper();
  let totalExtracted = 0;
  let totalSaved = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (let i = 0; i < organizations.length; i++) {
    const org = organizations[i];

    console.log(`\n${'='.repeat(60)}`);
    console.log(`[${i + 1}/${organizations.length}] ${org.name}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`🌐 URL: ${org.url}`);
    console.log(`📁 Category: ${org.category}`);
    console.log(`⭐ Priority: ${org.priority}`);

    try {
      const result = await scraper.scrape(org.url, org.name);

      if (result.success && result.services.length > 0) {
        console.log(`✅ Extracted ${result.services.length} services`);
        totalExtracted += result.services.length;

        // Save each service
        for (const service of result.services) {
          try {
            // Check if service already exists (by name similarity)
            const { data: existing } = await supabase
              .from('services')
              .select('id, name')
              .ilike('name', `%${service.name.slice(0, 30)}%`)
              .limit(1);

            if (existing && existing.length > 0) {
              console.log(`  ⏭️  Skipped (duplicate): ${service.name}`);
              totalSkipped++;
              continue;
            }

            // Create organization if doesn't exist
            let orgId: string;
            const { data: existingOrg } = await supabase
              .from('organizations')
              .select('id')
              .eq('name', service.organization_name)
              .single();

            if (existingOrg) {
              orgId = existingOrg.id;
            } else {
              const { data: newOrg, error: orgError } = await supabase
                .from('organizations')
                .insert({
                  name: service.organization_name,
                  website_url: service.website_url,
                  description: `${org.category} services provider`
                })
                .select('id')
                .single();

              if (orgError) {
                console.error(`  ❌ Error creating organization:`, orgError.message);
                totalErrors++;
                continue;
              }

              orgId = newOrg!.id;
            }

            // Insert service
            const { error: serviceError } = await supabase
              .from('services')
              .insert({
                name: service.name,
                description: service.description,
                categories: service.categories,
                organization_id: orgId,
                contact: {
                  phone: service.contact_phone,
                  email: service.contact_email,
                  website: service.website_url
                },
                location: {
                  street_address: service.street_address,
                  locality: service.locality,
                  city: service.city,
                  state: service.state || 'QLD',
                  postcode: service.postcode,
                  region: service.region || 'Queensland'
                },
                eligibility_criteria: service.eligibility_criteria || [],
                cost: service.cost || 'unknown',
                availability: service.availability,
                data_source: org.url,
                data_source_url: org.url,
                verification_status: service.confidence >= 0.8 ? 'verified' : 'pending'
              });

            if (serviceError) {
              console.error(`  ❌ Error saving service:`, serviceError.message);
              totalErrors++;
            } else {
              console.log(`  ✅ Saved: ${service.name} (confidence: ${service.confidence.toFixed(2)})`);
              totalSaved++;
            }
          } catch (error: any) {
            console.error(`  ❌ Error processing service:`, error.message);
            totalErrors++;
          }
        }
      } else {
        console.log(`⚠️  No services extracted`);
      }

      // Wait 10 seconds between organizations to be respectful
      if (i < organizations.length - 1) {
        console.log(`\n⏳ Waiting 10 seconds before next organization...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }

    } catch (error: any) {
      console.error(`❌ Error scraping:`, error.message);
      totalErrors++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('🎉 FINAL SUMMARY');
  console.log(`${'='.repeat(60)}`);
  console.log(`Organizations scraped: ${organizations.length}`);
  console.log(`Services extracted: ${totalExtracted}`);
  console.log(`Services saved: ${totalSaved}`);
  console.log(`Services skipped (duplicates): ${totalSkipped}`);
  console.log(`Errors: ${totalErrors}`);
  console.log(`\n✅ Scraping complete!`);
}

scrapeKnownOrganizations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
