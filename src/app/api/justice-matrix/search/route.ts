/**
 * GET /api/justice-matrix/search
 *
 * Unified public search across justice_matrix_cases + justice_matrix_campaigns.
 * Two modes:
 *   - keyword (default): ilike across citation/name + jurisdiction/region + issue/goals
 *   - semantic: embed the query with text-embedding-3-small and use the
 *     justice_matrix_search_cases/_campaigns pgvector RPCs
 *
 * No auth. Returns a slim payload suitable for instant-search rendering.
 *
 * Query params:
 *   q        — free text (defaults to '' → list mode)
 *   mode     — 'keyword' | 'semantic' (default keyword)
 *   type     — 'all' | 'case' | 'campaign' (default all)
 *   cat      — comma-separated category tags (overlaps)
 *   outcome  — favorable | adverse | pending (cases only)
 *   strength — high | medium | low (cases only)
 *   region   — string (cases.region or campaigns.country_region prefix)
 *   country  — ISO country code (case-insensitive)
 *   limit    — per-type cap, default 24, max 60
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { embed, toPgVector } from '@/lib/justice-matrix/embeddings';

export const dynamic = 'force-dynamic';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

interface CaseResult {
  kind: 'case';
  id: string;
  title: string;
  jurisdiction: string;
  year: number | null;
  court: string | null;
  excerpt: string | null;
  region: string | null;
  country_code: string | null;
  categories: string[] | null;
  outcome: string | null;
  precedent_strength: string | null;
  case_type: string | null;
  authoritative_link: string | null;
  distance: number | null;
}

interface CampaignResult {
  kind: 'campaign';
  id: string;
  title: string;
  region: string | null;
  start_year: number | null;
  is_ongoing: boolean | null;
  excerpt: string | null;
  country_code: string | null;
  categories: string[] | null;
  lead_organizations: string | null;
  campaign_link: string | null;
  distance: number | null;
}

function clampInt(value: string | null, def: number, min: number, max: number): number {
  if (!value) return def;
  const n = parseInt(value, 10);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, n));
}

function safeIlike(q: string): string {
  // Strip characters that break PostgREST .or() syntax. Already known safe in
  // the older /cases page; using the same scrub here.
  return q.replace(/[,()*%]/g, ' ').trim().slice(0, 120);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sp = url.searchParams;

  const q = safeIlike(sp.get('q') ?? '');
  const mode = sp.get('mode') === 'semantic' ? 'semantic' : 'keyword';
  const typeParam = sp.get('type') ?? 'all';
  const type: 'all' | 'case' | 'campaign' =
    typeParam === 'case' || typeParam === 'campaign' ? typeParam : 'all';
  const cats = (sp.get('cat') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const outcome = sp.get('outcome') ?? '';
  const strength = sp.get('strength') ?? '';
  const region = (sp.get('region') ?? '').trim().slice(0, 80);
  const country = (sp.get('country') ?? '').trim().slice(0, 8).toUpperCase();
  const limit = clampInt(sp.get('limit'), 24, 1, 60);

  const supabase = createServiceClient() as AnyClient;

  // Semantic mode requires an embedding for the query string. If q is empty we
  // silently fall back to keyword mode (no point semantic-searching for "").
  const useSemantic = mode === 'semantic' && q.length >= 3 && !!process.env.OPENAI_API_KEY;

  let cases: CaseResult[] = [];
  let campaigns: CampaignResult[] = [];

  if (useSemantic) {
    let queryVec: string;
    try {
      const vec = await embed(q);
      queryVec = toPgVector(vec);
    } catch (e) {
      // Fall back to keyword if the embedding call fails.
      return runKeywordSearch();
    }

    if (type !== 'campaign') {
      const { data } = await supabase.rpc('justice_matrix_search_cases', {
        query_embedding: queryVec,
        match_limit: limit,
        max_distance: 0.6,
      });
      cases = (data ?? []).map(mapCaseRow);
    }
    if (type !== 'case') {
      const { data } = await supabase.rpc('justice_matrix_search_campaigns', {
        query_embedding: queryVec,
        match_limit: limit,
        max_distance: 0.6,
      });
      campaigns = (data ?? []).map(mapCampaignRow);
    }

    // Apply non-semantic facet filters in-memory — the RPCs return a small set.
    cases = applyCaseFilters(cases, { cats, outcome, strength, region, country });
    campaigns = applyCampaignFilters(campaigns, { cats, region, country });
  } else {
    return runKeywordSearch();
  }

  return NextResponse.json({
    mode: useSemantic ? 'semantic' : 'keyword',
    q,
    type,
    cases,
    campaigns,
    total: cases.length + campaigns.length,
  });

  // -----------------------------------------------------------------
  // Inner helpers
  // -----------------------------------------------------------------

  async function runKeywordSearch() {
    const tasks: Array<Promise<unknown>> = [];

    if (type !== 'campaign') {
      let cq = supabase
        .from('justice_matrix_cases')
        .select(
          'id,case_citation,jurisdiction,year,court,strategic_issue,key_holding,region,country_code,categories,outcome,precedent_strength,case_type,authoritative_link',
        )
        .order('year', { ascending: false, nullsFirst: false })
        .limit(limit);
      if (q) cq = cq.or(`case_citation.ilike.%${q}%,jurisdiction.ilike.%${q}%,strategic_issue.ilike.%${q}%,key_holding.ilike.%${q}%`);
      if (cats.length) cq = cq.overlaps('categories', cats);
      if (outcome) cq = cq.eq('outcome', outcome);
      if (strength) cq = cq.eq('precedent_strength', strength);
      if (region) cq = cq.ilike('region', `%${region}%`);
      if (country) cq = cq.eq('country_code', country);
      tasks.push(cq);
    } else {
      tasks.push(Promise.resolve({ data: [] }));
    }

    if (type !== 'case') {
      let mq = supabase
        .from('justice_matrix_campaigns')
        .select(
          'id,campaign_name,country_region,start_year,is_ongoing,goals,notable_tactics,country_code,categories,lead_organizations,campaign_link',
        )
        .order('start_year', { ascending: false, nullsFirst: false })
        .limit(limit);
      if (q) mq = mq.or(`campaign_name.ilike.%${q}%,country_region.ilike.%${q}%,goals.ilike.%${q}%,notable_tactics.ilike.%${q}%,lead_organizations.ilike.%${q}%`);
      if (cats.length) mq = mq.overlaps('categories', cats);
      if (region) mq = mq.ilike('country_region', `%${region}%`);
      if (country) mq = mq.eq('country_code', country);
      tasks.push(mq);
    } else {
      tasks.push(Promise.resolve({ data: [] }));
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [caseRes, campRes] = (await Promise.all(tasks)) as Array<{ data: any[] | null }>;
    const caseRows = (caseRes.data ?? []).map(mapCaseRow);
    const campRows = (campRes.data ?? []).map(mapCampaignRow);

    return NextResponse.json({
      mode: 'keyword',
      q,
      type,
      cases: caseRows,
      campaigns: campRows,
      total: caseRows.length + campRows.length,
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCaseRow(r: any): CaseResult {
  return {
    kind: 'case',
    id: r.id,
    title: r.case_citation,
    jurisdiction: r.jurisdiction,
    year: r.year ?? null,
    court: r.court ?? null,
    excerpt: r.strategic_issue ?? r.key_holding ?? null,
    region: r.region ?? null,
    country_code: r.country_code ?? null,
    categories: r.categories ?? null,
    outcome: r.outcome ?? null,
    precedent_strength: r.precedent_strength ?? null,
    case_type: r.case_type ?? null,
    authoritative_link: r.authoritative_link ?? null,
    distance: typeof r.distance === 'number' ? r.distance : null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCampaignRow(r: any): CampaignResult {
  return {
    kind: 'campaign',
    id: r.id,
    title: r.campaign_name,
    region: r.country_region ?? null,
    start_year: r.start_year ?? null,
    is_ongoing: r.is_ongoing ?? null,
    excerpt: r.goals ?? r.notable_tactics ?? null,
    country_code: r.country_code ?? null,
    categories: r.categories ?? null,
    lead_organizations: r.lead_organizations ?? null,
    campaign_link: r.campaign_link ?? null,
    distance: typeof r.distance === 'number' ? r.distance : null,
  };
}

function applyCaseFilters(
  rows: CaseResult[],
  opts: { cats: string[]; outcome: string; strength: string; region: string; country: string },
): CaseResult[] {
  return rows.filter((r) => {
    if (opts.cats.length && !(r.categories ?? []).some((c) => opts.cats.includes(c))) return false;
    if (opts.outcome && r.outcome !== opts.outcome) return false;
    if (opts.strength && r.precedent_strength !== opts.strength) return false;
    if (opts.region && !(r.region ?? '').toLowerCase().includes(opts.region.toLowerCase())) return false;
    if (opts.country && r.country_code !== opts.country) return false;
    return true;
  });
}

function applyCampaignFilters(
  rows: CampaignResult[],
  opts: { cats: string[]; region: string; country: string },
): CampaignResult[] {
  return rows.filter((r) => {
    if (opts.cats.length && !(r.categories ?? []).some((c) => opts.cats.includes(c))) return false;
    if (opts.region && !(r.region ?? '').toLowerCase().includes(opts.region.toLowerCase())) return false;
    if (opts.country && r.country_code !== opts.country) return false;
    return true;
  });
}
