#!/usr/bin/env node
/**
 * Scrape Queensland Department of Youth Justice Service Provider List to JSON
 * Source: https://www.youthjustice.qld.gov.au/our-department/strategies-reform/taskforce/service-provider-list
 *
 * Outputs to: data/government/qld-youth-justice-providers.json
 * Then generates SQL import file
 */

import { chromium } from 'playwright';
import Anthropic from '@anthropic-ai/sdk';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface ServiceProvider {
  name: string;
  description?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  postcode?: string | null;
  categories: string[];
  isGovernmentVerified: boolean;
}

async function extractProvidersFromPage(html: string): Promise<ServiceProvider[]> {
  console.log('🤖 Using Claude to extract all service providers...');

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 8192,
    messages: [{
      role: 'user',
      content: `Extract ALL service provider organizations from this Queensland Government Youth Justice page.

This page contains a list of prescribed entities under section 307 of the Youth Justice Act 1992.
There should be approximately 40+ organizations listed.

For each provider, extract:
- name (required) - The full organization name

Return ONLY a valid JSON array with ALL organizations found:
[
  {
    "name": "Organization Name"
  }
]

Extract EVERY organization name from the list. Do not stop at just a few.

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
          name: p.name,
          description: null,
          website: null,
          phone: null,
          email: null,
          address: null,
          city: 'Queensland',
          postcode: null,
          categories: ['support'],
          isGovernmentVerified: true
        }));
      } catch (error) {
        console.error('❌ Failed to parse JSON:', error);
        console.log('Response text:', content.text);
        return [];
      }
    }
  }

  return [];
}

async function enrichProviderFromWeb(provider: ServiceProvider): Promise<ServiceProvider> {
  console.log(`\n🔍 Searching for: ${provider.name}`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Search for the organization
    const searchQuery = `${provider.name} Queensland youth services contact`;
    await page.goto(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    await page.waitForTimeout(2000);

    const searchHtml = await page.content();

    // Use Claude to extract information from search results
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Extract contact information for "${provider.name}" from these search results.

Return JSON:
{
  "website": "official website URL or null",
  "phone": "contact phone or null",
  "email": "contact email or null",
  "address": "physical address or null",
  "city": "city or null",
  "postcode": "postcode or null",
  "description": "brief description of services or null"
}

Search results:
${searchHtml.substring(0, 30000)}`
      }]
    });

    const content = message.content[0];
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const enriched = JSON.parse(jsonMatch[0]);
        console.log(`   ✅ Found: ${Object.keys(enriched).filter(k => enriched[k]).length} fields`);

        return {
          ...provider,
          ...enriched,
          categories: enriched.categories || provider.categories
        };
      }
    }

    console.log(`   ⚠️  No additional info found`);
    return provider;

  } catch (error) {
    console.error(`   ❌ Error: ${error instanceof Error ? error.message : error}`);
    return provider;
  } finally {
    await browser.close();
  }
}

