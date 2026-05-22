#!/usr/bin/env node
/**
 * ALMA Organisation URL discovery — finds the correct website for orgs
 * whose `website` field on file points at a DIFFERENT entity.
 *
 * Reads candidates with status='pending_data_repair' (produced by
 * scripts/alma-org-enrichment.mjs when the identity check fails) and runs
 * a web search to propose the right URL. Writes proposed candidates back
 * into the same row's provenance.proposed_urls so the admin UI can
 * surface them.
 *
 * Usage:
 *   node scripts/alma-org-url-discovery.mjs                    # dry-run, 10 candidates
 *   node scripts/alma-org-url-discovery.mjs --apply            # write proposals back
 *   node scripts/alma-org-url-discovery.mjs --apply --batch 25
 *
 * Safety:
 *   - Read-only against organizations table. Only updates the candidate row.
 *   - Per-host fetch politely throttled.
 *   - LLM is asked to be conservative: prefer official .org / .com.au domains
 *     that obviously match the named org; reject parent bodies, aggregators,
 *     directory listings (LinkedIn, Facebook, ACNC charity register, etc.).
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
        const val = l.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
        if (!env[key]) env[key] = val;
      });
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const batchSize = parseInt(args.find((_, i) => args[i - 1] === '--batch') || '10', 10);

// Search providers — Serper first (2500/mo free), Brave second (2000/mo free).
const SEARCH_PROVIDERS = [
  { name: 'serper', key: env.SERPER_API_KEY },
  { name: 'brave', key: env.BRAVE_SEARCH_API_KEY },
];

// LLM chain — same order as alma-org-enrichment, Cerebras first.
const PROVIDERS = [
  {
    name: 'cerebras',
    key: env.CEREBRAS_API_KEY,
    url: 'https://api.cerebras.ai/v1/chat/completions',
    model: 'qwen-3-235b-a22b-instruct-2507',
  },
  {
    name: 'groq',
    key: env.GROQ_API_KEY,
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
  },
  {
    name: 'gemini',
    key: env.GEMINI_API_KEY,
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    model: 'gemini-2.5-flash',
  },
].filter((p) => p.key);

if (PROVIDERS.length === 0) {
  console.error('No LLM keys. Set CEREBRAS_API_KEY / GROQ_API_KEY / GEMINI_API_KEY.');
  process.exit(1);
}
if (SEARCH_PROVIDERS.every((p) => !p.key)) {
  console.error('No search keys. Set SERPER_API_KEY or BRAVE_SEARCH_API_KEY.');
  process.exit(1);
}

console.log(
  `Search: ${SEARCH_PROVIDERS.filter((p) => p.key).map((p) => p.name).join(' → ')} · LLM: ${PROVIDERS.map((p) => p.name).join(' → ')}`
);

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

async function searchSerper(query, key) {
  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-KEY': key },
    body: JSON.stringify({ q: query, num: 8, gl: 'au' }),
  });
  if (!res.ok) throw new Error(`Serper ${res.status}`);
  const data = await res.json();
  return (data.organic || []).map((r) => ({
    title: r.title,
    url: r.link,
    description: r.snippet || '',
  }));
}

async function searchBrave(query, key) {
  const res = await fetch(
    `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=8&country=AU`,
    {
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': key,
      },
    }
  );
  if (!res.ok) throw new Error(`Brave ${res.status}`);
  const data = await res.json();
  return (data.web?.results || []).map((r) => ({
    title: r.title,
    url: r.url,
    description: r.description || '',
  }));
}

async function searchWeb(query) {
  for (const provider of SEARCH_PROVIDERS) {
    if (!provider.key) continue;
    try {
      const fn = provider.name === 'serper' ? searchSerper : searchBrave;
      return await fn(query, provider.key);
    } catch (err) {
      console.warn(`  [${provider.name}] failed: ${err.message}`);
    }
  }
  return [];
}

// ---------------------------------------------------------------------------
// LLM scoring
// ---------------------------------------------------------------------------

const SCORING_PROMPT = `You are helping a Map of Australian community organisations fix wrong website URLs in its records.

Given the named organisation and a list of search results from a web search for that organisation's name + location, choose the result that is most likely the org's PRIMARY OFFICIAL WEBSITE.

Hard rejections — DO NOT pick:
- LinkedIn, Facebook, Instagram, TikTok, YouTube, X/Twitter pages
- ACNC charity register, ABR business register, OpenAustralia, Glassdoor, Indeed
- Government aggregator directories (data.gov.au, etc.)
- News articles ABOUT the org (only the org's own site)
- Parent / sponsor / funder / network bodies that aren't the org itself
- Wikipedia or third-party encyclopedia
- Domain parking pages

Output JSON with:
- best_url: string | null — the URL of the org's likely real website. null if no result is good enough.
- confidence: 0.0-1.0 — how sure are you this is the named org's own site
- reason: string — one short sentence explaining the call
- alternatives: array of {url, reason} — up to 2 runner-up candidates the admin might want to check manually
- needs_human: boolean — true if no clear answer; admin should search manually

Return ONLY JSON.`;

async function callLLM(systemPrompt, userContent) {
  for (const provider of PROVIDERS) {
    try {
      const res = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${provider.key}`,
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
          temperature: 0,
          response_format: { type: 'json_object' },
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        console.warn(`  · LLM ${provider.name} ${res.status}: ${txt.slice(0, 100)}`);
        continue;
      }
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) continue;
      try {
        return { provider: provider.name, model: provider.model, json: JSON.parse(text) };
      } catch {
        const m = text.match(/\{[\s\S]+\}/);
        if (m) return { provider: provider.name, model: provider.model, json: JSON.parse(m[0]) };
      }
    } catch (e) {
      console.warn(`  · LLM ${provider.name} failed: ${e.message}`);
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function processCandidate(candidate, org) {
  const locationBits = [org.suburb, org.city, org.state].filter(Boolean).join(' ');
  // Add a location hint when we have one — community orgs often share names
  // with for-profits in a different state.
  const query = locationBits ? `${org.name} ${locationBits} Australia` : `${org.name} Australia`;

  console.log(`\n→ ${org.name} (${org.slug}) · search: "${query}"`);

  const results = await searchWeb(query);
  if (results.length === 0) {
    console.log('  · no search results');
    return { proposed_urls: [], needs_human: true, reason: 'no_search_results' };
  }

  const wrongUrl = candidate.source_query?.url || null;
  const filtered = results
    .filter((r) => r.url && !r.url.includes('facebook.com') && !r.url.includes('linkedin.com'))
    .slice(0, 6);

  const llmInput = `Organisation: ${org.name}
Location: ${locationBits || 'unknown'}
URL we have on file (WRONG, do not pick): ${wrongUrl || '(none)'}
Site the wrong URL actually represents: ${candidate.extracted_fields?.identity_match?.represented_entity_name || '(unknown)'}

Search results:
${filtered
  .map((r, i) => `${i + 1}. ${r.title}\n   ${r.url}\n   ${r.description}`)
  .join('\n\n')}`;

  const decision = await callLLM(SCORING_PROMPT, llmInput);
  if (!decision) {
    console.log('  · LLM failed; needs_human=true');
    return { proposed_urls: [], needs_human: true, reason: 'llm_failed' };
  }

  const j = decision.json || {};
  const proposed = [];
  if (j.best_url && typeof j.confidence === 'number') {
    proposed.push({
      url: j.best_url,
      confidence: j.confidence,
      reason: j.reason || '',
      rank: 1,
    });
  }
  for (const alt of j.alternatives || []) {
    if (alt?.url) proposed.push({ url: alt.url, confidence: 0, reason: alt.reason || '', rank: proposed.length + 1 });
  }

  console.log(
    `  · ${decision.provider}: ${j.best_url || 'no clear winner'} ${
      typeof j.confidence === 'number' ? `(${Math.round(j.confidence * 100)}%)` : ''
    }${j.needs_human ? ' [needs human]' : ''}`
  );

  return {
    proposed_urls: proposed,
    needs_human: !!j.needs_human || proposed.length === 0,
    reason: j.reason || '',
    llm_provider: decision.provider,
    llm_model: decision.model,
    queried_at: new Date().toISOString(),
  };
}

async function main() {
  console.log(`ALMA URL discovery · ${apply ? 'APPLY' : 'DRY-RUN'} · batch=${batchSize}\n`);

  const { data: candidates, error } = await supabase
    .from('alma_org_enrichment_candidates')
    .select('id, organization_id, source_query, extracted_fields, provenance')
    .eq('status', 'pending_data_repair')
    // skip rows we already searched for
    .order('created_at', { ascending: true })
    .limit(batchSize * 10);

  if (error) {
    console.error('Fetch candidates failed:', error.message);
    process.exit(1);
  }

  // Drop ones that already have a URL search done (provenance.url_discovery)
  const todo = (candidates || [])
    .filter((c) => !(c.provenance && c.provenance.url_discovery))
    .slice(0, batchSize);

  if (todo.length === 0) {
    console.log('Nothing to do — all repair candidates have already been searched.');
    return;
  }

  // Pull orgs in one batch
  const orgIds = Array.from(new Set(todo.map((c) => c.organization_id)));
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, slug, state, suburb, city, website_url, website')
    .in('id', orgIds);
  const orgsById = Object.fromEntries((orgs || []).map((o) => [o.id, o]));

  let updated = 0;
  for (const candidate of todo) {
    const org = orgsById[candidate.organization_id];
    if (!org) {
      console.log(`  · skipped — org ${candidate.organization_id} not found`);
      continue;
    }

    const discovery = await processCandidate(candidate, org);

    if (apply) {
      const newProvenance = {
        ...(candidate.provenance || {}),
        url_discovery: discovery,
      };
      const { error: updErr } = await supabase
        .from('alma_org_enrichment_candidates')
        .update({ provenance: newProvenance })
        .eq('id', candidate.id);
      if (updErr) {
        console.error(`  · failed to write: ${updErr.message}`);
      } else {
        updated++;
      }
    }

    // be polite to the search API
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log(
    `\n${apply ? `Wrote ${updated} url_discovery results` : `Dry-run — would write ${todo.length} results`}.`
  );
  if (apply) console.log('Review them at /admin/alma/outreach-queue → Needs URL repair.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
