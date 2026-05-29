#!/usr/bin/env npx tsx
/**
 * Source-link resolver (#6), Anthropic-independent. The web_search resolver
 * (backfill-source-links-search.ts) is better but burns Anthropic credit, which
 * ran out mid-session. This one uses Serper (real Google results) for discovery
 * and the model-router (MiniMax/Cerebras/Groq/Gemini, NOT Anthropic) only to PICK
 * the best candidate BY INDEX from the actual results - so a URL can never be
 * hallucinated, it can only be chosen from what Serper returned. Every pick is
 * then HEAD-verified before saving.
 *
 * Handles both linkless cases (authoritative_link) and linkless campaigns
 * (campaign_link).
 *
 * Usage:
 *   npx tsx scripts/justice-matrix-resolve-links-serper.ts                       (dry run, cases)
 *   npx tsx scripts/justice-matrix-resolve-links-serper.ts --target campaigns
 *   npx tsx scripts/justice-matrix-resolve-links-serper.ts --target cases --apply --limit 60
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { callBackgroundLLM } from '../src/lib/ai/model-router';
import { parseJSON } from '../src/lib/ai/parse-json';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const env = readFileSync(join(root, '.env.local'), 'utf8')
  .split('\n')
  .filter((l) => l && !l.startsWith('#') && l.includes('='))
  .reduce<Record<string, string>>((acc, l) => {
    const [k, ...v] = l.split('=');
    acc[k.trim()] = v.join('=').trim();
    return acc;
  }, {});

// The model-router reads keys from process.env; hydrate it from .env.local.
for (const [k, v] of Object.entries(env)) if (!process.env[k]) process.env[k] = v;

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const argv = process.argv.slice(2);
const APPLY = argv.includes('--apply');
const arg = (n: string, d?: string) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d;
};
const TARGET = (arg('target', 'cases') as 'cases' | 'campaigns');
const LIMIT = parseInt(arg('limit', '60')!, 10);

interface Candidate {
  title: string;
  link: string;
  snippet: string;
}

// Domains that are never a canonical source - filtered before the model even sees them.
const JUNK = /google\.|bing\.|duckduckgo|wikipedia\.|facebook\.|twitter\.|x\.com|youtube\.|linkedin\.|scribd\.|jstor\.|researchgate|academia\.edu|amazon\./i;

async function serper(query: string): Promise<Candidate[]> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': env.SERPER_API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ q: query, num: 8 }),
      signal: ctrl.signal,
    });
    if (!res.ok) return [];
    const json = await res.json();
    const organic = Array.isArray(json?.organic) ? json.organic : [];
    return organic
      .map((o: Record<string, unknown>) => ({
        title: String(o.title ?? ''),
        link: String(o.link ?? ''),
        snippet: String(o.snippet ?? ''),
      }))
      .filter((c: Candidate) => c.link && !JUNK.test(c.link));
  } catch {
    return [];
  } finally {
    clearTimeout(t);
  }
}

function pickPrompt(label: string, context: string, candidates: Candidate[], forCampaign: boolean): string {
  const list = candidates
    .map((c, i) => `[${i}] ${c.title}\n    ${c.link}\n    ${c.snippet.slice(0, 160)}`)
    .join('\n');
  const canon = forCampaign
    ? 'the campaign or running organisation\'s OWN page about this campaign (its site, a coalition page, or a recognised NGO page for it)'
    : 'the official court/government page, a free legal database (BAILII, AustLII, CourtListener, HUDOC, CanLII), or the publishing body\'s own page for this report/inquiry/legislation';
  return `Pick the single best CANONICAL source URL for this item from the numbered search results below, or null if none qualify.

Item: ${label}
Context: ${context.slice(0, 220)}

Canonical means: ${canon}.
Reject: news articles, blogs, aggregators, paywalled pages, social media, search pages, generic homepages that are not about this specific item.

Results:
${list}

Respond with ONLY this JSON: {"choice": <the [index] number of the best result, or null>, "confidence": "high" | "medium" | "low"}`;
}

async function urlResolves(url: string): Promise<boolean> {
  const headers = {
    'user-agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
  };
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10000);
  try {
    let res: Response;
    try {
      res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: ctrl.signal, headers });
    } catch {
      res = await fetch(url, { method: 'GET', redirect: 'follow', signal: ctrl.signal, headers });
    }
    return res.ok || (res.status >= 300 && res.status < 400);
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

async function resolveOne(label: string, context: string, query: string, forCampaign: boolean): Promise<string | null> {
  const candidates = await serper(query);
  if (!candidates.length) return null;
  let text: string;
  try {
    text = await callBackgroundLLM(pickPrompt(label, context, candidates, forCampaign), { maxTokens: 200 });
  } catch {
    return null;
  }
  let parsed: { choice: number | null; confidence?: string };
  try {
    parsed = parseJSON(text) as { choice: number | null; confidence?: string };
  } catch {
    return null;
  }
  if (parsed.choice == null || !Number.isInteger(parsed.choice)) return null;
  if (parsed.confidence === 'low') return null; // require some confidence
  const chosen = candidates[parsed.choice];
  if (!chosen?.link) return null;
  const ok = await urlResolves(chosen.link);
  return ok ? chosen.link : null;
}

async function run() {
  console.log(`\nSerper link resolver (#6)  |  ${APPLY ? 'APPLY' : 'DRY RUN'}  |  target ${TARGET}  |  limit ${LIMIT}\n`);
  let written = 0;
  let found = 0;
  let missed = 0;

  if (TARGET === 'cases') {
    const { data, error } = await supabase
      .from('justice_matrix_cases')
      .select('id,case_citation,jurisdiction,year,case_type,strategic_issue')
      .or('authoritative_link.is.null,authoritative_link.eq.')
      .limit(LIMIT);
    if (error) { console.error(error.message); process.exit(1); }
    for (const r of data ?? []) {
      const label = `${r.case_citation} (${r.jurisdiction ?? ''}, ${r.year ?? '?'})`;
      const query = `${r.case_citation} ${r.jurisdiction ?? ''} ${r.case_type === 'court_decision' ? 'judgment' : ''}`.trim();
      const url = await resolveOne(label, r.strategic_issue ?? '', query, false);
      if (!url) { console.log(`  --     ${(r.case_citation || '').slice(0, 60)}`); missed++; continue; }
      found++;
      console.log(`  link   ${url}\n         ^ ${(r.case_citation || '').slice(0, 60)}`);
      if (APPLY) {
        const { error: e } = await supabase.from('justice_matrix_cases').update({ authoritative_link: url, updated_at: new Date().toISOString() }).eq('id', r.id);
        if (!e) written++; else console.log(`    ! write failed: ${e.message}`);
      }
    }
  } else {
    const { data, error } = await supabase
      .from('justice_matrix_campaigns')
      .select('id,campaign_name,country_region,goals')
      .or('campaign_link.is.null,campaign_link.eq.')
      .limit(LIMIT);
    if (error) { console.error(error.message); process.exit(1); }
    for (const r of data ?? []) {
      const label = `${r.campaign_name} (${r.country_region ?? ''})`;
      const query = `${r.campaign_name} ${r.country_region ?? ''} campaign`.trim();
      const url = await resolveOne(label, r.goals ?? '', query, true);
      if (!url) { console.log(`  --     ${(r.campaign_name || '').slice(0, 60)}`); missed++; continue; }
      found++;
      console.log(`  link   ${url}\n         ^ ${(r.campaign_name || '').slice(0, 60)}`);
      if (APPLY) {
        const { error: e } = await supabase.from('justice_matrix_campaigns').update({ campaign_link: url, updated_at: new Date().toISOString() }).eq('id', r.id);
        if (!e) written++; else console.log(`    ! write failed: ${e.message}`);
      }
    }
  }

  console.log(`\n${APPLY ? 'Wrote' : 'Would write'} ${APPLY ? written : found}  |  found ${found}  |  no canonical URL ${missed}.`);
}

run().catch((e) => { console.error(e); process.exit(1); });
