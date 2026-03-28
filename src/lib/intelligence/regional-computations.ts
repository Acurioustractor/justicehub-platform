/**
 * Regional Report Computations
 *
 * Pure functions for computing derived metrics shown on regional intelligence reports.
 * Extracted from page.tsx for testability.
 */

/* ── Types ────────────────────────────────────────────────────── */

export interface RegionOrg {
  id: string;
  name: string;
  slug?: string | null;
  control_type?: string | null;
  is_indigenous_org?: boolean;
  city?: string | null;
  state?: string | null;
}

export interface RegionFunding {
  id: string;
  source: string;
  program_name?: string | null;
  amount_dollars?: number | null;
  financial_year?: string | null;
  recipient_name?: string | null;
  alma_organization_id?: string | null;
}

export interface RegionIntervention {
  id: string;
  name: string;
  description?: string | null;
  type?: string | null;
  evidence_level?: string | null;
  cost_per_young_person?: number | null;
  estimated_annual_capacity?: number | null;
  operating_organization_id?: string | null;
}

export interface FundingByControlType {
  community_controlled: number;
  community_adjacent: number;
  intermediary: number;
  government: number;
  other: number;
  unclassified: number;
}

export interface DetentionComparison {
  detentionCostPerChild: number;
  avgCommunityProgramCost: number | null;
  programsWithCostData: number;
  totalCommunityFunding: number;
  equivalentDetentionBeds: number;
  communityProgramsPerBed: number | null;
  costMultiplier: number | null;
}

export interface GovernmentSource {
  source: string;
  sourceLabel: string;
  total: number;
  orgNames: string[];
  records: RegionFunding[];
}

export interface IntermediaryPresence {
  orgId: string;
  orgName: string;
  orgSlug?: string | null;
  controlType: string;
  programCount: number;
  totalFunding: number;
  programs: { id: string; name: string; evidenceLevel?: string | null }[];
}

export interface FundingFlowNode {
  source: string;
  sourceLabel: string;
  intermediary?: { name: string; slug?: string | null };
  program?: { name: string; type?: string | null };
  amount: number;
}

/* ── Constants ────────────────────────────────────────────────── */

export const DETENTION_COST_PER_CHILD = 1_300_000; // ROGS 2026

export const GOVERNMENT_SOURCES = [
  'nsw-dcj',
  'nsw-facs-ngo-grants',
  'qld-contract-disclosure',
  'austender',
  'niaa',
  'australian-government-jr',
  'qgip',
  'qld-historical',
  'sa-budget',
  'wa-budget',
  'nt-budget',
  'vic-budget',
  'tas-budget',
  'rogs',
];

export const SOURCE_LABELS: Record<string, string> = {
  'nsw-dcj': 'NSW Dept of Communities & Justice',
  'nsw-facs-ngo-grants': 'NSW FACS NGO Grants',
  'qld-contract-disclosure': 'QLD Contract Disclosure',
  'austender': 'AusTender (Federal)',
  'niaa': 'NIAA (National Indigenous Australians Agency)',
  'australian-government-jr': 'Australian Govt Justice Reinvestment',
  'qgip': 'QLD Govt Investment Portal',
  'qld-historical': 'QLD Historical Funding',
  'sa-budget': 'SA Budget',
  'wa-budget': 'WA Budget',
  'nt-budget': 'NT Budget',
  'vic-budget': 'VIC Budget',
  'tas-budget': 'TAS Budget',
  'rogs': 'Report on Govt Services',
  'foundation-notable-grants': 'Foundation Grants',
};

/* ── Computation Functions ────────────────────────────────────── */

/**
 * Compute funding breakdown by organization control type.
 * Returns how much money goes to community-controlled vs intermediaries vs government.
 */
export function computeFundingByControlType(
  funding: RegionFunding[],
  orgs: RegionOrg[]
): FundingByControlType {
  const orgControlMap = new Map<string, string>();
  for (const o of orgs) {
    if (o.id && o.control_type) {
      orgControlMap.set(o.id, o.control_type);
    }
  }

  const result: FundingByControlType = {
    community_controlled: 0,
    community_adjacent: 0,
    intermediary: 0,
    government: 0,
    other: 0,
    unclassified: 0,
  };

  for (const f of funding) {
    const amount = f.amount_dollars || 0;
    if (!f.alma_organization_id) {
      result.unclassified += amount;
      continue;
    }
    const controlType = orgControlMap.get(f.alma_organization_id);
    if (!controlType) {
      result.unclassified += amount;
    } else if (controlType === 'community_controlled') {
      result.community_controlled += amount;
    } else if (controlType === 'community_adjacent') {
      result.community_adjacent += amount;
    } else if (controlType === 'intermediary') {
      result.intermediary += amount;
    } else if (controlType === 'government') {
      result.government += amount;
    } else {
      result.other += amount;
    }
  }

  return result;
}

