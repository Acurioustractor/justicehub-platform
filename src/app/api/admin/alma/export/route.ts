import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/supabase/admin-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Allow up to 5000 rows per export — beyond that the response gets large
// enough that admins should be running a script instead of hitting an API.
const MAX_ROWS = 5000;

function csvEscape(v: any): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const COLUMNS = [
  'org_name',
  'org_slug',
  'state',
  'city',
  'public_url',
  'website',
  'contact_email',
  'contact_phone',
  'completeness_score',
  'last_outreach_status',
  'last_outreach_at',
  'has_logo',
  'has_annual_report',
  'has_history',
  'is_claimed',
  'is_indigenous_org',
];

export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;
    const format = params.get('format') || 'csv';
    if (format !== 'csv' && format !== 'json') {
      return NextResponse.json({ error: 'format must be csv | json' }, { status: 400 });
    }
    const stateFilter = params.get('state') || '';
    const onlyApproved = params.get('onlyApproved') === '1';
    const sinceParam = params.get('since') || ''; // ISO date
    const limit = Math.min(MAX_ROWS, parseInt(params.get('limit') || '1000', 10));

    const supabase = createServiceClient();

    // Pick orgs that have at least one approved candidate (if onlyApproved)
    // or just the eligible pool ordered by score.
    let orgIds: string[] | null = null;
    if (onlyApproved) {
      let q = supabase
        .from('alma_org_enrichment_candidates')
        .select('organization_id')
        .eq('status', 'approved');
      if (sinceParam) q = q.gte('reviewed_at', sinceParam);
      const { data: cs } = await q.limit(limit * 2);
      orgIds = Array.from(new Set((cs || []).map((c: any) => c.organization_id))).slice(0, limit);
      if (orgIds.length === 0) {
        if (format === 'json') return NextResponse.json({ rows: [] });
        return new NextResponse(COLUMNS.join(','), {
          headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="alma-export.csv"' },
        });
      }
    }

    let query = supabase
      .from('organizations')
      .select(
        'id, name, slug, state, city, website_url, website, contact_email, email, phone, logo_url, annual_report_url, history_summary, profile_completeness_score, is_indigenous_org'
      )
      .neq('archived', true)
      .order('profile_completeness_score', { ascending: false, nullsFirst: false })
      .limit(limit);
    if (stateFilter) query = query.eq('state', stateFilter);
    if (orgIds) query = query.in('id', orgIds);

    const { data: orgs, error } = await query;
    if (error) throw error;

    const orgsArr = (orgs || []) as any[];
    if (orgsArr.length === 0) {
      if (format === 'json') return NextResponse.json({ rows: [] });
      return new NextResponse(COLUMNS.join(','), {
        headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="alma-export.csv"' },
      });
    }

    // Hydrate latest outreach and claim per org
    const ids = orgsArr.map((o) => o.id);
    const outreachByOrg: Record<string, any> = {};
    const claimByOrg: Record<string, any> = {};
    for (let i = 0; i < ids.length; i += 100) {
      const slice = ids.slice(i, i + 100);
      const [outreach, claims] = await Promise.all([
        supabase
          .from('organization_outreach_log')
          .select('organization_id, response_status, sent_at')
          .in('organization_id', slice)
          .order('sent_at', { ascending: false }),
        supabase
          .from('organization_claims')
          .select('organization_id, status')
          .in('organization_id', slice)
          .order('created_at', { ascending: false }),
      ]);
      for (const r of (outreach.data || []) as any[]) {
        if (!outreachByOrg[r.organization_id]) outreachByOrg[r.organization_id] = r;
      }
      for (const c of (claims.data || []) as any[]) {
        if (!claimByOrg[c.organization_id]) claimByOrg[c.organization_id] = c;
      }
    }

    const rows = orgsArr.map((o) => ({
      org_name: o.name,
      org_slug: o.slug,
      state: o.state,
      city: o.city,
      public_url: `https://justicehub.com.au/sites/${o.slug}`,
      website: o.website_url || o.website,
      contact_email: o.contact_email || o.email,
      contact_phone: o.phone,
      completeness_score:
        o.profile_completeness_score !== null
          ? Number(o.profile_completeness_score).toFixed(2)
          : '',
      last_outreach_status: outreachByOrg[o.id]?.response_status || '',
      last_outreach_at: outreachByOrg[o.id]?.sent_at || '',
      has_logo: o.logo_url ? '1' : '0',
      has_annual_report: o.annual_report_url ? '1' : '0',
      has_history: o.history_summary ? '1' : '0',
      is_claimed: claimByOrg[o.id]?.status === 'verified' ? '1' : '0',
      is_indigenous_org: o.is_indigenous_org ? '1' : '0',
    }));

    if (format === 'json') {
      return NextResponse.json({ rows, count: rows.length });
    }

    const csvLines = [COLUMNS.join(',')];
    for (const r of rows) {
      csvLines.push(COLUMNS.map((c) => csvEscape((r as any)[c])).join(','));
    }
    const csv = csvLines.join('\n');
    const filename = `alma-export-${new Date().toISOString().slice(0, 10)}${stateFilter ? `-${stateFilter}` : ''}.csv`;
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (e: any) {
    console.error('[export GET]', e);
    return NextResponse.json({ error: e?.message || 'internal error' }, { status: 500 });
  }
}
