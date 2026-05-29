/**
 * Vercel cron: auto-publish pending Justice Matrix discoveries into the live
 * matrix as AI-EXTRACTED, NOT-YET-HUMAN-CONFIRMED rows.
 *
 * Why this exists: scan-json stages candidates into justice_matrix_discovered
 * (status='pending') with structured extracted_* fields. Without an automatic
 * promote step those candidates never appear, so corpus growth was capped at the
 * rate a human ran the CLI. This cron decouples PUBLIC VISIBILITY from HUMAN
 * CONFIRMATION: items go live immediately behind the "AI-extracted, unconfirmed"
 * badge (verified=false, human_confirmed=false). A human reviewer's confirm_review
 * action (discovered/[id] route) is the slower quality overlay, not a release gate.
 *
 * No LLM here. The scanner already extracted the fields; the facts-backfill cron
 * deepens court decisions later. This cron only maps and inserts.
 *
 * Guardrails preserved from the dual-control build:
 *   - never sets human_confirmed (only a human may, via the admin UI)
 *   - publication-law gate: Australian youth / children's-court matters are HELD
 *     (left pending) for human review, never auto-published
 *   - near-duplicates (high pgvector similarity) are auto-rejected at promote
 *
 * Idempotent + bounded (MAX_PER_RUN + wall budget). CRON_SECRET-guarded.
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_PER_RUN = 30;
const WALL_BUDGET_MS = 50_000;
const DUP_REJECT_SIMILARITY = 92; // similarity_score is 0-100; >= this is a near-dup

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

interface Discovery {
  id: string;
  item_type: string | null;
  source_url: string | null;
  extracted_title: string | null;
  extracted_jurisdiction: string | null;
  extracted_year: number | null;
  extracted_categories: string[] | null;
  extracted_summary: string | null;
  extracted_country_code: string | null;
  similarity_score: number | null;
}

const YOUTH = /youth|child|juvenile|minor|raise the age|raise-the-age|young (person|people|offender)/i;

// Publication-law gate: do not auto-publish Australian children's-court matters
// (statutory non-publication rules). Held for a human to review.
function isAustralianYouthMatter(d: Discovery): boolean {
  const au = /australia/i.test(d.extracted_jurisdiction ?? '');
  if (!au) return false;
  const hay = `${d.extracted_title ?? ''} ${(d.extracted_categories ?? []).join(' ')}`;
  return YOUTH.test(hay);
}

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

  const { data, error } = await supabase
    .from('justice_matrix_discovered')
    .select(
      'id,item_type,source_url,extracted_title,extracted_jurisdiction,extracted_year,extracted_categories,extracted_summary,extracted_country_code,similarity_score',
    )
    .eq('status', 'pending')
    .order('discovered_at', { ascending: true })
    .limit(MAX_PER_RUN);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message.slice(0, 200) }, { status: 500 });
  }

  const rows = (data ?? []) as Discovery[];
  let published = 0;
  let held = 0;
  let deduped = 0;
  let failed = 0;
  let stoppedEarly = false;
  const now = new Date().toISOString();

  for (const d of rows) {
    if (Date.now() - startedAt > WALL_BUDGET_MS) {
      stoppedEarly = true;
      break;
    }
    if (!d.extracted_title) {
      failed++;
      continue;
    }

    // Auto-reject near-duplicates so they never reach a human or the live matrix.
    if (d.similarity_score != null && d.similarity_score >= DUP_REJECT_SIMILARITY) {
      await supabase
        .from('justice_matrix_discovered')
        .update({ status: 'rejected', review_notes: `auto-rejected: near-duplicate (similarity ${d.similarity_score})`, reviewed_at: now })
        .eq('id', d.id);
      deduped++;
      continue;
    }

    // Publication-law gate: hold AU youth matters for human review.
    if (d.item_type === 'case' && isAustralianYouthMatter(d)) {
      held++;
      continue; // stays pending; no insert
    }

    try {
      if (d.item_type === 'campaign') {
        const { data: ins, error: e } = await supabase
          .from('justice_matrix_campaigns')
          .insert({
            campaign_name: d.extracted_title,
            country_region: d.extracted_jurisdiction,
            goals: d.extracted_summary,
            categories: d.extracted_categories ?? [],
            country_code: d.extracted_country_code,
            source: 'ai_scraped',
            campaign_link: d.source_url,
            verified: false, // automated, not a human sign-off
          })
          .select('id')
          .single();
        if (e) throw e;
        await supabase
          .from('justice_matrix_discovered')
          .update({
            status: 'approved',
            approved_campaign_id: ins.id,
            review_notes: 'auto-published by cron (AI-extracted, not human-confirmed)',
            reviewed_at: now,
          })
          .eq('id', d.id);
        published++;
      } else {
        // Treat everything else as a case. Our JSON sources are court databases,
        // so these are court decisions.
        const { data: ins, error: e } = await supabase
          .from('justice_matrix_cases')
          .insert({
            case_citation: d.extracted_title,
            jurisdiction: d.extracted_jurisdiction,
            year: d.extracted_year,
            strategic_issue: d.extracted_summary,
            categories: d.extracted_categories ?? [],
            country_code: d.extracted_country_code,
            case_type: 'court_decision',
            authoritative_link: d.source_url,
            source: 'ai_scraped',
            verified: false,
            human_confirmed: false,
            ai_extracted_at: now,
          })
          .select('id')
          .single();
        if (e) throw e;
        await supabase
          .from('justice_matrix_discovered')
          .update({
            status: 'approved',
            approved_case_id: ins.id,
            review_notes: 'auto-published by cron (AI-extracted, not human-confirmed)',
            reviewed_at: now,
          })
          .eq('id', d.id);
        published++;
      }
    } catch {
      failed++;
    }
  }

  return NextResponse.json({
    ok: true,
    scanned_at: now,
    considered: rows.length,
    published,
    held, // AU youth matters left pending for human review
    deduped,
    failed,
    stoppedEarly,
  });
}