/**
 * Compute detention cost comparison metrics.
 */
export function computeDetentionComparison(
  interventions: RegionIntervention[],
  totalCommunityFunding: number
): DetentionComparison {
  const withCost = interventions.filter(i => i.cost_per_young_person != null && i.cost_per_young_person > 0);
  const avgCost = withCost.length > 0
    ? withCost.reduce((sum, i) => sum + (i.cost_per_young_person || 0), 0) / withCost.length
    : null;

  const equivalentBeds = Math.floor(totalCommunityFunding / DETENTION_COST_PER_CHILD);
  const programsPerBed = avgCost != null && avgCost > 0
    ? Math.floor(DETENTION_COST_PER_CHILD / avgCost)
    : null;
  const costMultiplier = avgCost != null && avgCost > 0
    ? Math.round(DETENTION_COST_PER_CHILD / avgCost)
    : null;

  return {
    detentionCostPerChild: DETENTION_COST_PER_CHILD,
    avgCommunityProgramCost: avgCost,
    programsWithCostData: withCost.length,
    totalCommunityFunding,
    equivalentDetentionBeds: equivalentBeds,
    communityProgramsPerBed: programsPerBed,
    costMultiplier,
  };
}

/**
 * Group government funding by source, showing which orgs receive from each.
 */
