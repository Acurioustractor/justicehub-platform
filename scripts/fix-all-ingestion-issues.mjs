#!/usr/bin/env node
/**
 * Fix All ALMA Ingestion Issues
 *
 * 1. Re-ingest Indigenous sources with cultural_authority
 * 2. Re-ingest Evidence/Outcomes with proper error handling
 * 3. Find and ingest better NSW sources
 * 4. Find and ingest better NT sources
 * 5. Add Tasmania sources
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

console.log('\n🔧 ALMA Ingestion Fixes - Complete Repair\n');
console.log('═'.repeat(80));

// COMPREHENSIVE SOURCE LIST WITH FIXES
const SOURCES = [
  // ========================================
  // FIX 1: Indigenous Sources (with cultural_authority)
  // ========================================
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

  // ========================================
  // FIX 3: Better NSW Sources
  // ========================================
  {
    name: 'NSW Youth Justice - Programs and Services',
    url: 'https://www.youthservicesnsw.org.au/',
    category: 'NSW Programs',
    priority: 'CRITICAL',
    state: 'NSW',
  },

  // ========================================
  // FIX 4: Better NT Sources
  // ========================================
  {
    name: 'NT Youth Justice - Programs',
    url: 'https://tfhc.nt.gov.au/youth-justice',
    category: 'NT Programs',
    priority: 'CRITICAL',
    state: 'NT',
  },

  // ========================================
  // FIX 5: Tasmania Sources
  // ========================================
  {
    name: 'TAS Youth Justice Services',
    url: 'https://www.communities.tas.gov.au/children/youth-justice',
    category: 'TAS Programs',
    priority: 'HIGH',
    state: 'TAS',
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
      console.log(`   ⚠️  Content is sparse (${markdown.length} chars)`);
    }

    // Step 2: Extract with Claude
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

INTERVENTION TYPES (use EXACT match):
Prevention, Early Intervention, Diversion, Therapeutic, Wraparound Support,
Family Strengthening, Cultural Connection, Education/Employment,
Justice Reinvestment, Community-Led

For each entity, extract all available fields.

Return ONLY valid JSON. No markdown, no explanation.`;

    let extraction;
    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 8192,
        temperature: 0.1,
        system: `You are an expert in Australian youth justice.
Extract structured entities with precision. Return valid JSON only.`,
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

    // Step 3: Store in database WITH FIXES
    let created = 0;

    // Store interventions (WITH cultural_authority for Indigenous sources)
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

          // ADD cultural_authority for Community Controlled sources
          if (source.cultural_authority) {
            insertData.cultural_authority = source.cultural_authority;
          }

          const { error } = await supabase.from('alma_interventions').insert(insertData);

          if (!error) {
            created++;
            stats.interventions++;
            console.log(`      ✅ ${intervention.name}`);
          } else {
            console.log(`      ❌ ${intervention.name}: ${error.message}`);
          }
        } catch (err) {
          console.log(`      ❌ Exception: ${err.message}`);
        }
      }
    }

    // Store evidence (WITH better error handling)
    if (extraction.evidence?.length > 0) {
      for (const evidence of extraction.evidence) {
        try {
          const metadata = {};
          if (evidence.year) metadata.year = evidence.year;
          if (source.state) metadata.state = source.state;

          const insertData = {
            title: evidence.title || 'Untitled evidence',
            evidence_type: evidence.evidence_type || evidence.type || 'Government report',
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
            console.log(`      ✅ Evidence: ${evidence.title}`);
          } else {
            console.log(`      ❌ Evidence failed: ${error.message}`);
            console.log(`         Data: ${JSON.stringify(insertData, null, 2)}`);
          }
        } catch (err) {
          console.log(`      ❌ Evidence exception: ${err.message}`);
        }
      }
    }

    // Store outcomes (WITH better error handling)
    if (extraction.outcomes?.length > 0) {
      for (const outcome of extraction.outcomes) {
        try {
          const metadata = {};
          if (outcome.measurement) metadata.measurement = outcome.measurement;
          if (source.state) metadata.state = source.state;

          const insertData = {
            name: outcome.name || 'Unnamed outcome',
            outcome_type: outcome.outcome_type || outcome.category || outcome.type || 'System improvement',
            description: outcome.description || outcome.name || 'No description',
            metadata: Object.keys(metadata).length > 0 ? metadata : null,
          };

          // Add optional fields
          if (outcome.measurement_method) insertData.measurement_method = outcome.measurement_method;
          if (outcome.indicators) insertData.indicators = outcome.indicators;
          if (outcome.time_horizon) insertData.time_horizon = outcome.time_horizon;

          const { error } = await supabase.from('alma_outcomes').insert(insertData);

          if (!error) {
            created++;
            stats.outcomes++;
            console.log(`      ✅ Outcome: ${outcome.name}`);
          } else {
            console.log(`      ❌ Outcome failed: ${error.message}`);
          }
        } catch (err) {
          console.log(`      ❌ Outcome exception: ${err.message}`);
        }
      }
    }

    // Store contexts (WITH cultural_authority for Indigenous)
    if (extraction.contexts?.length > 0) {
      for (const context of extraction.contexts) {
        try {
          const metadata = {};
          if (context.significance) metadata.significance = context.significance;
          if (source.state) metadata.state = source.state;

          const insertData = {
            name: context.name || 'Community context',
            context_type: context.context_type || context.type || 'Geographic',
            consent_level: source.consent || 'Public Knowledge Commons',
            metadata: Object.keys(metadata).length > 0 ? metadata : null,
          };

          // Add cultural_authority for Indigenous contexts
          if (source.cultural_authority) {
            insertData.cultural_authority = source.cultural_authority;
          }

          // Add optional fields
          if (context.description) insertData.system_factors = context.description;
          if (context.location) insertData.location = context.location;
          if (source.state) insertData.state = source.state;

          const { error } = await supabase.from('alma_community_contexts').insert(insertData);

          if (!error) {
            created++;
            stats.contexts++;
            console.log(`      ✅ Context: ${context.name}`);
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
console.log(`✅ INGESTION FIXES COMPLETE\n`);
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
  const detail = r.success ? `${r.entities} entities` : `(${r.error?.substring(0, 40) || 'failed'})`;
  console.log(`   ${status} ${r.source}: ${detail}`);
});

// Database totals
console.log(`\n📊 Database Totals (After Fixes):`);
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

console.log(`\n✨ ALMA fixes applied!\n`);
