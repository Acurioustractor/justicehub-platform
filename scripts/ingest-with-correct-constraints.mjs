#!/usr/bin/env node
/**
 * ALMA Comprehensive Ingestion - With Correct Database Constraints
 *
 * Fixes:
 * 1. Evidence types must match: RCT, Quasi-experimental, Program evaluation, etc.
 * 2. Outcome types must match: Reduced detention, Reduced recidivism, etc.
 * 3. Context types must match: First Nations community, Remote community, etc.
 * 4. Contexts ALWAYS require cultural_authority (NOT NULL constraint)
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import FirecrawlApp from '@mendable/firecrawl-js';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Read .env.local
const env = readFileSync(join(root, '.env.local'), 'utf8')
  .split('\n')
  .filter((line) => line && !line.startsWith('#') && line.includes('='))
  .reduce((acc, line) => {
    const [key, ...values] = line.split('=');
    acc[key.trim()] = values.join('=').trim();
    return acc;
  }, {});

// Initialize services
const firecrawl = new FirecrawlApp({ apiKey: env.FIRECRAWL_API_KEY });
const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

console.log('\n📊 ALMA Comprehensive Ingestion - Correct Constraints\n');
console.log('═'.repeat(80));

// COMPREHENSIVE SOURCE LIST
const SOURCES = [
  // Indigenous sources (WITH cultural_authority)
  {
    name: 'NATSILS - National Aboriginal and Torres Strait Islander Legal Services',
    url: 'https://www.natsils.org.au/',
    category: 'Indigenous',
    priority: 'CRITICAL',
    consent: 'Community Controlled',
    cultural_authority: 'NATSILS National Board',
  },
  {
    name: 'SNAICC - National Voice for Our Children',
    url: 'https://www.snaicc.org.au/',
    category: 'Indigenous',
    priority: 'CRITICAL',
    consent: 'Community Controlled',
    cultural_authority: 'SNAICC Board',
  },
  {
    name: 'ALS NSW - Aboriginal Legal Service',
    url: 'https://www.alsnswact.org.au/youth_justice',
    category: 'Indigenous',
    priority: 'HIGH',
    state: 'NSW',
    consent: 'Community Controlled',
    cultural_authority: 'ALS NSW/ACT Board',
  },

  // NSW sources (better URLs from web search)
  {
    name: 'NSW Youth Justice Strategic Plan 2024-2030',
    url: 'https://www.nsw.gov.au/legal-and-justice/youth-justice/about/strategies/youth-justice-nsw-strategic-plan-2024-2030',
    category: 'NSW Programs',
    priority: 'CRITICAL',
    state: 'NSW',
  },
  {
    name: 'NSW Youth Justice Conferencing',
    url: 'https://childrenscourt.nsw.gov.au/criminal/youth-justice-conferencing.html',
    category: 'NSW Programs',
    priority: 'HIGH',
    state: 'NSW',
  },

  // NT sources (better URLs)
  {
    name: 'NT Youth Justice Programs',
    url: 'https://tfhc.nt.gov.au/youth-justice',
    category: 'NT Programs',
    priority: 'CRITICAL',
    state: 'NT',
  },
  {
    name: 'NT Youth Justice Conferencing',
    url: 'https://www.youthjustice.nt.gov.au/initiatives/youth-justice-conferencing-and-victim-support',
    category: 'NT Programs',
    priority: 'HIGH',
    state: 'NT',
  },

  // Tasmania sources
  {
    name: 'TAS Youth Justice Services',
    url: 'https://www.communities.tas.gov.au/children/youth-justice',
    category: 'TAS Programs',
    priority: 'HIGH',
    state: 'TAS',
  },

  // AIHW Evidence
  {
    name: 'AIHW Youth Justice in Australia 2023-24',
    url: 'https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-2023-24',
    category: 'Evidence',
    priority: 'CRITICAL',
  },

  // Research institutions
  {
    name: 'Jesuit Social Services - Youth Justice',
    url: 'https://jss.org.au/what-we-do/youth-justice/',
    category: 'Research',
    priority: 'HIGH',
  },
  {
    name: 'Closing the Gap - Justice Targets',
    url: 'https://www.closingthegap.gov.au/national-agreement/targets',
    category: 'Policy',
    priority: 'HIGH',
  },
];

let totalEntities = 0;
let totalCost = 0;
const results = [];
let successfulSources = 0;
let failedSources = 0;

const stats = {
  interventions: 0,
  evidence: 0,
  outcomes: 0,
  contexts: 0,
};

for (const source of SOURCES) {
  console.log(`\n${'─'.repeat(80)}`);
  console.log(`📄 ${source.name}`);
  console.log(`   Priority: ${source.priority}`);
  console.log(`   Category: ${source.category}`);
  if (source.state) console.log(`   State: ${source.state}`);
  if (source.cultural_authority) console.log(`   Cultural Authority: ${source.cultural_authority}`);
  console.log(`   URL: ${source.url}`);

  try {
    // Step 1: Scrape
    console.log(`   🔍 Scraping...`);
    const scrapeResult = await firecrawl.scrapeUrl(source.url, {
      formats: ['markdown'],
      onlyMainContent: true,
      waitFor: 3000,
    });

    if (!scrapeResult.success || !scrapeResult.markdown) {
      console.log(`   ⚠️  Scrape returned no content`);
      failedSources++;
      results.push({
        source: source.name,
        success: false,
        entities: 0,
        reason: 'No content returned',
      });

      await new Promise((resolve) => setTimeout(resolve, 3000));
      continue;
    }

    const markdown = scrapeResult.markdown;
    console.log(`   ✅ Scraped ${markdown.length} characters`);

    if (markdown.length < 500) {
      console.log(`   ⚠️  Content is sparse (${markdown.length} chars) - skipping`);
      failedSources++;
      results.push({
        source: source.name,
        success: false,
        entities: 0,
        reason: 'Sparse content',
      });
      await new Promise((resolve) => setTimeout(resolve, 3000));
      continue;
    }

    // Step 2: Extract with Claude WITH CORRECT CONSTRAINTS
    console.log(`   🤖 Extracting entities...`);

    const extractionPrompt = `Extract youth justice entities from this Australian document.

CONTEXT: ${source.state || 'Australia'} - ${source.category}
${source.consent ? 'CONSENT LEVEL: ' + source.consent : ''}
${source.cultural_authority ? 'CULTURAL AUTHORITY: ' + source.cultural_authority : ''}

DOCUMENT:
${markdown}

Extract and return a JSON object with these arrays:
- interventions: Programs, practices, or initiatives
- evidence: Research, evaluations, data, outcome studies
- outcomes: Measured results, recidivism data, success metrics
- contexts: Place-based or cultural contexts

CRITICAL CONSTRAINTS - Must use EXACT values:

INTERVENTION TYPES (EXACT match required):
Prevention, Early Intervention, Diversion, Therapeutic, Wraparound Support,
Family Strengthening, Cultural Connection, Education/Employment,
Justice Reinvestment, Community-Led

EVIDENCE TYPES (EXACT match required):
RCT (Randomized Control Trial), Quasi-experimental, Program evaluation,
Longitudinal study, Case study, Community-led research, Lived experience,
Cultural knowledge, Policy analysis

OUTCOME TYPES (EXACT match required):
Reduced detention/incarceration, Reduced recidivism, Diversion from justice system,
Educational engagement, Employment/training, Family connection, Cultural connection,
Mental health/wellbeing, Reduced substance use, Community safety,
System cost reduction, Healing/restoration

CONTEXT TYPES (EXACT match required):
First Nations community, Remote community, Regional area, Metro suburb,
Cultural community, Care system, Education setting

For each entity, extract all available fields matching these constraints.

Return ONLY valid JSON. No markdown, no explanation.`;

    let extraction;
    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 8192,
        temperature: 0.1,
        system: `You are an expert in Australian youth justice.
Extract structured entities with precision.
CRITICAL: Use ONLY the EXACT type values provided in the prompt.
If you cannot determine an exact match, use the closest match or skip that entity.
Return valid JSON only.`,
        messages: [{ role: 'user', content: extractionPrompt }],
      });

      const response = message.content[0];
      if (response.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      const cleaned = response.text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      extraction = JSON.parse(cleaned);

      console.log(`   ✅ Extracted:`);
      console.log(`      • ${extraction.interventions?.length || 0} interventions`);
      console.log(`      • ${extraction.evidence?.length || 0} evidence records`);
      console.log(`      • ${extraction.outcomes?.length || 0} outcomes`);
      console.log(`      • ${extraction.contexts?.length || 0} contexts`);

      if (extraction.interventions?.length > 0) {
        console.log(`\n   📋 Programs found:`);
        extraction.interventions.slice(0, 5).forEach((i) => {
          console.log(`      • ${i.name || 'Unnamed'}`);
        });
        if (extraction.interventions.length > 5) {
          console.log(`      ... and ${extraction.interventions.length - 5} more`);
        }
      }
    } catch (err) {
      console.error(`   ❌ Extraction failed: ${err.message}`);
      failedSources++;
      results.push({
        source: source.name,
        success: false,
        entities: 0,
        error: err.message,
      });

      await new Promise((resolve) => setTimeout(resolve, 3000));
      continue;
    }

    // Step 3: Store in database
    let created = 0;

    // Store interventions
    if (extraction.interventions?.length > 0) {
      for (const intervention of extraction.interventions) {
        try {
          const metadata = {};
          if (intervention.target_cohort) metadata.target_cohort = intervention.target_cohort;
          if (intervention.delivery_model) metadata.delivery_model = intervention.delivery_model;
          if (intervention.geographic_scope) metadata.geographic_scope = intervention.geographic_scope;
          if (source.state) metadata.state = source.state;

          const insertData = {
            name: intervention.name || 'Unnamed intervention',
            type: intervention.type || 'Prevention',
            description: intervention.description || intervention.name || 'No description',
            consent_level: source.consent || 'Public Knowledge Commons',
            review_status: 'Draft',
            source_documents: [{
              url: source.url,
              scraped_at: new Date().toISOString(),
              source_name: source.name,
              category: source.category,
              state: source.state,
            }],
            metadata: Object.keys(metadata).length > 0 ? metadata : null,
          };

          // Add cultural_authority for Community Controlled sources
          if (source.cultural_authority) {
            insertData.cultural_authority = source.cultural_authority;
          }

          const { error } = await supabase.from('alma_interventions').insert(insertData);

          if (!error) {
            created++;
            stats.interventions++;
          } else {
            console.log(`      ❌ Intervention failed: ${intervention.name}: ${error.message}`);
          }
        } catch (err) {
          console.log(`      ❌ Exception: ${err.message}`);
        }
      }
    }

    // Store evidence (WITH correct evidence_type)
    if (extraction.evidence?.length > 0) {
      for (const evidence of extraction.evidence) {
        try {
          const metadata = {};
          if (evidence.year) metadata.year = evidence.year;
          if (source.state) metadata.state = source.state;

          const insertData = {
            title: evidence.title || 'Untitled evidence',
            evidence_type: evidence.evidence_type || 'Program evaluation',
            findings: evidence.findings || evidence.key_findings || 'See source document',
            consent_level: source.consent || 'Public Knowledge Commons',
            metadata: Object.keys(metadata).length > 0 ? metadata : null,
          };

          // Add optional fields if present
          if (evidence.methodology) insertData.methodology = evidence.methodology;
          if (evidence.author) insertData.author = evidence.author;
          if (evidence.organization) insertData.organization = evidence.organization;
          if (evidence.source_url) insertData.source_url = evidence.source_url;

          const { error } = await supabase.from('alma_evidence').insert(insertData);

          if (!error) {
            created++;
            stats.evidence++;
          } else {
            console.log(`      ❌ Evidence failed: ${error.message}`);
          }
        } catch (err) {
          console.log(`      ❌ Evidence exception: ${err.message}`);
        }
      }
    }

    // Store outcomes (WITH correct outcome_type)
    if (extraction.outcomes?.length > 0) {
      for (const outcome of extraction.outcomes) {
        try {
          const metadata = {};
          if (outcome.measurement) metadata.measurement = outcome.measurement;
          if (source.state) metadata.state = source.state;

          const insertData = {
            name: outcome.name || 'Unnamed outcome',
            outcome_type: outcome.outcome_type || 'Reduced recidivism',
            description: outcome.description || outcome.name || 'No description',
            metadata: Object.keys(metadata).length > 0 ? metadata : null,
          };

          // Add optional fields
          if (outcome.measurement_method) insertData.measurement_method = outcome.measurement_method;
          if (outcome.indicators) insertData.indicators = outcome.indicators;
          if (outcome.time_horizon) insertData.time_horizon = outcome.time_horizon;
          if (outcome.beneficiary) insertData.beneficiary = outcome.beneficiary;

          const { error } = await supabase.from('alma_outcomes').insert(insertData);

          if (!error) {
            created++;
            stats.outcomes++;
          } else {
            console.log(`      ❌ Outcome failed: ${error.message}`);
          }
        } catch (err) {
          console.log(`      ❌ Outcome exception: ${err.message}`);
        }
      }
    }

    // Store contexts (WITH correct context_type AND cultural_authority ALWAYS)
    if (extraction.contexts?.length > 0) {
      for (const context of extraction.contexts) {
        try {
          const metadata = {};
          if (context.significance) metadata.significance = context.significance;
          if (source.state) metadata.state = source.state;

          const insertData = {
            name: context.name || 'Community context',
            context_type: context.context_type || 'Regional area',
            consent_level: source.consent || 'Public Knowledge Commons',
            // CRITICAL: cultural_authority is ALWAYS required
            cultural_authority: source.cultural_authority || 'Government source',
            metadata: Object.keys(metadata).length > 0 ? metadata : null,
          };

          // Add optional fields
          if (context.description) insertData.system_factors = context.description;
          if (context.location) insertData.location = context.location;
          if (source.state) insertData.state = source.state;
          if (context.population_size) insertData.population_size = context.population_size;

          const { error } = await supabase.from('alma_community_contexts').insert(insertData);

          if (!error) {
            created++;
            stats.contexts++;
          } else {
            console.log(`      ❌ Context failed: ${error.message}`);
          }
        } catch (err) {
          console.log(`      ❌ Context exception: ${err.message}`);
        }
      }
    }

    console.log(`   ✅ Stored ${created} entities total`);

    totalEntities += created;
    totalCost += 0.05;

    successfulSources++;
    results.push({
      source: source.name,
      category: source.category,
      state: source.state,
      success: true,
      entities: created,
    });

    // Rate limiting
    console.log(`   ⏳ Waiting 5 seconds...`);
    await new Promise((resolve) => setTimeout(resolve, 5000));

  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    failedSources++;
    results.push({
      source: source.name,
      success: false,
      entities: 0,
      error: err.message,
    });

    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}

// Summary
console.log(`\n${'═'.repeat(80)}`);
console.log(`✅ COMPREHENSIVE INGESTION COMPLETE\n`);
console.log(`📊 Summary:`);
console.log(`   • Sources attempted: ${SOURCES.length}`);
console.log(`   • Successful: ${successfulSources}`);
console.log(`   • Failed: ${failedSources}`);
console.log(`   • Total NEW entities: ${totalEntities}`);
console.log(`   • Estimated cost: $${totalCost.toFixed(2)}`);

console.log(`\n📊 Entities by Type:`);
console.log(`   • Interventions: ${stats.interventions}`);
console.log(`   • Evidence: ${stats.evidence}`);
console.log(`   • Outcomes: ${stats.outcomes}`);
console.log(`   • Contexts: ${stats.contexts}`);

console.log(`\n📋 Results by Source:`);
results.forEach((r) => {
  const status = r.success ? '✅' : '❌';
  const detail = r.success ? `${r.entities} entities` : `(${r.error?.substring(0, 40) || r.reason || 'failed'})`;
  console.log(`   ${status} ${r.source}: ${detail}`);
});

// Database totals
console.log(`\n📊 Database Totals (After Ingestion):`);
const { count: interventionCount } = await supabase
  .from('alma_interventions')
  .select('*', { count: 'exact', head: true });
const { count: evidenceCount } = await supabase
  .from('alma_evidence')
  .select('*', { count: 'exact', head: true });
const { count: outcomeCount } = await supabase
  .from('alma_outcomes')
  .select('*', { count: 'exact', head: true });
const { count: contextCount } = await supabase
  .from('alma_community_contexts')
  .select('*', { count: 'exact', head: true });

console.log(`   • Total Interventions: ${interventionCount || 0}`);
console.log(`   • Total Evidence: ${evidenceCount || 0}`);
console.log(`   • Total Outcomes: ${outcomeCount || 0}`);
console.log(`   • Total Contexts: ${contextCount || 0}`);

console.log(`\n✨ ALMA comprehensive ingestion complete!\n`);