export function computeGovernmentSources(
  funding: RegionFunding[],
  orgs: RegionOrg[]
): GovernmentSource[] {
  const orgNameMap = new Map<string, string>();
  for (const o of orgs) {
    orgNameMap.set(o.id, o.name);
  }

  const sourceMap = new Map<string, { total: number; orgNames: Set<string>; records: RegionFunding[] }>();

  for (const f of funding) {
    if (!GOVERNMENT_SOURCES.includes(f.source)) continue;
    const existing = sourceMap.get(f.source) || { total: 0, orgNames: new Set<string>(), records: [] };
    existing.total += f.amount_dollars || 0;
    if (f.alma_organization_id) {
      const orgName = orgNameMap.get(f.alma_organization_id) || f.recipient_name;
      if (orgName) existing.orgNames.add(orgName);
    } else if (f.recipient_name) {
      existing.orgNames.add(f.recipient_name);
    }
    existing.records.push(f);
    sourceMap.set(f.source, existing);
  }

  return [...sourceMap.entries()]
    .map(([source, data]) => ({
      source,
      sourceLabel: SOURCE_LABELS[source] || source,
      total: data.total,
      orgNames: [...data.orgNames],
      records: data.records,
    }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Identify intermediary organizations operating in the region with their programs.
 */
export function computeIntermediaryPresence(
  orgs: RegionOrg[],
  interventions: RegionIntervention[],
  funding: RegionFunding[]
): IntermediaryPresence[] {
  const intermediaries = orgs.filter(o => o.control_type === 'intermediary');

  const orgFundingMap = new Map<string, number>();
  for (const f of funding) {
    if (f.alma_organization_id) {
      orgFundingMap.set(
        f.alma_organization_id,
        (orgFundingMap.get(f.alma_organization_id) || 0) + (f.amount_dollars || 0)
      );
    }
  }

  const orgPrograms = new Map<string, { id: string; name: string; evidenceLevel?: string | null }[]>();
  for (const i of interventions) {
    if (i.operating_organization_id) {
      const existing = orgPrograms.get(i.operating_organization_id) || [];
      existing.push({ id: i.id, name: i.name, evidenceLevel: i.evidence_level });
      orgPrograms.set(i.operating_organization_id, existing);
    }
  }

  return intermediaries
    .map(o => ({
      orgId: o.id,
      orgName: o.name,
      orgSlug: o.slug,
      controlType: o.control_type || 'intermediary',
      programCount: orgPrograms.get(o.id)?.length || 0,
      totalFunding: orgFundingMap.get(o.id) || 0,
      programs: orgPrograms.get(o.id) || [],
    }))
    .filter(i => i.programCount > 0 || i.totalFunding > 0)
    .sort((a, b) => b.totalFunding - a.totalFunding);
}

/**
 * Build funding flow chains: source -> intermediary -> program.
 * For the visual flow diagram.
 */
export function computeFundingFlows(
  govSources: GovernmentSource[],
  intermediaries: IntermediaryPresence[],
  funding: RegionFunding[],
  orgs: RegionOrg[]
): FundingFlowNode[] {
  const orgMap = new Map<string, RegionOrg>();
  for (const o of orgs) {
    orgMap.set(o.id, o);
  }

  const intermediaryIds = new Set(intermediaries.map(i => i.orgId));
  const flows: FundingFlowNode[] = [];

  // For each gov source, find the top recipients and build flows
  for (const source of govSources.slice(0, 5)) {
    // Group by org receiving from this source
    const orgAmounts = new Map<string, number>();
    for (const r of source.records) {
      if (r.alma_organization_id) {
        orgAmounts.set(
          r.alma_organization_id,
          (orgAmounts.get(r.alma_organization_id) || 0) + (r.amount_dollars || 0)
        );
      }
    }

    // Top recipients from this source
    const topRecipients = [...orgAmounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    for (const [orgId, amount] of topRecipients) {
      const org = orgMap.get(orgId);
      if (!org) continue;

      const isIntermediary = intermediaryIds.has(orgId);
      const intermediaryData = intermediaries.find(i => i.orgId === orgId);

      if (isIntermediary && intermediaryData && intermediaryData.programs.length > 0) {
        // Flow through intermediary to programs
        flows.push({
          source: source.source,
          sourceLabel: source.sourceLabel,
          intermediary: { name: org.name, slug: org.slug },
          program: {
            name: intermediaryData.programs[0].name,
            type: intermediaryData.programs.length > 1
              ? `+ ${intermediaryData.programs.length - 1} more`
              : undefined,
          },
          amount,
        });
      } else {
        // Direct to org
        flows.push({
          source: source.source,
          sourceLabel: source.sourceLabel,
          intermediary: { name: org.name, slug: org.slug },
          amount,
        });
      }
    }
  }

  return flows;
}

/* ── Governance Network ──────────────────────────────────────── */

export interface BoardDirector {
  personName: string;
  boards: { orgName: string; orgId?: string; role: string; isIndigenous: boolean }[];
  totalBoards: number;
  indigenousBoards: number;
}

export interface GovernanceNetwork {
  totalDirectors: number;
  multiboardDirectors: number;
  multiboardIndigenous: number;
  topConnectors: BoardDirector[];
  avgBoardsPerDirector: number;
  crossSectorConnections: number;
}

export interface PersonRole {
  person_name: string;
  role_type: string;
  company_name: string;
  entity_id?: string | null;
}

/**
 * Compute governance network metrics from person_roles data.
 * Shows board overlap, cross-org connections, and key connectors.
 */
export function computeGovernanceNetwork(
  personRoles: PersonRole[],
  orgs: RegionOrg[]
): GovernanceNetwork {
  const orgMap = new Map<string, RegionOrg>();
  for (const o of orgs) {
    orgMap.set(o.id, o);
  }

  // Group roles by person name
  const personBoards = new Map<string, { orgName: string; orgId?: string; role: string; isIndigenous: boolean }[]>();
  for (const pr of personRoles) {
    if (!pr.person_name) continue;
    const normalised = pr.person_name.trim();
    const existing = personBoards.get(normalised) || [];
    const org = pr.entity_id ? orgMap.get(pr.entity_id) : undefined;
    existing.push({
      orgName: pr.company_name || 'Unknown',
      orgId: pr.entity_id || undefined,
      role: pr.role_type || 'Director',
      isIndigenous: org?.is_indigenous_org ?? false,
    });
    personBoards.set(normalised, existing);
  }

  const totalDirectors = personBoards.size;
  const multiboard: BoardDirector[] = [];

  for (const [name, boards] of personBoards) {
    // Deduplicate by org name (same person may have multiple roles at same org)
    const uniqueOrgs = new Map<string, typeof boards[0]>();
    for (const b of boards) {
      if (!uniqueOrgs.has(b.orgName)) uniqueOrgs.set(b.orgName, b);
    }
    if (uniqueOrgs.size >= 2) {
      const uniqueBoards = [...uniqueOrgs.values()];
      multiboard.push({
        personName: name,
        boards: uniqueBoards,
        totalBoards: uniqueBoards.length,
        indigenousBoards: uniqueBoards.filter(b => b.isIndigenous).length,
      });
    }
  }

  const multiboardIndigenous = multiboard.filter(d => d.indigenousBoards >= 2).length;

  // Cross-sector: directors connecting Indigenous + non-Indigenous orgs
  const crossSector = multiboard.filter(d =>
    d.boards.some(b => b.isIndigenous) && d.boards.some(b => !b.isIndigenous)
  ).length;

  // Top connectors: sort by total boards, take top 10
  const topConnectors = [...multiboard]
    .sort((a, b) => b.totalBoards - a.totalBoards)
    .slice(0, 10);

  const totalBoards = [...personBoards.values()].reduce((sum, boards) => {
    const unique = new Set(boards.map(b => b.orgName));
    return sum + unique.size;
  }, 0);

  return {
    totalDirectors,
    multiboardDirectors: multiboard.length,
    multiboardIndigenous,
    topConnectors,
    avgBoardsPerDirector: totalDirectors > 0 ? Math.round((totalBoards / totalDirectors) * 10) / 10 : 0,
    crossSectorConnections: crossSector,
  };
}

/* ── Formatting helpers ───────────────────────────────────────── */

export function formatDollars(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export function pct(n: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((n / total) * 100)}%`;
}
