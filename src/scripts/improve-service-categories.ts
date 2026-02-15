#!/usr/bin/env node
/**
 * Improve service categories using AI analysis
 * Reviews service descriptions and assigns better categories
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const VALID_CATEGORIES = [
  'mental_health',
  'housing',
  'legal_aid',
  'advocacy',
  'cultural_support',
  'family_support',
  'education_training',
  'court_support',
  'substance_abuse',
  'employment',
  'health',
  'disability_support',
  'recreation',
  'life_skills'
];

async function analyzeCategories(serviceName: string, description: string, orgType: string): Promise<string[]> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Analyze this Queensland youth justice service and assign the most appropriate categories.

Service: ${serviceName}
Organization Type: ${orgType}
Description: ${description}

Available categories:
${VALID_CATEGORIES.join(', ')}

Return ONLY a JSON array of 1-3 most relevant categories. Example: ["mental_health", "family_support"]

Categories:`
      }]
    });

    const content = message.content[0];
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        const categories = JSON.parse(jsonMatch[0]);
        // Validate categories
        return categories.filter((c: string) => VALID_CATEGORIES.includes(c));
      }
    }

    return ['support'];
  } catch (error) {
    console.error(`❌ Error analyzing categories:`, error instanceof Error ? error.message : error);
    return ['support'];
  }
}

async function main() {
  console.log('============================================================');
  console.log('🤖 AI-POWERED CATEGORY IMPROVEMENT');
  console.log('============================================================\n');

  // Get services with only 'support' category
  const { data: services, error } = await supabase
    .from('services')
    .select('id, name, description, service_category, organizations(name)')
    .limit(200); // Process 200 services

  if (error) {
    console.error('❌ Error fetching services:', error);
    return;
  }

  const needsImprovement = services?.filter(s =>
    s.service_category?.length === 1 && s.service_category[0] === 'support'
  ) || [];

  console.log(`📊 Found ${needsImprovement.length} services needing category improvement\n`);

  let improved = 0;
  let failed = 0;

  for (const service of needsImprovement) {
    const orgName = (service.organizations as any)?.name || 'Unknown';
    const orgType = service.description?.split(' - ')[0] || '';

    console.log(`\n[${improved + failed + 1}/${needsImprovement.length}] ${service.name}`);
    console.log(`Organization: ${orgName}`);
    console.log(`Description: ${service.description}`);

    const newCategories = await analyzeCategories(
      service.name,
      service.description || '',
      orgType
    );

    console.log(`🏷️  Suggested categories: ${newCategories.join(', ')}`);

    if (newCategories.length > 0 && !(newCategories.length === 1 && newCategories[0] === 'support')) {
      // Update service with new categories
      const { error: updateError } = await supabase
        .from('services')
        .update({ service_category: newCategories })
        .eq('id', service.id);

      if (updateError) {
        console.error(`❌ Failed to update:`, updateError);
        failed++;
      } else {
        console.log(`✅ Updated categories`);
        improved++;
      }
    } else {
      console.log(`⚠️  No better categories found`);
      failed++;
    }

    // Rate limiting (1 request per 2 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n============================================================');
  console.log('🎉 CATEGORY IMPROVEMENT COMPLETE');
  console.log('============================================================');
  console.log(`✅ Successfully improved: ${improved}`);
  console.log(`❌ Failed or no change: ${failed}`);
  console.log(`📊 Total processed: ${improved + failed}`);
}

main().catch(console.error);
