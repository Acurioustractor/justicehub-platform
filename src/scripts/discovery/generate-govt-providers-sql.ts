#!/usr/bin/env node
/**
 * Generate SQL for importing Queensland Government Service Providers
 * Researches each provider using Claude AI and outputs SQL for manual import
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// 43 government-verified service providers from QLD Youth Justice
const GOVT_PROVIDERS = [
  "Abbwell Pty Ltd",
  "Act for Kids",
  "Acts-on Support Services",
  "Anglicare Southern Queensland",
  "Better Together",
  "Capricornia Training Company Limited",
  "Central Qld Indigenous Development Ltd",
  "Cherbourg Wellbeing Indigenous Corporation",
  "Community Solutions",
  "Community Support Centre Innisfail",
  "Deadly Inspiring Youth Doing Good Aboriginal and Torres Strait Islander Corporation",
  "Empowering Minds and Development",
  "Fearless to Success",
  "Great Mates",
  "IFYS Limited",
  "Innisfail Youth and Family Care Inc",
  "Inspire Youth and Family Services",
  "ICYS Ipswich Community Youth Service Inc.",
  "Jabalbina Yalanji Aboriginal Corporation",
  "Lamberr Wungarch Justice Group",
  "Lives Lived Well",
  "Mamu Health Service Limited",
  "Mareeba Community Centre Inc",
  "Mercy Community",
  "Mission Australia",
  "Mulungu Aboriginal Corporation Primary Health Care Service",
  "Path to Independence",
  "Queensland African Communities Council (QACC)",
  "Rubies Nursing Care",
  "Save the Children Australia",
  "Shifting Gears Mens Counselling",
  "South Burnett CTC Inc",
  "Southern Cross Support Services",
  "The Base Support Services Inc.",
  "The Centre for Women & Co. Ltd",
  "The Salvation Army Property Trust - Youth Outreach Service",
  "Trauma Assist (Wide Bay Sexual Assault Service)",
  "Vocational Partnerships Group Inc",
  "Wuchopperen Health Service Limited",
  "Yiliyapinya Indigenous Corporation",
  "Yoga on the Inside",
  "Youth Advocacy Centre",
  "Youth Empowered Towards Independence"
];

interface ProviderData {
  name: string;
  description: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  categories: string[];
}

async function researchProvider(name: string): Promise<ProviderData> {
  console.log(`🔍 Researching: ${name}`);

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Research this Queensland youth justice service provider: "${name}"

Provide detailed information:
{
  "description": "Comprehensive description of their services (2-3 sentences)",
  "website": "their official website URL",
  "phone": "contact phone number",
  "email": "contact email",
  "city": "primary Queensland city they operate in",
  "categories": ["2-4 relevant categories from: mental_health, housing, legal_aid, advocacy, cultural_support, family_support, education_training, court_support, substance_abuse, employment, health, disability_support, recreation, life_skills"]
}

Use null for unknown fields. Return ONLY valid JSON.`
    }]
  });

  const content = message.content[0];
  if (content.type === 'text') {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[0]);
        console.log(`   ✅ Got data`);
        return {
          name,
          description: data.description || `Queensland youth justice service provider - ${name}`,
          website: data.website,
          phone: data.phone,
          email: data.email,
          city: data.city || 'Queensland',
          categories: data.categories && data.categories.length > 0 ? data.categories : ['family_support']
        };
      } catch (error) {
        console.error(`   ❌ Parse error`);
      }
    }
  }

  return {
    name,
    description: `Queensland youth justice service provider - ${name}`,
    website: null,
    phone: null,
    email: null,
    city: 'Queensland',
    categories: ['family_support']
  };
}

function escapeSQL(str: string | null): string {
  if (!str) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

function generateSQL(providers: ProviderData[]): string {
  let sql = `-- Queensland Government Service Providers Import
-- Source: Queensland Department of Youth Justice
-- ${providers.length} government-verified providers
-- Generated: ${new Date().toISOString()}

DO $$
DECLARE
  org_id UUID;
  service_categories TEXT[];
BEGIN

`;

  providers.forEach((provider, idx) => {
    sql += `  -- [${idx + 1}/${providers.length}] ${provider.name}\n`;
    sql += `  SELECT id INTO org_id FROM organizations WHERE name = ${escapeSQL(provider.name)};\n`;
    sql += `  IF org_id IS NULL THEN\n`;
    sql += `    INSERT INTO organizations (name, description, website_url)\n`;
    sql += `    VALUES (\n`;
    sql += `      ${escapeSQL(provider.name)},\n`;
    sql += `      ${escapeSQL(provider.description)},\n`;
    sql += `      ${escapeSQL(provider.website)}\n`;
    sql += `    )\n`;
    sql += `    RETURNING id INTO org_id;\n`;
    sql += `  ELSE\n`;
    sql += `    UPDATE organizations SET\n`;
    sql += `      description = ${escapeSQL(provider.description)},\n`;
    sql += `      website_url = COALESCE(website_url, ${escapeSQL(provider.website)})\n`;
    sql += `    WHERE id = org_id;\n`;
    sql += `  END IF;\n\n`;

    // Create service categories array
    const categoriesSQL = `ARRAY[${provider.categories.map(c => `'${c}'`).join(', ')}]::TEXT[]`;

    sql += `  IF NOT EXISTS (SELECT 1 FROM services WHERE organization_id = org_id LIMIT 1) THEN\n`;
    sql += `    service_categories := ${categoriesSQL};\n`;
    sql += `    INSERT INTO services (\n`;
    sql += `      name, slug, description, program_type, service_category,\n`;
    sql += `      organization_id, contact_phone, contact_email, website_url,\n`;
    sql += `      location_city, location_state, metadata\n`;
    sql += `    ) VALUES (\n`;
    sql += `      ${escapeSQL(provider.name)},\n`;
    sql += `      lower(regexp_replace(${escapeSQL(provider.name)}, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 8),\n`;
    sql += `      ${escapeSQL(provider.description)},\n`;
    sql += `      'support',\n`;
    sql += `      service_categories,\n`;
    sql += `      org_id,\n`;
    sql += `      ${escapeSQL(provider.phone)},\n`;
    sql += `      ${escapeSQL(provider.email)},\n`;
    sql += `      ${escapeSQL(provider.website)},\n`;
    sql += `      ${escapeSQL(provider.city)},\n`;
    sql += `      'QLD',\n`;
    sql += `      '{"government_verified": true, "source": "Queensland Department of Youth Justice", "last_verified": "${new Date().toISOString()}"}'::jsonb\n`;
    sql += `    );\n`;
    sql += `  ELSE\n`;
    sql += `    UPDATE services SET\n`;
    sql += `      metadata = metadata || '{"government_verified": true, "last_verified": "${new Date().toISOString()}"}'::jsonb\n`;
    sql += `    WHERE organization_id = org_id;\n`;
    sql += `  END IF;\n\n`;
  });

  sql += `END $$;`;

  return sql;
}

async function main() {
  console.log('============================================================');
  console.log('🏛️  GOVERNMENT PROVIDERS SQL GENERATOR');
  console.log('============================================================');
  console.log(`Researching ${GOVT_PROVIDERS.length} providers...\n`);

  const providersData: ProviderData[] = [];

  for (let i = 0; i < GOVT_PROVIDERS.length; i++) {
    const name = GOVT_PROVIDERS[i];

    console.log(`[${i + 1}/${GOVT_PROVIDERS.length}] ${name}`);

    try {
      const data = await researchProvider(name);
      providersData.push(data);

      // Rate limiting
      if (i < GOVT_PROVIDERS.length - 1) {
        console.log('   ⏳ Waiting 2 seconds...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`   ❌ Error:`, error instanceof Error ? error.message : error);
      // Add with minimal data
      providersData.push({
        name,
        description: `Queensland youth justice service provider - ${name}`,
        website: null,
        phone: null,
        email: null,
        city: 'Queensland',
        categories: ['family_support']
      });
    }
  }

  console.log('\n============================================================');
  console.log('📝 GENERATING SQL');
  console.log('============================================================\n');

  const sql = generateSQL(providersData);

  const outputPath = '/Users/benknight/Code/JusticeHub/supabase/import-govt-providers.sql';
  fs.writeFileSync(outputPath, sql);

  console.log(`✅ SQL generated: ${outputPath}`);
  console.log(`📊 ${providersData.length} providers ready to import`);
  console.log(`\n📋 Next steps:`);
  console.log(`   1. Open Supabase SQL Editor`);
  console.log(`   2. Paste contents of ${outputPath}`);
  console.log(`   3. Run the SQL`);
  console.log(`   4. Check results with service-data-quality.ts`);
}

main().catch(console.error);
