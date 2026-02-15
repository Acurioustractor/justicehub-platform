#!/usr/bin/env node
/**
 * Queensland Youth Justice Deep Dive - CORRECTED SOURCES
 *
 * Target the NEW Queensland youth justice website (youthjustice.qld.gov.au)
 * and recent government strategy documents
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

console.log('\n🔍 Queensland Youth Justice Deep Dive - CORRECTED SOURCES\n');
console.log('═'.repeat(80));

// CORRECTED QLD sources (new website + strategy docs)
const QLD_SOURCES = [
  // NEW Department website
  {
    name: 'QLD Youth Justice - All Programs',
    url: 'https://www.youthjustice.qld.gov.au/programs-initiatives/programs/all',
    category: 'Programs',
    priority: 'CRITICAL',
  },
  {
    name: 'QLD Youth Justice - Intensive Case Management',
    url: 'https://www.youthjustice.qld.gov.au/programs-initiatives/initiatives/icm',
    category: 'Programs',
    priority: 'CRITICAL',
  },
  {
    name: 'QLD Youth Justice - Strategy 2024-2028',
    url: 'https://www.youthjustice.qld.gov.au/our-department/strategies-reform/strategy',
    category: 'Policy',
    priority: 'CRITICAL',
  },
  {
    name: 'QLD Youth Justice - Changing the Story',
    url: 'https://www.youthjustice.qld.gov.au/our-department/strategies-reform/changing-story',
    category: 'Policy',
    priority: 'HIGH',
  },
  {
    name: 'QLD Youth Justice - Proven Initiatives',
    url: 'https://www.youthjustice.qld.gov.au/partnerships/partnerships/proven-initiatives',
    category: 'Programs',
    priority: 'CRITICAL',
  },
  {
    name: 'QLD Youth Justice - Aboriginal and Torres Strait Islander',
    url: 'https://www.youthjustice.qld.gov.au/parents-carers/aboriginal-torres-strait-islander',
    category: 'Indigenous',
    priority: 'CRITICAL',
  },
  {
    name: 'QLD Community-Based Crime Action Grants',
    url: 'https://www.youthjustice.qld.gov.au/partnerships/grants/compare/community-crime-action',
    category: 'Funding',
    priority: 'HIGH',
  },

  // AIHW - QLD-specific data
  {
    name: 'AIHW - QLD Youth Justice Programs 2023-24',
    url: 'https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-2023-24/contents/appendices/appendix-d-state-and-territory-systems',
    category: 'Evidence',
    priority: 'HIGH',
  },

  // Indigenous Justice resources
  {
    name: 'Indigenous Justice Clearinghouse - QLD Strategy',
    url: 'https://www.indigenousjustice.gov.au/resources/a-safer-queensland-queensland-youth-justice-strategy-2024-2028/',
    category: 'Indigenous',
    priority: 'HIGH',
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

  try {
    // Step 1: Scrape
    console.log(`   🔍 Scraping...`);
    const scrapeResult = await firecrawl.scrapeUrl(source.url, {
      formats: ['markdown'],
      onlyMainContent: true,
      waitFor: 3000, // Longer wait for dynamic content
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

      await new Promise((resolve) => setTimeout(resolve, 3000));
      continue;
    }

    const markdown = scrapeResult.markdown;
    console.log(`   ✅ Scraped ${markdown.length} characters`);

    if (markdown.length < 500) {
      console.log(`   ⚠️  Content is very sparse (${markdown.length} chars)`);
    }

    // Step 2: Extract with Claude
    console.log(`   🤖 Extracting Queensland programs...`);

    const extractionPrompt = `Extract ALMA entities from this Queensland youth justice document.

CONTEXT: Queensland, Australia - Department of Youth Justice and Victim Support
FOCUS: Recent programs (2024-2025), Indigenous initiatives, community-based services

DOCUMENT:
${markdown}

Extract and return a JSON object with these arrays:
- interventions: Programs, practices, or initiatives
- evidence: Research, evaluations, or data
- outcomes: Intended or measured results
- contexts: Place-based or cultural contexts

For INTERVENTIONS, prioritize:
- Program name (exact as stated)
- Type: Prevention, Diversion, Rehabilitation, Custody, Aftercare, Support
- Description: What it does (extract verbatim where possible)
- Target cohort: Who it serves
- Delivery model: How it's delivered
- Geographic scope: Where in QLD
- Funding source: If mentioned
- Recent changes: If mentioned

CRITICAL RULES:
- Extract ONLY what is explicitly stated
- Do NOT invent or infer
- Capture Queensland-specific details
- Pay special attention to Indigenous programs
- Note recent reforms or policy shifts (2024-2025)
- If multiple programs are listed, extract each one separately

Return ONLY valid JSON. No markdown, no explanation.`;

    let extraction;
    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 8192,
        temperature: 0.1,
        system: `You are an expert in Australian youth justice, specializing in Queensland.

Extract structured ALMA entities with precision. Focus on Queensland-specific programs and recent reforms.

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

      // Show programs
      if (extraction.interventions?.length > 0) {
        console.log(`\n   📋 Programs found:`);
        extraction.interventions.forEach((i) => {
          console.log(`      • ${i.name || 'Unnamed'}`);
          if (i.target_cohort) console.log(`        → ${i.target_cohort}`);
        });
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
          const { error } = await supabase.from('alma_evidence').insert({
            title: evidence.title || 'Untitled Queensland evidence',
            evidence_type: evidence.type || 'Government report',
            findings: evidence.findings || 'See source document',
            consent_level: 'Public Knowledge Commons',
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
          });

          if (!error) created++;
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
console.log(`✅ QUEENSLAND INGESTION COMPLETE\n`);
console.log(`📊 Summary:`);
console.log(`   • Sources attempted: ${QLD_SOURCES.length}`);
console.log(`   • Successful: ${successfulSources}`);
console.log(`   • Failed: ${failedSources}`);
console.log(`   • Total NEW entities: ${totalEntities}`);
console.log(`   • Estimated cost: $${totalCost.toFixed(2)}`);

console.log(`\n📋 By Source:`);
results.forEach((r) => {
  const status = r.success ? '✅' : '❌';
  const detail = r.success ? `${r.entities} entities` : `(failed)`;
  console.log(`   ${status} ${r.source}: ${detail}`);
});

// QLD totals
const { data: qldPrograms } = await supabase
  .from('alma_interventions')
  .select('*')
  .or('source_documents->>url.ilike.%youthjustice.qld.gov.au%,source_documents->>url.ilike.%qld.gov.au%');

console.log(`\n📊 Queensland Intelligence Base:`);
console.log(`   • Total QLD programs: ${qldPrograms?.length || 0}`);

if (qldPrograms && qldPrograms.length > 0) {
  console.log(`\n   🎯 Key Programs:`);
  qldPrograms.slice(0, 15).forEach((p) => {
    console.log(`   • ${p.name}`);
    if (p.metadata?.target_cohort) {
      console.log(`     → Target: ${p.metadata.target_cohort}`);
    }
  });
}

console.log(`\n✨ Queensland deep dive complete!\n`);
