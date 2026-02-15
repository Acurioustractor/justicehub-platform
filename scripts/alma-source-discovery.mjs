#!/usr/bin/env node
/**
 * ALMA Source Discovery
 *
 * Uses Oochiumpa as exemplar to discover similar Aboriginal-led programs
 * via AI-powered link following and relevance scoring.
 *
 * Week 2 of 12-week ALMA plan.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Load environment
const env = readFileSync(join(root, '.env.local'), 'utf8')
  .split('\n')
  .filter((line) => line && !line.startsWith('#') && line.includes('='))
  .reduce((acc, line) => {
    const [key, ...values] = line.split('=');
    acc[key.trim()] = values.join('=').trim();
    return acc;
  }, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

console.log('\n🔍 ALMA Source Discovery');
console.log('═'.repeat(80));
console.log('\nUsing Oochiumpa patterns to discover similar Aboriginal-led programs\n');

// ==========================================
// STEP 1: Extract Oochiumpa Patterns
// ==========================================

async function extractOochiumpaPatterns() {
  console.log('📊 Step 1: Extracting Oochiumpa Patterns\n');

  // Get Oochiumpa intervention from database
  const { data: intervention, error } = await supabase
    .from('alma_interventions')
    .select('*, metadata')
    .eq('name', 'Oochiumpa Youth Services')
    .single();

  if (error || !intervention) {
    throw new Error('Oochiumpa intervention not found. Run integrate-oochiumpa-to-alma.mjs first.');
  }

  // Get linked outcomes
  const { data: outcomeLinks } = await supabase
    .from('alma_intervention_outcomes')
    .select('outcome_id')
    .eq('intervention_id', intervention.id);

  const outcomeIds = outcomeLinks?.map((l) => l.outcome_id) || [];

  const { data: outcomes } = await supabase
    .from('alma_outcomes')
    .select('name, outcome_type, indicators')
    .in('id', outcomeIds);

  // Extract patterns
  const patterns = {
    keywords: [
      'on-country',
      'cultural connection',
      'holistic youth support',
      'family healing',
      'wraparound support',
      'Aboriginal-owned',
      'Aboriginal-led',
      'community-controlled',
      'Elder involvement',
      'cultural safety',
      'Traditional Owners',
      'kinship',
      'cultural activities',
      'healing',
      'diversion',
      'youth empowerment',
    ],

    outcomes: {
      offending_reduction: '95% reduction in Operation Luna offending list',
      school_reengagement: '72% school re-engagement',
      program_retention: '89% retention rate',
      service_connections: '71 service referrals',
      mental_health: 'Emotional regulation, trauma coping',
      community_recognition: '10 external referral requests',
    },

    structure: {
      governance: 'Aboriginal Community Controlled Organisation',
      approach: 'Holistic, wraparound support',
      cultural_elements: ['On-country experiences', 'Elder involvement', 'Cultural activities'],
      location: 'Remote/regional (not urban)',
      funding_status: 'At-risk (underfunded despite proven outcomes)',
    },

    indicators: outcomes?.map((o) => o.indicators) || [],
  };

  console.log('✅ Oochiumpa patterns extracted:');
  console.log(`   Keywords: ${patterns.keywords.length} identified`);
  console.log(`   Outcomes: ${Object.keys(patterns.outcomes).length} categories`);
  console.log(`   Structure: Aboriginal-led, holistic, on-country`);
  console.log(`   Location: Remote/regional NT\n`);

  return { intervention, patterns };
}

// ==========================================
// STEP 2: Discover New Sources
// ==========================================

async function discoverNewSources(seedUrls, patterns, maxDepth = 2) {
  console.log('🌐 Step 2: Discovering New Sources\n');
  console.log(`Seed URLs: ${seedUrls.length}`);
  console.log(`Max depth: ${maxDepth} levels\n`);

  const discovered = {
    sources: [],
    programs: [],
    organizations: [],
  };

  for (const seedUrl of seedUrls) {
    console.log(`\n🔗 Following: ${seedUrl}`);

    try {
      // Use Claude to analyze page and extract relevant links
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: `You are analyzing a website to discover Aboriginal-led youth justice programs similar to Oochiumpa Youth Services.

OOCHIUMPA PATTERNS:
- Keywords: ${patterns.keywords.join(', ')}
- Outcomes: 95% offending reduction, 72% school re-engagement, holistic healing
- Structure: Aboriginal Community Controlled, on-country experiences, Elder involvement
- Location: Remote/regional (not urban)

TASK:
1. Identify if this page mentions youth justice programs, Aboriginal-led initiatives, or community services
2. Extract program names, organizations, and key outcomes
3. Find links to similar programs (score relevance 0-100)
4. Look for: "Programs", "Services", "About Us", "Community", "Youth"

URL: ${seedUrl}

Return JSON:
{
  "page_summary": "Brief description",
  "programs_mentioned": [
    {
      "name": "Program name",
      "organization": "Organization name",
      "relevance_score": 85,
      "why_relevant": "Reason",
      "outcomes_mentioned": ["Outcome 1", "Outcome 2"]
    }
  ],
  "relevant_links": [
    {
      "url": "https://...",
      "link_text": "Link text",
      "relevance_score": 90,
      "why_relevant": "Reason"
    }
  ],
  "organizations_found": [
    {
      "name": "Organization name",
      "type": "Aboriginal Community Controlled / Mainstream NGO / Government",
      "focus": "Youth justice / Child protection / Community services"
    }
  ]
}`,
          },
        ],
      });

      const analysisText = response.content[0].text;

      // Extract JSON from Claude's response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.log('   ⚠️  No JSON found in response');
        continue;
      }

      const analysis = JSON.parse(jsonMatch[0]);

      console.log(`   Summary: ${analysis.page_summary}`);
      console.log(`   Programs found: ${analysis.programs_mentioned?.length || 0}`);
      console.log(`   Organizations: ${analysis.organizations_found?.length || 0}`);
      console.log(`   Relevant links: ${analysis.relevant_links?.length || 0}`);

      // Store discovered programs
      if (analysis.programs_mentioned) {
        for (const program of analysis.programs_mentioned) {
          if (program.relevance_score >= 70) {
            // High relevance threshold
            discovered.programs.push({
              ...program,
              source_url: seedUrl,
              discovered_at: new Date().toISOString(),
            });
            console.log(`   ✅ Program: ${program.name} (${program.relevance_score}/100)`);
          }
        }
      }

      // Store discovered organizations
      if (analysis.organizations_found) {
        discovered.organizations.push(...analysis.organizations_found);
      }

      // Store discovered sources
      if (analysis.relevant_links) {
        for (const link of analysis.relevant_links) {
          if (link.relevance_score >= 75 && maxDepth > 1) {
            // Only follow high-relevance links
            discovered.sources.push({
              url: link.url,
              link_text: link.link_text,
              relevance_score: link.relevance_score,
              why_relevant: link.why_relevant,
              source_url: seedUrl,
              depth: 1,
            });
          }
        }
      }
    } catch (error) {
      console.error(`   ❌ Error analyzing ${seedUrl}:`, error.message);
    }
  }

  return discovered;
}

// ==========================================
// STEP 3: Score Program Similarity
// ==========================================

async function scoreProgramSimilarity(program, patterns) {
  // Calculate similarity to Oochiumpa model

  let score = 0;
  const reasons = [];

  // Keyword matching (40% of score)
  const programText = `${program.name} ${program.why_relevant} ${program.outcomes_mentioned?.join(' ')}`.toLowerCase();

  const keywordMatches = patterns.keywords.filter((kw) => programText.includes(kw.toLowerCase()));

  const keywordScore = (keywordMatches.length / patterns.keywords.length) * 40;
  score += keywordScore;

  if (keywordMatches.length > 0) {
    reasons.push(
      `Keywords matched: ${keywordMatches.slice(0, 3).join(', ')}${keywordMatches.length > 3 ? '...' : ''}`
    );
  }

  // Outcomes mentioned (30% of score)
  if (program.outcomes_mentioned && program.outcomes_mentioned.length > 0) {
    score += 30;
    reasons.push(`Outcomes documented: ${program.outcomes_mentioned.length}`);
  }

  // Aboriginal-led indicator (30% of score - highest priority)
  const isAboriginalLed =
    programText.includes('aboriginal') ||
    programText.includes('indigenous') ||
    programText.includes('community controlled') ||
    programText.includes('acco');

  if (isAboriginalLed) {
    score += 30;
    reasons.push('Aboriginal-led/community-controlled');
  }

  return {
    similarity_score: Math.round(score),
    reasons,
    classification:
      score >= 80 ? 'Very Similar' : score >= 60 ? 'Similar' : score >= 40 ? 'Somewhat Similar' : 'Different',
  };
}

// ==========================================
// STEP 4: Main Execution
// ==========================================

async function main() {
  // Step 1: Extract Oochiumpa patterns
  const { intervention, patterns } = await extractOochiumpaPatterns();

  // Step 2: Define seed URLs (NT focus for Week 2)
  const seedUrls = [
    'https://www.naaja.org.au', // North Australian Aboriginal Justice Agency
    'https://www.amsant.org.au', // Aboriginal Medical Services Alliance NT
    'https://www.apont.org.au', // Aboriginal Peak Organisations NT
    'https://www.cafs.org.au', // Central Australian Family Services
    // Add more NT Aboriginal organizations
  ];

  console.log('\n🌱 Seed URLs for Discovery:');
  seedUrls.forEach((url, i) => {
    console.log(`   ${i + 1}. ${url}`);
  });

  // Step 3: Discover new sources
  const discovered = await discoverNewSources(seedUrls, patterns, 2);

  console.log('\n\n📊 Discovery Results');
  console.log('═'.repeat(80));
  console.log(`\n✅ Programs Discovered: ${discovered.programs.length}`);
  console.log(`✅ Organizations Found: ${discovered.organizations.length}`);
  console.log(`✅ New Sources: ${discovered.sources.length}\n`);

  // Step 4: Score program similarity
  console.log('🎯 Scoring Program Similarity to Oochiumpa\n');

  for (const program of discovered.programs) {
    const similarity = await scoreProgramSimilarity(program, patterns);

    console.log(`\n📌 ${program.name}`);
    console.log(`   Organization: ${program.organization}`);
    console.log(`   Similarity: ${similarity.similarity_score}/100 (${similarity.classification})`);
    console.log(`   Reasons: ${similarity.reasons.join(', ')}`);

    if (program.outcomes_mentioned && program.outcomes_mentioned.length > 0) {
      console.log(`   Outcomes: ${program.outcomes_mentioned.join(', ')}`);
    }

    // Store in database (optional - for now just log)
    if (similarity.similarity_score >= 70) {
      console.log(`   ✅ RECOMMENDED for ALMA integration (high similarity)`);
    }
  }

  // Summary
  const verySimilar = discovered.programs.filter((p) => p.relevance_score >= 80);
  const similar = discovered.programs.filter((p) => p.relevance_score >= 60 && p.relevance_score < 80);

  console.log('\n\n📋 Summary');
  console.log('═'.repeat(80));
  console.log(`\n🔥 Very Similar to Oochiumpa: ${verySimilar.length}`);
  console.log(`✅ Similar to Oochiumpa: ${similar.length}`);
  console.log(`📝 Total Programs Discovered: ${discovered.programs.length}`);
  console.log(`🏢 Organizations Identified: ${discovered.organizations.length}`);
  console.log(`🔗 New Sources to Explore: ${discovered.sources.length}\n`);

  console.log('💡 Next Steps:');
  console.log('   1. Contact organizations with "Very Similar" programs for partnership');
  console.log('   2. Request consent to document programs in ALMA');
  console.log('   3. Follow new source links (depth 2) for comprehensive mapping');
  console.log('   4. Cross-reference with government reports (what is missing?)\n');

  console.log('✨ Discovery complete!\n');
}

// Run
main().catch(console.error);
