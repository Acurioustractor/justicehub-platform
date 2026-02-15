#!/usr/bin/env node
/**
 * Import Queensland Government Service Providers
 * Source: https://www.youthjustice.qld.gov.au/our-department/strategies-reform/taskforce/service-provider-list
 *
 * 43 government-verified service providers
 * Research each one to get contact details and categorize
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

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

interface OrganizationData {
  name: string;
  description: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  categories: string[];
}

async function researchOrganization(name: string): Promise<OrganizationData> {
  console.log(`🔍 Researching: ${name}`);

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Research this Queensland youth justice service provider: "${name}"

Based on your knowledge, provide:
{
  "description": "What services they provide (1-2 sentences)",
  "website": "their website URL if known",
  "phone": "contact phone if known",
  "email": "contact email if known",
  "city": "primary Queensland city/region they serve",
  "categories": ["array of 2-4 relevant categories from: mental_health, housing, legal_aid, advocacy, cultural_support, family_support, education_training, court_support, substance_abuse, employment, health, disability_support, recreation, life_skills"]
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
        return {
          name,
          description: data.description || `Youth justice service provider - ${name}`,
          website: data.website,
          phone: data.phone,
          email: data.email,
          city: data.city || 'Queensland',
          categories: data.categories || ['support']
        };
      } catch (error) {
        console.error(`   ❌ Failed to parse JSON for ${name}`);
      }
    }
  }

  // Fallback if AI research fails
  return {
    name,
    description: `Youth justice service provider - ${name}`,
    website: null,
    phone: null,
    email: null,
    city: 'Queensland',
    categories: ['support']
  };
}

async function importProvider(provider: OrganizationData): Promise<{created: boolean, updated: boolean}> {
  // Check if organization exists
  const { data: existingOrg } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', provider.name)
    .single();

  let orgId: string;
  let orgCreated = false;

  if (existingOrg) {
    orgId = existingOrg.id;

    // Update if we have new information
    if (provider.website || provider.description) {
      await supabase
        .from('organizations')
        .update({
          website_url: provider.website,
          description: provider.description
        })
        .eq('id', orgId);
      console.log(`   📝 Updated organization`);
    }
  } else {
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: provider.name,
        description: provider.description,
        website_url: provider.website
      })
      .select('id')
      .single();

    if (orgError) {
      console.error(`   ❌ Organization error:`, orgError.message);
      return { created: false, updated: false };
    }

    orgId = newOrg!.id;
    orgCreated = true;
    console.log(`   ✅ Created organization`);
  }

  // Check if service exists
  const { data: existingService } = await supabase
    .from('services')
    .select('id, created_at')
    .eq('organization_id', orgId)
    .single();

  let serviceCreated = false;

  if (existingService) {
    // Update existing service with government verification
    await supabase
      .from('services')
      .update({
        description: provider.description,
        service_category: provider.categories,
        contact_phone: provider.phone,
        contact_email: provider.email,
        website_url: provider.website,
        location_city: provider.city,
        location_state: 'QLD',
        metadata: {
          government_verified: true,
          source: 'Queensland Department of Youth Justice',
          last_verified: new Date().toISOString()
        }
      })
      .eq('id', existingService.id);

    console.log(`   📝 Updated service with govt verification`);
  } else {
    // Create new service
    const { error: serviceError } = await supabase
      .from('services')
      .insert({
        name: provider.name,
        slug: provider.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 8),
        description: provider.description,
        program_type: 'support',
        service_category: provider.categories,
        organization_id: orgId,
        contact_phone: provider.phone,
        contact_email: provider.email,
        website_url: provider.website,
        location_city: provider.city,
        location_state: 'QLD',
        metadata: {
          government_verified: true,
          source: 'Queensland Department of Youth Justice',
          last_verified: new Date().toISOString()
        }
      });

    if (serviceError) {
      console.error(`   ❌ Service error:`, serviceError.message);
    } else {
      serviceCreated = true;
      console.log(`   ✅ Created service`);
    }
  }

  return { created: orgCreated || serviceCreated, updated: !orgCreated && !serviceCreated };
}

async function main() {
  console.log('============================================================');
  console.log('🏛️  IMPORTING GOVERNMENT SERVICE PROVIDERS');
  console.log('============================================================');
  console.log(`Source: Queensland Department of Youth Justice`);
  console.log(`Providers to import: ${GOVT_PROVIDERS.length}\n`);

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (let i = 0; i < GOVT_PROVIDERS.length; i++) {
    const name = GOVT_PROVIDERS[i];

    console.log(`\n[${i + 1}/${GOVT_PROVIDERS.length}] ${name}`);

    try {
      // Research the organization
      const providerData = await researchOrganization(name);

      // Import to database
      const result = await importProvider(providerData);

      if (result.created) created++;
      if (result.updated) updated++;

      // Rate limiting - be respectful
      if (i < GOVT_PROVIDERS.length - 1) {
        console.log('   ⏳ Waiting 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`   ❌ Error processing ${name}:`, error instanceof Error ? error.message : error);
      errors++;
    }
  }

  console.log('\n============================================================');
  console.log('🎉 IMPORT COMPLETE');
  console.log('============================================================');
  console.log(`✅ Providers processed: ${GOVT_PROVIDERS.length}`);
  console.log(`🆕 New services/orgs created: ${created}`);
  console.log(`📝 Existing updated: ${updated}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`📊 Success rate: ${Math.round((created + updated) / GOVT_PROVIDERS.length * 100)}%`);
}

main().catch(console.error);
