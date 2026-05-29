import { createServiceClient } from '@/lib/supabase/service-lite';
import type { CivicClaim } from './citation-format';

/**
 * Server-side queries for the /intelligence/civic page.
 *
 * All claim values come from civic_intelligence_claims (snapshotted by
 * scripts/civic/snapshot-civic-claims.mjs). Live lists (Hansard, oversight
 * recommendations, commitments) are fetched directly.
 */

const VERIFIED_STATUSES = ['snapshot', 'verified'];

export async function getClaimsByChapter(chapter: 'access' | 'promises' | 'oversight'): Promise<CivicClaim[]> {
  const supabase = createServiceClient() as any;
  const { data, error } = await supabase
    .from('civic_intelligence_claims')
    .select('*')
    .eq('chapter', chapter)
    .in('verification_status', VERIFIED_STATUSES)
    .order('claim_id');
  if (error) {
    console.error(`getClaimsByChapter(${chapter}) failed:`, error.message);
    return [];
  }
  return (data || []) as CivicClaim[];
}

export async function getClaim(claimId: string): Promise<CivicClaim | null> {
  const supabase = createServiceClient() as any;
  const { data, error } = await supabase
    .from('civic_intelligence_claims')
    .select('*')
    .eq('claim_id', claimId)
    .in('verification_status', VERIFIED_STATUSES)
    .maybeSingle();
  if (error) {
    console.error(`getClaim(${claimId}) failed:`, error.message);
    return null;
  }
  return (data || null) as CivicClaim | null;
}

export async function getAllClaims(): Promise<Record<string, CivicClaim>> {
  const supabase = createServiceClient() as any;
  const { data, error } = await supabase
    .from('civic_intelligence_claims')
    .select('*')
    .in('verification_status', VERIFIED_STATUSES);
  if (error) {
    console.error('getAllClaims failed:', error.message);
    return {};
  }
  const out: Record<string, CivicClaim> = {};
  for (const row of (data || []) as CivicClaim[]) out[row.claim_id] = row;
  return out;
}

export interface EvidenceSummary {
  triangulation_tier: 'triangulated' | 'corroborated' | 'single_source' | 'no_evidence';
  supporting_sources: number;
}

export async function getEvidenceSummary(): Promise<Record<string, EvidenceSummary>> {
  const supabase = createServiceClient() as any;
  const { data, error } = await supabase
    .from('v_claim_evidence_summary')
    .select('claim_id, triangulation_tier, supporting_sources');
  if (error) {
    console.error('getEvidenceSummary failed:', error.message);
    return {};
  }
  const out: Record<string, EvidenceSummary> = {};
  for (const row of data || []) {
    out[row.claim_id] = {
      triangulation_tier: row.triangulation_tier,
      supporting_sources: row.supporting_sources,
    };
  }
  return out;
}

export interface ConfirmedTierOneOrg {
  organization_id: string;
  org_name: string | null;
  org_slug: string | null;
  abn: string | null;
  state: string;
  is_indigenous_org: boolean;
  acco_certified: boolean;
  sector_category: string | null;
}

export async function getConfirmedTier1Orgs(state?: string): Promise<ConfirmedTierOneOrg[]> {
  const supabase = createServiceClient() as any;
  const { data: classRows, error: classErr } = await supabase
    .from('civic_org_classifications')
    .select('organization_id, sector_category, tier, confirmed_at')
    .eq('tier', 1)
    .not('confirmed_at', 'is', null)
    .limit(10000);
  if (classErr) {
    console.error('getConfirmedTier1Orgs classRows fetch failed:', classErr.message);
    return [];
  }

  const orgIds = Array.from(new Set((classRows || []).map((c: any) => c.organization_id).filter(Boolean)));
  if (orgIds.length === 0) return [];

  const orgRows: any[] = [];
  for (let i = 0; i < orgIds.length; i += 100) {
    const chunk = orgIds.slice(i, i + 100);
    let orgQuery = supabase
      .from('organizations')
      .select('id, name, slug, abn, state, is_indigenous_org, acco_certified, archived')
      .eq('is_active', true)
      .in('id', chunk);
    if (state) orgQuery = orgQuery.eq('state', state.toUpperCase());

    const { data, error } = await orgQuery;
    if (error) {
      console.error('getConfirmedTier1Orgs orgRows chunk failed:', error.message);
      continue;
    }
    orgRows.push(...(data || []));
  }

  const sectorByOrgId = new Map((classRows || []).map((c: any) => [c.organization_id, c.sector_category]));

  return orgRows
    .filter((o: any) => o.archived !== true)
    .map((o: any) => ({
      organization_id: o.id,
      org_name: o.name,
      org_slug: o.slug,
      abn: o.abn,
      state: o.state,
      is_indigenous_org: !!o.is_indigenous_org,
      acco_certified: !!o.acco_certified,
      sector_category: (sectorByOrgId.get(o.id) as string) || null,
    }))
    .sort((a: ConfirmedTierOneOrg, b: ConfirmedTierOneOrg) => (a.org_name || '').localeCompare(b.org_name || ''));
}

