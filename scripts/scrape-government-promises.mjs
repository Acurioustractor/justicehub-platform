#!/usr/bin/env node
/**
 * scrape-government-promises.mjs
 *
 * Scrapes government promises about youth justice programs, extracts structured
 * data via LLM, and inserts into alma_government_programs.
 *
 * Usage:
 *   node scripts/scrape-government-promises.mjs ministerial               # All states
 *   node scripts/scrape-government-promises.mjs ministerial --state=QLD   # QLD only
 *   node scripts/scrape-government-promises.mjs ministerial --limit=20    # Cap results
 *   node scripts/scrape-government-promises.mjs budget-papers             # Parse budget PDFs
 *   node scripts/scrape-government-promises.mjs evaluations               # Find evaluations
 *   node scripts/scrape-government-promises.mjs --dry-run ministerial     # Preview only
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ENV + SETUP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function loadEnv() {
  const env = { ...process.env };
  const envPath = join(root, '.env.local');
  if (existsSync(envPath)) {
    try {
      readFileSync(envPath, 'utf8')
        .split('\n')
        .filter((l) => l && !l.startsWith('#') && l.includes('='))
        .forEach((l) => {
          const eqIdx = l.indexOf('=');
          const key = l.slice(0, eqIdx).trim();
          const val = l.slice(eqIdx + 1).trim();
          if (!env[key]) env[key] = val;
        });
    } catch { /* ignore */ }
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const stateArg = args.find((a) => a.startsWith('--state='))?.split('=')[1]?.toUpperCase();
const limitArg = parseInt(args.find((a) => a.startsWith('--limit='))?.split('=')[1] || '50', 10);
const subcommand = args.filter((a) => !a.startsWith('--'))[0] || 'ministerial';

const SLEEP = (ms) => new Promise((r) => setTimeout(r, ms));
const UA = 'JusticeHub-Research/1.0 (youth justice data aggregation)';

