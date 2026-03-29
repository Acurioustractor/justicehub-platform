import { createServiceClient } from '@/lib/supabase/service';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Funding Flow Sankey API
 *
 * Aggregates justice_funding records into Sankey-ready data:
 *   Source Category -> Program Category -> Organization Type
 *
 * Query params:
 *   ?state=QLD  (optional, filter by org state)
 *   ?type=govt|philanthropic|all  (optional, filter by source type)
 */

/* ── Source categorisation ──────────────────────────────────── */

function categoriseSource(source: string): string {
  const s = source.toLowerCase();

  // QLD Government
  if (
    s.includes('qgip') ||
    s.includes('qld') ||
    s.includes('queensland') ||
    s.includes('dyjvs') ||
    s === 'qld-contract-disclosure' ||
    s === 'qld-historical'
  ) {
    return 'QLD Govt';
  }

  // NSW Government
  if (s.includes('nsw') || s.includes('new-south-wales') || s.includes('facs')) {
    return 'NSW Govt';
  }

  // Other state govts
  if (
    s.includes('vic') ||
    s.includes('sa-') ||
    s.includes('wa-') ||
    s.includes('nt-') ||
    s.includes('tas') ||
    s.includes('act-')
  ) {
    return 'Other State Govt';
  }

  // Federal
  if (
    s.includes('austender') ||
    s.includes('federal') ||
    s.includes('commonwealth') ||
    s.includes('rogs') ||
    s.includes('aihw') ||
    s.includes('budget')
  ) {
    return 'Federal Govt';
  }

  // Philanthropic
  if (
    s.includes('foundation') ||
    s.includes('philanthropic') ||
    s.includes('charitable') ||
    s.includes('trust') ||
    s.includes('endowment')
  ) {
    return 'Philanthropic';
  }

  return 'Other';
}

/* ── Program categorisation ─────────────────────────────────── */

function categoriseProgram(programName: string | null): string {
  if (!programName) return 'Unspecified';
  const p = programName.toLowerCase();

  if (p.includes('youth justice') || p.includes('juvenile') || p.includes('detention') || p.includes('yj ')) {
    return 'Youth Justice';
  }
  if (p.includes('family') || p.includes('parenting') || p.includes('child safety') || p.includes('child protection')) {
    return 'Family Services';
  }
  if (p.includes('education') || p.includes('school') || p.includes('training') || p.includes('vocational')) {
    return 'Education & Training';
  }
  if (p.includes('health') || p.includes('mental') || p.includes('wellbeing') || p.includes('drug') || p.includes('alcohol')) {
    return 'Health & Wellbeing';
  }
  if (p.includes('housing') || p.includes('homelessness') || p.includes('accommodation') || p.includes('shelter')) {
    return 'Housing';
  }
  if (
    p.includes('indigenous') ||
    p.includes('aboriginal') ||
    p.includes('torres strait') ||
    p.includes('first nations') ||
    p.includes('cultural')
  ) {
    return 'Indigenous Services';
  }
  if (p.includes('legal') || p.includes('court') || p.includes('justice reinvestment')) {
    return 'Legal & Courts';
  }
  if (p.includes('community') || p.includes('diversion') || p.includes('restorative')) {
    return 'Community Programs';
  }

  return 'Other Programs';
}

/* ── Org type categorisation ────────────────────────────────── */

function categoriseOrg(org: {
  is_indigenous_org: boolean | null;
  control_type: string | null;
} | null): string {
  if (!org) return 'Unlinked';

  if (org.is_indigenous_org) return 'Indigenous-led';

  const ct = (org.control_type || '').toLowerCase();
  if (ct === 'government') return 'Government';
  if (ct === 'university') return 'University';
  if (ct === 'community_controlled' || ct === 'community_adjacent') return 'Community NFP';

  return 'Non-Indigenous NFP';
}

/* ── Types ───────────────────────────────────────────────────── */

interface SankeyNode {
  id: string;
  label: string;
  color: string;
}

interface SankeyLink {
  source: string;
  target: string;
  value: number;
  color: string;
}

export interface FundingFlowsResponse {
  nodes: SankeyNode[];
  links: SankeyLink[];
  stats: {
    totalFunding: number;
    totalRecords: number;
    linkedRecords: number;
    indigenousOrgShare: number;
    philanthropicIndigenousShare: number;
    govtIndigenousShare: number;
    uniqueOrgs: number;
  };
}

