#!/usr/bin/env node
/**
 * ALMA Queue Processor v2
 *
 * Enhanced queue processor that:
 * - Uses Jina Reader (free) instead of Firecrawl-only
 * - Uses callLLM() rotation instead of direct Anthropic SDK
 * - Uses parseJSON() 7-stage parser
 * - Extracts interventions + evidence + outcomes (not just interventions)
 * - Auto-links organizations using Phase 1 fuzzy matching
 * - Processes in batches with checkpointing
 *
 * Usage:
 *   node scripts/alma-process-queue-v2.mjs                  # dry-run (first 10)
 *   node scripts/alma-process-queue-v2.mjs --apply           # process & save
 *   node scripts/alma-process-queue-v2.mjs --apply --batch 100
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnv() {
  const env = { ...process.env };
  const envPath = join(root, '.env.local');
  if (existsSync(envPath)) {
    try {
      const envFile = readFileSync(envPath, 'utf8');
      envFile
        .split('\n')
        .filter((line) => line && !line.startsWith('#') && line.includes('='))
        .forEach((line) => {
          const [key, ...values] = line.split('=');
          const trimmedKey = key.trim();
          if (!env[trimmedKey]) {
            env[trimmedKey] = values.join('=').trim();
          }
        });
    } catch {}
  }
  return env;
}

const env = loadEnv();
for (const [key, val] of Object.entries(env)) {
  if (!process.env[key]) process.env[key] = val;
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const args = process.argv.slice(2);
const applyMode = args.includes('--apply');
const batchSize = parseInt(args.find((_, i) => args[i - 1] === '--batch') || (applyMode ? '50' : '10'));

// Dynamic imports
let callLLM, parseJSON, scrapeViaJina, resetJinaFailures, shouldPreferFirecrawl;

async function loadModules() {
  const { LLMClient } = await import('../src/lib/ai/model-router.ts');
  const parseJsonModule = await import('../src/lib/ai/parse-json.ts');
  const jinaModule = await import('../src/lib/scraping/jina-reader.ts');
  callLLM = (prompt, options) => LLMClient.getInstance().call(prompt, options);
  parseJSON = parseJsonModule.parseJSON;
  scrapeViaJina = jinaModule.scrapeViaJina;
  resetJinaFailures = jinaModule.resetJinaFailures;
  shouldPreferFirecrawl = jinaModule.shouldPreferFirecrawl;
}

// ---------------------------------------------------------------------------
// Organization matching (from Phase 1)
// ---------------------------------------------------------------------------

function normalize(value) {
  if (!value) return '';
  return value.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

const ORG_STOPWORDS = new Set([
  'the', 'and', 'pty', 'ltd', 'limited', 'inc', 'incorporated',
  'co', 'company', 'services', 'service', 'council', 'program',
  'programs', 'foundation', 'association', 'organisation', 'organization',
  'australia', 'australian',
]);

function coreName(value) {
  const base = normalize(value);
  if (!base) return '';
  return base.split(' ').filter((t) => t && !ORG_STOPWORDS.has(t)).join(' ').trim();
}

function tokenOverlap(a, b) {
  const aT = new Set(normalize(a).split(' ').filter(Boolean));
  const bT = new Set(normalize(b).split(' ').filter(Boolean));
  if (aT.size === 0 || bT.size === 0) return 0;
  let inter = 0;
  for (const t of aT) if (bT.has(t)) inter++;
  return inter / Math.max(aT.size, bT.size);
}

let orgIndex = null;

async function loadOrgIndex() {
  const { data: orgs } = await supabase.from('organizations').select('id, name, slug');
  orgIndex = (orgs || []).map((org) => ({
    org,
    full: normalize(org.name),
    core: coreName(org.name),
    slug: normalize(org.slug || ''),
  }));
}

function findOrgMatch(orgName) {
  if (!orgIndex || !orgName) return null;
  const normFull = normalize(orgName);
  const normCore = coreName(orgName);

  // Exact
  for (const entry of orgIndex) {
    if (entry.full === normFull || entry.core === normCore || entry.slug === normFull) {
      return entry.org.id;
    }
  }

  // Substring
  for (const entry of orgIndex) {
    if (normFull.length >= 4 && entry.full.length >= 4) {
      if (normFull.includes(entry.full) || entry.full.includes(normFull)) {
        return entry.org.id;
      }
    }
  }

  // Token overlap
  let bestId = null;
  let bestScore = 0;
  for (const entry of orgIndex) {
    const score = tokenOverlap(normCore, entry.core);
    if (score >= 0.6 && score > bestScore) {
      bestScore = score;
      bestId = entry.org.id;
    }
  }

  return bestId;
}

// ---------------------------------------------------------------------------
// Extraction prompt
// ---------------------------------------------------------------------------

function buildExtractionPrompt(content, url) {
  return `Extract ALMA entities from this Australian youth justice web page.

URL: ${url}
CONTENT (truncated):
${content.substring(0, 6000)}

Extract and return a JSON object:
{
  "interventions": [
    {
      "name": "Program/initiative name (required)",
      "type": "One of: Prevention, Early Intervention, Diversion, Therapeutic, Cultural Connection, Community-Led, Wraparound Support, Education/Employment, Justice Reinvestment, Family Strengthening",
      "description": "2-3 sentence description (required)",
      "operating_organization": "Organization running this (if mentioned)",
      "geography": ["State/territory abbreviations, e.g. NSW, QLD"],
      "target_cohort": ["e.g. Aboriginal/Torres Strait Islander youth, 10-17 years"],
      "evidence_level": "Promising (community-endorsed, emerging evidence)|Effective (strong evaluation, positive outcomes)|Proven (RCT/quasi-experimental, replicated)|Indigenous-led (culturally grounded, community authority)|Untested (theory/pilot stage)",
      "website": "${url}"
    }
  ],
  "evidence": [
    {
      "title": "Research/report title (required)",
      "evidence_type": "RCT (Randomized Control Trial)|Quasi-experimental|Program evaluation|Longitudinal study|Case study|Community-led research|Lived experience|Cultural knowledge|Policy analysis",
      "organization": "Publishing organization",
      "findings": "Key findings summary",
      "publication_year": 2024
    }
  ],
  "outcomes": [
    {
      "name": "Specific outcome name (required)",
      "outcome_type": "Reduced detention/incarceration|Reduced recidivism|Diversion from justice system|Educational engagement|Employment/training|Family connection|Cultural connection|Mental health/wellbeing|Reduced substance use|Community safety|System cost reduction|Healing/restoration",
      "description": "Brief description"
    }
  ]
}

RULES:
- Only extract entities clearly described in the content
- Do NOT invent or infer data not stated
- If no entities of a type are found, return an empty array
- Return ONLY valid JSON`;
}

// ---------------------------------------------------------------------------
// Scraping
// ---------------------------------------------------------------------------

async function scrapeUrl(url) {
  // Try Jina first (free)
  if (!shouldPreferFirecrawl()) {
    const jinaContent = await scrapeViaJina(url);
    if (jinaContent) return jinaContent;
  }

  // Firecrawl fallback
  if (env.FIRECRAWL_API_KEY) {
    try {
      const { default: FirecrawlApp } = await import('@mendable/firecrawl-js');
      const firecrawl = new FirecrawlApp({ apiKey: env.FIRECRAWL_API_KEY });
      const result = await firecrawl.scrapeUrl(url, {
        formats: ['markdown'],
        onlyMainContent: true,
        timeout: 30000,
      });
      if (result.success && result.markdown) return result.markdown;
    } catch (err) {
      console.warn(`  [Firecrawl] Failed: ${err.message}`);
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log('\n🚀 ALMA Queue Processor v2');
console.log('═'.repeat(60));
console.log(`Mode: ${applyMode ? 'APPLY (writing to DB)' : 'DRY RUN (preview only)'}`);
console.log(`Batch size: ${batchSize}\n`);

async function main() {
  await loadModules();
  await loadOrgIndex();
  resetJinaFailures();

  // Get pending links
  const { data: pendingLinks, error } = await supabase
    .from('alma_discovered_links')
    .select('*')
    .eq('status', 'pending')
    .order('predicted_relevance', { ascending: false, nullsFirst: false })
    .limit(batchSize);

  if (error) throw error;

  if (!pendingLinks || pendingLinks.length === 0) {
    console.log('✅ No pending links in queue!');
    return;
  }

  console.log(`Processing ${pendingLinks.length} pending links...\n`);

  const stats = {
    processed: 0,
    scraped: 0,
    scrapeFailures: 0,
    interventions: 0,
    evidence: 0,
    outcomes: 0,
    orgLinks: 0,
    llmCalls: 0,
    errors: 0,
  };

  for (let i = 0; i < pendingLinks.length; i++) {
    const link = pendingLinks[i];
    const progress = `[${i + 1}/${pendingLinks.length}]`;
    console.log(`${progress} ${link.url.substring(0, 70)}...`);

    try {
      // Mark as queued
      if (applyMode) {
        await supabase
          .from('alma_discovered_links')
          .update({ status: 'queued' })
          .eq('id', link.id);
      }

      // Scrape
      const content = await scrapeUrl(link.url);
      if (!content || content.length < 300) {
        console.log(`  ⚠️ Content too short or failed`);
        if (applyMode) {
          await supabase
            .from('alma_discovered_links')
            .update({
              status: content ? 'rejected' : 'error',
              error_message: content ? 'Content too short' : 'Scrape failed',
            })
            .eq('id', link.id);
        }
        stats.scrapeFailures++;
        stats.processed++;
        continue;
      }

      stats.scraped++;
      const wordCount = content.split(/\s+/).length;
      console.log(`  📄 ${wordCount} words scraped`);

      // Extract via LLM
      let extracted;
      try {
        const prompt = buildExtractionPrompt(content, link.url);
        const response = await callLLM(prompt, {
          maxTokens: 4096,
          temperature: 0.2,
          systemPrompt: 'You are an expert in Australian youth justice. Extract structured data from web pages. Return only valid JSON.',
        });
        stats.llmCalls++;
        extracted = parseJSON(response);
      } catch (err) {
        console.log(`  ⚠️ LLM extraction failed: ${err.message}`);
        // Fall back to basic extraction (like old fast processor)
        extracted = {
          interventions: [{
            name: (link.title || link.url).substring(0, 200),
            description: content.substring(0, 500),
            type: 'Prevention',
            website: link.url,
            geography: ['National'],
          }],
          evidence: [],
          outcomes: [],
        };
      }

      // Valid evidence levels per DB constraint
      const VALID_EVIDENCE_LEVELS = [
        'Promising (community-endorsed, emerging evidence)',
        'Effective (strong evaluation, positive outcomes)',
        'Proven (RCT/quasi-experimental, replicated)',
        'Indigenous-led (culturally grounded, community authority)',
        'Untested (theory/pilot stage)',
      ];

      // Process interventions
      for (const intervention of extracted.interventions || []) {
        if (!intervention.name) continue;

        // Validate intervention type
        const VALID_TYPES = [
          'Prevention', 'Early Intervention', 'Diversion', 'Therapeutic',
          'Wraparound Support', 'Family Strengthening', 'Cultural Connection',
          'Education/Employment', 'Justice Reinvestment', 'Community-Led',
        ];
        if (!VALID_TYPES.includes(intervention.type)) {
          const match = VALID_TYPES.find(
            (t) => t.toLowerCase().includes((intervention.type || '').toLowerCase()) ||
              (intervention.type || '').toLowerCase().includes(t.toLowerCase())
          );
          intervention.type = match || 'Prevention';
        }

        // Validate evidence_level
        if (intervention.evidence_level && !VALID_EVIDENCE_LEVELS.includes(intervention.evidence_level)) {
          // Try fuzzy match
          const lower = intervention.evidence_level.toLowerCase();
          const match = VALID_EVIDENCE_LEVELS.find((v) => v.toLowerCase().includes(lower) || lower.includes(v.split(' (')[0].toLowerCase()));
          intervention.evidence_level = match || null;
        }

        // Auto-link org
        let orgId = null;
        if (intervention.operating_organization) {
          orgId = findOrgMatch(intervention.operating_organization);
          if (orgId) stats.orgLinks++;
        }

        if (applyMode) {
          const { data, error: insertErr } = await supabase
            .from('alma_interventions')
            .insert({
              name: intervention.name.substring(0, 200),
              description: intervention.description || content.substring(0, 500),
              type: intervention.type || 'Prevention',
              consent_level: 'Public Knowledge Commons',
              operating_organization: intervention.operating_organization || null,
              operating_organization_id: orgId,
              geography: intervention.geography || ['National'],
              target_cohort: intervention.target_cohort || null,
              evidence_level: intervention.evidence_level || null,
              website: intervention.website || link.url,
              source_documents: [{ url: link.url, scraped_at: new Date().toISOString() }],
              metadata: {
                from_queue_v2: true,
                source_link_id: link.id,
                word_count: wordCount,
              },
            })
            .select('id')
            .single();

          if (insertErr) {
            if (insertErr.code !== '23505') {
              console.log(`  ✗ Intervention: ${insertErr.message}`);
            }
          } else {
            stats.interventions++;
            console.log(`  💾 Intervention: ${intervention.name.substring(0, 50)}`);

            // Valid outcome types per DB constraint
            const VALID_OUTCOME_TYPES = [
              'Reduced detention/incarceration', 'Reduced recidivism', 'Diversion from justice system',
              'Educational engagement', 'Employment/training', 'Family connection', 'Cultural connection',
              'Mental health/wellbeing', 'Reduced substance use', 'Community safety',
              'System cost reduction', 'Healing/restoration',
            ];

            // Link outcomes to this intervention
            for (const outcome of extracted.outcomes || []) {
              if (!outcome.name || !outcome.outcome_type) continue;

              // Validate outcome_type against DB constraint
              if (!VALID_OUTCOME_TYPES.includes(outcome.outcome_type)) {
                const closest = VALID_OUTCOME_TYPES.find(
                  (t) => t.toLowerCase().includes(outcome.outcome_type.toLowerCase()) ||
                    outcome.outcome_type.toLowerCase().includes(t.toLowerCase())
                );
                if (closest) {
                  outcome.outcome_type = closest;
                } else {
                  continue; // skip invalid
                }
              }

              // Find or create outcome
              const { data: existingOutcome } = await supabase
                .from('alma_outcomes')
                .select('id')
                .eq('name', outcome.name)
                .eq('outcome_type', outcome.outcome_type)
                .limit(1);

              let outcomeId;
              if (existingOutcome && existingOutcome.length > 0) {
                outcomeId = existingOutcome[0].id;
              } else {
                const { data: newOutcome, error: oErr } = await supabase
                  .from('alma_outcomes')
                  .insert({
                    name: outcome.name,
                    outcome_type: outcome.outcome_type,
                    description: outcome.description || null,
                  })
                  .select('id')
                  .single();

                if (oErr) continue;
                outcomeId = newOutcome.id;
                stats.outcomes++;
              }

              await supabase
                .from('alma_intervention_outcomes')
                .insert({ intervention_id: data.id, outcome_id: outcomeId })
                .then(({ error: linkErr }) => {
                  if (linkErr && linkErr.code !== '23505') {
                    console.log(`    ✗ Outcome link: ${linkErr.message}`);
                  }
                });
            }
          }
        } else {
          console.log(`  [preview] Intervention: ${intervention.name.substring(0, 50)}`);
          stats.interventions++;
        }
      }

      // Valid evidence types per DB constraint
      const VALID_EVIDENCE_TYPES = [
        'RCT (Randomized Control Trial)', 'Quasi-experimental', 'Program evaluation',
        'Longitudinal study', 'Case study', 'Community-led research',
        'Lived experience', 'Cultural knowledge', 'Policy analysis',
      ];

      // Process evidence
      for (const evidence of extracted.evidence || []) {
        if (!evidence.title) continue;

        // Validate evidence_type
        let evType = evidence.evidence_type || 'Policy analysis';
        if (!VALID_EVIDENCE_TYPES.includes(evType)) {
          const match = VALID_EVIDENCE_TYPES.find(
            (t) => t.toLowerCase().includes(evType.toLowerCase()) || evType.toLowerCase().includes(t.split(' (')[0].toLowerCase())
          );
          evType = match || 'Policy analysis';
        }

        if (applyMode) {
          const { error: evErr } = await supabase
            .from('alma_evidence')
            .insert({
              title: evidence.title.substring(0, 300),
              evidence_type: evType,
              organization: evidence.organization || null,
              findings: evidence.findings || 'See source document.',
              consent_level: 'Public Knowledge Commons',
              metadata: { from_queue_v2: true, source_url: link.url },
            });

          if (evErr) {
            if (evErr.code !== '23505') {
              console.log(`  ✗ Evidence: ${evErr.message}`);
            }
          } else {
            stats.evidence++;
            console.log(`  📄 Evidence: ${evidence.title.substring(0, 50)}`);
          }
        } else {
          console.log(`  [preview] Evidence: ${evidence.title.substring(0, 50)}`);
          stats.evidence++;
        }
      }

      // Mark link as scraped
      if (applyMode) {
        await supabase
          .from('alma_discovered_links')
          .update({
            status: 'scraped',
            scraped_at: new Date().toISOString(),
            metadata: {
              ...link.metadata,
              scraped_at: new Date().toISOString(),
              word_count: wordCount,
              extracted_interventions: (extracted.interventions || []).length,
              extracted_evidence: (extracted.evidence || []).length,
              extracted_outcomes: (extracted.outcomes || []).length,
              processor: 'v2',
            },
          })
          .eq('id', link.id);
      }
    } catch (err) {
      console.log(`  ✗ Error: ${err.message}`);
      if (applyMode) {
        await supabase
          .from('alma_discovered_links')
          .update({ status: 'error', error_message: err.message })
          .eq('id', link.id);
      }
      stats.errors++;
    }

    stats.processed++;

    // Rate limiting
    if (i < pendingLinks.length - 1) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 Results');
  console.log('═'.repeat(60));
  console.log(`Processed: ${stats.processed}`);
  console.log(`Scraped: ${stats.scraped}`);
  console.log(`Scrape failures: ${stats.scrapeFailures}`);
  console.log(`LLM calls: ${stats.llmCalls}`);
  console.log(`New interventions: ${stats.interventions}`);
  console.log(`New evidence: ${stats.evidence}`);
  console.log(`New outcomes: ${stats.outcomes}`);
  console.log(`Org auto-links: ${stats.orgLinks}`);
  console.log(`Errors: ${stats.errors}`);

  if (!applyMode) {
    console.log('\n(dry-run — no changes written)');
    console.log('Run with --apply to write changes.');
  }

  // Remaining
  const { count: remaining } = await supabase
    .from('alma_discovered_links')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  console.log(`\nRemaining in queue: ${remaining || 0}`);
}

main().catch((err) => {
  console.error('Fatal:', err.message || err);
  process.exitCode = 1;
});
