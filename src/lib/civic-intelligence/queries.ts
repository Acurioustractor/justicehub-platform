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
  let q = supabase
    .from('civic_org_classifications')
    .select('organization_id, sector_category, tier')
    .eq('tier', 1)
    .not('confirmed_at', 'is', null);

  const { data: classRows, error } = await q;
  if (error) {
    console.error('getConfirmedTier1Orgs failed:', error.message);
    return [];
  }

  const ids = (classRows || []).map((c: any) => c.organization_id);
  if (ids.length === 0) return [];

  const orgs: any[] = [];
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const { data, error: orgErr } = await supabase
      .from('organizations')
      .select('id, name, slug, abn, state, is_indigenous_org')
      .in('id', chunk);
    if (orgErr) {
      console.error('orgs fetch failed:', orgErr.message);
      continue;
    }
    orgs.push(...(data || []));
  }

  const sectorByOrgId = new Map((classRows || []).map((c: any) => [c.organization_id, c.sector_category]));

  return orgs
    .filter((o) => !state || o.state === state)
    .map((o) => ({
      organization_id: o.id,
      org_name: o.name,
      org_slug: o.slug,
      abn: o.abn,
      state: o.state,
      is_indigenous_org: !!o.is_indigenous_org,
      sector_category: (sectorByOrgId.get(o.id) as string) || null,
    }))
    .sort((a, b) => (a.org_name || '').localeCompare(b.org_name || ''));
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
