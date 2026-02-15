#!/usr/bin/env node
/**
 * Queensland Youth Justice Deep Dive
 *
 * Comprehensive sweep of QLD programs, recent government initiatives,
 * and current policy approach to youth justice.
 *
 * Sources:
 * - QLD Youth Justice website (multiple pages)
 * - Department of Children, Youth Justice and Multicultural Affairs
 * - Recent policy announcements and reforms
 * - Government tenders and funded programs
 * - Indigenous-specific initiatives
 * - Community-based programs
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

console.log('\n🔍 Queensland Youth Justice Deep Dive\n');
console.log('═'.repeat(80));

// Comprehensive QLD sources
const QLD_SOURCES = [
  // Main department pages
  {
    name: 'QLD Youth Justice - Main',
    url: 'https://www.cyjma.qld.gov.au/youth-justice',
    category: 'Core',
    priority: 'HIGH',
  },
  {
    name: 'QLD Youth Justice - About',
    url: 'https://www.cyjma.qld.gov.au/youth-justice/about',
    category: 'Core',
    priority: 'HIGH',
  },
  {
    name: 'QLD Youth Justice - Programs and Services',
    url: 'https://www.cyjma.qld.gov.au/youth-justice/programs-services',
    category: 'Programs',
    priority: 'CRITICAL',
  },
  {
    name: 'QLD Youth Justice - Community-based Services',
    url: 'https://www.cyjma.qld.gov.au/youth-justice/community-based-services',
    category: 'Programs',
    priority: 'CRITICAL',
  },
  {
    name: 'QLD Youth Justice - Detention Services',
    url: 'https://www.cyjma.qld.gov.au/youth-justice/detention-services',
    category: 'Programs',
    priority: 'HIGH',
  },

  // Recent reforms and policy
  {
    name: 'QLD Youth Justice - Reforms',
    url: 'https://www.cyjma.qld.gov.au/youth-justice/reforms',
    category: 'Policy',
    priority: 'CRITICAL',
  },
  {
    name: 'QLD Youth Justice - Working Together Plan',
    url: 'https://www.cyjma.qld.gov.au/youth-justice/working-together',
    category: 'Policy',
    priority: 'HIGH',
  },

  // Indigenous programs
  {
    name: 'QLD Indigenous Youth Justice',
    url: 'https://www.cyjma.qld.gov.au/youth-justice/indigenous',
    category: 'Indigenous',
    priority: 'CRITICAL',
  },
  {
    name: 'QLD Aboriginal and Torres Strait Islander Programs',
    url: 'https://www.cyjma.qld.gov.au/resources/dcsyw/about-us/partners/aboriginal-torres-strait-islander',
    category: 'Indigenous',
    priority: 'HIGH',
  },

  // Diversion and prevention
  {
    name: 'QLD Youth Justice Conferencing',
    url: 'https://www.cyjma.qld.gov.au/youth-justice/conferencing',
    category: 'Diversion',
    priority: 'CRITICAL',
  },
  {
    name: 'QLD Restorative Justice',
    url: 'https://www.cyjma.qld.gov.au/youth-justice/restorative-justice',
    category: 'Diversion',
    priority: 'HIGH',
  },

  // Recent announcements (try common URL patterns)
  {
    name: 'QLD Media Releases - Youth Justice',
    url: 'https://statements.qld.gov.au/search?query=youth+justice&sort=date',
    category: 'Recent',
    priority: 'HIGH',
  },

  // Budget and funding
  {
    name: 'QLD Budget - Youth Justice',
    url: 'https://budget.qld.gov.au/files/bp2-2023-24.pdf',
    category: 'Funding',
    priority: 'MEDIUM',
    type: 'pdf',
  },
];

let totalEntities = 0;
let totalCost = 0;
const results = [];
let successfulSources = 0;
let failedSources = 0;

for (const source of QLD_SOURCES) {
  console.log(`\n${'─'.repeat(80)}`);
  console.log(`📄 ${source.name}`);
  console.log(`   Priority: ${source.priority}`);
  console.log(`   Category: ${source.category}`);
  console.log(`   URL: ${source.url}`);

  // Skip PDFs for now (need different handling)
  if (source.type === 'pdf') {
    console.log(`   ⏭️  Skipping PDF (requires special handling)`);
    results.push({ source: source.name, skipped: true, reason: 'PDF' });
    continue;
  }

  try {
    // Step 1: Scrape
    console.log(`   🔍 Scraping...`);
    const scrapeResult = await firecrawl.scrapeUrl(source.url, {
      formats: ['markdown'],
      onlyMainContent: true,
      waitFor: 2000, // Wait for dynamic content
    });

    if (!scrapeResult.success || !scrapeResult.markdown) {
      console.log(`   ⚠️  Scrape returned no content`);
      failedSources++;
      results.push({
        source: source.name,
        success: false,
        entities: 0,
        reason: 'No content returned'
      });

      // Wait before next request
      await new Promise((resolve) => setTimeout(resolve, 3000));
      continue;
    }

    const markdown = scrapeResult.markdown;
    console.log(`   ✅ Scraped ${markdown.length} characters`);

    // If very sparse, note it but continue
    if (markdown.length < 500) {
      console.log(`   ⚠️  Content is very sparse (${markdown.length} chars)`);
    }

    // Step 2: Extract with Claude - Enhanced prompt for QLD focus
    console.log(`   🤖 Extracting Queensland youth justice entities...`);

    const extractionPrompt = `Extract ALMA entities from this Queensland youth justice document.

CONTEXT: Queensland, Australia
FOCUS: Recent government programs, reforms, Indigenous initiatives, diversion programs

DOCUMENT:
${markdown.substring(0, 12000)} ${markdown.length > 12000 ? '... (truncated)' : ''}

Extract and return a JSON object with these arrays:
- interventions: Programs, practices, or initiatives addressing youth justice in Queensland
- evidence: Research, evaluations, or data supporting interventions
- outcomes: Intended or measured results from programs
- contexts: Place-based or cultural contexts specific to Queensland

For INTERVENTIONS, extract:
- name: Full program name
- type: One of (Prevention, Diversion, Rehabilitation, Custody, Aftercare, Support)
- description: What the program does (be specific about QLD approach)
- target_cohort: Who it serves (e.g., "Indigenous youth", "10-17 year olds")
- delivery_model: How it's delivered (e.g., "community-based", "residential")
- geographic_scope: Where in QLD (e.g., "Brisbane", "Regional QLD", "Statewide")
- funding_source: If mentioned (e.g., "QLD Government", "Federal co-funding")
- recent_changes: Any recent reforms or policy shifts mentioned

For EVIDENCE, extract:
- title: Study or report name
- findings: Key findings or data points
- year: If mentioned

For OUTCOMES, extract:
- name: Outcome being measured
- description: What success looks like
- measurement: How it's tracked (if mentioned)

For CONTEXTS, extract:
- name: Place or community name
- description: Cultural or geographic context
- significance: Why this context matters

CRITICAL RULES:
- Extract ONLY what is explicitly stated in the document
- Do NOT invent or infer data
- If a program is mentioned but details are sparse, extract what you have
- Pay special attention to Indigenous-specific programs
- Note any recent policy changes or reforms
- Capture Queensland-specific approaches that differ from other states

Return ONLY valid JSON. No markdown, no explanation.`;

    let extraction;
    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 8192, // Increased for detailed extraction
        temperature: 0.1, // Lower temp for more precise extraction
        system: `You are an expert in Australian youth justice systems, with specific knowledge of Queensland's approach.

You understand:
- Queensland's recent youth justice reforms
- Indigenous youth justice programs in QLD
- QLD's community-based service model
- Recent policy shifts and government priorities

Extract structured ALMA entities with precision. Focus on Queensland-specific details.

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

      // Show what was extracted
      if (extraction.interventions?.length > 0) {
        console.log(`\n   📋 Interventions found:`);
        extraction.interventions.slice(0, 5).forEach((i) => {
          console.log(`      • ${i.name || 'Unnamed'} (${i.type || 'Unknown type'})`);
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
          // Build metadata object for QLD-specific fields
          const metadata = {};
          if (intervention.target_cohort) metadata.target_cohort = intervention.target_cohort;
          if (intervention.delivery_model) metadata.delivery_model = intervention.delivery_model;
          if (intervention.geographic_scope) metadata.geographic_scope = intervention.geographic_scope;
          if (intervention.funding_source) metadata.funding_source = intervention.funding_source;
          if (intervention.recent_changes) metadata.recent_changes = intervention.recent_changes;

          const { error } = await supabase.from('alma_interventions').insert({
            name: intervention.name || 'Unnamed Queensland intervention',
            type: intervention.type || 'Prevention',
            description: intervention.description || intervention.name || 'No description available',
            consent_level: 'Public Knowledge Commons',
            review_status: 'Draft',
            source_documents: [{
              url: source.url,
              scraped_at: new Date().toISOString(),
              source_name: source.name,
              category: source.category,
            }],
            metadata: Object.keys(metadata).length > 0 ? metadata : null,
          });

          if (!error) {
            created++;
          } else {
            console.log(`      ⚠️  Failed to store: ${intervention.name} - ${error.message}`);
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
          const { error } = await supabase.from('alma_evidence').insert({
            title: evidence.title || 'Untitled Queensland evidence',
            evidence_type: evidence.type || 'Government report',
            findings: evidence.findings || evidence.key_findings || 'See source document',
            consent_level: 'Public Knowledge Commons',
            metadata: evidence.year ? { year: evidence.year } : null,
          });

          if (!error) created++;
        } catch (err) {
          // Skip
        }
      }
    }

    // Store outcomes
    if (extraction.outcomes?.length > 0) {
      for (const outcome of extraction.outcomes) {
        try {
          const { error } = await supabase.from('alma_outcomes').insert({
            name: outcome.name || 'Unnamed outcome',
            outcome_type: outcome.category || outcome.type || 'System improvement',
            description: outcome.description || outcome.name || 'No description',
            metadata: outcome.measurement ? { measurement: outcome.measurement } : null,
          });

          if (!error) created++;
        } catch (err) {
          // Skip
        }
      }
    }

    // Store contexts
    if (extraction.contexts?.length > 0) {
      for (const context of extraction.contexts) {
        try {
          const { error } = await supabase.from('alma_community_contexts').insert({
            name: context.name || 'Queensland context',
            context_type: context.type || 'Geographic',
            description: context.description || context.name || 'No description',
            consent_level: 'Public Knowledge Commons',
            metadata: context.significance ? { significance: context.significance } : null,
          });

          if (!error) created++;
        } catch (err) {
          // Skip
        }
      }
    }

    console.log(`   ✅ Stored ${created} entities in database`);

    totalEntities += created;
    totalCost += 0.05; // Estimate per source

    successfulSources++;
    results.push({
      source: source.name,
      category: source.category,
      priority: source.priority,
      success: true,
      entities: created,
      characters_scraped: markdown.length,
    });

    // Respectful rate limiting - longer pause for government sites
    console.log(`   ⏳ Waiting 5 seconds before next source...`);
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

    // Wait even on error
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}

// Summary
console.log(`\n${'═'.repeat(80)}`);
console.log(`✅ QUEENSLAND DEEP DIVE COMPLETE\n`);
console.log(`📊 Summary:`);
console.log(`   • Sources attempted: ${QLD_SOURCES.length}`);
console.log(`   • Successful: ${successfulSources}`);
console.log(`   • Failed: ${failedSources}`);
console.log(`   • Total entities created: ${totalEntities}`);
console.log(`   • Estimated cost: $${totalCost.toFixed(2)}`);

console.log(`\n📋 Results by Category:`);
const byCategory = results.reduce((acc, r) => {
  if (!r.category) return acc;
  if (!acc[r.category]) acc[r.category] = { count: 0, entities: 0 };
  acc[r.category].count++;
  acc[r.category].entities += r.entities || 0;
  return acc;
}, {});

Object.entries(byCategory).forEach(([cat, stats]) => {
  console.log(`   ${cat}: ${stats.count} sources → ${stats.entities} entities`);
});

console.log(`\n📋 By Source:`);
results.forEach((r) => {
  const status = r.success ? '✅' : r.skipped ? '⏭️' : '❌';
  const detail = r.skipped
    ? `(${r.reason})`
    : r.success
      ? `${r.entities} entities`
      : `(${r.error?.substring(0, 40) || 'failed'})`;
  console.log(`   ${status} ${r.source}: ${detail}`);
});

// Database totals
console.log(`\n📊 Database Totals (QLD + Previous):`);
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

console.log(`   • Interventions: ${interventionCount || 0}`);
console.log(`   • Evidence: ${evidenceCount || 0}`);
console.log(`   • Outcomes: ${outcomeCount || 0}`);
console.log(`   • Contexts: ${contextCount || 0}`);

// QLD-specific analysis
console.log(`\n🔍 Queensland-Specific Analysis:`);
const { data: qldInterventions } = await supabase
  .from('alma_interventions')
  .select('name, type, metadata')
  .ilike('name', '%queensland%')
  .or('source_documents->>url.ilike.%qld.gov.au%');

if (qldInterventions && qldInterventions.length > 0) {
  console.log(`   Found ${qldInterventions.length} Queensland-specific interventions`);
  console.log(`\n   Top programs:`);
  qldInterventions.slice(0, 10).forEach((i) => {
    console.log(`   • ${i.name} (${i.type})`);
    if (i.metadata?.target_cohort) {
      console.log(`     Target: ${i.metadata.target_cohort}`);
    }
  });
}

console.log(`\n🎯 Next Steps:`);
console.log(`   1. Review extracted QLD programs in Supabase dashboard`);
console.log(`   2. Compare QLD approach to VIC (patterns emerging?)`);
console.log(`   3. Identify QLD-specific Indigenous programs`);
console.log(`   4. Note recent policy shifts and reforms`);
console.log(`   5. Prepare QLD intelligence report`);

console.log(`\n✨ Queensland intelligence gathering complete!\n`);
