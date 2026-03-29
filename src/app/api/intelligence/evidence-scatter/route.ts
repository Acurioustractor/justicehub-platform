import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/**
 * Evidence Scatter API
 *
 * Returns all verified ALMA interventions with cost data, joined with
 * organizations (state, Indigenous status) and aggregated funding.
 *
 * Used by the Evidence Scatter visualization at /intelligence/evidence.
 */

export interface EvidenceScatterProgram {
  id: string;
  name: string;
  type: string | null;
  evidence_level: string | null;
  cost_per_young_person: number | null;
  org_name: string | null;
  org_id: string | null;
  state: string | null;
  is_indigenous_org: boolean;
  funding_total: number;
}

export interface EvidenceScatterResponse {
  programs: EvidenceScatterProgram[];
  stats: {
    total_programs: number;
    programs_with_cost: number;
    median_cost: number;
    cheapest_effective: { name: string; cost: number } | null;
    evidence_distribution: Record<string, number>;
    unfunded_effective_plus: number;
  };
  provenance: {
    mode: 'authoritative';
    summary: string;
    generated_at: string;
  };
}

const EVIDENCE_ORDER = [
  'Untested (theory/pilot stage)',
  'Promising (community-endorsed, emerging evidence)',
  'Indigenous-led (culturally grounded, community authority)',
  'Effective (strong evaluation, positive outcomes)',
  'Proven (RCT/quasi-experimental, replicated)',
];

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export async function GET() {
  try {
    const supabase = createServiceClient();
    const sb = supabase as any;

    // Parallel fetches: interventions, orgs, funding
    const [interventionsRes, orgsRes, fundingRes] = await Promise.all([
      sb
        .from('alma_interventions')
        .select('id, name, type, evidence_level, cost_per_young_person, operating_organization_id')
        .neq('verification_status', 'ai_generated'),

      sb
        .from('organizations')
        .select('id, name, state, is_indigenous_org')
        .eq('is_active', true),

      sb
        .from('justice_funding')
        .select('alma_organization_id, amount_dollars'),
    ]);

    const interventions: any[] = interventionsRes.data || [];
    const orgs: any[] = orgsRes.data || [];
    const funding: any[] = fundingRes.data || [];

    // Build org lookup
    const orgMap = new Map<string, any>();
    for (const o of orgs) {
      orgMap.set(o.id, o);
    }

    // Build funding totals per org
    const fundingByOrg = new Map<string, number>();
    for (const f of funding) {
      if (f.alma_organization_id && f.amount_dollars) {
        const current = fundingByOrg.get(f.alma_organization_id) || 0;
        fundingByOrg.set(f.alma_organization_id, current + f.amount_dollars);
      }
    }

    // Build programs array
    const programs: EvidenceScatterProgram[] = interventions.map((i: any) => {
      const org = i.operating_organization_id ? orgMap.get(i.operating_organization_id) : null;
      const fundingTotal = i.operating_organization_id
        ? fundingByOrg.get(i.operating_organization_id) || 0
        : 0;

      return {
        id: i.id,
        name: i.name,
        type: i.type,
        evidence_level: i.evidence_level,
        cost_per_young_person: i.cost_per_young_person,
        org_name: org?.name || null,
        org_id: i.operating_organization_id,
        state: org?.state || null,
        is_indigenous_org: org?.is_indigenous_org || false,
        funding_total: fundingTotal,
      };
    });

    // Compute stats
    const costsOnly = programs
      .filter((p) => p.cost_per_young_person && p.cost_per_young_person > 0)
      .map((p) => p.cost_per_young_person as number);

    const medianCost = median(costsOnly);

    // Evidence distribution
    const evidenceDistribution: Record<string, number> = {};
    for (const level of EVIDENCE_ORDER) {
      evidenceDistribution[level] = 0;
    }
    for (const p of programs) {
      if (p.evidence_level && evidenceDistribution[p.evidence_level] !== undefined) {
        evidenceDistribution[p.evidence_level]++;
      }
    }

    // Cheapest effective+ program
    const effectivePlus = programs.filter(
      (p) =>
        p.cost_per_young_person &&
        p.cost_per_young_person > 0 &&
        (p.evidence_level === 'Effective (strong evaluation, positive outcomes)' ||
          p.evidence_level === 'Proven (RCT/quasi-experimental, replicated)')
    );
    effectivePlus.sort((a, b) => (a.cost_per_young_person || 0) - (b.cost_per_young_person || 0));
    const cheapestEffective = effectivePlus.length > 0
      ? { name: effectivePlus[0].name, cost: effectivePlus[0].cost_per_young_person as number }
      : null;

    // Unfunded effective+ count
    const unfundedEffPlus = effectivePlus.filter((p) => p.funding_total < 100_000).length;

    const stats = {
      total_programs: programs.length,
      programs_with_cost: costsOnly.length,
      median_cost: Math.round(medianCost),
      cheapest_effective: cheapestEffective,
      evidence_distribution: evidenceDistribution,
      unfunded_effective_plus: unfundedEffPlus,
    };

    const response: EvidenceScatterResponse = {
      programs,
      stats,
      provenance: {
        mode: 'authoritative',
        summary:
          'Direct reads from alma_interventions + organizations + justice_funding. Verified programs only (ai_generated excluded).',
        generated_at: new Date().toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[evidence-scatter] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch evidence scatter data' },
      { status: 500 }
    );
  }
}
