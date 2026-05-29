#!/usr/bin/env npx tsx
/**
 * Second-pass source-link backfill — same shape as backfill-source-links.ts
 * but with the Anthropic web_search server tool enabled, so the LLM can
 * actually look up URLs it doesn't carry in training knowledge.
 *
 * HEAD-verification is still the load-bearing safety net: every URL the
 * model emits (whether from training or from search) is fetched before
 * being saved. The 47-URLs-rejected outcome from the training-only pass
 * showed how often even confidently-stated URLs are hallucinated, so we
 * keep that gate.
 *
 * Usage:
 *   npx tsx scripts/backfill-source-links-search.ts                  (dry run, all types)
 *   npx tsx scripts/backfill-source-links-search.ts --apply
 *   npx tsx scripts/backfill-source-links-search.ts --limit 20 --apply
 *   npx tsx scripts/backfill-source-links-search.ts --case-type report --apply
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { validateLLMOutput } from '../src/lib/ai/llm-schemas';
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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-5-20250929';

const argv = process.argv.slice(2);
const arg = (name: string, def?: string) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : def;
};
const CASE_TYPE_FILTER = arg('case-type');
const CASE_ID = arg('case-id');
const LIMIT = parseInt(arg('limit', '60')!, 10);
const APPLY = argv.includes('--apply');

const UrlResponseSchema = z.object({
  url: z.string().url().nullable(),
  confidence: z.enum(['high', 'medium', 'low', 'unknown']),
  reasoning: z.string().max(400).optional(),
});

interface CaseRow {
  id: string;
  case_citation: string;
  jurisdiction: string;
  year: number | null;
  case_type: string | null;
  strategic_issue: string | null;
}

async function loadCandidates(): Promise<CaseRow[]> {
  let q = supabase
    .from('justice_matrix_cases')
    .select('id,case_citation,jurisdiction,year,case_type,strategic_issue')
    .or('authoritative_link.is.null,authoritative_link.eq.');
  if (CASE_ID) q = q.eq('id', CASE_ID);
  if (CASE_TYPE_FILTER) q = q.eq('case_type', CASE_TYPE_FILTER);
  q = q.limit(LIMIT);
  const { data, error } = await q;
  if (error) throw new Error(`loadCandidates: ${error.message}`);
  return (data ?? []) as CaseRow[];
}

async function askWithSearch(
  row: CaseRow,
): Promise<{ url: string | null; confidence: string; reasoning?: string } | null> {
  const prompt = `Find the canonical source URL for this Justice Matrix item. Use the web_search tool to look it up if you don't already know.

Item: ${row.case_citation}
Jurisdiction: ${row.jurisdiction}
Year: ${row.year ?? 'unknown'}
Type: ${row.case_type ?? 'unknown'}
Context: ${row.strategic_issue?.slice(0, 200) ?? 'unknown'}

What counts as canonical by type:
  court_decision    → official court site, free legal database (BAILII, AustLII, CourtListener, HUDOC, ZACC, CanLII), or recognized government law-reports site
  legislation       → official legislation registry (legislation.gov.au, www.legislation.act.gov.au, equivalents)
  royal_commission / inquiry / commission_of_inquiry / senate_inquiry / law_reform_inquiry
                    → the commission's final-report page on its own site, or the host parliament's inquiry page
  report / inspection_report / ngo_report / government_review / statistical_report / statistics / national_agreement
                    → the publishing body's page for that report
  investigation / human_rights_investigation
                    → the investigating body's report page, coronial inquest site, or oversight commission

After searching (up to 3 queries), respond with ONLY valid JSON in your final assistant message:
{"url": "https://..." | null, "confidence": "high" | "medium" | "low" | "unknown", "reasoning": "one sentence on the source"}

Hard rules:
- The URL must be a stable, public-facing page on the source-of-truth domain. NOT a Google search results page, NOT a Wikipedia article, NOT a news article, NOT a paywalled aggregator.
- If you cannot find or verify a canonical URL, return {"url": null, "confidence": "unknown", "reasoning": "..."}. Do not return a plausible-looking but unconfirmed URL.
- Prefer the source's own page over secondary coverage.`;

  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    tools: [
      {
        // Anthropic-hosted web search tool. Server-executed, so we just wait
        // for the model's final text response after it's done searching.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: 'web_search_20250305' as any,
        name: 'web_search',
        max_uses: 3,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    ],
    messages: [{ role: 'user', content: prompt }],
  });

  // Grab the final text block; ignore tool_use blocks that precede it.
  const textBlocks = res.content.filter((b) => b.type === 'text');
  const text = textBlocks.length ? textBlocks[textBlocks.length - 1].text : '';
  if (!text) return null;
  let raw: unknown;
  try {
    raw = parseJSON(text);
  } catch {
    return null;
  }
  const v = validateLLMOutput(raw, UrlResponseSchema);
  return v.success ? v.data : null;
}

async function urlResolves(url: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  const headers = {
    'user-agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 10000);
    let res: Response;
    try {
      res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal, headers });
    } catch {
      res = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal, headers });
    }
    clearTimeout(t);
    return { ok: res.ok || (res.status >= 300 && res.status < 400), status: res.status };
  } catch (e) {
    return { ok: false, error: (e as Error).message?.slice(0, 80) };
  }
}

async function run() {
  console.log(
    `\n🔍 Source-link backfill (web-search)  |  ${APPLY ? 'APPLY (writing)' : 'DRY RUN'}${
      CASE_TYPE_FILTER ? `  |  case_type=${CASE_TYPE_FILTER}` : ''
    }${CASE_ID ? `  |  case ${CASE_ID}` : `  |  limit ${LIMIT}`}`,
  );
  const candidates = await loadCandidates();
  if (!candidates.length) {
    console.log('No candidates.');
    return;
  }
  console.log(`Found ${candidates.length} case(s) needing a source link.\n`);

  let written = 0;
  let urlsRejected = 0;
  let llmDeclined = 0;
  let errors = 0;

  for (const row of candidates) {
    console.log(`— ${row.case_citation}`);
    let resp: { url: string | null; confidence: string; reasoning?: string } | null = null;
    try {
      resp = await askWithSearch(row);
    } catch (e) {
      console.log(`  ❌ LLM error: ${(e as Error).message?.slice(0, 200)}`);
      errors++;
      continue;
    }
    if (!resp || resp.confidence === 'unknown' || !resp.url) {
      console.log(
        `  ⏭️  declined (${resp?.confidence ?? 'malformed'})${
          resp?.reasoning ? `: ${resp.reasoning.slice(0, 140)}` : ''
        }`,
      );
      llmDeclined++;
      continue;
    }
    const check = await urlResolves(resp.url);
    if (!check.ok) {
      console.log(`  ❌ URL failed verify (${check.status ?? check.error}): ${resp.url}`);
      urlsRejected++;
      continue;
    }
    console.log(`  📝 [${resp.confidence}] [${check.status}] ${resp.url}`);
    if (APPLY) {
      const { error } = await supabase
        .from('justice_matrix_cases')
        .update({ authoritative_link: resp.url, updated_at: new Date().toISOString() })
        .eq('id', row.id);
      if (error) {
        console.log(`  ❌ update failed: ${error.message}`);
        continue;
      }
      console.log('  ✅ written');
    }
    written++;
  }

  console.log(
    `\n${APPLY ? '✅ done' : '✅ dry run done'} — ${written} ${
      APPLY ? 'written' : 'would write'
    }, ${urlsRejected} URL-rejected, ${llmDeclined} declined, ${errors} errors.`,
  );
}

run().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
