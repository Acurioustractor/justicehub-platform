#!/usr/bin/env node
/**
 * ALMA Evidence Discovery Agent
 *
 * Searches the web for new evidence (research papers, government reports,
 * media articles, evaluations) about ALMA interventions and organisations.
 * Scrapes via Jina, extracts structured data via callLLM(), and inserts
 * into alma_evidence + alma_intervention_evidence.
 *
 * Usage:
 *   npx tsx scripts/alma-discover-sources.mjs                # dry-run (5 interventions)
 *   npx tsx scripts/alma-discover-sources.mjs --apply         # write to DB
 *   npx tsx scripts/alma-discover-sources.mjs --apply --batch 50
 *   npx tsx scripts/alma-discover-sources.mjs --apply --mode orgs   # search by org name
 *   npx tsx scripts/alma-discover-sources.mjs --apply --mode media  # search for media coverage
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
        .filter((l) => l && !l.startsWith('#') && l.includes('='))
        .forEach((l) => {
          const eqIdx = l.indexOf('=');
          const key = l.slice(0, eqIdx).trim();
          const val = l.slice(eqIdx + 1).trim();
          if (!env[key]) env[key] = val;
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
const batchSize = parseInt(args.find((_, i) => args[i - 1] === '--batch') || (applyMode ? '20' : '5'));
const mode = args.find((_, i) => args[i - 1] === '--mode') || 'interventions';

let callLLM, parseJSON, scrapeViaJina;

async function loadModules() {
  const { LLMClient } = await import('../src/lib/ai/model-router.ts');
  const parseJsonModule = await import('../src/lib/ai/parse-json.ts');
  const jinaModule = await import('../src/lib/scraping/jina-reader.ts');
  callLLM = (prompt, options) => LLMClient.getInstance().call(prompt, options);
  parseJSON = parseJsonModule.parseJSON;
  scrapeViaJina = jinaModule.scrapeViaJina;
}

// Search via Jina Search API
async function searchWeb(query) {
  try {
    const apiKey = process.env.JINA_API_KEY;
    const headers = { Accept: 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const response = await fetch(`https://s.jina.ai/${encodeURIComponent(query)}`, {
      headers,
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      console.warn(`[Search] HTTP ${response.status}`);
      return [];
    }
    const data = await response.json();
    return (data.data || []).slice(0, 5).map((r) => ({
      title: r.title || '',
      url: r.url || '',
      description: r.description || '',
    }));
  } catch (err) {
    console.warn(`[Search] Failed: ${err.message}`);
    return [];
  }
}

function buildSearchQuery(intervention, searchMode) {
  // Keep names short to avoid 422 errors — Jina has URL length limits
  const name = (intervention.name || '').substring(0, 60);
  const org = (intervention.operating_organization || '').substring(0, 40);
  const type = intervention.type || '';

  if (searchMode === 'media') {
    return `${name} ${org} youth justice Australia`;
  }
  if (searchMode === 'orgs') {
    return `${org} youth justice evaluation Australia`;
  }
  // Default: intervention-focused
  return `${name} ${type} evaluation outcomes Australia`;
}

function buildExtractionPrompt(searchResults, intervention) {
  return `You are an expert Australian youth justice researcher. Analyze these search results about the intervention "${intervention.name}" (type: ${intervention.type}, org: ${intervention.operating_organization || 'unknown'}).

For each result that contains genuine evidence (research papers, evaluations, government reports, media articles with data), extract:
- title: Short title for this evidence item
- evidence_type: One of "Program evaluation", "Case study", "Policy analysis", "Community-led research", "Quasi-experimental", "RCT (Randomized Control Trial)"
- url: The URL
- findings: 2-4 sentence summary of findings/evidence
- methodology: Brief description of methodology if identifiable (null otherwise)
- author: Author/organization name if identifiable (null otherwise)
- year: Publication year if identifiable (null otherwise)
- relevance_score: 0.0-1.0 how relevant this is to the intervention
- outcomes_mentioned: Array of outcome types if any (from: Reduced recidivism, Educational engagement, Community safety, Mental health/wellbeing, Diversion from justice system, Reduced detention/incarceration, Cultural connection, Family connection, Employment/training, Reduced substance use, System cost reduction, Healing/restoration)

SEARCH RESULTS:
${searchResults.map((r, i) => `[${i + 1}] Title: ${r.title}\nURL: ${r.url}\nSnippet: ${r.description}`).join('\n\n')}

Return JSON:
{
  "results": [
    {
      "title": "...",
      "evidence_type": "...",
      "url": "...",
      "findings": "...",
      "methodology": null,
      "author": null,
      "year": null,
      "relevance_score": 0.0,
      "outcomes_mentioned": []
    }
  ]
}

Only include results with relevance_score >= 0.4. Skip generic pages, directories, or irrelevant results. If no results are relevant, return {"results": []}.`;
}

async function main() {
  console.log(`\n🔍 ALMA Evidence Discovery Agent`);
  console.log('════════════════════════════════════════════════════════════');
  console.log(`Mode: ${applyMode ? 'APPLY (writing to DB)' : 'DRY RUN (preview only)'}`);
  console.log(`Search mode: ${mode}`);
  console.log(`Batch size: ${batchSize}\n`);

  await loadModules();

  // Get interventions that need more evidence, prioritized by portfolio score
  const { data: interventions, error: intErr } = await supabase
    .from('alma_interventions')
    .select('id, name, type, description, operating_organization, portfolio_score, geography')
    .order('portfolio_score', { ascending: false })
    .limit(1000);

  if (intErr) throw intErr;

  // Get existing evidence URLs to avoid duplicates
  const { data: existingEvidence } = await supabase
    .from('alma_evidence')
    .select('source_url');
  const existingUrls = new Set((existingEvidence || []).map((e) => e.source_url).filter(Boolean));

  // Get interventions with fewest evidence links
  const { data: evidenceCounts } = await supabase
    .from('alma_intervention_evidence')
    .select('intervention_id');
  const evCountMap = {};
  for (const link of evidenceCounts || []) {
    evCountMap[link.intervention_id] = (evCountMap[link.intervention_id] || 0) + 1;
  }

  // Prioritize: high-score interventions with few evidence links
  const candidates = interventions
    .map((i) => ({ ...i, evidenceCount: evCountMap[i.id] || 0 }))
    .sort((a, b) => {
      // Sort by: least evidence first, then highest score
      if (a.evidenceCount !== b.evidenceCount) return a.evidenceCount - b.evidenceCount;
      return (b.portfolio_score || 0) - (a.portfolio_score || 0);
    })
    .slice(0, batchSize);

  console.log(`Interventions loaded: ${interventions.length}`);
  console.log(`Existing evidence URLs: ${existingUrls.size}`);
  console.log(`Processing: ${candidates.length}\n`);

  let totalNewEvidence = 0;
  let totalNewLinks = 0;
  let searchCount = 0;
  let llmCalls = 0;

  for (let i = 0; i < candidates.length; i++) {
    const intervention = candidates[i];
    const query = buildSearchQuery(intervention, mode);

    process.stdout.write(`[${i + 1}/${candidates.length}] ${intervention.name.substring(0, 50)}... `);

    // Search
    const results = await searchWeb(query);
    searchCount++;

    if (results.length === 0) {
      console.log('no results');
      continue;
    }

    // Filter out already-known URLs
    const newResults = results.filter((r) => !existingUrls.has(r.url));
    if (newResults.length === 0) {
      console.log('all URLs already known');
      continue;
    }

    // Extract structured evidence via LLM
    const prompt = buildExtractionPrompt(newResults, intervention);
    let extracted;
    try {
      const raw = await callLLM(prompt, { maxTokens: 2000 });
      llmCalls++;
      extracted = parseJSON(raw);
      if (!extracted || !extracted.results) {
        console.log('LLM parse failed');
        continue;
      }
    } catch (err) {
      console.log(`LLM error: ${err.message}`);
      continue;
    }

    const validResults = (extracted.results || []).filter(
      (r) => r.relevance_score >= 0.4 && r.url && r.title && !existingUrls.has(r.url)
    );

    if (validResults.length === 0) {
      console.log('no relevant evidence found');
      continue;
    }

    console.log(`found ${validResults.length} evidence items`);

    if (!applyMode) {
      for (const ev of validResults) {
        console.log(`  → [${ev.source_type}] ${ev.title} (relevance: ${ev.relevance_score})`);
      }
      continue;
    }

    // Insert evidence + links
    for (const ev of validResults) {
      // Insert into alma_evidence (schema: title, evidence_type, findings, consent_level required)
      const evidenceType = ev.evidence_type || 'Case study';
      const validTypes = ['Program evaluation', 'Case study', 'Policy analysis', 'Community-led research', 'Quasi-experimental', 'RCT (Randomized Control Trial)'];
      const { data: inserted, error: insErr } = await supabase
        .from('alma_evidence')
        .insert({
          title: ev.title.substring(0, 500),
          evidence_type: validTypes.includes(evidenceType) ? evidenceType : 'Case study',
          findings: ev.findings || ev.title,
          source_url: ev.url,
          methodology: ev.methodology || null,
          author: ev.author || null,
          publication_date: ev.year ? `${ev.year}-01-01` : null,
          consent_level: 'Public Knowledge Commons',
          metadata: { auto_discovered: true, discovery_method: `alma-discover-sources/${mode}` },
        })
        .select('id')
        .single();

      if (insErr) {
        // Likely duplicate URL — skip
        console.log(`  ⚠️ Insert failed for ${ev.title}: ${insErr.message}`);
        continue;
      }

      existingUrls.add(ev.url);
      totalNewEvidence++;

      // Link to intervention
      const { error: linkErr } = await supabase
        .from('alma_intervention_evidence')
        .insert({
          intervention_id: intervention.id,
          evidence_id: inserted.id,
        });

      if (!linkErr) totalNewLinks++;

      // If outcomes mentioned, try to link those too
      if (ev.outcomes_mentioned && ev.outcomes_mentioned.length > 0) {
        for (const outcomeType of ev.outcomes_mentioned) {
          // Check if outcome already exists for this type + intervention
          const { data: existingOutcome } = await supabase
            .from('alma_outcomes')
            .select('id')
            .eq('outcome_type', outcomeType)
            .limit(1)
            .single();

          if (existingOutcome) {
            // Link existing outcome
            await supabase
              .from('alma_intervention_outcomes')
              .upsert({
                intervention_id: intervention.id,
                outcome_id: existingOutcome.id,
              }, { onConflict: 'intervention_id,outcome_id' })
              .select();
          }
        }
      }

      console.log(`  ✅ ${ev.title} → ${ev.source_type} (${ev.relevance_score})`);
    }

    // Rate limit between interventions
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log(`\n════════════════════════════════════════════════════════════`);
  console.log(`📊 Results`);
  console.log(`════════════════════════════════════════════════════════════`);
  console.log(`Searches: ${searchCount}`);
  console.log(`LLM calls: ${llmCalls}`);
  console.log(`New evidence created: ${totalNewEvidence}`);
  console.log(`New evidence links: ${totalNewLinks}`);
  console.log(`Remaining candidates: ${candidates.length - searchCount}`);
}

main().catch((err) => {
  console.error('Fatal:', err.message || err);
  process.exit(1);
});
