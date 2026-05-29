#!/usr/bin/env npx tsx
/**
 * Backfill `key_holding` on verified Justice Matrix cases where it's missing.
 *
 * The Justice Matrix has cases with a strategic_issue but no holding text, so
 * profile pages render with one substantive block instead of two. Many of the
 * affected cases are well-documented (J.B. v Malta, Held v Montana, North
 * Macedonia Romani Children, etc.), and an LLM with public legal knowledge can
 * write a faithful 2-3 sentence holding from the citation + jurisdiction +
 * year + existing strategic_issue + authoritative link.
 *
 * The LLM is asked to return `confidence: 'unknown'` when it cannot write a
 * grounded holding, and we skip those rows rather than guess.
 *
 * Usage:
 *   npx tsx scripts/backfill-key-holdings.ts                          (dry run)
 *   npx tsx scripts/backfill-key-holdings.ts --apply                  (write)
 *   npx tsx scripts/backfill-key-holdings.ts --case-id <uuid> --apply
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

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-5-20250929';

const argv = process.argv.slice(2);
const arg = (name: string, def?: string) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : def;
};
const CASE_ID = arg('case-id');
const LIMIT = parseInt(arg('limit', '20')!, 10);
const APPLY = argv.includes('--apply');

// Inline schema — keeps the backfill self-contained; CLAUDE.md asks for Zod
// validation, which is what matters for "don't write malformed data".
const HoldingResponseSchema = z.object({
  key_holding: z.string().min(20).max(2000).nullable(),
  confidence: z.enum(['high', 'medium', 'low', 'unknown']),
  reasoning: z.string().max(400).optional(),
});
type HoldingResponse = z.infer<typeof HoldingResponseSchema>;

interface CaseRow {
  id: string;
  case_citation: string;
  jurisdiction: string;
  year: number | null;
  court: string | null;
  strategic_issue: string | null;
  authoritative_link: string | null;
  categories: string[] | null;
}

async function loadCandidates(): Promise<CaseRow[]> {
  let q = supabase
    .from('justice_matrix_cases')
    .select('id,case_citation,jurisdiction,year,court,strategic_issue,authoritative_link,categories')
    .eq('verified', true);
  if (CASE_ID) q = q.eq('id', CASE_ID);
  else q = q.or('key_holding.is.null,key_holding.eq.').limit(LIMIT);
  const { data, error } = await q;
  if (error) throw new Error(`loadCandidates: ${error.message}`);
  // Belt-and-braces: filter again client-side because PostgREST .or() on
  // null + empty-string is finicky.
  return ((data ?? []) as CaseRow[]).filter((c) =>
    CASE_ID ? true : !((c as unknown as { key_holding?: string }).key_holding ?? '').trim(),
  );
}

async function askForHolding(row: CaseRow): Promise<HoldingResponse | null> {
  const prompt = `You are a legal researcher cataloguing strategic litigation. Write a faithful key holding for this case.

Case: ${row.case_citation}
Jurisdiction: ${row.jurisdiction}
Court: ${row.court ?? 'unknown'}
Year: ${row.year ?? 'unknown'}
Strategic issue: ${row.strategic_issue ?? 'unknown'}
Authoritative link: ${row.authoritative_link ?? 'unknown'}
Categories: ${(row.categories ?? []).join(', ')}

Return ONLY valid JSON (no markdown):
{"key_holding": "2-3 sentence holding describing what the court actually decided, in your own words", "confidence": "high" | "medium" | "low" | "unknown", "reasoning": "one sentence on basis for confidence"}

Rules:
- The holding is what the court DECIDED, not the issue it considered. Distinguish.
- Write your own concise prose; do not quote without attribution.
- If you are not confident this is a real, public decision you can describe faithfully, return key_holding=null and confidence="unknown". Do NOT guess at a holding for a case you cannot verify from training knowledge.
- For investigations, royal commissions, or reports rather than court decisions, return confidence="unknown" with key_holding=null (this script is for court holdings only).
`;

  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = res.content[0].type === 'text' ? res.content[0].text : '';
  let raw: unknown;
  try {
    raw = parseJSON(text);
  } catch {
    return null;
  }
  const v = validateLLMOutput(raw, HoldingResponseSchema);
  return v.success ? v.data : null;
}

async function run() {
  console.log(
    `\n📜 Key-holding backfill  |  ${APPLY ? 'APPLY (writing)' : 'DRY RUN'}${CASE_ID ? `  |  case ${CASE_ID}` : `  |  limit ${LIMIT}`}`,
  );
  const candidates = await loadCandidates();
  if (!candidates.length) {
    console.log('No candidates.');
    return;
  }
  console.log(`Found ${candidates.length} verified case(s) needing a holding.\n`);

  let updated = 0;
  let skipped = 0;
  for (const row of candidates) {
    console.log(`— ${row.case_citation}`);
    let resp: HoldingResponse | null = null;
    try {
      resp = await askForHolding(row);
    } catch (e) {
      console.log(`  ❌ LLM error: ${(e as Error).message?.slice(0, 200)}`);
      skipped++;
      continue;
    }
    if (!resp) {
      console.log('  ❌ LLM output failed schema validation, skipping');
      skipped++;
      continue;
    }
    if (resp.confidence === 'unknown' || !resp.key_holding) {
      console.log(`  ⏭️  LLM declined (${resp.confidence})${resp.reasoning ? `: ${resp.reasoning}` : ''}`);
      skipped++;
      continue;
    }

    console.log(`  📝 [${resp.confidence}] ${resp.key_holding.slice(0, 140)}${resp.key_holding.length > 140 ? '…' : ''}`);

    if (APPLY) {
      const { error } = await supabase
        .from('justice_matrix_cases')
        .update({ key_holding: resp.key_holding, updated_at: new Date().toISOString() })
        .eq('id', row.id);
      if (error) {
        console.log(`  ❌ update failed: ${error.message}`);
        skipped++;
        continue;
      }
      console.log('  ✅ written');
    }
    updated++;
  }

  console.log(`\n${APPLY ? '✅ done' : '✅ dry run done'} — ${updated} ${APPLY ? 'written' : 'would write'}, ${skipped} skipped.`);
}

run().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
