#!/usr/bin/env node
/**
 * Scrape Queensland Department of Youth Justice Service Provider List
 * Source: https://www.youthjustice.qld.gov.au/our-department/strategies-reform/taskforce/service-provider-list
 *
 * This scrapes the official government list of prescribed entities and service providers
 * - High quality, government-verified organizations
 * - Updated regularly by Department of Youth Justice
 * - Includes contact details and service descriptions
 */

import { chromium } from 'playwright';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface ServiceProvider {
  name: string;
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  postcode?: string;
  categories: string[];
  isGovernmentVerified: boolean;
}

async function extractProvidersFromPage(html: string): Promise<ServiceProvider[]> {
  console.log('🤖 Using Claude to extract service providers from government page...');

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20250514',
    max_tokens: 8192,
    messages: [{
      role: 'user',
      content: `Extract ALL service provider organizations from this Queensland Government Youth Justice page.

This page contains a list of prescribed entities under section 307 of the Youth Justice Act 1992.
Look for organization names in lists, tables, or body text.

For each provider, extract:
- name (required) - The full organization name
- description (if available on the page)
- website (if available)
- Any contact details (phone, email, address)

Return ONLY a valid JSON array with ALL organizations found:
[
  {
    "name": "Organization Name",
    "description": "What they do",
    "website": "https://...",
    "phone": "07...",
    "email": "contact@...",
    "address": "Street address",
    "city": "City",
    "postcode": "4000"
  }
]

If a field is not available, use null.
IMPORTANT: Extract ALL organizations from the list, not just the first one.

HTML:
${html.substring(0, 100000)}`
    }]
  });

  const content = message.content[0];
  if (content.type === 'text') {
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const providers = JSON.parse(jsonMatch[0]);
        console.log(`✅ Extracted ${providers.length} providers`);
        return providers.map((p: any) => ({
          ...p,
          categories: ['support'], // Will be improved later by AI
          isGovernmentVerified: true
        }));
      } catch (error) {
        console.error('❌ Failed to parse JSON:', error);
        return [];
      }
    }
  }

  return [];
}

