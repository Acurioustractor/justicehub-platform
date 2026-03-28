import {
  computeFundingByControlType,
  computeDetentionComparison,
  computeGovernmentSources,
  computeIntermediaryPresence,
  computeFundingFlows,
  computeGovernanceNetwork,
  formatDollars,
  pct,
  DETENTION_COST_PER_CHILD,
  RegionOrg,
  RegionFunding,
  RegionIntervention,
  PersonRole,
} from '@/lib/intelligence/regional-computations';

/* ── Test fixtures ────────────────────────────────────────────── */

const makeOrg = (overrides: Partial<RegionOrg> = {}): RegionOrg => ({
  id: 'org-1',
  name: 'Test Org',
  slug: 'test-org',
  control_type: null,
  is_indigenous_org: false,
  ...overrides,
});

const makeFunding = (overrides: Partial<RegionFunding> = {}): RegionFunding => ({
  id: 'fund-1',
  source: 'austender',
  amount_dollars: 100000,
  alma_organization_id: 'org-1',
  ...overrides,
});

const makeIntervention = (overrides: Partial<RegionIntervention> = {}): RegionIntervention => ({
  id: 'prog-1',
  name: 'Test Program',
  operating_organization_id: 'org-1',
  cost_per_young_person: null,
  ...overrides,
});

/* ── formatDollars ────────────────────────────────────────────── */

describe('formatDollars', () => {
  it('formats billions', () => {
    expect(formatDollars(1_500_000_000)).toBe('$1.5B');
  });

  it('formats millions', () => {
    expect(formatDollars(2_300_000)).toBe('$2.3M');
  });

  it('formats thousands', () => {
    expect(formatDollars(450_000)).toBe('$450K');
  });

  it('formats small amounts', () => {
    expect(formatDollars(999)).toBe('$999');
  });

  it('formats zero', () => {
    expect(formatDollars(0)).toBe('$0');
  });
});

/* ── pct ──────────────────────────────────────────────────────── */

describe('pct', () => {
  it('returns percentage string', () => {
    expect(pct(25, 100)).toBe('25%');
  });

  it('rounds to nearest integer', () => {
    expect(pct(1, 3)).toBe('33%');
  });

  it('handles zero total', () => {
    expect(pct(10, 0)).toBe('0%');
  });

  it('handles 100%', () => {
    expect(pct(50, 50)).toBe('100%');
  });
});

/* ── computeFundingByControlType ──────────────────────────────── */

