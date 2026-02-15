#!/usr/bin/env node
/**
 * Enrich services imported from Airtable with web scraping
 * Adds contact details, websites, addresses to existing services
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { chromium } from 'playwright';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface EnrichmentResult {
  website_url?: string;
  contact_phone?: string;
  contact_email?: string;
  location_address?: string;
  location_city?: string;
  location_postcode?: string;
  description?: string;
}

async function enrichService(serviceName: string, organizationName: string): Promise<EnrichmentResult> {
  console.log(`\n🔍 Searching for: ${serviceName}`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Search Google for the organization
    const searchQuery = `${organizationName} Queensland contact`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

    console.log(`🌐 Searching: ${searchQuery}`);
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    const html = await page.content();

    // Use Claude to extract information from search results
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Extract contact information for "${organizationName}" from this Google search results page.

Return ONLY valid JSON with these fields (use null if not found):
{
  "website_url": "https://...",
  "contact_phone": "07...",
  "contact_email": "...",
  "location_address": "street address",
  "location_city": "city",
  "location_postcode": "4000"
}

HTML:
${html.substring(0, 50000)}`
      }]
    });

    const content = message.content[0];
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        console.log(`✅ Found:`, data);
        return data;
      }
    }

    return {};
  } catch (error) {
    console.error(`❌ Error enriching ${serviceName}:`, error instanceof Error ? error.message : error);
    return {};
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('============================================================');
  console.log('🚀 SERVICE ENRICHMENT - Airtable Imports');
  console.log('============================================================\n');

  // Get services that need enrichment (no website_url)
  const { data: services, error } = await supabase
    .from('services')
    .select('id, name, organization_id, organizations(name)')
    .is('website_url', null)
    .limit(50); // Start with 50 services

  if (error) {
    console.error('❌ Error fetching services:', error);
    return;
  }

  console.log(`📊 Found ${services?.length || 0} services to enrich\n`);

  let enriched = 0;
  let failed = 0;

  for (const service of services || []) {
    const orgName = (service.organizations as any)?.name || service.name;

    console.log(`\n[${enriched + failed + 1}/${services?.length}] ${service.name}`);
    console.log(`Organization: ${orgName}`);

    const enrichmentData = await enrichService(service.name, orgName);

    if (Object.keys(enrichmentData).length > 0) {
      // Update service with enrichment data
      const { error: updateError } = await supabase
        .from('services')
        .update(enrichmentData)
        .eq('id', service.id);

      if (updateError) {
        console.error(`❌ Failed to update service:`, updateError);
        failed++;
      } else {
        console.log(`✅ Enriched service`);
        enriched++;
      }
    } else {
      console.log(`⚠️  No data found`);
      failed++;
    }

    // Rate limiting
    console.log(`⏳ Waiting 15 seconds...`);
    await new Promise(resolve => setTimeout(resolve, 15000));
  }

  console.log('\n============================================================');
  console.log('🎉 ENRICHMENT COMPLETE');
  console.log('============================================================');
  console.log(`✅ Successfully enriched: ${enriched}`);
  console.log(`❌ Failed or no data: ${failed}`);
  console.log(`📊 Total processed: ${enriched + failed}`);
}

main().catch(console.error);
