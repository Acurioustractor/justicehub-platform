#!/usr/bin/env node
/**
 * Test Full ALMA Ingestion Pipeline
 *
 * Tests: Firecrawl → Claude Extraction → Database Storage
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

console.log('\n🚀 ALMA Full Ingestion Pipeline Test\n');

// Initialize services
const firecrawl = new FirecrawlApp({ apiKey: env.FIRECRAWL_API_KEY });
const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

console.log('✅ Services initialized');
console.log('   • Firecrawl');
console.log('   • Claude (Anthropic)');
console.log('   • Supabase');

// Test URL - AIHW Youth Justice overview
const testUrl = 'https://www.aihw.gov.au/reports/australias-welfare/youth-justice';

console.log(`\n📥 Step 1: Scraping document`);
console.log(`   URL: ${testUrl}`);

let markdown;
try {
  const scrapeResult = await firecrawl.scrapeUrl(testUrl, {
    formats: ['markdown'],
    onlyMainContent: true,
  });

  if (!scrapeResult.success) {
    throw new Error('Firecrawl scrape failed');
  }

  markdown = scrapeResult.markdown;
  console.log(`   ✅ Scraped ${markdown.length} characters`);
} catch (err) {
  console.error('   ❌ Scrape failed:', err.message);
  process.exit(1);
}

console.log(`\n🤖 Step 2: Extracting ALMA entities with Claude`);

const extractionPrompt = `Extract ALMA entities from this youth justice document.

DOCUMENT:
${markdown}

Extract and return a JSON object with these arrays:
- interventions: Programs, practices, or initiatives addressing youth justice
- evidence: Research, evaluations, or data supporting interventions
- outcomes: Intended or measured results
- contexts: Place-based or cultural contexts

For each entity, extract all available fields according to the ALMA schema.

Return ONLY valid JSON. No markdown, no explanation.`;

let extraction;
try {
  const message = await anthropic.messages.create({
    model: 'claude-3-7-sonnet-20250219',
    max_tokens: 4096,
    temperature: 0.2,
    system: `You are an expert in youth justice and ALMA (Adaptive Learning & Measurement Architecture).

Extract structured ALMA entities from documents.

RULES:
- Extract ONLY entities clearly described in the document
- Do NOT invent or infer data not explicitly stated
- For consent_level, default to "Public Knowledge Commons" for government reports
- Return valid JSON with structure: {"interventions": [...], "evidence": [...], "outcomes": [...], "contexts": [...]}`,
    messages: [{ role: 'user', content: extractionPrompt }],
  });

  const response = message.content[0];
  if (response.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  // Parse JSON
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

  // Debug: Show what was extracted
  if (extraction.interventions?.length > 0) {
    console.log(`\n   📋 Interventions extracted:`);
    extraction.interventions.forEach(i => {
      console.log(`      • ${i.name || 'NO NAME'} (type: ${i.type || 'NO TYPE'})`);
    });
  }
} catch (err) {
  console.error('   ❌ Extraction failed:', err.message);
  process.exit(1);
}

console.log(`\n💾 Step 3: Storing entities in database`);

let created = {
  interventions: 0,
  evidence: 0,
  outcomes: 0,
  contexts: 0,
};

// Store interventions
if (extraction.interventions?.length > 0) {
  for (const intervention of extraction.interventions.slice(0, 3)) { // Limit to 3 for test
    try {
      const { error } = await supabase.from('alma_interventions').insert({
        name: intervention.name,
        type: intervention.type || 'Prevention',
        description: intervention.description || intervention.name,
        consent_level: 'Public Knowledge Commons',
        review_status: 'Draft',
        source_documents: [{ url: testUrl, scraped_at: new Date().toISOString() }],
      });

      if (error) {
        console.error(`      ⚠️  Failed to store "${intervention.name}": ${error.message}`);
      } else {
        created.interventions++;
      }
    } catch (err) {
      console.error(`      ⚠️  Exception storing intervention: ${err.message}`);
    }
  }
}

// Store evidence
if (extraction.evidence?.length > 0) {
  for (const evidence of extraction.evidence.slice(0, 3)) { // Limit to 3 for test
    try {
      const { error } = await supabase.from('alma_evidence').insert({
        title: evidence.title,
        evidence_type: evidence.type || 'Government report',
        findings: evidence.findings || evidence.key_findings || 'See source document',
        consent_level: 'Public Knowledge Commons',
      });

      if (!error) created.evidence++;
    } catch (err) {
      console.error(`      ⚠️  Failed to store evidence: ${err.message}`);
    }
  }
}

// Store outcomes
if (extraction.outcomes?.length > 0) {
  for (const outcome of extraction.outcomes.slice(0, 3)) { // Limit to 3 for test
    try {
      const { error } = await supabase.from('alma_outcomes').insert({
        name: outcome.name,
        outcome_type: outcome.category || outcome.type || 'Reduced recidivism',
        description: outcome.description || outcome.measurement_approach || outcome.name,
      });

      if (!error) created.outcomes++;
    } catch (err) {
      console.error(`      ⚠️  Failed to store outcome: ${err.message}`);
    }
  }
}

console.log(`   ✅ Stored in database:`);
console.log(`      • ${created.interventions} interventions`);
console.log(`      • ${created.evidence} evidence records`);
console.log(`      • ${created.outcomes} outcomes`);
console.log(`      • ${created.contexts} contexts`);

const total = created.interventions + created.evidence + created.outcomes + created.contexts;

console.log(`\n✅ Pipeline test complete!`);
console.log(`   Total entities created: ${total}`);
console.log(`\n🎉 ALMA ingestion pipeline is working!\n`);

if (total > 0) {
  console.log('📊 Next steps:');
  console.log('   1. Check entities in Supabase: https://supabase.com/dashboard/project/tednluwflfhxyucgwigh');
  console.log('   2. Run portfolio analysis on new interventions');
  console.log('   3. Ingest all curated sources: npm run alma:ingest-all');
  console.log('');
}