describe('computeFundingByControlType', () => {
  it('splits funding by org control type', () => {
    const orgs = [
      makeOrg({ id: 'cc-1', control_type: 'community_controlled' }),
      makeOrg({ id: 'int-1', control_type: 'intermediary' }),
      makeOrg({ id: 'gov-1', control_type: 'government' }),
    ];
    const funding = [
      makeFunding({ id: 'f1', alma_organization_id: 'cc-1', amount_dollars: 500_000 }),
      makeFunding({ id: 'f2', alma_organization_id: 'int-1', amount_dollars: 2_000_000 }),
      makeFunding({ id: 'f3', alma_organization_id: 'gov-1', amount_dollars: 1_000_000 }),
    ];

    const result = computeFundingByControlType(funding, orgs);

    expect(result.community_controlled).toBe(500_000);
    expect(result.intermediary).toBe(2_000_000);
    expect(result.government).toBe(1_000_000);
    expect(result.community_adjacent).toBe(0);
    expect(result.other).toBe(0);
    expect(result.unclassified).toBe(0);
  });

  it('puts funding with no org link into unclassified', () => {
    const funding = [
      makeFunding({ id: 'f1', alma_organization_id: null, amount_dollars: 300_000 }),
    ];

    const result = computeFundingByControlType(funding, []);
    expect(result.unclassified).toBe(300_000);
  });

  it('puts funding for org with no control_type into unclassified', () => {
    const orgs = [makeOrg({ id: 'org-1', control_type: null })];
    const funding = [makeFunding({ id: 'f1', alma_organization_id: 'org-1', amount_dollars: 200_000 })];

    const result = computeFundingByControlType(funding, orgs);
    expect(result.unclassified).toBe(200_000);
  });

  it('handles community_adjacent type', () => {
    const orgs = [makeOrg({ id: 'ca-1', control_type: 'community_adjacent' })];
    const funding = [makeFunding({ id: 'f1', alma_organization_id: 'ca-1', amount_dollars: 150_000 })];

    const result = computeFundingByControlType(funding, orgs);
    expect(result.community_adjacent).toBe(150_000);
  });

  it('puts unknown control types into other', () => {
    const orgs = [makeOrg({ id: 'u-1', control_type: 'university' })];
    const funding = [makeFunding({ id: 'f1', alma_organization_id: 'u-1', amount_dollars: 75_000 })];

    const result = computeFundingByControlType(funding, orgs);
    expect(result.other).toBe(75_000);
  });

  it('handles empty inputs', () => {
    const result = computeFundingByControlType([], []);
    expect(result.community_controlled).toBe(0);
    expect(result.intermediary).toBe(0);
    expect(result.government).toBe(0);
    expect(result.unclassified).toBe(0);
  });

  it('handles null amount_dollars gracefully', () => {
    const orgs = [makeOrg({ id: 'cc-1', control_type: 'community_controlled' })];
    const funding = [makeFunding({ id: 'f1', alma_organization_id: 'cc-1', amount_dollars: null })];

    const result = computeFundingByControlType(funding, orgs);
    expect(result.community_controlled).toBe(0);
  });

  it('aggregates multiple records for same control type', () => {
    const orgs = [
      makeOrg({ id: 'cc-1', control_type: 'community_controlled' }),
      makeOrg({ id: 'cc-2', control_type: 'community_controlled' }),
    ];
    const funding = [
      makeFunding({ id: 'f1', alma_organization_id: 'cc-1', amount_dollars: 100_000 }),
      makeFunding({ id: 'f2', alma_organization_id: 'cc-2', amount_dollars: 200_000 }),
      makeFunding({ id: 'f3', alma_organization_id: 'cc-1', amount_dollars: 50_000 }),
    ];

    const result = computeFundingByControlType(funding, orgs);
    expect(result.community_controlled).toBe(350_000);
  });
});

/* ── computeDetentionComparison ───────────────────────────────── */

describe('computeDetentionComparison', () => {
  it('computes average community program cost', () => {
    const interventions = [
      makeIntervention({ id: 'p1', cost_per_young_person: 50_000 }),
      makeIntervention({ id: 'p2', cost_per_young_person: 100_000 }),
    ];

    const result = computeDetentionComparison(interventions, 5_000_000);
    expect(result.avgCommunityProgramCost).toBe(75_000);
  });

  it('returns null avg when no programs have cost data', () => {
    const interventions = [
      makeIntervention({ id: 'p1', cost_per_young_person: null }),
    ];

    const result = computeDetentionComparison(interventions, 1_000_000);
    expect(result.avgCommunityProgramCost).toBeNull();
    expect(result.communityProgramsPerBed).toBeNull();
    expect(result.costMultiplier).toBeNull();
  });

  it('calculates equivalent detention beds from total funding', () => {
    const result = computeDetentionComparison([], 3_900_000);
    expect(result.equivalentDetentionBeds).toBe(3); // 3.9M / 1.3M = 3 beds
  });

  it('calculates how many community programs fit in one detention bed cost', () => {
    const interventions = [
      makeIntervention({ id: 'p1', cost_per_young_person: 65_000 }),
    ];

    const result = computeDetentionComparison(interventions, 0);
    // 1,300,000 / 65,000 = 20
    expect(result.communityProgramsPerBed).toBe(20);
  });

  it('calculates cost multiplier', () => {
    const interventions = [
      makeIntervention({ id: 'p1', cost_per_young_person: 100_000 }),
    ];

    const result = computeDetentionComparison(interventions, 0);
    // 1,300,000 / 100,000 = 13x
    expect(result.costMultiplier).toBe(13);
  });

  it('uses ROGS 2026 detention cost constant', () => {
    expect(DETENTION_COST_PER_CHILD).toBe(1_300_000);
  });

  it('excludes programs with zero cost', () => {
    const interventions = [
      makeIntervention({ id: 'p1', cost_per_young_person: 0 }),
      makeIntervention({ id: 'p2', cost_per_young_person: 80_000 }),
    ];

    const result = computeDetentionComparison(interventions, 0);
    expect(result.programsWithCostData).toBe(1);
    expect(result.avgCommunityProgramCost).toBe(80_000);
  });
});

