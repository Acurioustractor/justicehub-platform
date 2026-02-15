#!/usr/bin/env node
/**
 * Scrape Peak Body Member Directories
 *
 * Peak bodies for Queensland youth justice and community services:
 * 1. QATSICPP - Queensland Aboriginal and Torres Strait Islander Child Protection Peak
 * 2. PeakCare Queensland - Child and family services peak body
 * 3. QCOSS - Queensland Council of Social Service
 * 4. YANQ - Youth Affairs Network Queensland
 * 5. QNADA - Queensland Network of Alcohol and Drug Agencies
 */

import { chromium } from 'playwright';
import Anthropic from '@anthropic-ai/sdk';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface Organization {
  name: string;
  peakBody: string;
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  postcode?: string;
  services?: string[];
}

async function extractOrganizationsFromHTML(
  html: string,
  peakBodyName: string
): Promise<Organization[]> {
  console.log(`🤖 Using Claude to extract member organizations from ${peakBodyName}...`);

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 8192,
    messages: [{
      role: 'user',
      content: `Extract ALL member organizations from this ${peakBodyName} page.

For each organization, extract:
- name (required)
- description (if available)
- website (if available)
- phone (if available)
- email (if available)
- address (if available)
- city/location (if available)
- services provided (if available)

Return ONLY a valid JSON array:
[
  {
    "name": "Organization Name",
    "description": "Brief description",
    "website": "https://...",
    "phone": "07...",
    "email": "contact@...",
    "address": "Street address",
    "city": "City name",
    "postcode": "4000",
    "services": ["service1", "service2"]
  }
]

Use null for missing fields.
Extract EVERY organization listed.

HTML:
${html.substring(0, 100000)}`
    }]
  });

  const content = message.content[0];
  if (content.type === 'text') {
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const orgs = JSON.parse(jsonMatch[0]);
        console.log(`✅ Extracted ${orgs.length} organizations from ${peakBodyName}`);
        return orgs.map((o: any) => ({
          ...o,
          peakBody: peakBodyName
        }));
      } catch (error) {
        console.error(`❌ Failed to parse JSON for ${peakBodyName}:`, error);
        return [];
      }
    }
  }

  return [];
}

async function scrapePeakBody(
  url: string,
  name: string,
  waitForSelector?: string
): Promise<Organization[]> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 Scraping: ${name}`);
  console.log(`🌐 URL: ${url}`);
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for content to load
    if (waitForSelector) {
      await page.waitForSelector(waitForSelector, { timeout: 10000 }).catch(() => {
        console.log('   ⚠️  Selector not found, continuing anyway...');
      });
    }

    await page.waitForTimeout(3000);

    const html = await page.content();
    await browser.close();

    const organizations = await extractOrganizationsFromHTML(html, name);

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));

    return organizations;

  } catch (error) {
    console.error(`❌ Error scraping ${name}:`, error instanceof Error ? error.message : error);
    await browser.close();
    return [];
  }
}

async function main() {
  console.log('============================================================');
  console.log('🏛️  PEAK BODY MEMBER DIRECTORY SCRAPER');
  console.log('============================================================\n');

  const peakBodies = [
    {
      name: 'QATSICPP',
      fullName: 'Queensland Aboriginal and Torres Strait Islander Child Protection Peak',
      url: 'https://www.qatsicpp.com.au/about-us/our-members/',
      selector: null
    },
    {
      name: 'PeakCare',
      fullName: 'PeakCare Queensland',
      url: 'https://peakcare.org.au/our-members/',
      selector: null
    },
    {
      name: 'QCOSS',
      fullName: 'Queensland Council of Social Service',
      url: 'https://www.qcoss.org.au/members/',
      selector: null
    },
    {
      name: 'YANQ',
      fullName: 'Youth Affairs Network Queensland',
      url: 'https://yanq.org.au/members',
      selector: null
    },
    {
      name: 'QNADA',
      fullName: 'Queensland Network of Alcohol and Drug Agencies',
      url: 'https://qnada.org.au/members',
      selector: null
    }
  ];

  const allOrganizations: Organization[] = [];
  const results: { [key: string]: number } = {};

  for (const peakBody of peakBodies) {
    const orgs = await scrapePeakBody(
      peakBody.url,
      peakBody.fullName,
      peakBody.selector || undefined
    );

    allOrganizations.push(...orgs);
    results[peakBody.name] = orgs.length;
  }

  // Deduplicate by organization name
  const uniqueOrgs = new Map<string, Organization>();
  allOrganizations.forEach(org => {
    const key = org.name.toLowerCase().trim();
    if (!uniqueOrgs.has(key)) {
      uniqueOrgs.set(key, org);
    } else {
      // Merge data if org appears in multiple peak bodies
      const existing = uniqueOrgs.get(key)!;
      uniqueOrgs.set(key, {
        ...existing,
        website: existing.website || org.website,
        phone: existing.phone || org.phone,
        email: existing.email || org.email,
        address: existing.address || org.address,
        description: existing.description || org.description,
        peakBody: `${existing.peakBody}, ${org.peakBody}`
      });
    }
  });

  const finalOrgs = Array.from(uniqueOrgs.values());

  console.log('\n============================================================');
  console.log('📊 SCRAPING SUMMARY');
  console.log('============================================================');

  Object.entries(results).forEach(([name, count]) => {
    console.log(`${name}: ${count} organizations`);
  });

  console.log(`\nTotal extracted: ${allOrganizations.length}`);
  console.log(`Unique organizations: ${finalOrgs.length}`);

  // Save to JSON
  const dataDir = join(process.cwd(), 'data', 'peak-bodies');
  mkdirSync(dataDir, { recursive: true });

  const jsonPath = join(dataDir, 'peak-body-members.json');
  writeFileSync(jsonPath, JSON.stringify(finalOrgs, null, 2));
  console.log(`\n✅ Saved to: ${jsonPath}`);

  // Generate SQL
  console.log('\n📝 Generating SQL import file...');
  const sql = generateSQL(finalOrgs);
  const sqlPath = join(process.cwd(), 'supabase', 'import-peak-body-members.sql');
  writeFileSync(sqlPath, sql);
  console.log(`✅ SQL saved to: ${sqlPath}`);

  // Statistics
  const withWebsite = finalOrgs.filter(o => o.website).length;
  const withPhone = finalOrgs.filter(o => o.phone).length;
  const withEmail = finalOrgs.filter(o => o.email).length;
  const withAddress = finalOrgs.filter(o => o.address).length;

  console.log('\n📈 DATA QUALITY');
  console.log('============================================================');
  console.log(`Organizations with website: ${withWebsite} (${Math.round(withWebsite/finalOrgs.length*100)}%)`);
  console.log(`Organizations with phone: ${withPhone} (${Math.round(withPhone/finalOrgs.length*100)}%)`);
  console.log(`Organizations with email: ${withEmail} (${Math.round(withEmail/finalOrgs.length*100)}%)`);
  console.log(`Organizations with address: ${withAddress} (${Math.round(withAddress/finalOrgs.length*100)}%)`);

  console.log('\n💡 NEXT STEPS');
  console.log('============================================================');
  console.log('1. Review data/peak-bodies/peak-body-members.json');
  console.log('2. Run SQL in Supabase: supabase/import-peak-body-members.sql');
  console.log('3. Verify imported organizations in database');
  console.log('4. Update verification status to "verified"');
}

function generateSQL(organizations: Organization[]): string {
  let sql = `-- Import Peak Body Member Organizations
