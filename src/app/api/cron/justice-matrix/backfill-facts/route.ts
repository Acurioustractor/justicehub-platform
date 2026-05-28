/**
 * Vercel cron: nightly top-up of deep case fields (facts, reasoning, dissents,
 * statutes_cited, cases_cited, judges) for Justice Matrix cases that landed
 * without them. Keeps newly-published cases substantive over time — the same
 * steady-state role embed-new plays for embeddings.
 *
 * This is NOT the bulk backfill. To fill the existing factless backlog in one
 * pass (no serverless timeout), run the hardened CLI:
 *   node scripts/justice-matrix-backfill-deep.mjs --apply --limit 100
 *
 * Idempotent. Bounded by MAX_PER_RUN and a wall-clock budget so a single
 * serverless invocation can't blow the timeout. Uses the shared model-router
 * with retry-on-JSON-fail (re-call on unparseable output).
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { callLLM } from '@/lib/ai/model-router';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_PER_RUN = 12;
const WALL_BUDGET_MS = 50_000; // leave headroom under maxDuration

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

interface CaseRow {
  id: string;
  case_citation: string;
  jurisdiction: string;
  year: number | null;
  court: string | null;
  strategic_issue: string | null;
  key_holding: string | null;
  authoritative_link: string | null;
  facts: string | null;
  reasoning: string | null;
  judges: string[] | null;
}

function parseJson(text: string): Record<string, unknown> {
  const cleaned = text
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first >= 0 && last > first) return JSON.parse(cleaned.slice(first, last + 1));
    throw new Error('No JSON object found');
  }
}

// model-router rotates providers on HTTP error but returns the first 200-OK
// text; it does not validate JSON. So we re-call on a parse failure (a fresh
// call may rotate or simply produce valid output) up to `attempts` times.
async function callForJson(prompt: string, attempts = 3): Promise<Record<string, unknown>> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const text = await callLLM(prompt, { jsonMode: true, maxTokens: 1500 });
      return parseJson(text);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error('callForJson exhausted');
}

async function fetchSourceText(url: string | null): Promise<string> {
  if (!url || url.startsWith('mailto:')) return '';
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: ctrl.signal,
      headers: {
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    if (!res.ok) return '';
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 30000);
  } catch {
    return '';
  } finally {
    clearTimeout(t);
  }
}

function deepPrompt(c: CaseRow, pageText: string): string {
  return `You are filling in deeper fields on an existing strategic-litigation case profile. The basic profile already exists; do NOT overwrite identity fields. Only fill the 6 fields requested.

Existing case profile:
  citation: ${c.case_citation}
  jurisdiction: ${c.jurisdiction}
  year: ${c.year ?? 'unknown'}
  court: ${c.court ?? 'unknown'}
  strategic_issue: ${c.strategic_issue ?? 'unknown'}
  key_holding: ${c.key_holding ?? 'unknown'}
  source_url: ${c.authoritative_link ?? '(none)'}

Source page text (truncated):
${pageText || '(empty — fall back to training knowledge if you have it; null otherwise)'}

Return ONLY valid JSON of this shape; use null for fields you cannot ground:
{"facts":"What happened to the people in this case — one paragraph","reasoning":"Why the court decided this way — the ratio decidendi (2-4 sentences)","dissents":"Dissenting opinions: who and on what point, or null","statutes_cited":["Refugee Convention art. 33"],"cases_cited":["Plaintiff M70/2011 v Minister"],"judges":["Kiefel CJ"]}

Rules:
- Don't invent. Null (or []) if you can't ground.
- Statutes/cases/judges: arrays of short strings. Trim honorifics.
- Facts != strategic_issue. Facts = what happened to the people. Issue = the legal question.
- Reasoning != key_holding. Holding = the decision. Reasoning = why that decision.`;
}

const arr = (v: unknown): string[] | null =>
  Array.isArray(v) && v.length ? v.map(String) : null;

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const got = request.headers.get('authorization');
    if (got !== `Bearer ${expected}`) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabase = createServiceClient() as Db;
  const startedAt = Date.now();

  // Target cases missing any of the three prose/array fields.
  const { data, error } = await supabase
    .from('justice_matrix_cases')
    .select(
      'id,case_citation,jurisdiction,year,court,strategic_issue,key_holding,authoritative_link,facts,reasoning,judges',
    )
    .or('facts.is.null,reasoning.is.null,judges.is.null')
    .order('created_at', { ascending: false })
    .limit(MAX_PER_RUN);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message.slice(0, 200) }, { status: 500 });
  }

  const cases = (data ?? []) as CaseRow[];
  let filled = 0;
  let skipped = 0;
  let failed = 0;
  let stoppedEarly = false;

  for (const c of cases) {
    if (Date.now() - startedAt > WALL_BUDGET_MS) {
      stoppedEarly = true;
      break;
    }
    if (c.facts && c.reasoning && c.judges?.length) {
      skipped++;
      continue;
    }

    let enriched: Record<string, unknown>;
    try {
      const pageText = await fetchSourceText(c.authoritative_link);
      enriched = await callForJson(deepPrompt(c, pageText));
    } catch {
      failed++;
      continue;
    }

    // Never overwrite existing values; only fill empties.
    const patch: Record<string, unknown> = {};
    if (!c.facts && enriched.facts) patch.facts = enriched.facts;
    if (!c.reasoning && enriched.reasoning) patch.reasoning = enriched.reasoning;
    if (enriched.dissents) patch.dissents = enriched.dissents;
    if (arr(enriched.statutes_cited)) patch.statutes_cited = arr(enriched.statutes_cited);
    if (arr(enriched.cases_cited)) patch.cases_cited = arr(enriched.cases_cited);
    if ((!c.judges || c.judges.length === 0) && arr(enriched.judges)) patch.judges = arr(enriched.judges);

    if (!Object.keys(patch).length) {
      skipped++;
      continue;
    }

    const { error: upErr } = await supabase
      .from('justice_matrix_cases')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', c.id);
    if (upErr) failed++;
    else filled++;
  }

  return NextResponse.json({
    ok: true,
    scanned_at: new Date().toISOString(),
    considered: cases.length,
    filled,
    skipped,
    failed,
    stoppedEarly,
  });
}