/* ── computeGovernmentSources ─────────────────────────────────── */

describe('computeGovernmentSources', () => {
  it('groups funding by government source', () => {
    const orgs = [makeOrg({ id: 'org-1', name: 'Community Org' })];
    const funding = [
      makeFunding({ id: 'f1', source: 'austender', amount_dollars: 500_000, alma_organization_id: 'org-1' }),
      makeFunding({ id: 'f2', source: 'austender', amount_dollars: 300_000, alma_organization_id: 'org-1' }),
      makeFunding({ id: 'f3', source: 'niaa', amount_dollars: 1_000_000, alma_organization_id: 'org-1' }),
    ];

    const result = computeGovernmentSources(funding, orgs);

    expect(result).toHaveLength(2);
    // Sorted by total desc
    expect(result[0].source).toBe('niaa');
    expect(result[0].total).toBe(1_000_000);
    expect(result[1].source).toBe('austender');
    expect(result[1].total).toBe(800_000);
  });

  it('excludes non-government sources', () => {
    const funding = [
      makeFunding({ id: 'f1', source: 'foundation-notable-grants', amount_dollars: 100_000 }),
      makeFunding({ id: 'f2', source: 'random-other-source', amount_dollars: 200_000 }),
    ];

    const result = computeGovernmentSources(funding, []);
    // foundation-notable-grants is NOT in GOVERNMENT_SOURCES
    expect(result).toHaveLength(0);
  });

  it('tracks unique org names per source', () => {
    const orgs = [
      makeOrg({ id: 'org-1', name: 'Org A' }),
      makeOrg({ id: 'org-2', name: 'Org B' }),
    ];
    const funding = [
      makeFunding({ id: 'f1', source: 'austender', amount_dollars: 100_000, alma_organization_id: 'org-1' }),
      makeFunding({ id: 'f2', source: 'austender', amount_dollars: 200_000, alma_organization_id: 'org-2' }),
      makeFunding({ id: 'f3', source: 'austender', amount_dollars: 50_000, alma_organization_id: 'org-1' }),
    ];

    const result = computeGovernmentSources(funding, orgs);
    expect(result[0].orgNames).toHaveLength(2);
    expect(result[0].orgNames).toContain('Org A');
    expect(result[0].orgNames).toContain('Org B');
  });

  it('uses recipient_name for unlinked funding', () => {
    const funding = [
      makeFunding({ id: 'f1', source: 'niaa', amount_dollars: 100_000, alma_organization_id: null, recipient_name: 'Some Org' }),
    ];

    const result = computeGovernmentSources(funding, []);
    expect(result[0].orgNames).toContain('Some Org');
  });

  it('returns source labels', () => {
    const funding = [
      makeFunding({ id: 'f1', source: 'niaa', amount_dollars: 100_000 }),
    ];

    const result = computeGovernmentSources(funding, []);
    expect(result[0].sourceLabel).toBe('NIAA (National Indigenous Australians Agency)');
  });

  it('handles empty funding', () => {
    expect(computeGovernmentSources([], [])).toHaveLength(0);
  });
});

/* ── computeIntermediaryPresence ──────────────────────────────── */