function generateSQL(providers: ServiceProvider[]): string {
  let sql = `-- Import Queensland Government Youth Justice Service Providers
-- Generated: ${new Date().toISOString()}
-- Source: https://www.youthjustice.qld.gov.au/our-department/strategies-reform/taskforce/service-provider-list
-- Total providers: ${providers.length}

`;

  for (const provider of providers) {
    const safeName = provider.name.replace(/'/g, "''");
    const safeDesc = (provider.description || `Queensland Government verified youth justice service provider`).replace(/'/g, "''");
    const safeWebsite = provider.website ? `'${provider.website.replace(/'/g, "''")}'` : 'NULL';
    const safePhone = provider.phone ? `'${provider.phone.replace(/'/g, "''")}'` : 'NULL';
    const safeEmail = provider.email ? `'${provider.email.replace(/'/g, "''")}'` : 'NULL';
    const safeAddress = provider.address ? `'${provider.address.replace(/'/g, "''")}'` : 'NULL';
    const safeCity = provider.city ? `'${provider.city.replace(/'/g, "''")}'` : "'Queensland'";
    const safePostcode = provider.postcode ? `'${provider.postcode}'` : 'NULL';
    const slug = provider.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const categories = `ARRAY[${provider.categories.map(c => `'${c}'`).join(', ')}]::text[]`;

    sql += `
-- ${provider.name}
DO $$
DECLARE
  v_org_id uuid;
  v_service_exists boolean;
BEGIN
  -- Insert or get organization
  INSERT INTO organizations (name, description, website_url)
  VALUES ('${safeName}', '${safeDesc}', ${safeWebsite})
  ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    website_url = COALESCE(EXCLUDED.website_url, organizations.website_url)
  RETURNING id INTO v_org_id;

  -- Check if service exists
  SELECT EXISTS(
    SELECT 1 FROM services
    WHERE organization_id = v_org_id
    AND name = '${safeName}'
  ) INTO v_service_exists;

  -- Insert service if it doesn't exist
  IF NOT v_service_exists THEN
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, contact_phone, contact_email, website_url,
      location_address, location_city, location_state, location_postcode,
      metadata
    ) VALUES (
      '${safeName}',
      '${slug}-' || substring(md5(random()::text) from 1 for 8),
      '${safeDesc}',
      'support',
      ${categories},
      v_org_id,
      ${safePhone},
      ${safeEmail},
      ${safeWebsite},
      ${safeAddress},
      ${safeCity},
      'QLD',
      ${safePostcode},
      jsonb_build_object(
        'government_verified', true,
        'source', 'Queensland Department of Youth Justice',
        'imported_at', NOW()
      )
    );
  ELSE
    -- Update existing service
    UPDATE services SET
      contact_phone = COALESCE(${safePhone}, contact_phone),
      contact_email = COALESCE(${safeEmail}, contact_email),
      website_url = COALESCE(${safeWebsite}, website_url),
      location_address = COALESCE(${safeAddress}, location_address),
      location_city = ${safeCity},
      location_postcode = COALESCE(${safePostcode}, location_postcode),
      metadata = metadata || jsonb_build_object('government_verified', true, 'last_verified', NOW())
    WHERE organization_id = v_org_id AND name = '${safeName}';
  END IF;
END $$;
`;
  }

  return sql;
}

async function main() {
  console.log('============================================================');
  console.log('🏛️  GOVERNMENT SERVICE PROVIDER SCRAPER');
  console.log('============================================================');
  console.log('Source: Queensland Department of Youth Justice\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Step 1: Get the provider list page
    console.log('📄 Fetching government provider list...');
    await page.goto('https://www.youthjustice.qld.gov.au/our-department/strategies-reform/taskforce/service-provider-list', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await page.waitForTimeout(3000);

    const html = await page.content();
    await browser.close();

    // Step 2: Extract all provider names
    const providers = await extractProvidersFromPage(html);

    if (providers.length === 0) {
      console.log('⚠️  No providers found. The page structure may have changed.');
      return;
    }

    console.log(`\n📊 Found ${providers.length} service providers`);
    console.log('============================================================');

    // Step 3: Enrich a sample (first 5) to avoid rate limiting
    console.log('\n🌐 Enriching sample providers (first 5)...');
    for (let i = 0; i < Math.min(5, providers.length); i++) {
      providers[i] = await enrichProviderFromWeb(providers[i]);

      // Rate limiting
      if (i < Math.min(5, providers.length) - 1) {
        console.log('   ⏳ Waiting 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    // Step 4: Save to JSON
    const dataDir = join(process.cwd(), 'data', 'government');
    mkdirSync(dataDir, { recursive: true });

    const jsonPath = join(dataDir, 'qld-youth-justice-providers.json');
    writeFileSync(jsonPath, JSON.stringify(providers, null, 2));
    console.log(`\n✅ Saved to: ${jsonPath}`);

    // Step 5: Generate SQL
    const sql = generateSQL(providers);
    const sqlPath = join(process.cwd(), 'supabase', 'import-govt-providers.sql');
    writeFileSync(sqlPath, sql);
    console.log(`✅ Generated SQL: ${sqlPath}`);

    console.log('\n============================================================');
    console.log('🎉 SCRAPING COMPLETE');
    console.log('============================================================');
    console.log(`📊 Total providers: ${providers.length}`);
    console.log(`🌐 Enriched providers: 5`);
    console.log(`📁 JSON file: ${jsonPath}`);
    console.log(`📝 SQL file: ${sqlPath}`);
    console.log('\n💡 Next step: Run the SQL in Supabase SQL Editor');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    await browser.close();
    process.exit(1);
  }
}

main().catch(console.error);
