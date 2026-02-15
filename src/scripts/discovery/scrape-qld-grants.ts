#!/usr/bin/env node
/**
 * Scrape Queensland Government Grant Recipients
 *
 * Sources:
 * 1. Queensland Health grant funding recipients
 * 2. Advance Queensland Funding Recipients
 * 3. Small Business Grants recipients
 * 4. Community Services grants
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface GrantRecipient {
  organizationName: string;
  grantProgram: string;
  amount?: number;
  year?: string;
  description?: string;
  location?: string;
  website?: string;
  source: string;
}

const grantDatasets = [
  {
    name: 'Queensland Health Grant Recipients',
    url: 'https://www.data.qld.gov.au/dataset/queensland-health-grant-funding-recipients',
    resourceUrl: null, // Need to extract from page
  },
  {
    name: 'Advance Queensland Funding',
    url: 'https://www.data.qld.gov.au/dataset/advance-queensland-funding-recipients/resource/0f97b985-f5c7-49d2-8b0a-bc5dfbe070b9',
    resourceUrl: 'https://www.data.qld.gov.au/dataset/89c73f40-0094-4e56-94e6-a1e6d5ce76f9/resource/0f97b985-f5c7-49d2-8b0a-bc5dfbe070b9/download/advance-queensland-committed-funding-recipients.csv'
  },
  {
    name: '2024 Small Business Grants',
    url: 'https://www.data.qld.gov.au/dataset/desbt-2024-small-business-grants/resource/b5159c6c-aac4-4c03-bda0-acde445465b8',
    resourceUrl: 'https://www.data.qld.gov.au/dataset/89614d66-47d3-4e95-b9bd-11aa438e5fc6/resource/b5159c6c-aac4-4c03-bda0-acde445465b8/download/2024-basics-round-5-resilience-grant-recipients.csv'
  }
];

async function downloadCSV(url: string): Promise<string> {
  console.log(`📥 Downloading: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status}`);
  }
  const text = await response.text();
  console.log(`✅ Downloaded ${text.length} characters`);
  return text;
}

function parseCSV(csv: string): string[][] {
  const lines = csv.split('\n');
  return lines.map(line => {
    // Simple CSV parser (handles basic cases)
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
  });
}

async function extractOrganizationsFromCSV(
  csv: string,
  datasetName: string
): Promise<GrantRecipient[]> {
  console.log(`\n🤖 Using Claude to analyze ${datasetName} data...`);

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 8192,
    messages: [{
      role: 'user',
      content: `Analyze this grant recipients CSV data and extract organization information.

For each organization that might provide youth justice, community services, family support,
mental health, housing, or similar social services, extract:

{
  "organizationName": "Name of organization",
  "grantProgram": "Name of grant program",
  "amount": number or null,
  "year": "2024" or null,
  "description": "What the grant is for",
  "location": "City/region if available"
}

IMPORTANT: Only include organizations that appear to be community services, social services,
youth programs, health services, or similar. Exclude:
- Individual businesses (restaurants, shops, etc.)
- Pure research projects
- Infrastructure/construction projects
- For-profit companies unrelated to social services

Return ONLY a JSON array.

CSV Data (first 50 rows):
${csv.split('\n').slice(0, 50).join('\n')}`
    }]
  });

  const content = message.content[0];
  if (content.type === 'text') {
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const orgs = JSON.parse(jsonMatch[0]);
        console.log(`✅ Extracted ${orgs.length} relevant organizations`);
        return orgs.map((o: any) => ({
          ...o,
          source: datasetName
        }));
      } catch (error) {
        console.error(`❌ Failed to parse JSON:`, error);
        return [];
      }
    }
  }

  return [];
}

async function main() {
  console.log('============================================================');
  console.log('💰 QUEENSLAND GRANTS RECIPIENTS SCRAPER');
  console.log('============================================================\n');

  const allRecipients: GrantRecipient[] = [];

  for (const dataset of grantDatasets) {
    if (!dataset.resourceUrl) {
      console.log(`⚠️  Skipping ${dataset.name} - no resource URL`);
      continue;
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 Processing: ${dataset.name}`);
    console.log('='.repeat(60));

    try {
      const csv = await downloadCSV(dataset.resourceUrl);
      const recipients = await extractOrganizationsFromCSV(csv, dataset.name);
      allRecipients.push(...recipients);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 3000));

    } catch (error) {
      console.error(`❌ Error processing ${dataset.name}:`, error instanceof Error ? error.message : error);
    }
  }

  console.log('\n============================================================');
  console.log('📊 SCRAPING SUMMARY');
  console.log('============================================================');
  console.log(`Total grant recipients extracted: ${allRecipients.length}`);

  // Group by source
  const bySource: { [key: string]: number } = {};
  allRecipients.forEach(r => {
    bySource[r.source] = (bySource[r.source] || 0) + 1;
  });

  console.log('\n📈 By Source:');
  Object.entries(bySource).forEach(([source, count]) => {
    console.log(`   ${source}: ${count}`);
  });

  // Deduplicate by organization name
  const uniqueOrgs = new Map<string, GrantRecipient>();
  allRecipients.forEach(recipient => {
    const key = recipient.organizationName.toLowerCase().trim();
    if (!uniqueOrgs.has(key)) {
      uniqueOrgs.set(key, recipient);
    }
  });

  const finalRecipients = Array.from(uniqueOrgs.values());
  console.log(`\nUnique organizations: ${finalRecipients.length}`);

  // Save to JSON
  const dataDir = join(process.cwd(), 'data', 'grants');
  mkdirSync(dataDir, { recursive: true });

  const jsonPath = join(dataDir, 'qld-grant-recipients.json');
  writeFileSync(jsonPath, JSON.stringify(finalRecipients, null, 2));
  console.log(`\n✅ Saved to: ${jsonPath}`);

  // Generate SQL
  console.log('\n📝 Generating SQL import file...');
  const sql = generateSQL(finalRecipients);
  const sqlPath = join(process.cwd(), 'supabase', 'import-grant-recipients.sql');
  writeFileSync(sqlPath, sql);
  console.log(`✅ SQL saved to: ${sqlPath}`);

  console.log('\n💡 NEXT STEPS');
  console.log('============================================================');
  console.log('1. Review: data/grants/qld-grant-recipients.json');
  console.log('2. Run SQL: supabase/import-grant-recipients.sql');
  console.log('3. Verify imported organizations');
  console.log('4. Research websites/contact info for high-value orgs');
}

function generateSQL(recipients: GrantRecipient[]): string {
  let sql = `-- Import Queensland Grant Recipients
-- Generated: ${new Date().toISOString()}
-- Total organizations: ${recipients.length}

`;

  for (const recipient of recipients) {
    const safeName = recipient.organizationName.replace(/'/g, "''");
    const safeDesc = (recipient.description || `Queensland Government grant recipient - ${recipient.grantProgram}`).replace(/'/g, "''");
    const safeLocation = recipient.location ? `'${recipient.location.replace(/'/g, "''")}'` : "'Queensland'";
    const slug = recipient.organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Infer categories from grant program and description
    const categories = ['support'];
    const text = `${recipient.grantProgram} ${recipient.description || ''}`.toLowerCase();

    if (text.includes('health') || text.includes('mental')) categories.push('health', 'mental_health');
    if (text.includes('youth') || text.includes('young')) categories.push('life_skills');
    if (text.includes('family')) categories.push('family_support');
    if (text.includes('aboriginal') || text.includes('torres strait')) categories.push('cultural_support');
    if (text.includes('housing') || text.includes('homelessness')) categories.push('housing');
    if (text.includes('education') || text.includes('training')) categories.push('education_training');
    if (text.includes('employment') || text.includes('job')) categories.push('employment');

    const uniqueCategories = [...new Set(categories)];
    const categoriesSQL = `ARRAY[${uniqueCategories.map(c => `'${c}'`).join(', ')}]::text[]`;

    sql += `
-- ${recipient.organizationName} (${recipient.source})
DO $$
DECLARE
  v_org_id uuid;
  v_service_exists boolean;
BEGIN
  INSERT INTO organizations (name, description)
  VALUES ('${safeName}', '${safeDesc}')
  ON CONFLICT (name) DO UPDATE SET
    description = COALESCE(EXCLUDED.description, organizations.description)
  RETURNING id INTO v_org_id;

  SELECT EXISTS(
    SELECT 1 FROM services
    WHERE organization_id = v_org_id
    AND name = '${safeName}'
  ) INTO v_service_exists;

  IF NOT v_service_exists THEN
    INSERT INTO services (
      name, slug, description, program_type, service_category,
      organization_id, location_city, location_state,
      metadata
    ) VALUES (
      '${safeName}',
      '${slug}-' || substring(md5(random()::text) from 1 for 8),
      '${safeDesc}',
      'support',
      ${categoriesSQL},
      v_org_id,
      ${safeLocation},
      'QLD',
      jsonb_build_object(
        'grant_recipient', true,
        'grant_program', '${recipient.grantProgram.replace(/'/g, "''")}',
        'grant_year', '${recipient.year || '2024'}',
        'source', 'Queensland Government Grants',
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