describe('computeIntermediaryPresence', () => {
  it('identifies intermediaries with programs', () => {
    const orgs = [
      makeOrg({ id: 'int-1', name: 'Mission Australia', control_type: 'intermediary', slug: 'mission-australia' }),
      makeOrg({ id: 'cc-1', name: 'Local Org', control_type: 'community_controlled' }),
    ];
    const interventions = [
      makeIntervention({ id: 'p1', name: 'Youth Diversion', operating_organization_id: 'int-1' }),
      makeIntervention({ id: 'p2', name: 'Local Program', operating_organization_id: 'cc-1' }),
    ];
    const funding = [
      makeFunding({ id: 'f1', alma_organization_id: 'int-1', amount_dollars: 2_000_000 }),
    ];

    const result = computeIntermediaryPresence(orgs, interventions, funding);

    expect(result).toHaveLength(1);
    expect(result[0].orgName).toBe('Mission Australia');
    expect(result[0].programCount).toBe(1);
    expect(result[0].totalFunding).toBe(2_000_000);
    expect(result[0].programs[0].name).toBe('Youth Diversion');
  });

  it('excludes intermediaries with no programs and no funding', () => {
    const orgs = [
      makeOrg({ id: 'int-1', name: 'Empty Intermediary', control_type: 'intermediary' }),
    ];

    const result = computeIntermediaryPresence(orgs, [], []);
    expect(result).toHaveLength(0);
  });

  it('includes intermediaries with funding but no programs', () => {
    const orgs = [
      makeOrg({ id: 'int-1', name: 'Funded Intermediary', control_type: 'intermediary' }),
    ];
    const funding = [
      makeFunding({ id: 'f1', alma_organization_id: 'int-1', amount_dollars: 500_000 }),
    ];

    const result = computeIntermediaryPresence(orgs, [], funding);
    expect(result).toHaveLength(1);
    expect(result[0].programCount).toBe(0);
    expect(result[0].totalFunding).toBe(500_000);
  });

  it('sorts by total funding descending', () => {
    const orgs = [
      makeOrg({ id: 'int-1', name: 'Small', control_type: 'intermediary' }),
      makeOrg({ id: 'int-2', name: 'Big', control_type: 'intermediary' }),
    ];
    const interventions = [
      makeIntervention({ id: 'p1', name: 'Prog A', operating_organization_id: 'int-1' }),
      makeIntervention({ id: 'p2', name: 'Prog B', operating_organization_id: 'int-2' }),
    ];
    const funding = [
      makeFunding({ id: 'f1', alma_organization_id: 'int-1', amount_dollars: 100_000 }),
      makeFunding({ id: 'f2', alma_organization_id: 'int-2', amount_dollars: 5_000_000 }),
    ];

    const result = computeIntermediaryPresence(orgs, interventions, funding);
    expect(result[0].orgName).toBe('Big');
    expect(result[1].orgName).toBe('Small');
  });

  it('does not include non-intermediary orgs', () => {
    const orgs = [
      makeOrg({ id: 'cc-1', name: 'Community Org', control_type: 'community_controlled' }),
      makeOrg({ id: 'gov-1', name: 'Gov Agency', control_type: 'government' }),
    ];
    const interventions = [
      makeIntervention({ id: 'p1', operating_organization_id: 'cc-1' }),
      makeIntervention({ id: 'p2', operating_organization_id: 'gov-1' }),
    ];
    const funding = [
      makeFunding({ id: 'f1', alma_organization_id: 'cc-1', amount_dollars: 1_000_000 }),
    ];

    const result = computeIntermediaryPresence(orgs, interventions, funding);
    expect(result).toHaveLength(0);
  });
});

/* ── computeFundingFlows ──────────────────────────────────────── */

