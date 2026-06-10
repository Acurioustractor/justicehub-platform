/**
 * GET /api/justice-matrix/export
 *
 * CSV / JSON export of a Justice Matrix filter set — the export the v2 NJP
 * paper promised. Mirrors the facet params of the public list pages so any
 * filtered view can be carried into a spreadsheet or pipeline:
 *
 *   ?type=case|campaign   (default case)
 *   &format=csv|json      (default csv)
 *   &q=…                  free text (citation / jurisdiction / issue)
 *   &cat=a,b,c            category overlap
 *   &outcome=favorable|adverse|pending          (cases)
 *   &strength=high|medium|low                   (cases)
 *
 * Read-only, service-role via the same lite client the pages use, capped at
 * EXPORT_LIMIT rows. Verification state is included so downstream users can
 * filter on it; this endpoint never pretends unconfirmed rows are confirmed.
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';

export const dynamic = 'force-dynamic';

const EXPORT_LIMIT = 1000;

const CASE_COLUMNS =
  'id,case_citation,jurisdiction,country_code,region,year,court,case_type,strategic_issue,key_holding,outcome,precedent_strength,categories,authoritative_link,verified,human_confirmed';
const CAMPAIGN_COLUMNS =
  'id,campaign_name,country_region,country_code,start_year,end_year,is_ongoing,lead_organizations,goals,notable_tactics,outcome_status,categories,campaign_link,verified';

function sanitise(s: string): string {
  return s.replace(/[%,()]/g, ' ').trim().slice(0, 120);
}

function csvCell(v: unknown): string {
  if (v == null) return '';
  const s = Array.isArray(v) ? v.join('; ') : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const head = columns.join(',');
  const body = rows.map((r) => columns.map((c) => csvCell(r[c])).join(',')).join('\n');
  return `${head}\n${body}\n`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get('type') === 'campaign' ? 'campaign' : 'case';
  const format = url.searchParams.get('format') === 'json' ? 'json' : 'csv';
  const q = sanitise(url.searchParams.get('q') ?? '');
  const cats = (url.searchParams.get('cat') ?? '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 12);
  const outcome = url.searchParams.get('outcome') ?? '';
  const strength = url.searchParams.get('strength') ?? '';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any;

  let query;
  if (type === 'campaign') {
    query = supabase.from('justice_matrix_campaigns').select(CAMPAIGN_COLUMNS).order('start_year', { ascending: false, nullsFirst: false });
    if (q) query = query.or(`campaign_name.ilike.%${q}%,country_region.ilike.%${q}%,goals.ilike.%${q}%`);
  } else {
    query = supabase.from('justice_matrix_cases').select(CASE_COLUMNS).order('year', { ascending: false, nullsFirst: false });
    if (q) query = query.or(`case_citation.ilike.%${q}%,jurisdiction.ilike.%${q}%,strategic_issue.ilike.%${q}%`);
    if (outcome) query = query.eq('outcome', outcome);
    if (strength) query = query.eq('precedent_strength', strength);
  }
  if (cats.length) query = query.overlaps('categories', cats);
  query = query.limit(EXPORT_LIMIT);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
  const rows = (data ?? []) as Record<string, unknown>[];
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `justice-matrix-${type}s-${stamp}`;

  if (format === 'json') {
    return new NextResponse(
      JSON.stringify(
        {
          exported_at: new Date().toISOString(),
          source: 'JusticeHub Justice Matrix — research resource, not legal advice',
          count: rows.length,
          truncated: rows.length === EXPORT_LIMIT,
          rows,
        },
        null,
        2,
      ),
      {
        headers: {
          'content-type': 'application/json',
          'content-disposition': `attachment; filename="${filename}.json"`,
        },
      },
    );
  }

  const columns = (type === 'campaign' ? CAMPAIGN_COLUMNS : CASE_COLUMNS).split(',');
  return new NextResponse(toCsv(rows, columns), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}.csv"`,
    },
  });
}