export async function getYjHansardSample(limit = 10): Promise<any[]> {
  const supabase = createServiceClient() as any;
  const { data, error } = await supabase
    .from('civic_hansard')
    .select('id, subject, speaker_name, party:speaker_party, date:sitting_date, body_text, source_url, jurisdiction')
    .or('subject.ilike.%youth justice%,subject.ilike.%detention%,body_text.ilike.%youth justice%,body_text.ilike.%bail support%,body_text.ilike.%diversion%')
    .order('sitting_date', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('getYjHansardSample failed:', error.message);
    return [];
  }
  return data || [];
}

export async function getOversightRecommendations(limit = 25): Promise<any[]> {
  const supabase = createServiceClient() as any;
  const { data, error } = await supabase
    .from('oversight_recommendations')
    .select('*')
    .order('report_date', { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) {
    console.error('getOversightRecommendations failed:', error.message);
    return [];
  }
  return data || [];
}

export type StateOversightEvidenceKind =
  | 'recommendation'
  | 'children_commissioner_report'
  | 'auditor_general_audit';

export interface StateOversightEvidence {
  id: string;
  kind: StateOversightEvidenceKind;
  jurisdiction: string;
  sourceName: string;
  title: string;
  publishedDate: string | null;
  url: string | null;
  summary: string;
  status: string | null;
  flags: string[];
}

function summarizeJsonList(value: unknown, fallback = 'Structured source row indexed.'): string {
  if (!value) return fallback;
  const pieces: string[] = [];
  const pushPiece = (piece: unknown) => {
    if (typeof piece === 'string') pieces.push(piece);
    if (piece && typeof piece === 'object') {
      const item = piece as Record<string, unknown>;
      pushPiece(item.text || item.finding || item.recommendation || item.summary || item.title);
    }
  };

  if (Array.isArray(value)) {
    value.slice(0, 2).forEach(pushPiece);
  } else if (typeof value === 'object') {
    Object.values(value as Record<string, unknown>).slice(0, 2).forEach(pushPiece);
  } else {
    pushPiece(value);
  }

  const summary = pieces
    .map((piece) => piece.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join(' ');
  return summary ? `${summary.slice(0, 320)}${summary.length > 320 ? '...' : ''}` : fallback;
}

export async function getStateOversightEvidence(stateCode: string): Promise<StateOversightEvidence[]> {
  const state = stateCode.toUpperCase();
  const supabase = createServiceClient() as any;
  const [recommendations, commissionerReports, auditorAudits] = await Promise.all([
    supabase
      .from('oversight_recommendations')
      .select('id,jurisdiction,oversight_body,report_title,report_date,report_url,recommendation_text,status,severity')
      .eq('jurisdiction', state)
      .order('report_date', { ascending: false, nullsFirst: false })
      .limit(8),
    supabase
      .from('children_commissioner_reports')
      .select('id,jurisdiction,body_name,report_year,report_url,report_title,published_date,key_findings,recommendations,yj_relevant,raise_age_mentioned,detention_mentioned,indigenous_overrep_mentioned')
      .eq('jurisdiction', state)
      .order('published_date', { ascending: false, nullsFirst: false })
      .limit(6),
    supabase
      .from('auditor_general_audits')
      .select('id,jurisdiction,title,report_number,url,publication_date,tabled_date,key_findings,key_recommendations,status')
      .ilike('jurisdiction', state)
      .order('publication_date', { ascending: false, nullsFirst: false })
      .limit(6),
  ]);

  const rows: StateOversightEvidence[] = [];

  if (recommendations.error) {
    console.error(`getStateOversightEvidence(${state}) recommendations failed:`, recommendations.error.message);
  } else {
    for (const row of recommendations.data || []) {
      rows.push({
        id: `recommendation:${row.id}`,
        kind: 'recommendation',
        jurisdiction: row.jurisdiction || state,
        sourceName: row.oversight_body || row.report_title || 'Oversight body',
        title: row.report_title || row.oversight_body || 'Oversight recommendation',
        publishedDate: row.report_date || null,
        url: row.report_url || null,
        summary: row.recommendation_text || 'Recommendation text unavailable.',
        status: row.status || row.severity || null,
        flags: ['recommendation extracted'],
      });
    }
  }

  if (commissionerReports.error) {
    console.error(`getStateOversightEvidence(${state}) commissioner reports failed:`, commissionerReports.error.message);
  } else {
    for (const row of commissionerReports.data || []) {
      const flags = [
        row.yj_relevant ? 'YJ relevant' : null,
        row.raise_age_mentioned ? 'raise age mentioned' : null,
        row.detention_mentioned ? 'detention mentioned' : null,
        row.indigenous_overrep_mentioned ? 'Indigenous over-representation mentioned' : null,
      ].filter(Boolean) as string[];
      rows.push({
        id: `children:${row.id}`,
        kind: 'children_commissioner_report',
        jurisdiction: row.jurisdiction || state,
        sourceName: row.body_name || "Children's Commissioner",
        title: row.report_title || `${row.body_name || "Children's Commissioner"} ${row.report_year || 'report'}`,
        publishedDate: row.published_date || null,
        url: row.report_url || null,
        summary: summarizeJsonList(row.key_findings || row.recommendations, 'Commissioner report indexed; recommendations not yet extracted into the recommendation ledger.'),
        status: row.yj_relevant ? 'YJ relevant' : 'supporting evidence',
        flags,
      });
    }
  }

  if (auditorAudits.error) {
    console.error(`getStateOversightEvidence(${state}) auditor audits failed:`, auditorAudits.error.message);
  } else {
    for (const row of auditorAudits.data || []) {
      rows.push({
        id: `auditor:${row.id}`,
        kind: 'auditor_general_audit',
        jurisdiction: (row.jurisdiction || state).toUpperCase(),
        sourceName: 'Auditor-General',
        title: row.title || row.report_number || 'Auditor-General audit',
        publishedDate: row.publication_date || row.tabled_date || null,
        url: row.url || null,
        summary: summarizeJsonList(row.key_findings || row.key_recommendations, 'Auditor-General audit indexed; recommendations not yet extracted into the recommendation ledger.'),
        status: row.status || 'supporting evidence',
        flags: row.report_number ? [`report ${row.report_number}`] : [],
      });
    }
  }

  return rows.sort((a, b) => {
    const dateA = a.publishedDate ? Date.parse(a.publishedDate) : 0;
    const dateB = b.publishedDate ? Date.parse(b.publishedDate) : 0;
    return dateB - dateA || a.title.localeCompare(b.title);
  });
}

export async function getFoundationClassifierCoverage(): Promise<{
  total: number;
  classified: number;
  pct: number;
}> {
  const supabase = createServiceClient() as any;
  const { count: total } = await supabase
    .from('foundation_grantees')
    .select('id', { count: 'exact', head: true });
  const { count: classified } = await supabase
    .from('foundation_grantees')
    .select('id', { count: 'exact', head: true })
    .not('yj_classified_at', 'is', null);
  const t = total || 0;
  const c = classified || 0;
  return { total: t, classified: c, pct: t > 0 ? c / t : 0 };
}

export async function getCharterCommitments(limit = 25): Promise<any[]> {
  const supabase = createServiceClient() as any;
  const { data, error } = await supabase
    .from('civic_charter_commitments')
    .select('*')
    .limit(limit);
  if (error) {
    console.error('getCharterCommitments failed:', error.message);
    return [];
  }
  return data || [];
}
