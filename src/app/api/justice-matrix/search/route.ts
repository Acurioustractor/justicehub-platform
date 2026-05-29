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
  verified: boolean | null;
  // A human reviewer has confirmed the facts (vs. AI-extracted, unconfirmed).
  // Defaults false in the migration; absent from the semantic RPC, so it maps
  // to null there (no badge on semantic results, which is the honest fallback).
  human_confirmed: boolean | null;
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

interface EvidenceResult {
  kind: 'evidence';
  id: string;
  title: string;
  // ALMA evidence is Australia-only by definition; stamped here so the explore
  // UI can label and filter it as a distinct kind, never confused with the
  // (global) litigation cases.
  jurisdiction: string;
  country_code: 'AU';
  region: null;
  year: number | null;
  evidence_type: string | null;
  excerpt: string | null;
  organization: string | null;
  author: string | null;
  source_url: string | null;
  consent_level: string | null;
  cultural_safety: string | null;
  // 'Community Controlled' rows: title + provenance only, no findings/source.
  restricted: boolean;
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
  const type: 'all' | 'case' | 'campaign' | 'evidence' =
    typeParam === 'case' || typeParam === 'campaign' || typeParam === 'evidence'
      ? typeParam
      : 'all';
  const cats = (sp.get('cat') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const outcome = sp.get('outcome') ?? '';
  const strength = sp.get('strength') ?? '';
  const region = (sp.get('region') ?? '').trim().slice(0, 80);
  const country = (sp.get('country') ?? '').trim().slice(0, 8).toUpperCase();
  const scopeParam = sp.get('scope');
  const scope: 'all' | 'au' | 'global' =
    scopeParam === 'au' || scopeParam === 'global' ? scopeParam : 'all';
  // Raised cap: the explore client loads a generous working set and does the
  // sort / grouping / jurisdiction-bucketing / pagination itself (corpus is
  // small). cases+campaigns fit well under 200; evidence is capped (true total
  // comes from `counts`).
  const limit = clampInt(sp.get('limit'), 50, 1, 200);

  const supabase = createServiceClient() as AnyClient;

  // Which kinds to include for this request.
  const includeCases = type === 'all' || type === 'case';
  const includeCampaigns = type === 'all' || type === 'campaign';
  // ALMA evidence has no categories/outcome/precedent-strength/region and is
  // Australia-only. So a category/outcome/strength/region filter — or a country
  // filter for anywhere but AU — means evidence cannot honestly match; drop it
  // rather than show unfiltered evidence alongside filtered cases/campaigns.
  const evidenceEligible =
    cats.length === 0 && !outcome && !strength && !region && (!country || country === 'AU');
  // Evidence is Australia-only, so the 'global' lens excludes it entirely.
  const includeEvidence =
    (type === 'all' || type === 'evidence') && evidenceEligible && scope !== 'global';

  // Semantic mode requires an embedding for the query string. If q is empty we
  // silently fall back to keyword mode (no point semantic-searching for "").
  const useSemantic = mode === 'semantic' && q.length >= 3 && !!process.env.OPENAI_API_KEY;

  let cases: CaseResult[] = [];
  let campaigns: CampaignResult[] = [];
  let evidence: EvidenceResult[] = [];

  if (useSemantic) {
    let queryVec: string;
    try {
      const vec = await embed(q);
      queryVec = toPgVector(vec);
    } catch (e) {
      // Fall back to keyword if the embedding call fails.
      return runKeywordSearch();
    }

    if (includeCases) {
      const { data } = await supabase.rpc('justice_matrix_search_cases', {
        query_embedding: queryVec,
        match_limit: limit,
        max_distance: 0.6,
      });
      cases = (data ?? []).map(mapCaseRow);
    }
    if (includeCampaigns) {
      const { data } = await supabase.rpc('justice_matrix_search_campaigns', {
        query_embedding: queryVec,
        match_limit: limit,
        max_distance: 0.6,
      });
      campaigns = (data ?? []).map(mapCampaignRow);
    }
    if (includeEvidence) {
      const { data } = await supabase.rpc('justice_matrix_search_evidence', {
        query_embedding: queryVec,
        match_limit: limit,
        max_distance: 0.6,
      });
      evidence = (data ?? []).map(mapEvidenceRow);
    }

    // Apply non-semantic facet filters in-memory — the RPCs return a small set.
    cases = applyCaseFilters(cases, { cats, outcome, strength, region, country });
    campaigns = applyCampaignFilters(campaigns, { cats, region, country });
    // AU-vs-global lens (case by jurisdiction, campaign by region text).
    if (scope !== 'all') {
      cases = cases.filter((c) => inScope(c.jurisdiction, scope));
      campaigns = campaigns.filter((m) => inScope(m.region, scope));
    }
    // Evidence needs no in-memory facet filtering: includeEvidence already
    // gates it to the no-incompatible-filter case (and excludes it under global).
  } else {
    return runKeywordSearch();
  }

  return NextResponse.json({
    mode: useSemantic ? 'semantic' : 'keyword',
    q,
    type,
    cases,
    campaigns,
    evidence,
    // Semantic returns top-N by distance, so the "count" is just what matched.
    counts: { case: cases.length, campaign: campaigns.length, evidence: evidence.length },
    total: cases.length + campaigns.length + evidence.length,
  });

  // -----------------------------------------------------------------
  // Inner helpers
  // -----------------------------------------------------------------

  async function runKeywordSearch() {
    // Filter-applier closures so the data fetch and the head:true count share
    // identical filter chains (single source of truth per type).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filterCases = (b: any) => {
      if (q) b = b.or(`case_citation.ilike.%${q}%,jurisdiction.ilike.%${q}%,strategic_issue.ilike.%${q}%,key_holding.ilike.%${q}%`);
      if (cats.length) b = b.overlaps('categories', cats);
      if (outcome) b = b.eq('outcome', outcome);
      if (strength) b = b.eq('precedent_strength', strength);
      if (region) b = b.ilike('region', `%${region}%`);
      if (country) b = b.eq('country_code', country);
      if (scope === 'au') b = b.ilike('jurisdiction', '%australia%');
      else if (scope === 'global') b = b.not('jurisdiction', 'ilike', '%australia%');
      return b;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filterCampaigns = (b: any) => {
      if (q) b = b.or(`campaign_name.ilike.%${q}%,country_region.ilike.%${q}%,goals.ilike.%${q}%,notable_tactics.ilike.%${q}%,lead_organizations.ilike.%${q}%`);
      if (cats.length) b = b.overlaps('categories', cats);
      if (region) b = b.ilike('country_region', `%${region}%`);
      if (country) b = b.eq('country_code', country);
      if (scope === 'au') b = b.ilike('country_region', '%australia%');
      else if (scope === 'global') b = b.not('country_region', 'ilike', '%australia%');
      return b;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filterEvidence = (b: any) => {
      // Consent gate: exclude 'Strictly Private' (and NULL/unknown). A matched
      // 'Community Controlled' row only exposes title + provenance (redacted in
      // mapEvidenceRow), which the policy permits — so a single .or() is safe.
      b = b.in('consent_level', ['Public Knowledge Commons', 'Community Controlled']);
      if (q) b = b.or(`title.ilike.%${q}%,findings.ilike.%${q}%,methodology.ilike.%${q}%,organization.ilike.%${q}%,author.ilike.%${q}%`);
      return b;
    };

    const empty = Promise.resolve({ data: [], count: 0 });
    const caseSel = 'id,case_citation,jurisdiction,year,court,strategic_issue,key_holding,region,country_code,categories,outcome,precedent_strength,case_type,authoritative_link,verified,human_confirmed';
    const campSel = 'id,campaign_name,country_region,start_year,is_ongoing,goals,notable_tactics,country_code,categories,lead_organizations,campaign_link';
    const evidSel = 'id,title,evidence_type,findings,methodology,organization,author,publication_date,source_url,source_document_url,consent_level,cultural_safety';

    const [caseRes, campRes, evidRes, caseCount, campCount, evidCount] = await Promise.all([
      includeCases
        ? filterCases(supabase.from('justice_matrix_cases').select(caseSel)).order('year', { ascending: false, nullsFirst: false }).limit(limit)
        : empty,
      includeCampaigns
        ? filterCampaigns(supabase.from('justice_matrix_campaigns').select(campSel)).order('start_year', { ascending: false, nullsFirst: false }).limit(limit)
        : empty,
      includeEvidence
        ? filterEvidence(supabase.from('alma_evidence').select(evidSel)).order('publication_date', { ascending: false, nullsFirst: false }).limit(limit)
        : empty,
      includeCases ? filterCases(supabase.from('justice_matrix_cases').select('*', { count: 'exact', head: true })) : empty,
      includeCampaigns ? filterCampaigns(supabase.from('justice_matrix_campaigns').select('*', { count: 'exact', head: true })) : empty,
      includeEvidence ? filterEvidence(supabase.from('alma_evidence').select('*', { count: 'exact', head: true })) : empty,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ]) as Array<{ data: any[] | null; count: number | null }>;

    const caseRows = (caseRes.data ?? []).map(mapCaseRow);
    const campRows = (campRes.data ?? []).map(mapCampaignRow);
    const evidRows = (evidRes.data ?? []).map(mapEvidenceRow);
    const counts = {
      case: caseCount.count ?? caseRows.length,
      campaign: campCount.count ?? campRows.length,
      evidence: evidCount.count ?? evidRows.length,
    };

    return NextResponse.json({
      mode: 'keyword',
      q,
      type,
      cases: caseRows,
      campaigns: campRows,
      evidence: evidRows,
      counts,
      total: counts.case + counts.campaign + counts.evidence,
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
    verified: typeof r.verified === 'boolean' ? r.verified : null,
    human_confirmed: typeof r.human_confirmed === 'boolean' ? r.human_confirmed : null,
    distance: typeof r.distance === 'number' ? r.distance : null,
  };
}

// AU-vs-global lens. Case `country_code` is ~40% null, so we read the
// jurisdiction/region text instead ("... Australia" vs "European Court ...").
function inScope(text: string | null, scope: 'all' | 'au' | 'global'): boolean {
  if (scope === 'all') return true;
  const isAu = /australia/i.test(text ?? '');
  return scope === 'au' ? isAu : !isAu;
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

// Handles both the semantic RPC row (year, source_url) and the keyword row
// (publication_date, source_url + source_document_url). Enforces the consent
// policy at the mapping layer too (the RPC already redacts in SQL; the keyword
// branch relies on this): 'Community Controlled' → title + provenance only.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEvidenceRow(r: any): EvidenceResult {
  const year =
    typeof r.year === 'number'
      ? r.year
      : r.publication_date
        ? new Date(r.publication_date).getUTCFullYear()
        : null;
  const restricted = r.consent_level === 'Community Controlled';
  return {
    kind: 'evidence',
    id: r.id,
    title: r.title,
    jurisdiction: 'Australia',
    country_code: 'AU',
    region: null,
    year,
    evidence_type: r.evidence_type ?? null,
    excerpt: restricted ? null : r.findings ?? r.methodology ?? null,
    organization: r.organization ?? null,
    author: r.author ?? null,
    source_url: restricted ? null : r.source_url ?? r.source_document_url ?? null,
    consent_level: r.consent_level ?? null,
    cultural_safety: r.cultural_safety ?? null,
    restricted,
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
