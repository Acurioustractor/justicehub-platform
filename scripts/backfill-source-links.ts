#!/usr/bin/env npx tsx
/**
 * Backfill `authoritative_link` on Justice Matrix cases that don't have one.
 *
 * 75 of 98 cases (76%) ship with no source link, so their profile pages render
 * without the "view source" affordance — the practitioner's primary action.
 *
 * Strategy:
 *  1. Ask the LLM to produce a canonical URL for the case from training
 *     knowledge — gov website, court database, commission report page, etc.
 *  2. Verify the URL with a HEAD request (allows 200, 301-308). This is the
 *     crucial step that would have caught the placeholder URLs (404/403) that
 *     made it into the matrix earlier.
 *  3. Only write when the LLM is confident AND the URL responds.
 *
 * Usage:
 *   npx tsx scripts/backfill-source-links.ts                              (dry run, all types)
 *   npx tsx scripts/backfill-source-links.ts --apply                      (write)
 *   npx tsx scripts/backfill-source-links.ts --case-type court_decision   (filter)
 *   npx tsx scripts/backfill-source-links.ts --limit 10 --apply           (small batch)
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
const LIMIT = parseInt(arg('limit', '20')!, 10);
const APPLY = argv.includes('--apply');

// Schema for the LLM response — URL plus confidence + reason.
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

async function askForUrl(row: CaseRow): Promise<{ url: string | null; confidence: string; reasoning?: string } | null> {
  const prompt = `You are populating an authoritative source link for a Justice Matrix entry. Return ONE canonical URL where this item can be read.

Item: ${row.case_citation}
Jurisdiction: ${row.jurisdiction}
Year: ${row.year ?? 'unknown'}
Type: ${row.case_type ?? 'unknown'}
Strategic issue / context: ${row.strategic_issue ?? 'unknown'}

Acceptable URLs by type:
  court_decision         -> official court site, free legal database (BAILII, AustLII, CourtListener, HUDOC, ZACC), or government law reports site
  legislation            -> official statute page on a government legislation site (legislation.gov.au, www.legislation.act.gov.au, comparable)
  royal_commission / inquiry / commission_of_inquiry / law_reform_inquiry / senate_inquiry
                         -> the commission's own final-report page or the host parliament's inquiry page
  report / inspection_report / ngo_report / government_review / statistical_report / statistics
                         -> the publishing body's page for that report
  investigation / human_rights_investigation
                         -> the investigating body's report page or coronial inquest site

Rules:
- Return ONLY valid JSON: {"url": "https://..." | null, "confidence": "high" | "medium" | "low" | "unknown", "reasoning": "one sentence"}
- If you cannot identify a specific canonical URL from training knowledge, return url=null and confidence="unknown". DO NOT invent a plausible-looking URL.
- If you give a URL, it must be a stable, public-facing URL — not a Google search result, a paywalled aggregator, a Wikipedia article, or a news article.
- Prefer the source-of-truth page over secondary coverage.`;

  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = res.content[0].type === 'text' ? res.content[0].text : '';
  let raw: unknown;
  try {
    raw = parseJSON(text);
  } catch {
    return null;
  }
  const v = validateLLMOutput(raw, UrlResponseSchema);
  return v.success ? v.data : null;
}

/** Verifies the URL responds. Accepts 200 and 3xx. 4xx / 5xx / timeout / DNS error => false. */
async function urlResolves(url: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000);
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'user-agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
    } catch {
      // Some servers reject HEAD; fall back to GET.
      res = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'user-agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
    }
    clearTimeout(t);
    return { ok: res.ok || (res.status >= 300 && res.status < 400), status: res.status };
  } catch (e) {
    return { ok: false, error: (e as Error).message?.slice(0, 80) };
  }
}

async function run() {
  console.log(
    `\n🔗 Source-link backfill  |  ${APPLY ? 'APPLY (writing)' : 'DRY RUN'}${CASE_TYPE_FILTER ? `  |  case_type=${CASE_TYPE_FILTER}` : ''}${CASE_ID ? `  |  case ${CASE_ID}` : `  |  limit ${LIMIT}`}`,
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

  for (const row of candidates) {
    console.log(`— ${row.case_citation}`);
    let resp: { url: string | null; confidence: string; reasoning?: string } | null = null;
    try {
      resp = await askForUrl(row);
    } catch (e) {
      console.log(`  ❌ LLM error: ${(e as Error).message?.slice(0, 180)}`);
      llmDeclined++;
      continue;
    }
    if (!resp || resp.confidence === 'unknown' || !resp.url) {
      console.log(`  ⏭️  LLM declined (${resp?.confidence ?? 'malformed'})${resp?.reasoning ? `: ${resp.reasoning}` : ''}`);
      llmDeclined++;
      continue;
    }

    // CRUCIAL: verify the URL actually responds before saving.
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
    `\n${APPLY ? '✅ done' : '✅ dry run done'} — ${written} ${APPLY ? 'written' : 'would write'}, ${urlsRejected} URL-rejected, ${llmDeclined} LLM-declined.`,
  );
}

run().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