const stats = { inserted: 0, skipped: 0, errors: 0, searches: 0 };

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LLM PROVIDERS (same pattern as other scripts)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const PROVIDERS = [
  { name: 'groq', key: env.GROQ_API_KEY, url: 'https://api.groq.com/openai/v1/chat/completions', model: 'llama-3.3-70b-versatile' },
  { name: 'gemini', key: env.GEMINI_API_KEY, url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', model: 'gemini-2.5-flash' },
  { name: 'deepseek', key: env.DEEPSEEK_API_KEY, url: 'https://api.deepseek.com/v1/chat/completions', model: 'deepseek-chat' },
  { name: 'openai', key: env.OPENAI_API_KEY, url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini' },
];

async function callLLM(prompt, { systemPrompt, maxTokens = 3000 } = {}) {
  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });

  for (const provider of PROVIDERS) {
    if (!provider.key) continue;
    try {
      const res = await fetch(provider.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.key}` },
        body: JSON.stringify({ model: provider.model, messages, max_tokens: maxTokens, temperature: 0.1 }),
        signal: AbortSignal.timeout(45000),
      });
      if (!res.ok) { console.warn(`  [${provider.name}] HTTP ${res.status}`); continue; }
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || '';
      return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    } catch (e) { console.warn(`  [${provider.name}] ${e.message}`); continue; }
  }
  throw new Error('All LLM providers failed');
}

function extractJSON(text) {
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '');
  cleaned = cleaned.replace(/```(?:json|JSON)?\s*\n?/g, '').replace(/```\s*$/gm, '').trim();
  try { return JSON.parse(cleaned); } catch {}
  const objMatch = cleaned.match(/(\{[\s\S]*\})/);
  const arrMatch = cleaned.match(/(\[[\s\S]*\])/);
  const extracted = objMatch?.[1] ?? arrMatch?.[1];
  if (extracted) {
    const fixed = extracted.replace(/,\s*([}\]])/g, '$1');
    try { return JSON.parse(fixed); } catch {}
  }
  return null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SEARCH PROVIDERS (Serper → Brave → Jina)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function searchWeb(query, maxResults = 5) {
  stats.searches++;

  // Serper
  if (env.SERPER_API_KEY) {
    try {
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': env.SERPER_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query, num: maxResults }),
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        const remaining = res.headers.get('x-ratelimit-remaining');
        if (remaining && parseInt(remaining, 10) < 100) {
          console.warn(`  [Serper] ⚠ Only ${remaining} searches remaining this month`);
        }
        const data = await res.json();
        const results = (data.organic || []).slice(0, maxResults).map((r) => ({
          title: r.title || '', url: r.link || '', description: r.snippet || '',
        }));
        if (results.length > 0) return results;
      }
    } catch {}
  }

  // Brave
  if (env.BRAVE_SEARCH_API_KEY) {
    try {
      const res = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${maxResults}`, {
        headers: { 'X-Subscription-Token': env.BRAVE_SEARCH_API_KEY, Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        const data = await res.json();
        const results = (data.web?.results || []).slice(0, maxResults).map((r) => ({
          title: r.title || '', url: r.url || '', description: r.description || '',
        }));
        if (results.length > 0) return results;
      }
    } catch {}
  }

  // Jina (free fallback)
  try {
    const res = await fetch(`https://s.jina.ai/${encodeURIComponent(query)}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      const data = await res.json();
      return (data.data || []).slice(0, maxResults).map((r) => ({
        title: r.title || '', url: r.url || '', description: r.description || '',
      }));
    }
  } catch {}

  return [];
}

async function fetchPage(url) {
  try {
    // Use Jina reader for clean text extraction
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: { Accept: 'text/plain', 'User-Agent': UA },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    // Truncate to ~8K chars for LLM context
    return text.substring(0, 8000);
  } catch {
    return null;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONTENT HASH (dedup)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function contentHash(name, url) {
  return createHash('sha256')
    .update(`${name.toLowerCase().trim()}||${url || ''}`)
    .digest('hex')
    .substring(0, 16);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INSERT GOVERNMENT PROGRAM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function insertProgram(program) {
  if (dryRun) {
    console.log(`  [DRY] ${program.jurisdiction} | ${program.name} | $${(program.budget_amount || 0).toLocaleString()} | ${program.status || '?'}`);
    stats.inserted++;
    return true;
  }

  // Dedup by name + jurisdiction
  const { data: existing } = await supabase
    .from('alma_government_programs')
    .select('id')
    .ilike('name', program.name)
    .eq('jurisdiction', program.jurisdiction)
    .maybeSingle();

  if (existing) {
    stats.skipped++;
    return false;
  }

  const record = {
    name: program.name.substring(0, 300),
    jurisdiction: program.jurisdiction,
    program_type: program.program_type || null,
    announced_date: program.announced_date || null,
    status: program.status || 'announced',
    budget_amount: program.budget_amount || null,
    description: (program.description || '').substring(0, 5000),
    official_url: program.source_url || null,
    minister: program.minister || null,
    department: program.department || null,
    target_cohort: program.target_cohort || null,
    community_led: false,
  };

  const { error } = await supabase.from('alma_government_programs').insert(record);

  if (error) {
    if (error.code === '23505') { stats.skipped++; return false; }
    console.log(`  [ERROR] Insert: ${error.message}`);
    stats.errors++;
    return false;
  }

  stats.inserted++;
  console.log(`  [OK] ${program.jurisdiction} | ${program.name}`);
  return true;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MINISTERIAL SUBCOMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const STATE_SEARCH_SITES = {
  QLD: ['statements.qld.gov.au', 'youth.justice.qld.gov.au', 'qld.gov.au'],
  NSW: ['nsw.gov.au', 'dcj.nsw.gov.au'],
  VIC: ['premier.vic.gov.au', 'dffh.vic.gov.au', 'justice.vic.gov.au'],
  WA: ['wa.gov.au', 'justice.wa.gov.au'],
  SA: ['sa.gov.au', 'dhs.sa.gov.au'],
  TAS: ['justice.tas.gov.au', 'premier.tas.gov.au'],
  ACT: ['act.gov.au', 'communityservices.act.gov.au'],
  NT: ['nt.gov.au', 'tfhc.nt.gov.au'],
  Federal: ['minister.ag.gov.au', 'ministers.pmc.gov.au', 'niaa.gov.au'],
};

const SEARCH_TERMS = [
  '"youth justice" program funding',
  '"juvenile justice" announcement initiative',
  '"youth detention" reform investment',
  '"youth diversion" program budget',
  '"young offenders" program government',
];

async function scrapeMinisterial() {
  const states = stateArg ? [stateArg] : Object.keys(STATE_SEARCH_SITES);
  let totalProcessed = 0;

  for (const state of states) {
    if (totalProcessed >= limitArg) break;
    console.log(`\n── ${state} Ministerial Releases ──`);

    // Lookup handles both 'QLD' and 'Federal' keys
    const sites = STATE_SEARCH_SITES[state] || STATE_SEARCH_SITES[Object.keys(STATE_SEARCH_SITES).find(k => k.toUpperCase() === state.toUpperCase())] || [];
    const siteFilter = sites.map((s) => `site:${s}`).join(' OR ');

    for (const term of SEARCH_TERMS) {
      if (totalProcessed >= limitArg) break;

      const query = `(${siteFilter}) ${term}`;
      console.log(`  Searching: ${query.substring(0, 80)}...`);

      const results = await searchWeb(query, 5);
      if (!results.length) { console.log('  No results'); continue; }

      for (const result of results) {
        if (totalProcessed >= limitArg) break;

        // Skip non-relevant URLs
        if (result.url.includes('/pdf') || result.url.includes('.pdf')) continue;

        console.log(`  Fetching: ${result.url.substring(0, 80)}...`);
        const pageText = await fetchPage(result.url);
        if (!pageText || pageText.length < 200) {
          console.log('  [SKIP] Page too short or empty');
          continue;
        }

        // LLM extraction
        const prompt = `Extract government youth justice program announcements from this page.
Return a JSON object with a "programs" array. Each program should have:
- name: Program name (string, required)
- jurisdiction: "${state}" (always this value)
- program_type: Type like "diversion", "therapeutic", "detention", "cultural", "conferencing", etc.
- announced_date: Date in YYYY-MM-DD format if mentioned
- budget_amount: Dollar amount as number (no $ sign). If "million", multiply by 1000000
- description: What the program does (min 10 chars)
- minister: Name of minister who announced it
- department: Government department responsible
- target_cohort: Array of target groups, e.g. ["10-17 year olds", "First Nations youth"]
- status: "announced", "in_progress", "implemented", or "abandoned"
- source_url: "${result.url}"

Only include programs specifically about youth justice, juvenile justice, or youth detention.
If no relevant programs found, return {"programs": []}.

Page content:
${pageText}`;

        try {
          const raw = await callLLM(prompt, {
            systemPrompt: 'You extract structured data from Australian government web pages about youth justice programs. Return valid JSON only.',
          });
          const parsed = extractJSON(raw);
          if (!parsed?.programs?.length) {
            console.log('  No programs found on page');
            continue;
          }

          for (const prog of parsed.programs) {
            if (!prog.name || prog.name.length < 3) continue;
            if (!prog.description || prog.description.length < 10) continue;
            prog.jurisdiction = state; // enforce
            prog.source_url = prog.source_url || result.url;
            await insertProgram(prog);
            totalProcessed++;
          }
        } catch (e) {
          console.log(`  [ERROR] LLM extraction: ${e.message}`);
          stats.errors++;
        }

        await SLEEP(1000); // Rate limit
      }

      await SLEEP(500);
    }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BUDGET-PAPERS SUBCOMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const BUDGET_SEARCH_QUERIES = {
  QLD: '"Queensland" "youth justice" budget appropriation site:budget.qld.gov.au OR site:treasury.qld.gov.au',
  NSW: '"New South Wales" "youth justice" budget "service description" site:budget.nsw.gov.au',
  VIC: '"Victoria" "youth justice" budget papers site:budget.vic.gov.au OR site:dtf.vic.gov.au',
  WA: '"Western Australia" "youth justice" budget site:ourstatebudget.wa.gov.au',
  SA: '"South Australia" "youth justice" budget site:statebudget.sa.gov.au',
  Federal: '"youth justice" budget "portfolio budget statement" site:budget.gov.au',
};

async function scrapeBudgetPapers() {
  const states = stateArg ? [stateArg] : Object.keys(BUDGET_SEARCH_QUERIES);

  for (const state of states) {
    console.log(`\n── ${state} Budget Papers ──`);

    const query = BUDGET_SEARCH_QUERIES[state];
    if (!query) { console.log('  No query configured'); continue; }

    const results = await searchWeb(query, 5);
    if (!results.length) { console.log('  No results'); continue; }

    for (const result of results) {
      console.log(`  Found: ${result.title?.substring(0, 70)} — ${result.url.substring(0, 60)}`);

      // For PDFs, note them for manual processing
      if (result.url.endsWith('.pdf')) {
        console.log('  [PDF] Would need alma-pdf-extractor.mjs — skipping auto-extraction');
        continue;
      }

      const pageText = await fetchPage(result.url);
      if (!pageText || pageText.length < 200) continue;

      const prompt = `Extract youth justice budget allocations from this government budget page.
Return JSON: {"programs": [...]} where each item has:
- name: Budget line item or program name
- jurisdiction: "${state}"
- program_type: "budget_allocation"
- budget_amount: Dollar amount as number
- description: What the allocation covers
- department: Department receiving the allocation
- announced_date: Budget year in "YYYY-07-01" format (start of financial year)
- status: "implemented" (budget allocations are committed)
- source_url: "${result.url}"

Only include items specifically about youth justice / juvenile justice.
Return {"programs": []} if none found.

Content:
${pageText}`;

      try {
        const raw = await callLLM(prompt, {
          systemPrompt: 'You extract structured budget data from Australian government budget papers. Return valid JSON only.',
        });
        const parsed = extractJSON(raw);
        if (!parsed?.programs?.length) { console.log('  No budget items found'); continue; }

        for (const prog of parsed.programs) {
          if (!prog.name || !prog.description) continue;
          prog.jurisdiction = state;
          prog.source_url = prog.source_url || result.url;
          await insertProgram(prog);
        }
      } catch (e) {
        console.log(`  [ERROR] LLM: ${e.message}`);
        stats.errors++;
      }

      await SLEEP(1000);
    }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EVALUATIONS SUBCOMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function scrapeEvaluations() {
  // Get existing programs to search for their evaluations
  const { data: programs } = await supabase
    .from('alma_government_programs')
    .select('id, name, jurisdiction')
    .order('created_at', { ascending: false })
    .limit(limitArg);

  if (!programs?.length) {
    console.log('No programs found — run ministerial scrape first');
    return;
  }

  console.log(`\n── Searching evaluations for ${programs.length} programs ──`);

  for (const prog of programs) {
    const query = `"${prog.name}" evaluation report outcomes Australia`;
    console.log(`  Searching: ${query.substring(0, 70)}...`);

    const results = await searchWeb(query, 3);
    if (!results.length) { console.log('  No results'); continue; }

    for (const result of results) {
      if (result.url.endsWith('.pdf')) {
        console.log(`  [PDF] ${result.title?.substring(0, 60)} — ${result.url}`);
        // Log PDF for manual processing with alma-pdf-extractor
        continue;
      }

      const pageText = await fetchPage(result.url);
      if (!pageText || pageText.length < 300) continue;

      const prompt = `Extract evaluation findings for the "${prog.name}" program from this page.
Return JSON: {
  "title": "evaluation title",
  "evidence_type": "Program evaluation" | "Case study" | "Policy analysis",
  "url": "${result.url}",
  "findings": "key findings summary (min 20 chars)",
  "methodology": "how the evaluation was conducted",
  "year": YYYY,
  "relevance_score": 0.0-1.0
}

If no relevant evaluation data found, return null.

Content:
${pageText}`;

      try {
        const raw = await callLLM(prompt, {
          systemPrompt: 'You extract evaluation findings from Australian youth justice program evaluations. Return valid JSON only.',
        });
        const parsed = extractJSON(raw);
        if (!parsed || !parsed.findings) continue;

        // Insert into alma_evidence
        if (!dryRun) {
          const { error } = await supabase.from('alma_evidence').upsert({
            title: (parsed.title || `${prog.name} Evaluation`).substring(0, 500),
            evidence_type: parsed.evidence_type || 'Program evaluation',
            source_url: result.url,
            findings: parsed.findings,
            methodology: parsed.methodology || null,
            year: parsed.year || null,
            relevance_score: parsed.relevance_score || 0.7,
          }, { onConflict: 'source_url' });

          if (error && error.code !== '23505') {
            console.log(`  [ERROR] Insert evidence: ${error.message}`);
            stats.errors++;
          } else if (!error) {
            console.log(`  [OK] Evidence: ${parsed.title?.substring(0, 60)}`);
            stats.inserted++;
          } else {
            stats.skipped++;
          }
        } else {
          console.log(`  [DRY] Evidence: ${parsed.title?.substring(0, 60)}`);
          stats.inserted++;
        }
      } catch (e) {
        console.log(`  [ERROR] LLM: ${e.message}`);
        stats.errors++;
      }

      await SLEEP(1000);
    }

    await SLEEP(500);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function main() {
  console.log(`\n╔══════════════════════════════════════════════════════════╗`);
  console.log(`║  Government Promises Scraper                            ║`);
  console.log(`║  Subcommand: ${subcommand.padEnd(43)}║`);
  console.log(`║  Dry run: ${String(dryRun).padEnd(46)}║`);
  if (stateArg) console.log(`║  State: ${stateArg.padEnd(48)}║`);
  console.log(`║  Limit: ${String(limitArg).padEnd(48)}║`);
  console.log(`╚══════════════════════════════════════════════════════════╝\n`);

  switch (subcommand) {
    case 'ministerial':
      await scrapeMinisterial();
      break;
    case 'budget-papers':
      await scrapeBudgetPapers();
      break;
    case 'evaluations':
      await scrapeEvaluations();
      break;
    case 'all':
      await scrapeMinisterial();
      await scrapeBudgetPapers();
      await scrapeEvaluations();
      break;
    default:
      console.error(`Unknown subcommand: ${subcommand}`);
      console.error('Available: ministerial, budget-papers, evaluations, all');
      process.exit(1);
  }

  console.log(`\n── Summary ──`);
  console.log(`  Inserted: ${stats.inserted}`);
  console.log(`  Skipped:  ${stats.skipped}`);
  console.log(`  Errors:   ${stats.errors}`);
  console.log(`  Searches: ${stats.searches}`);
}

main().catch((e) => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
