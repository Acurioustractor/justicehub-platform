import { createServiceClient } from '@/lib/supabase/service';
import type { AnchorCommunity } from './anchors';

/**
 * Server-only data access for community action-profiles. Reads existing tables
 * only. All `alma_interventions` reads are guarded with
 * `.neq('verification_status', 'ai_generated')` per the ALMA data rules.
 */

export interface CommunityProgram {
  id: string;
  name: string;
  type: string | null;
  description: string | null;
  evidenceLevel: string | null;
  costPerYoungPerson: number | null;
}

export interface CommunityFunding {
  id: string;
  amountDollars: number | null;
  /** Provenance of the figure (the `source` column on justice_funding). */
  source: string | null;
  programName: string | null;
  financialYear: string | null;
}

export interface CommunityProfileData {
  anchor: AnchorCommunity;
  /** True when the organisation row was found in the database by ILIKE. */
  matched: boolean;
  org: {
    id: string;
    name: string;
    state: string | null;
    isIndigenousOrg: boolean;
  };
  programs: CommunityProgram[];
  funding: CommunityFunding[];
}

/**
 * Resolve an anchor to its organisation record plus existing programs and
 * funding. If the organisation cannot be found, returns a profile built from
 * the anchor's fallback identity with empty programs and funding.
 */
export async function loadCommunityProfile(
  anchor: AnchorCommunity
): Promise<CommunityProfileData> {
  const supabase = createServiceClient() as any;

  const { data: orgRow } = await supabase
    .from('organizations')
    .select('id, name, state, is_indigenous_org')
    .ilike('name', anchor.ilikePattern)
    .limit(1)
    .maybeSingle();

  if (!orgRow) {
    return {
      anchor,
      matched: false,
      org: {
        id: '',
        name: anchor.name,
        state: anchor.fallback.state,
        isIndigenousOrg: anchor.fallback.isIndigenousOrg,
      },
      programs: [],
      funding: [],
    };
  }

  const [{ data: programRows }, { data: fundingRows }] = await Promise.all([
    supabase
      .from('alma_interventions')
      .select('id, name, type, description, evidence_level, cost_per_young_person')
      .eq('operating_organization_id', orgRow.id)
      .neq('verification_status', 'ai_generated')
      .order('name'),
    supabase
      .from('justice_funding')
      .select('id, amount_dollars, source, program_name, financial_year')
      .eq('alma_organization_id', orgRow.id)
      .order('amount_dollars', { ascending: false, nullsFirst: false }),
  ]);

  const programs: CommunityProgram[] = (programRows || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    type: p.type ?? null,
    description: p.description ?? null,
    evidenceLevel: p.evidence_level ?? null,
    costPerYoungPerson:
      p.cost_per_young_person != null ? Number(p.cost_per_young_person) : null,
  }));

  const funding: CommunityFunding[] = (fundingRows || []).map((f: any) => ({
    id: f.id,
    amountDollars: f.amount_dollars != null ? Number(f.amount_dollars) : null,
    source: f.source ?? null,
    programName: f.program_name ?? null,
    financialYear: f.financial_year ?? null,
  }));

  return {
    anchor,
    matched: true,
    org: {
      id: orgRow.id,
      name: orgRow.name,
      state: orgRow.state ?? null,
      isIndigenousOrg: !!orgRow.is_indigenous_org,
    },
    programs,
    funding,
  };
}

/** Resolve just the identity for the index card (name, state, indigenous badge). */
export async function loadAnchorIdentity(anchor: AnchorCommunity): Promise<{
  matched: boolean;
  state: string | null;
  isIndigenousOrg: boolean;
}> {
  const supabase = createServiceClient() as any;
  const { data: orgRow } = await supabase
    .from('organizations')
    .select('state, is_indigenous_org')
    .ilike('name', anchor.ilikePattern)
    .limit(1)
    .maybeSingle();

  if (!orgRow) {
    return {
      matched: false,
      state: anchor.fallback.state,
      isIndigenousOrg: anchor.fallback.isIndigenousOrg,
    };
  }
  return {
    matched: true,
    state: orgRow.state ?? null,
    isIndigenousOrg: !!orgRow.is_indigenous_org,
  };
}
