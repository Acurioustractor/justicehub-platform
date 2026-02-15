#!/usr/bin/env node
/**
 * ALMA Comprehensive Australian Youth Justice Ingestion
 *
 * Complete intelligence gathering across:
 * - All states/territories (NSW, NT, SA, WA, TAS, ACT)
 * - Indigenous-led sources (NATSILS, SNAICC, ALS)
 * - Evidence & outcomes (AIHW, research institutions)
 * - National frameworks
 *
 * Estimated cost: $7.60
 * Estimated time: 3-4 hours
 * Expected yield: 200+ interventions, 100+ evidence, 50+ outcomes
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

console.log('\n🌏 ALMA Comprehensive Australian Youth Justice Ingestion\n');
console.log('═'.repeat(80));

// COMPREHENSIVE SOURCE LIST
const SOURCES = [
  // ========================================
  // PHASE 1: NSW (Critical Gap)
  // ========================================
  {
    name: 'NSW - Youth Justice Overview',
    url: 'https://www.dcj.nsw.gov.au/service-providers/young-offenders.html',
    category: 'NSW Programs',
    priority: 'CRITICAL',
    state: 'NSW',
  },
  {
    name: 'NSW - Youth Justice Services',
    url: 'https://www.dcj.nsw.gov.au/children-and-families/youth-justice.html',
    category: 'NSW Programs',
    priority: 'CRITICAL',
    state: 'NSW',
  },
  {
    name: 'NSW - Juvenile Justice',
    url: 'https://www.dcj.nsw.gov.au/service-providers/children,-young-people-and-families/youth-justice.html',
    category: 'NSW Programs',
    priority: 'CRITICAL',
    state: 'NSW',
  },

  // ========================================
  // PHASE 1: NT (Critical for Pattern Analysis)
  // ========================================
  {
    name: 'NT - Youth Justice',
    url: 'https://tfhc.nt.gov.au/children-and-families/youth-justice',
    category: 'NT Programs',
    priority: 'CRITICAL',
    state: 'NT',
  },
  {
    name: 'NT - Youth Diversion',
    url: 'https://tfhc.nt.gov.au/children-and-families/youth-justice/youth-diversion',
    category: 'NT Programs',
    priority: 'HIGH',
    state: 'NT',
  },

  // ========================================
  // PHASE 1: Indigenous-Led Sources
  // ========================================
  {
    name: 'NATSILS - National Aboriginal and Torres Strait Islander Legal Services',
    url: 'https://www.natsils.org.au/',
    category: 'Indigenous',
    priority: 'CRITICAL',
    consent: 'Community Controlled',
  },
  {
    name: 'SNAICC - National Voice for Our Children',
    url: 'https://www.snaicc.org.au/',
    category: 'Indigenous',
    priority: 'CRITICAL',
    consent: 'Community Controlled',
  },
  {
    name: 'ALS NSW - Aboriginal Legal Service',
    url: 'https://www.alsnswact.org.au/youth_justice',
    category: 'Indigenous',
    priority: 'HIGH',
    state: 'NSW',
    consent: 'Community Controlled',
  },

  // ========================================
  // PHASE 2: Evidence & Outcomes (AIHW)
  // ========================================
  {
    name: 'AIHW - Youth Justice in Australia Overview',
    url: 'https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-2023-24/contents/about',
    category: 'Evidence',
    priority: 'CRITICAL',
  },
  {
    name: 'AIHW - Youth Detention Population',
    url: 'https://www.aihw.gov.au/reports/youth-justice/youth-detention-population-in-australia-2024/contents/about',
    category: 'Evidence',
    priority: 'CRITICAL',
  },
  {
    name: 'AIHW - Young People in Detention',
    url: 'https://www.aihw.gov.au/reports/youth-justice/youth-detention-population-in-australia-2024/contents/summary',
    category: 'Evidence',
    priority: 'HIGH',
  },

  // ========================================
  // PHASE 3: SA (Therapeutic Court Model)
  // ========================================
  {
    name: 'SA - Youth Justice',
    url: 'https://www.childprotection.sa.gov.au/department/youth-justice',
    category: 'SA Programs',
    priority: 'MEDIUM',
    state: 'SA',
  },
  {
    name: 'SA - Youth Court',
    url: 'https://www.courts.sa.gov.au/for-the-public/going-to-court/youth-court/',
    category: 'SA Programs',
    priority: 'MEDIUM',
    state: 'SA',
  },

  // ========================================
  // PHASE 3: WA (Regional Programs)
  // ========================================
  {
    name: 'WA - Youth Justice Services',
    url: 'https://www.wa.gov.au/organisation/department-of-justice/youth-justice-services',
    category: 'WA Programs',
    priority: 'MEDIUM',
    state: 'WA',
  },

  // ========================================
  // PHASE 3: TAS
  // ========================================
  {
    name: 'TAS - Youth Justice',
    url: 'https://www.justice.tas.gov.au/about/youth_justice',
    category: 'TAS Programs',
    priority: 'MEDIUM',
    state: 'TAS',
  },

  // ========================================
  // PHASE 3: ACT
  // ========================================
  {
    name: 'ACT - Youth Justice',
    url: 'https://www.communityservices.act.gov.au/justice-and-safety/youth-justice',
    category: 'ACT Programs',
    priority: 'MEDIUM',
    state: 'ACT',
  },
  {
    name: 'ACT - Restorative Justice',
    url: 'https://www.justice.act.gov.au/restorative-justice',
    category: 'ACT Programs',
    priority: 'MEDIUM',
    state: 'ACT',
  },

  // ========================================
  // PHASE 2: Research Institutions
  // ========================================
  {
    name: 'Jesuit Social Services - Youth Justice',
    url: 'https://jss.org.au/what-we-do/youth-justice/',
    category: 'Research',
    priority: 'HIGH',
  },
  {
    name: 'Jesuit Social Services - Thinking Outside Report',
    url: 'https://jss.org.au/what-we-do/advocacy-and-change/thinking-outside/',
    category: 'Evidence',
    priority: 'HIGH',
  },

  // ========================================
  // PHASE 4: National Frameworks
  // ========================================
  {
    name: 'Closing the Gap - Justice Targets',
    url: 'https://www.closingthegap.gov.au/national-agreement/targets',
    category: 'National Policy',
    priority: 'MEDIUM',
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
  console.log(`   State: ${source.state || 'National'}`);
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

DOCUMENT:
${markdown}

Extract and return a JSON object with these arrays:
- interventions: Programs, practices, or initiatives
- evidence: Research, evaluations, data, outcome studies
- outcomes: Measured results, recidivism data, success metrics
- contexts: Place-based or cultural contexts

INTERVENTION TYPES (use EXACT match):
- Prevention
- Early Intervention
- Diversion
- Therapeutic
- Wraparound Support
- Family Strengthening
- Cultural Connection
- Education/Employment
- Justice Reinvestment
- Community-Led

For INTERVENTIONS:
- name: Program name (exact)
- type: One of the 10 types above (EXACT)
- description: What it does
- target_cohort: Who it serves
- state: ${source.state || 'National'}

For EVIDENCE:
- title: Study/report name
- evidence_type: "Evaluation", "Research study", "Government report", "Outcome data"
- findings: Key findings or data points
- year: If mentioned

For OUTCOMES:
- name: Outcome being measured
- outcome_type: Type of outcome
- description: What was measured
- measurement: How measured (if stated)

For CONTEXTS:
- name: Place or community
- context_type: "Geographic", "Cultural", "Community"
- description: Context details

CRITICAL RULES:
- Extract ONLY what is explicitly stated
- Use EXACT type values for interventions
- Focus on Australian youth justice (10-17 year olds)
- Note Indigenous-specific programs
- Capture outcome data and evaluation findings

Return ONLY valid JSON. No markdown, no explanation.`;

    let extraction;
    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 8192,
        temperature: 0.1,
        system: `You are an expert in Australian youth justice systems.

CRITICAL: intervention "type" MUST be one of these EXACT strings:
Prevention, Early Intervention, Diversion, Therapeutic, Wraparound Support,
Family Strengthening, Cultural Connection, Education/Employment,
Justice Reinvestment, Community-Led

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
          if (intervention.funding_source) metadata.funding_source = intervention.funding_source;
          if (source.state) metadata.state = source.state;

          const { error } = await supabase.from('alma_interventions').insert({
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
          });

          if (!error) {
            created++;
            stats.interventions++;
          } else {
            console.log(`      ⚠️  Failed: ${intervention.name} - ${error.message}`);
          }
        } catch (err) {
          console.log(`      ⚠️  Exception: ${err.message}`);
        }
      }
    }

    // Store evidence
    if (extraction.evidence?.length > 0) {
      for (const evidence of extraction.evidence) {
        try {
          const metadata = {};
          if (evidence.year) metadata.year = evidence.year;
          if (source.state) metadata.state = source.state;

          const { error } = await supabase.from('alma_evidence').insert({
            title: evidence.title || 'Untitled evidence',
            evidence_type: evidence.evidence_type || evidence.type || 'Government report',
            findings: evidence.findings || evidence.key_findings || 'See source document',
            consent_level: source.consent || 'Public Knowledge Commons',
            metadata: Object.keys(metadata).length > 0 ? metadata : null,
          });

          if (!error) {
            created++;
            stats.evidence++;
          }
        } catch (err) {
          // Skip
        }
      }
    }

    // Store outcomes
    if (extraction.outcomes?.length > 0) {
      for (const outcome of extraction.outcomes) {
        try {
          const metadata = {};
          if (outcome.measurement) metadata.measurement = outcome.measurement;
          if (source.state) metadata.state = source.state;

          const { error } = await supabase.from('alma_outcomes').insert({
            name: outcome.name || 'Unnamed outcome',
            outcome_type: outcome.outcome_type || outcome.category || outcome.type || 'System improvement',
            description: outcome.description || outcome.name || 'No description',
            metadata: Object.keys(metadata).length > 0 ? metadata : null,
          });

          if (!error) {
            created++;
            stats.outcomes++;
          }
        } catch (err) {
          // Skip
        }
      }
    }

    // Store contexts
    if (extraction.contexts?.length > 0) {
      for (const context of extraction.contexts) {
        try {
          const metadata = {};
          if (context.significance) metadata.significance = context.significance;
          if (source.state) metadata.state = source.state;

          const { error } = await supabase.from('alma_community_contexts').insert({
            name: context.name || 'Community context',
            context_type: context.context_type || context.type || 'Geographic',
            description: context.description || context.name || 'No description',
            consent_level: source.consent || 'Public Knowledge Commons',
            metadata: Object.keys(metadata).length > 0 ? metadata : null,
          });

          if (!error) {
            created++;
            stats.contexts++;
          }
        } catch (err) {
          // Skip
        }
      }
    }

    console.log(`   ✅ Stored ${created} entities`);

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

console.log(`\n📋 Results by Category:`);
const byCategory = results.reduce((acc, r) => {
  if (!r.category) return acc;
  if (!acc[r.category]) acc[r.category] = { count: 0, entities: 0, success: 0 };
  acc[r.category].count++;
  acc[r.category].entities += r.entities || 0;
  if (r.success) acc[r.category].success++;
  return acc;
}, {});

Object.entries(byCategory).forEach(([cat, stats]) => {
  console.log(`   ${cat}: ${stats.success}/${stats.count} sources → ${stats.entities} entities`);
});

console.log(`\n📋 By State:`);
const byState = results.reduce((acc, r) => {
  const state = r.state || 'National';
  if (!acc[state]) acc[state] = { count: 0, entities: 0 };
  acc[state].count++;
  acc[state].entities += r.entities || 0;
  return acc;
}, {});

Object.entries(byState).forEach(([state, stats]) => {
  console.log(`   ${state}: ${stats.count} sources → ${stats.entities} entities`);
});

// Database totals
console.log(`\n📊 Database Totals (All States):`);
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

console.log(`\n🎯 Next Steps:`);
console.log(`   1. Review intelligence in Supabase dashboard`);
console.log(`   2. Run portfolio analysis across all states`);
console.log(`   3. Compare state approaches (VIC vs QLD vs NSW vs NT)`);
console.log(`   4. Identify patterns and signals`);
console.log(`   5. Prepare comprehensive intelligence report`);

console.log(`\n✨ ALMA intelligence base is now comprehensive!\n`);
