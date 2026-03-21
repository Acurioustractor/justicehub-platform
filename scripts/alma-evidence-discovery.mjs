#!/usr/bin/env node
/**
 * ALMA Evidence Discovery — standalone batch runner
 *
 * Searches web for evidence about interventions with the fewest evidence links.
 * Uses the same LLM + web search pipeline as the cron endpoint but runs locally.
 *
 * Usage:
 *   node scripts/alma-evidence-discovery.mjs              # dry-run (5 interventions)
 *   node scripts/alma-evidence-discovery.mjs --apply       # write to DB
 *   node scripts/alma-evidence-discovery.mjs --apply --batch 20 --mode media
 *
 * Modes: interventions (default), orgs, media
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
    readFileSync(envPath, 'utf8')
      .split('\n')
      .filter((l) => l && l[0] !== '#' && l.includes('='))
      .forEach((l) => {
        const eq = l.indexOf('=');
        const key = l.slice(0, eq).trim();
        const val = l.slice(eq + 1).trim();
        if (!env[key]) env[key] = val;
      });
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const batchSize = parseInt(args.find((_, i) => args[i - 1] === '--batch') || '5');
const mode = args.find((_, i) => args[i - 1] === '--mode') || 'media';

const EVIDENCE_TYPES = [
  'Program evaluation', 'Case study', 'Policy analysis',
  'Community-led research', 'Quasi-experimental',
  'RCT (Randomized Control Trial)', 'Government report', 'Media coverage',
];

const PROVIDERS = [
  { name: 'groq', key: env.GROQ_API_KEY, url: 'https://api.groq.com/openai/v1/chat/completions', model: 'llama-3.3-70b-versatile' },
  { name: 'gemini', key: env.GEMINI_API_KEY, url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', model: 'gemini-2.5-flash' },
  { name: 'openai', key: env.OPENAI_API_KEY, url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini' },
];

const SEARCH_PROVIDERS = [
  { name: 'serper', key: env.SERPER_API_KEY, search: searchSerper },
  { name: 'brave', key: env.BRAVE_SEARCH_API_KEY, search: searchBrave },
];

async function searchSerper(query) {
  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-KEY': env.SERPER_API_KEY },
    body: JSON.stringify({ q: query, num: 8 }),
  });
  if (!res.ok) throw new Error(`Serper ${res.status}`);
  const data = await res.json();
  return (data.organic || []).map((r) => ({
    title: r.title, url: r.link, description: r.snippet || '',
  }));
}

async function searchBrave(query) {
  const res = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=8`, {
    headers: { 'Accept': 'application/json', 'Accept-Encoding': 'gzip', 'X-Subscription-Token': env.BRAVE_SEARCH_API_KEY },
  });
  if (!res.ok) throw new Error(`Brave ${res.status}`);
  const data = await res.json();
  return (data.web?.results || []).map((r) => ({
    title: r.title, url: r.url, description: r.description || '',
  }));
}

async function searchWeb(query) {
  for (const provider of SEARCH_PROVIDERS) {
    if (!provider.key) continue;
    try {
      return await provider.search(query);
    } catch (err) {
      console.warn(`  [${provider.name}] failed: ${err.message}`);
    }
  }
  return [];
}

async function callLLM(prompt) {
  for (const provider of PROVIDERS) {
    if (!provider.key) continue;
    try {
      const res = await fetch(provider.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.key}` },
        body: JSON.stringify({
          model: provider.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 3000,
          temperature: 0.1,
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || '';
      return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    } catch { continue; }
  }
  throw new Error('All LLM providers failed');
}

function extractJSON(text) {
  // Strip think blocks + markdown fences first
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '');
  cleaned = cleaned.replace(/```(?:json|JSON)?\s*\n?/g, '').replace(/```\s*$/gm, '').trim();
  try { return JSON.parse(cleaned); } catch {}
  // Extract first JSON object or array
  const objMatch = cleaned.match(/(\{[\s\S]*\})/);
  const arrMatch = cleaned.match(/(\[[\s\S]*\])/);
  const extracted = objMatch?.[1] ?? arrMatch?.[1];
  if (extracted) {
    const fixed = extracted.replace(/,\s*([}\]])/g, '$1');
    try { return JSON.parse(fixed); } catch {}
  }
  // Truncated JSON — try to salvage by closing open brackets
  // Remove everything after the last complete object/array element
  let truncated = cleaned;
  // Remove partial trailing object (incomplete {...)
  truncated = truncated.replace(/,?\s*\{(?:[^{}]*(?:\{[^{}]*\})*)*[^}]*$/, '');
  // Remove partial trailing string
  truncated = truncated.replace(/,?\s*"[^"]*$/, '');
  truncated = truncated.replace(/,\s*([}\]])/g, '$1');
  // Count remaining open/close and add closers
  const ob = (truncated.match(/\[/g) || []).length - (truncated.match(/\]/g) || []).length;
  const oc = (truncated.match(/\{/g) || []).length - (truncated.match(/\}/g) || []).length;
  if (ob > 0 || oc > 0) {
    truncated += ']'.repeat(Math.max(0, ob)) + '}'.repeat(Math.max(0, oc));
    try { return JSON.parse(truncated); } catch {}
  }
  return null;
}

function buildQuery(intervention, mode) {
  const name = (intervention.name || '').substring(0, 60);
  const org = intervention.operating_organization || '';
  switch (mode) {
    case 'media':
      return `"${name}" youth justice program Australia evaluation outcomes`;
    case 'orgs':
      return org ? `"${org}" youth justice programs evaluation Australia` : `"${name}" organization evaluation`;
    default:
      return `${name} ${intervention.type || ''} evaluation outcomes Australia`;
  }
}

async function main() {
  console.log(`ALMA Evidence Discovery`);
  console.log(`Mode: ${mode} | Batch: ${batchSize} | ${apply ? 'APPLY' : 'DRY RUN'}\n`);

  // Get existing evidence URLs
  const { data: existingEvidence } = await supabase
    .from('alma_evidence').select('source_url');
  const existingUrls = new Set((existingEvidence || []).map((e) => e.source_url).filter(Boolean));
  console.log(`Existing evidence items: ${existingUrls.size}`);

  // Get evidence counts per intervention
  const { data: evidenceCounts } = await supabase
    .from('alma_intervention_evidence').select('intervention_id');
  const evCountMap = {};
  for (const link of evidenceCounts || []) {
    evCountMap[link.intervention_id] = (evCountMap[link.intervention_id] || 0) + 1;
  }

  // Get candidates — interventions with fewest evidence links
  const allCandidates = [];
  let from = 0;
  while (true) {
    const { data } = await supabase
      .from('alma_interventions')
      .select('id, name, type, operating_organization, description')
      .neq('verification_status', 'ai_generated')
      .range(from, from + 999);
    if (!data?.length) break;
    allCandidates.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }

  const candidates = allCandidates
    .map((i) => ({ ...i, evidenceCount: evCountMap[i.id] || 0 }))
    .filter((i) => i.evidenceCount === 0 && i.name.length > 20 && !i.name.includes('|'))
    .sort(() => Math.random() - 0.5) // Randomize to avoid hitting same candidates
    .slice(0, batchSize);

  console.log(`Candidates (0-1 evidence): ${candidates.length}\n`);

  const results = { searched: 0, discovered: 0, linked: 0, skipped_dupe: 0, errors: [] };

  for (const intervention of candidates) {
    const query = buildQuery(intervention, mode);
    process.stdout.write(`[${results.searched + 1}/${candidates.length}] ${intervention.name.substring(0, 50)}...`);

    try {
      const searchResults = await searchWeb(query);
      const newResults = searchResults.filter((r) => r.url && !existingUrls.has(r.url));

      if (newResults.length === 0) {
        console.log(' no new results');
        results.searched++;
        continue;
      }

      const prompt = `Analyze search results about "${intervention.name}" (${intervention.type || 'program'}).

For relevant results (research, evaluations, reports), return JSON only:
{"results":[{"title":"...","evidence_type":"...","url":"...","findings":"1-2 sentences","author":null,"year":null,"relevance_score":0.0}]}

evidence_type must be one of: ${EVIDENCE_TYPES.join(', ')}
Only include relevance_score >= 0.4. If none relevant: {"results":[]}

RESULTS:
${newResults.slice(0, 4).map((r, i) => `${r.title}\n${r.url}\n${r.description}`).join('\n\n')}`;

      let raw = await callLLM(prompt);
      // Strip markdown fences before parsing (LLM wraps JSON in ```json blocks)
      raw = raw.replace(/^```(?:json|JSON)?\s*\n/gm, '').replace(/\n?```\s*$/gm, '').trim();
      const parsed = extractJSON(raw);
      if (!parsed?.results) {
        console.log(` parse failed (${raw.substring(0, 80)}...)`);
        results.searched++;
        continue;
      }

      let added = 0;
      for (const ev of parsed.results) {
        if (!ev.url || !ev.title || (ev.relevance_score || 0) < 0.4) continue;
        if (existingUrls.has(ev.url)) { results.skipped_dupe++; continue; }

        if (apply) {
          const { data: inserted } = await supabase
            .from('alma_evidence')
            .upsert({
              title: (ev.title || '').substring(0, 500),
              evidence_type: EVIDENCE_TYPES.includes(ev.evidence_type) ? ev.evidence_type : (mode === 'media' ? 'Media coverage' : 'Case study'),
              findings: ev.findings || ev.title,
              source_url: ev.url,
              methodology: ev.methodology || null,
              author: ev.author || null,
              publication_date: ev.year ? `${ev.year}-01-01` : null,
              consent_level: 'Public Knowledge Commons',
              metadata: { auto_discovered: true, discovery_method: 'script', discovery_mode: mode },
            }, { onConflict: 'source_url', ignoreDuplicates: true })
            .select('id')
            .single();

          if (inserted) {
            existingUrls.add(ev.url);
            results.discovered++;
            added++;
            await supabase.from('alma_intervention_evidence')
              .upsert({ intervention_id: intervention.id, evidence_id: inserted.id },
                { onConflict: 'intervention_id,evidence_id', ignoreDuplicates: true });
            results.linked++;
          }
        } else {
          console.log(`\n    + ${ev.title.substring(0, 70)} (${ev.evidence_type}, ${ev.relevance_score})`);
          added++;
          results.discovered++;
        }
      }

      console.log(` ${added} new evidence`);
      results.searched++;

      // Rate limit: 1s between searches
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      console.log(` ERROR: ${err.message}`);
      results.errors.push(`${intervention.name}: ${err.message}`);
      results.searched++;
    }
  }

  console.log('\n--- Results ---');
  console.log(`Searched: ${results.searched} | Discovered: ${results.discovered} | Linked: ${results.linked}`);
  console.log(`Dupes skipped: ${results.skipped_dupe} | Errors: ${results.errors.length}`);
  if (!apply) console.log('\nDry run. Use --apply to write changes.');

  // Final stats
  const { count: totalEvidence } = await supabase.from('alma_evidence').select('*', { count: 'exact', head: true });
  const { count: totalLinks } = await supabase.from('alma_intervention_evidence').select('*', { count: 'exact', head: true });
  console.log(`\nDB: ${totalEvidence} evidence items, ${totalLinks} intervention-evidence links`);
}

main().catch(console.error);
