#!/usr/bin/env node
/**
 * Import Justice Reinvestment Sites from Paul Ramsay Foundation Portfolio
 *
 * This script imports 37 justice reinvestment sites across Australia
 * - Researches each organization for contact details and descriptions
 * - Creates organizations and services in database
 * - Marks as "justice_reinvestment" program type
 * - Uses AI to enrich with additional details
 */

import { readFileSync } from 'fs';
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

interface JusticeReinvestmentSite {
  name: string;
  location: string;
  state?: string;
  locations?: string[];
  categories: string[];
  type?: string;
  description?: string;
}

interface EnrichedSite extends JusticeReinvestmentSite {
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  postcode?: string;
  fullDescription?: string;
}

async function researchOrganization(org: JusticeReinvestmentSite): Promise<EnrichedSite> {
  console.log(`\n🔍 Researching: ${org.name}`);
  console.log(`   Location: ${org.location || org.locations?.join(', ')}`);
  console.log(`   State: ${org.state || 'Unknown'}`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Search for the organization
    const searchQuery = `${org.name} ${org.state || ''} justice reinvestment contact`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

    console.log(`   🌐 Searching: ${searchQuery}`);
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    const html = await page.content();

    // Use Claude to extract information
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Extract contact information for "${org.name}" - a justice reinvestment organization in ${org.state || 'Australia'}.

Return JSON with:
{
  "website": "https://...",
  "phone": "contact phone",
  "email": "contact email",
  "address": "physical address",
  "city": "city",
  "postcode": "postcode",
  "fullDescription": "comprehensive description of their justice reinvestment work"
}

Use null for missing fields.

HTML from Google search results:
${html.substring(0, 40000)}`
      }]
    });

    const content = message.content[0];
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const enriched = JSON.parse(jsonMatch[0]);
          console.log(`   ✅ Found: ${Object.keys(enriched).filter(k => enriched[k]).length} fields`);

          return {
            ...org,
            ...enriched,
            description: enriched.fullDescription || org.description
          };
        } catch (error) {
          console.error(`   ⚠️  Failed to parse enrichment data`);
        }
      }
    }

    return { ...org };
  } catch (error) {
    console.error(`   ❌ Error researching:`, error instanceof Error ? error.message : error);
    return { ...org };
  } finally {
    await browser.close();
  }
}

async function saveToDatabase(site: EnrichedSite) {
  console.log(`\n💾 Saving: ${site.name}`);

  // Check if organization exists
  const { data: existingOrg } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', site.name)
    .single();

  let orgId: string;

  if (existingOrg) {
    console.log(`   📌 Organization exists, updating...`);
    orgId = existingOrg.id;

    // Update organization with enriched data
    await supabase
      .from('organizations')
      .update({
        description: site.fullDescription || site.description,
        website_url: site.website
      })
      .eq('id', orgId);
  } else {
    // Create new organization
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: site.name,
        description: site.fullDescription || site.description || `Justice reinvestment site in ${site.location}`,
        website_url: site.website
      })
      .select('id')
      .single();

    if (orgError) {
      console.error(`   ❌ Failed to create organization:`, orgError);
      return { created: false, updated: false };
    }

    orgId = newOrg!.id;
    console.log(`   ✅ Created organization`);
  }

  // Create service for each location
  const locations = site.locations || [site.location];
  let servicesCreated = 0;
  let servicesUpdated = 0;

  for (const location of locations) {
    const serviceName = locations.length > 1
      ? `${site.name} - ${location}`
      : site.name;

    // Check if service exists
    const { data: existingService } = await supabase
      .from('services')
      .select('id')
      .eq('organization_id', orgId)
      .eq('name', serviceName)
      .single();

    if (existingService) {
      // Update existing service
      await supabase
        .from('services')
        .update({
          description: site.fullDescription || site.description || `Justice reinvestment service in ${location}`,
          service_category: site.categories,
          program_type: 'justice_reinvestment',
          contact_phone: site.phone,
          contact_email: site.email,
          website_url: site.website,
          location_address: site.address,
          location_city: site.city || location,
          location_state: site.state || 'QLD',
          location_postcode: site.postcode,
          metadata: {
            justice_reinvestment: true,
            prf_funded: !!site.type,
            type: site.type || 'community_site',
            source: 'Paul Ramsay Foundation Justice Reinvestment Portfolio 2024'
          }
        })
        .eq('id', existingService.id);

      servicesUpdated++;
      console.log(`   📝 Updated service: ${serviceName}`);
    } else {
      // Create new service
      const { error: serviceError } = await supabase
        .from('services')
        .insert({
          name: serviceName,
          slug: serviceName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 8),
          description: site.fullDescription || site.description || `Justice reinvestment service in ${location}`,
          program_type: 'justice_reinvestment',
          service_category: site.categories,
          organization_id: orgId,
          contact_phone: site.phone,
          contact_email: site.email,
          website_url: site.website,
          location_address: site.address,
          location_city: site.city || location,
          location_state: site.state || 'QLD',
          location_postcode: site.postcode,
          metadata: {
            justice_reinvestment: true,
            prf_funded: !!site.type,
            type: site.type || 'community_site',
            source: 'Paul Ramsay Foundation Justice Reinvestment Portfolio 2024'
          }
        });

      if (serviceError) {
        console.error(`   ❌ Failed to create service:`, serviceError);
      } else {
        servicesCreated++;
        console.log(`   ✅ Created service: ${serviceName}`);
      }
    }
  }

  return { created: servicesCreated > 0, updated: servicesUpdated > 0, count: servicesCreated + servicesUpdated };
}

async function main() {
  console.log('============================================================');
  console.log('🏛️  JUSTICE REINVESTMENT SITES IMPORTER');
  console.log('============================================================');
  console.log('Source: Paul Ramsay Foundation Portfolio Review 2024');
  console.log('Total sites: 37 across Australia\n');

  // Load data
  const dataPath = '/Users/benknight/Code/JusticeHub/data/justice-reinvestment-sites.json';
  const data = JSON.parse(readFileSync(dataPath, 'utf-8'));

  // Combine all sites into one list
  const allSites: JusticeReinvestmentSite[] = [
    ...data.prf_funded.map((site: any) => ({
      ...site,
      state: site.state,
      isPRFFunded: true
    })),
    ...Object.entries(data.all_sites).flatMap(([state, sites]) =>
      (sites as any[]).map(site => ({
        ...site,
        state,
        isPRFFunded: false
      }))
    )
  ];

  // Deduplicate by name
  const uniqueSites = Array.from(
    new Map(allSites.map(site => [site.name, site])).values()
  );

  console.log(`📊 Processing ${uniqueSites.length} unique sites\n`);
  console.log('============================================================\n');

  let created = 0;
  let updated = 0;
  let failed = 0;
  let totalServices = 0;

  // Process each site
  for (let i = 0; i < uniqueSites.length; i++) {
    const site = uniqueSites[i];

    console.log(`\n[${i + 1}/${uniqueSites.length}] ${site.name}`);

    try {
      // Research the organization
      const enrichedSite = await researchOrganization(site);

      // Save to database
      const result = await saveToDatabase(enrichedSite);

      if (result.created) created++;
      if (result.updated) updated++;
      totalServices += result.count;

      // Rate limiting - wait 5 seconds between searches
      if (i < uniqueSites.length - 1) {
        console.log(`   ⏳ Waiting 5 seconds before next...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (error) {
      console.error(`   ❌ Failed to process:`, error);
      failed++;
    }
  }

  console.log('\n============================================================');
  console.log('🎉 IMPORT COMPLETE');
  console.log('============================================================');
  console.log(`✅ Sites processed: ${uniqueSites.length}`);
  console.log(`🆕 New organizations created: ${created}`);
  console.log(`📝 Existing organizations updated: ${updated}`);
  console.log(`🔢 Total services added/updated: ${totalServices}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Success rate: ${Math.round((created + updated) / uniqueSites.length * 100)}%`);
}

main().catch(console.error);