async function deepScrapeProviderWebsite(url: string, providerName: string): Promise<Partial<ServiceProvider>> {
  console.log(`\n🌐 Deep scraping: ${providerName}`);
  console.log(`   URL: ${url}`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    const html = await page.content();

    // Use Claude to extract detailed information
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20250514',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Extract service information for "${providerName}" from their website.

Return JSON with:
{
  "description": "comprehensive description of services",
  "phone": "contact phone",
  "email": "contact email",
  "address": "physical address",
  "city": "city",
  "postcode": "postcode",
  "categories": ["array of relevant categories from: mental_health, housing, legal_aid, advocacy, cultural_support, family_support, education_training, court_support, substance_abuse, employment, health, disability_support, recreation, life_skills"]
}

Use null for missing fields.

HTML:
${html.substring(0, 30000)}`
      }]
    });

    const content = message.content[0];
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const details = JSON.parse(jsonMatch[0]);
        console.log(`   ✅ Extracted: ${Object.keys(details).filter(k => details[k]).length} fields`);
        return details;
      }
    }

    return {};
  } catch (error) {
    console.error(`   ❌ Error scraping ${url}:`, error instanceof Error ? error.message : error);
    return {};
  } finally {
    await browser.close();
  }
}

async function saveProviderToDatabase(provider: ServiceProvider) {
  // Check if organization already exists
  const { data: existingOrg } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', provider.name)
    .single();

  let orgId: string;

  if (existingOrg) {
    console.log(`   📌 Organization "${provider.name}" already exists`);
    orgId = existingOrg.id;

    // Update with new information
    if (provider.website || provider.description) {
      await supabase
        .from('organizations')
        .update({
          website_url: provider.website,
          description: provider.description
        })
        .eq('id', orgId);
    }
  } else {
    // Create new organization
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: provider.name,
        description: provider.description || `Youth justice service provider - ${provider.name}`,
        website_url: provider.website
      })
      .select('id')
      .single();

    if (orgError) {
      console.error(`   ❌ Failed to create organization:`, orgError);
      return;
    }

    orgId = newOrg!.id;
    console.log(`   ✅ Created organization "${provider.name}"`);
  }

  // Check if service already exists
  const { data: existingService } = await supabase
    .from('services')
    .select('id')
    .eq('organization_id', orgId)
    .eq('name', provider.name)
    .single();

  if (existingService) {
    // Update existing service with enriched data
    await supabase
      .from('services')
      .update({
        description: provider.description || `Youth justice service provider - ${provider.name}`,
        service_category: provider.categories,
        contact_phone: provider.phone,
        contact_email: provider.email,
        website_url: provider.website,
        location_address: provider.address,
        location_city: provider.city || 'Queensland',
        location_state: 'QLD',
        location_postcode: provider.postcode,
        metadata: {
          government_verified: true,
          last_verified: new Date().toISOString()
        }
      })
      .eq('id', existingService.id);

    console.log(`   📝 Updated service "${provider.name}"`);
  } else {
    // Create new service
    const { error: serviceError } = await supabase
      .from('services')
      .insert({
        name: provider.name,
        slug: provider.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 10),
        description: provider.description || `Youth justice service provider - ${provider.name}`,
        program_type: 'support',
        service_category: provider.categories,
        organization_id: orgId,
        contact_phone: provider.phone,
        contact_email: provider.email,
        website_url: provider.website,
        location_address: provider.address,
        location_city: provider.city || 'Queensland',
        location_state: 'QLD',
        location_postcode: provider.postcode,
        metadata: {
          government_verified: true,
          source: 'Queensland Department of Youth Justice',
          last_verified: new Date().toISOString()
        }
      });

    if (serviceError) {
      console.error(`   ❌ Failed to create service:`, serviceError);
    } else {
      console.log(`   ✅ Created service "${provider.name}"`);
    }
  }
}

async function main() {
  console.log('============================================================');
  console.log('🏛️  GOVERNMENT SERVICE PROVIDER SCRAPER');
  console.log('============================================================');
  console.log('Source: Queensland Department of Youth Justice');
  console.log('URL: https://www.youthjustice.qld.gov.au/our-department/strategies-reform/taskforce/service-provider-list\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Step 1: Get the main provider list page
    console.log('📄 Fetching government provider list...');
    await page.goto('https://www.youthjustice.qld.gov.au/our-department/strategies-reform/taskforce/service-provider-list', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await page.waitForTimeout(2000);

    const html = await page.content();
    await browser.close();

    // Step 2: Extract providers using Claude
    const providers = await extractProvidersFromPage(html);

    if (providers.length === 0) {
      console.log('⚠️  No providers found. The page structure may have changed.');
      return;
    }

    console.log(`\n📊 Found ${providers.length} service providers`);
    console.log('============================================================\n');

    let created = 0;
    let updated = 0;
    let enriched = 0;

    // Step 3: Process each provider
    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];

      console.log(`\n[${i + 1}/${providers.length}] ${provider.name}`);

      // Step 4: If provider has website, deep scrape for more details
      if (provider.website) {
        try {
          const enrichedData = await deepScrapeProviderWebsite(provider.website, provider.name);

          // Merge enriched data
          Object.assign(provider, {
            ...enrichedData,
            // Keep original website if enriched data doesn't have it
            website: enrichedData.website || provider.website,
            // Merge categories
            categories: enrichedData.categories && enrichedData.categories.length > 0
              ? enrichedData.categories
              : provider.categories
          });

          enriched++;

          // Rate limiting
          console.log('   ⏳ Waiting 3 seconds...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (error) {
          console.error(`   ⚠️  Failed to enrich from website`);
        }
      }

      // Step 5: Save to database
      await saveProviderToDatabase(provider);

      // Check if created or updated
      const { data } = await supabase
        .from('services')
        .select('created_at')
        .eq('name', provider.name)
        .single();

      if (data) {
        const isNew = new Date(data.created_at) > new Date(Date.now() - 60000); // Created in last minute
        if (isNew) {
          created++;
        } else {
          updated++;
        }
      }
    }

    console.log('\n============================================================');
    console.log('🎉 SCRAPING COMPLETE');
    console.log('============================================================');
    console.log(`✅ Providers processed: ${providers.length}`);
    console.log(`🆕 New services created: ${created}`);
    console.log(`📝 Existing services updated: ${updated}`);
    console.log(`🌐 Services enriched from websites: ${enriched}`);
    console.log(`📊 Success rate: ${Math.round((created + updated) / providers.length * 100)}%`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    await browser.close();
  }
}

main().catch(console.error);