/* ── Main handler ───────────────────────────────────────────── */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stateFilter = searchParams.get('state');
    const typeFilter = searchParams.get('type') || 'all';

    const sb = createServiceClient() as any;

    // Fetch funding records with org data in batches
    // We select only the columns we need to keep payload small
    const PAGE_SIZE = 10000;
    let allRecords: Array<{
      source: string;
      program_name: string | null;
      amount_dollars: number | null;
      alma_organization_id: string | null;
    }> = [];

    let from = 0;
    let hasMore = true;
    while (hasMore) {
      const { data, error } = await sb
        .from('justice_funding')
        .select('source, program_name, amount_dollars, alma_organization_id')
        .not('amount_dollars', 'is', null)
        .gt('amount_dollars', 0)
        .range(from, from + PAGE_SIZE - 1);

      if (error) throw error;
      const rows: any[] = data || [];
      if (rows.length < PAGE_SIZE) hasMore = false;
      allRecords = allRecords.concat(rows);
      from += PAGE_SIZE;
    }

    // Collect unique org IDs
    const orgIdSet = new Set<string>();
    allRecords.forEach(r => {
      if (r.alma_organization_id) orgIdSet.add(r.alma_organization_id);
    });
    const orgIds = Array.from(orgIdSet);

    // Fetch org details in batches
    const orgMap = new Map<string, {
      is_indigenous_org: boolean | null;
      control_type: string | null;
      state: string | null;
    }>();

    for (let i = 0; i < orgIds.length; i += 500) {
      const batch = orgIds.slice(i, i + 500);
      const { data: orgs } = await sb
        .from('organizations')
        .select('id, is_indigenous_org, control_type, state')
        .in('id', batch);

      for (const org of (orgs || [] as any[])) {
        orgMap.set(org.id, {
          is_indigenous_org: org.is_indigenous_org,
          control_type: org.control_type,
          state: org.state,
        });
      }
    }

    // Apply filters
    let filtered = allRecords;

    // State filter (by org's state)
    if (stateFilter) {
      filtered = filtered.filter(r => {
        if (!r.alma_organization_id) return false;
        const org = orgMap.get(r.alma_organization_id);
        return org?.state === stateFilter;
      });
    }

    // Source type filter
    if (typeFilter === 'govt') {
      filtered = filtered.filter(r => {
        const cat = categoriseSource(r.source);
        return cat !== 'Philanthropic' && cat !== 'Other';
      });
    } else if (typeFilter === 'philanthropic') {
      filtered = filtered.filter(r => categoriseSource(r.source) === 'Philanthropic');
    }

    // Aggregate flows: source_cat -> program_cat -> org_type
    const flowMap = new Map<string, number>();
    let totalFunding = 0;
    let linkedRecords = 0;
    let govtTotal = 0;
    let govtIndigenous = 0;
    let philanthropicTotal = 0;
    let philanthropicIndigenous = 0;
    const uniqueOrgIds = new Set<string>();

    for (const record of filtered) {
      const amount = record.amount_dollars || 0;
      const sourceCat = categoriseSource(record.source);
      const programCat = categoriseProgram(record.program_name);
      const org = record.alma_organization_id ? orgMap.get(record.alma_organization_id) || null : null;
      const orgType = categoriseOrg(org);

      if (record.alma_organization_id) {
        linkedRecords++;
        uniqueOrgIds.add(record.alma_organization_id);
      }

      totalFunding += amount;

      // Track indigenous share by source type
      const isIndigenous = org?.is_indigenous_org === true;
      if (sourceCat !== 'Philanthropic' && sourceCat !== 'Other') {
        govtTotal += amount;
        if (isIndigenous) govtIndigenous += amount;
      }
      if (sourceCat === 'Philanthropic') {
        philanthropicTotal += amount;
        if (isIndigenous) philanthropicIndigenous += amount;
      }

      // Source -> Program
      const spKey = `${sourceCat}||${programCat}`;
      flowMap.set(spKey, (flowMap.get(spKey) || 0) + amount);

      // Program -> OrgType
      const poKey = `${programCat}||${orgType}`;
      flowMap.set(poKey, (flowMap.get(poKey) || 0) + amount);
    }

    // Build nodes
    const sourceCategories = new Set<string>();
    const programCategories = new Set<string>();
    const orgTypes = new Set<string>();

    Array.from(flowMap.keys()).forEach(key => {
      const [from, to] = key.split('||');
      // Determine if this is source->program or program->org
      if (['QLD Govt', 'NSW Govt', 'Other State Govt', 'Federal Govt', 'Philanthropic', 'Other'].includes(from)) {
        sourceCategories.add(from);
        programCategories.add(to);
      } else {
        programCategories.add(from);
        orgTypes.add(to);
      }
    });

    const SOURCE_COLORS: Record<string, string> = {
      'QLD Govt': '#1e40af',
      'NSW Govt': '#7c3aed',
      'Other State Govt': '#6366f1',
      'Federal Govt': '#0369a1',
      'Philanthropic': '#059669',
      'Other': '#6b7280',
    };

    const PROGRAM_COLORS: Record<string, string> = {
      'Youth Justice': '#DC2626',
      'Family Services': '#ea580c',
      'Education & Training': '#2563eb',
      'Health & Wellbeing': '#0891b2',
      'Housing': '#7c3aed',
      'Indigenous Services': '#059669',
      'Legal & Courts': '#4338ca',
      'Community Programs': '#16a34a',
      'Other Programs': '#6b7280',
      'Unspecified': '#9ca3af',
    };

    const ORG_COLORS: Record<string, string> = {
      'Indigenous-led': '#059669',
      'Community NFP': '#16a34a',
      'Non-Indigenous NFP': '#0A0A0A',
      'Government': '#6b7280',
      'University': '#2563eb',
      'Unlinked': '#d1d5db',
    };

    const nodes: SankeyNode[] = [
      ...Array.from(sourceCategories).map(s => ({
        id: `src_${s}`,
        label: s,
        color: SOURCE_COLORS[s] || '#6b7280',
      })),
      ...Array.from(programCategories).map(p => ({
        id: `prog_${p}`,
        label: p,
        color: PROGRAM_COLORS[p] || '#6b7280',
      })),
      ...Array.from(orgTypes).map(o => ({
        id: `org_${o}`,
        label: o,
        color: ORG_COLORS[o] || '#6b7280',
      })),
    ];

    // Build links - filter out tiny flows for readability
    const minFlow = totalFunding * 0.001; // 0.1% threshold
    const links: SankeyLink[] = [];

    Array.from(flowMap.entries()).forEach(([key, value]) => {
      if (value < minFlow) return;
      const [from, to] = key.split('||');

      // Determine if source->program or program->org
      const isSourceToProgram = ['QLD Govt', 'NSW Govt', 'Other State Govt', 'Federal Govt', 'Philanthropic', 'Other'].includes(from);

      const sourceId = isSourceToProgram ? `src_${from}` : `prog_${from}`;
      const targetId = isSourceToProgram ? `prog_${to}` : `org_${to}`;

      // Color: emerald for flows to indigenous orgs, red for detention/custodial, black otherwise
      let color = 'rgba(10, 10, 10, 0.15)';
      if (!isSourceToProgram && to === 'Indigenous-led') {
        color = 'rgba(5, 150, 105, 0.4)';
      } else if (isSourceToProgram && to === 'Youth Justice') {
        color = 'rgba(220, 38, 38, 0.25)';
      }

      links.push({ source: sourceId, target: targetId, value, color });
    });

    const response: FundingFlowsResponse = {
      nodes,
      links,
      stats: {
        totalFunding,
        totalRecords: filtered.length,
        linkedRecords,
        indigenousOrgShare: govtTotal > 0 ? (govtIndigenous / govtTotal) * 100 : 0,
        philanthropicIndigenousShare: philanthropicTotal > 0 ? (philanthropicIndigenous / philanthropicTotal) * 100 : 0,
        govtIndigenousShare: govtTotal > 0 ? (govtIndigenous / govtTotal) * 100 : 0,
        uniqueOrgs: uniqueOrgIds.size,
      },
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error: any) {
    console.error('Funding flows API error:', error);
    return NextResponse.json(
      { error: 'Failed to compute funding flows', details: error.message },
      { status: 500 }
    );
  }
}