-- Generated: ${new Date().toISOString()}
-- Total organizations: ${organizations.length}
-- Sources: QATSICPP, PeakCare, QCOSS, YANQ, QNADA

`;

  for (const org of organizations) {
    const safeName = org.name.replace(/'/g, "''");
    const safeDesc = (org.description || `Member of ${org.peakBody}`).replace(/'/g, "''");
    const safeWebsite = org.website ? `'${org.website.replace(/'/g, "''")}'` : 'NULL';
    const safePhone = org.phone ? `'${org.phone.replace(/'/g, "''")}'` : 'NULL';
    const safeEmail = org.email ? `'${org.email.replace(/'/g, "''")}'` : 'NULL';
    const safeAddress = org.address ? `'${org.address.replace(/'/g, "''")}'` : 'NULL';
    const safeCity = org.city ? `'${org.city.replace(/'/g, "''")}'` : "'Queensland'";
    const safePostcode = org.postcode ? `'${org.postcode}'` : 'NULL';
    const slug = org.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Assign categories based on peak body and services
    let categories = ['support'];
    if (org.peakBody.includes('QATSICPP')) categories.push('cultural_support');
    if (org.peakBody.includes('PeakCare')) categories.push('family_support');
    if (org.peakBody.includes('QNADA')) categories.push('substance_abuse');
    if (org.peakBody.includes('YANQ')) categories.push('life_skills');
    categories = [...new Set(categories)]; // Remove duplicates

    const categoriesSQL = `ARRAY[${categories.map(c => `'${c}'`).join(', ')}]::text[]`;

    sql += `
-- ${org.name} (${org.peakBody})
DO $$
DECLARE
  v_org_id uuid;
  v_service_exists boolean;
BEGIN
  -- Insert or get organization
  INSERT INTO organizations (name, description, website_url)
  VALUES ('${safeName}', '${safeDesc}', ${safeWebsite})
  ON CONFLICT (name) DO UPDATE SET
    description = COALESCE(EXCLUDED.description, organizations.description),
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
      ${categoriesSQL},
      v_org_id,
      ${safePhone},
      ${safeEmail},
      ${safeWebsite},
      ${safeAddress},
      ${safeCity},
      'QLD',
      ${safePostcode},
      jsonb_build_object(
        'peak_body_verified', true,
        'peak_body', '${org.peakBody.replace(/'/g, "''")}',
        'source', 'Peak Body Member Directory',
        'imported_at', NOW()
      )
    );
  END IF;
END $$;
`;
  }

  return sql;
}

main().catch(console.error);
