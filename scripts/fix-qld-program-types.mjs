#!/usr/bin/env node
/**
 * Fix Queensland Program Types
 *
 * Re-extract the 27 QLD programs with correct type mapping
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

console.log('\n🔧 Fixing Queensland Program Types\n');
console.log('═'.repeat(80));

const url = 'https://www.youthjustice.qld.gov.au/programs-initiatives/programs/all';

console.log(`\n📄 Re-scraping: ${url}\n`);

const scrapeResult = await firecrawl.scrapeUrl(url, {
  formats: ['markdown'],
  onlyMainContent: true,
  waitFor: 3000,
});

if (!scrapeResult.success || !scrapeResult.markdown) {
  console.log('❌ Scrape failed');
  process.exit(1);
}

console.log(`✅ Scraped ${scrapeResult.markdown.length} characters\n`);

console.log('🤖 Extracting with CORRECTED type mapping...\n');

const extractionPrompt = `Extract Queensland youth justice programs from this page.

DOCUMENT:
${scrapeResult.markdown}

CRITICAL: The "type" field MUST be one of these EXACT values:
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

MAPPING GUIDE:
- Programs for at-risk youth (before offending) → "Prevention"
- Programs for first-time or low-risk offenders → "Early Intervention"
- Programs diverting from court/detention → "Diversion"
- Counseling, mental health, trauma programs → "Therapeutic"
- Multi-service coordinated support → "Wraparound Support"
- Family-focused programs → "Family Strengthening"
- Indigenous/cultural programs → "Cultural Connection"
- School/training/job programs → "Education/Employment"
- Community-driven initiatives → "Community-Led"
- Alternative sentencing programs → "Justice Reinvestment"

For each program, extract:
{
  "name": "Exact program name",
  "type": "One of the 10 allowed types above (EXACT match required)",
  "description": "What the program does",
  "target_cohort": "Who it serves",
  "delivery_model": "How delivered",
  "geographic_scope": "Where in QLD"
}

Return ONLY valid JSON: {"interventions": [...]}

No markdown. No explanation.`;

const message = await anthropic.messages.create({
  model: 'claude-3-7-sonnet-20250219',
  max_tokens: 8192,
  temperature: 0,
  system: `You are extracting Queensland youth justice programs.

CRITICAL RULE: The "type" field MUST be one of these EXACT strings:
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

Any other type value will cause database insertion to FAIL.

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

const extraction = JSON.parse(cleaned);

console.log(`✅ Extracted ${extraction.interventions.length} programs\n`);

let created = 0;
let failed = 0;

for (const intervention of extraction.interventions) {
  try {
    const metadata = {};
    if (intervention.target_cohort) metadata.target_cohort = intervention.target_cohort;
    if (intervention.delivery_model) metadata.delivery_model = intervention.delivery_model;
    if (intervention.geographic_scope) metadata.geographic_scope = intervention.geographic_scope;

    const { error } = await supabase.from('alma_interventions').insert({
      name: intervention.name,
      type: intervention.type,
      description: intervention.description || intervention.name,
      consent_level: 'Public Knowledge Commons',
      review_status: 'Draft',
      source_documents: [{
        url,
        scraped_at: new Date().toISOString(),
        source_name: 'QLD Youth Justice - All Programs (Fixed)',
      }],
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
    });

    if (error) {
      console.log(`❌ ${intervention.name}: ${error.message}`);
      failed++;
    } else {
      console.log(`✅ ${intervention.name} (${intervention.type})`);
      created++;
    }
  } catch (err) {
    console.log(`❌ ${intervention.name}: ${err.message}`);
    failed++;
  }
}

console.log(`\n${'═'.repeat(80)}`);
console.log(`\n📊 Results:`);
console.log(`   • Total extracted: ${extraction.interventions.length}`);
console.log(`   • Successfully stored: ${created}`);
console.log(`   • Failed: ${failed}`);

// Show totals
const { count: totalQLD } = await supabase
  .from('alma_interventions')
  .select('*', { count: 'exact', head: true })
  .or('source_documents->>url.ilike.%youthjustice.qld.gov.au%,source_documents->>url.ilike.%qld.gov.au%');

console.log(`\n📊 Queensland Intelligence Base:`);
console.log(`   • Total QLD programs: ${totalQLD || 0}`);

console.log(`\n✨ Done!\n`);