describe('computeFundingFlows', () => {
  it('builds flow nodes from gov source through intermediary to program', () => {
    const orgs = [
      makeOrg({ id: 'int-1', name: 'Mission Australia', control_type: 'intermediary', slug: 'mission-australia' }),
    ];
    const intermediaries = [{
      orgId: 'int-1',
      orgName: 'Mission Australia',
      orgSlug: 'mission-australia' as string | null,
      controlType: 'intermediary',
      programCount: 1,
      totalFunding: 500_000,
      programs: [{ id: 'p1', name: 'Youth Diversion', evidenceLevel: 'Promising (community-endorsed, emerging evidence)' as string | null }],
    }];
    const govSources = [{
      source: 'austender',
      sourceLabel: 'AusTender (Federal)',
      total: 500_000,
      orgNames: ['Mission Australia'],
      records: [makeFunding({ id: 'f1', source: 'austender', alma_organization_id: 'int-1', amount_dollars: 500_000 })],
    }];

    const result = computeFundingFlows(govSources, intermediaries, [], orgs);

    expect(result).toHaveLength(1);
    expect(result[0].sourceLabel).toBe('AusTender (Federal)');
    expect(result[0].intermediary?.name).toBe('Mission Australia');
    expect(result[0].program?.name).toBe('Youth Diversion');
    expect(result[0].amount).toBe(500_000);
  });

  it('creates direct flow when org is not intermediary', () => {
    const orgs = [
      makeOrg({ id: 'cc-1', name: 'Local Community Org', control_type: 'community_controlled', slug: 'local-org' }),
    ];
    const govSources = [{
      source: 'niaa',
      sourceLabel: 'NIAA',
      total: 200_000,
      orgNames: ['Local Community Org'],
      records: [makeFunding({ id: 'f1', source: 'niaa', alma_organization_id: 'cc-1', amount_dollars: 200_000 })],
    }];

    const result = computeFundingFlows(govSources, [], [], orgs);

    expect(result).toHaveLength(1);
    expect(result[0].intermediary?.name).toBe('Local Community Org');
    expect(result[0].program).toBeUndefined();
  });

  it('limits to top 5 gov sources', () => {
    const sources = Array.from({ length: 8 }, (_, i) => ({
      source: `source-${i}`,
      sourceLabel: `Source ${i}`,
      total: (8 - i) * 100_000,
      orgNames: [],
      records: [] as RegionFunding[],
    }));

    const result = computeFundingFlows(sources, [], [], []);
    // No records so no flows, but it should not error
    expect(result).toHaveLength(0);
  });

  it('handles empty inputs', () => {
    const result = computeFundingFlows([], [], [], []);
    expect(result).toHaveLength(0);
  });
});

/* ── computeGovernanceNetwork ──────────────────────────────────── */

const makeRole = (overrides: Partial<PersonRole> = {}): PersonRole => ({
  person_name: 'Jane Smith',
  role_type: 'Director',
  company_name: 'Test Corp',
  entity_id: null,
  ...overrides,
});

