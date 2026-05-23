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
  sector_category: string | null;
}

export async function getConfirmedTier1Orgs(state?: string): Promise<ConfirmedTierOneOrg[]> {
  const supabase = createServiceClient() as any;
  // When state is provided, scope the org fetch via .eq('state', upper)
  // so we don't pull the whole national register and filter in JS.
  let orgQuery = supabase
    .from('organizations')
    .select('id, name, slug, abn, state, is_indigenous_org')
    .eq('is_active', true);
  if (state) orgQuery = orgQuery.eq('state', state.toUpperCase());
  const { data: stateOrgs, error: orgErr } = await orgQuery.limit(10000);
  if (orgErr) {
    console.error('getConfirmedTier1Orgs orgs fetch failed:', orgErr.message);
    return [];
  }
  if (!stateOrgs || stateOrgs.length === 0) return [];

  const orgIds = stateOrgs.map((o: any) => o.id);
  // Now intersect with confirmed Tier 1 classifications.
  const classRows: any[] = [];
  for (let i = 0; i < orgIds.length; i += 100) {
    const chunk = orgIds.slice(i, i + 100);
    const { data, error } = await supabase
      .from('civic_org_classifications')
      .select('organization_id, sector_category, tier, confirmed_at')
      .eq('tier', 1)
      .not('confirmed_at', 'is', null)
      .in('organization_id', chunk);
    if (error) {
      console.error('getConfirmedTier1Orgs classRows chunk failed:', error.message);
      continue;
    }
    classRows.push(...(data || []));
  }
  const sectorByOrgId = new Map(classRows.map((c) => [c.organization_id, c.sector_category]));
  const confirmedSet = new Set(classRows.map((c) => c.organization_id));

  return stateOrgs
    .filter((o: any) => confirmedSet.has(o.id))
    .map((o: any) => ({
      organization_id: o.id,
      org_name: o.name,
      org_slug: o.slug,
      abn: o.abn,
      state: o.state,
      is_indigenous_org: !!o.is_indigenous_org,
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
