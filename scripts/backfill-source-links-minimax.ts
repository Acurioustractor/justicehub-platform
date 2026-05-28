#!/usr/bin/env npx tsx
/**
 * Third-pass source-link backfill — same goal as the other two, but routed
 * through MiniMax via the project's model-router. Used when Anthropic credit
 * is exhausted but MiniMax credit remains. MiniMax has a different training
 * cut and a different knowledge skew, so this pass catches URLs the
 * Anthropic-only passes missed.
 *
 * Web search is NOT used here — MiniMax doesn't expose a hosted search tool
 * in this client config. It's a pure training-knowledge pass, with the same
 * HEAD-verification gate that catches hallucinated URLs.
 *
 * Usage:
 *   npx tsx scripts/backfill-source-links-minimax.ts                  (dry run)
 *   npx tsx scripts/backfill-source-links-minimax.ts --apply
 *   npx tsx scripts/backfill-source-links-minimax.ts --limit 30 --apply
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
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
// Propagate to process.env so the model-router can pick the key up.
for (const [k, v] of Object.entries(env)) if (!process.env[k]) process.env[k] = v;

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Use the project's model-router for provider failover. callBackgroundLLM is
// the documented entry point for "data enrichment, research summarization" —
// it prefers MiniMax / cheap providers, exactly what we want here.
import { callBackgroundLLM } from '../src/lib/ai/model-router';

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

const PROMPT_BASE = `You are populating an authoritative source link for a Justice Matrix entry. Return ONE canonical URL where this item can be read.

Acceptable URLs by type:
  court_decision    -> official court site, free legal database (BAILII, AustLII, CourtListener, HUDOC, ZACC, CanLII)
  legislation       -> official legislation registry (legislation.gov.au, legislation.act.gov.au, etc)
  royal_commission / inquiry / commission_of_inquiry / senate_inquiry / law_reform_inquiry
                    -> the commission's final-report page on its own site, or the host parliament's inquiry page
  report / inspection_report / ngo_report / government_review / statistical_report / statistics / national_agreement
                    -> the publishing body's page for that report
  investigation / human_rights_investigation
                    -> the investigating body's report page or coronial inquest site

Return ONLY valid JSON: {"url": "https://..." | null, "confidence": "high" | "medium" | "low" | "unknown", "reasoning": "one sentence"}

Rules:
- If you cannot identify a specific canonical URL from training knowledge, return url=null and confidence="unknown". Do NOT invent a plausible-looking URL.
- The URL must be stable, public, and on the source-of-truth domain.
- Not Google search, not Wikipedia, not a news article, not a paywalled aggregator.`;

async function askForUrl(
  row: CaseRow,
): Promise<{ url: string | null; confidence: string; reasoning?: string } | null> {
  const prompt =
    PROMPT_BASE +
    `

Item: ${row.case_citation}
Jurisdiction: ${row.jurisdiction}
Year: ${row.year ?? 'unknown'}
Type: ${row.case_type ?? 'unknown'}
Context: ${row.strategic_issue?.slice(0, 200) ?? 'unknown'}`;

  let text: string;
  try {
    text = await callBackgroundLLM(prompt, { maxTokens: 600 });
  } catch (e) {
    throw e;
  }
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
    `\n🔗 Source-link backfill (MiniMax)  |  ${APPLY ? 'APPLY' : 'DRY RUN'}${
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
      resp = await askForUrl(row);
    } catch (e) {
      console.log(`  ❌ LLM error: ${(e as Error).message?.slice(0, 180)}`);
      errors++;
      continue;
    }
    if (!resp || resp.confidence === 'unknown' || !resp.url) {
      console.log(`  ⏭️  declined (${resp?.confidence ?? 'malformed'})`);
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