describe('computeGovernanceNetwork', () => {
  it('counts total unique directors', () => {
    const roles = [
      makeRole({ person_name: 'Alice', entity_id: 'org-1', company_name: 'Org A' }),
      makeRole({ person_name: 'Bob', entity_id: 'org-1', company_name: 'Org A' }),
      makeRole({ person_name: 'Alice', entity_id: 'org-2', company_name: 'Org B' }),
    ];
    const orgs = [
      makeOrg({ id: 'org-1', name: 'Org A' }),
      makeOrg({ id: 'org-2', name: 'Org B' }),
    ];

    const result = computeGovernanceNetwork(roles, orgs);
    expect(result.totalDirectors).toBe(2); // Alice + Bob
  });

  it('identifies multi-board directors', () => {
    const roles = [
      makeRole({ person_name: 'Alice', entity_id: 'org-1', company_name: 'Org A' }),
      makeRole({ person_name: 'Alice', entity_id: 'org-2', company_name: 'Org B' }),
      makeRole({ person_name: 'Bob', entity_id: 'org-1', company_name: 'Org A' }),
    ];
    const orgs = [
      makeOrg({ id: 'org-1', name: 'Org A' }),
      makeOrg({ id: 'org-2', name: 'Org B' }),
    ];

    const result = computeGovernanceNetwork(roles, orgs);
    expect(result.multiboardDirectors).toBe(1); // Alice only
  });

  it('counts Indigenous board connections', () => {
    const roles = [
      makeRole({ person_name: 'Alice', entity_id: 'org-1', company_name: 'ACCO One' }),
      makeRole({ person_name: 'Alice', entity_id: 'org-2', company_name: 'ACCO Two' }),
      makeRole({ person_name: 'Bob', entity_id: 'org-1', company_name: 'ACCO One' }),
      makeRole({ person_name: 'Bob', entity_id: 'org-3', company_name: 'Non-Indigenous Org' }),
    ];
    const orgs = [
      makeOrg({ id: 'org-1', name: 'ACCO One', is_indigenous_org: true }),
      makeOrg({ id: 'org-2', name: 'ACCO Two', is_indigenous_org: true }),
      makeOrg({ id: 'org-3', name: 'Non-Indigenous Org', is_indigenous_org: false }),
    ];

    const result = computeGovernanceNetwork(roles, orgs);
    expect(result.multiboardIndigenous).toBe(1); // Alice (2 Indigenous boards)
    // Bob has 1 Indigenous + 1 non-Indigenous, so indigenousBoards=1, not >=2
  });

  it('counts cross-sector connections', () => {
    const roles = [
      makeRole({ person_name: 'Bridge Person', entity_id: 'org-1', company_name: 'ACCO' }),
      makeRole({ person_name: 'Bridge Person', entity_id: 'org-2', company_name: 'Non-ACCO' }),
    ];
    const orgs = [
      makeOrg({ id: 'org-1', name: 'ACCO', is_indigenous_org: true }),
      makeOrg({ id: 'org-2', name: 'Non-ACCO', is_indigenous_org: false }),
    ];

    const result = computeGovernanceNetwork(roles, orgs);
    expect(result.crossSectorConnections).toBe(1);
  });

  it('returns top connectors sorted by board count', () => {
    const roles = [
      makeRole({ person_name: 'Alice', entity_id: 'org-1', company_name: 'A' }),
      makeRole({ person_name: 'Alice', entity_id: 'org-2', company_name: 'B' }),
      makeRole({ person_name: 'Alice', entity_id: 'org-3', company_name: 'C' }),
      makeRole({ person_name: 'Bob', entity_id: 'org-1', company_name: 'A' }),
      makeRole({ person_name: 'Bob', entity_id: 'org-2', company_name: 'B' }),
    ];
    const orgs = [
      makeOrg({ id: 'org-1', name: 'A' }),
      makeOrg({ id: 'org-2', name: 'B' }),
      makeOrg({ id: 'org-3', name: 'C' }),
    ];

    const result = computeGovernanceNetwork(roles, orgs);
    expect(result.topConnectors[0].personName).toBe('Alice');
    expect(result.topConnectors[0].totalBoards).toBe(3);
    expect(result.topConnectors[1].personName).toBe('Bob');
    expect(result.topConnectors[1].totalBoards).toBe(2);
  });

  it('deduplicates multiple roles at same org', () => {
    const roles = [
      makeRole({ person_name: 'Alice', entity_id: 'org-1', company_name: 'Org A', role_type: 'Director' }),
      makeRole({ person_name: 'Alice', entity_id: 'org-1', company_name: 'Org A', role_type: 'Secretary' }),
      makeRole({ person_name: 'Alice', entity_id: 'org-2', company_name: 'Org B', role_type: 'Director' }),
    ];
    const orgs = [
      makeOrg({ id: 'org-1', name: 'Org A' }),
      makeOrg({ id: 'org-2', name: 'Org B' }),
    ];

    const result = computeGovernanceNetwork(roles, orgs);
    expect(result.multiboardDirectors).toBe(1);
    expect(result.topConnectors[0].totalBoards).toBe(2); // not 3
  });

  it('handles empty inputs', () => {
    const result = computeGovernanceNetwork([], []);
    expect(result.totalDirectors).toBe(0);
    expect(result.multiboardDirectors).toBe(0);
    expect(result.topConnectors).toHaveLength(0);
  });

  it('skips roles with null person_name', () => {
    const roles = [
      makeRole({ person_name: null as any, entity_id: 'org-1' }),
      makeRole({ person_name: 'Alice', entity_id: 'org-1', company_name: 'A' }),
    ];
    const orgs = [makeOrg({ id: 'org-1', name: 'A' })];

    const result = computeGovernanceNetwork(roles, orgs);
    expect(result.totalDirectors).toBe(1);
  });

  it('computes average boards per director', () => {
    const roles = [
      makeRole({ person_name: 'Alice', entity_id: 'org-1', company_name: 'A' }),
      makeRole({ person_name: 'Alice', entity_id: 'org-2', company_name: 'B' }),
      makeRole({ person_name: 'Bob', entity_id: 'org-1', company_name: 'A' }),
    ];
    const orgs = [
      makeOrg({ id: 'org-1', name: 'A' }),
      makeOrg({ id: 'org-2', name: 'B' }),
    ];

    const result = computeGovernanceNetwork(roles, orgs);
    expect(result.avgBoardsPerDirector).toBe(1.5); // Alice=2, Bob=1 → 3/2
  });
});
