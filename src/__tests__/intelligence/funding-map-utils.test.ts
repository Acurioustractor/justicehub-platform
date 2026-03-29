/**
 * Tests for funding-map-utils.ts
 * TDD: These tests define expected behavior for LGA classification and summary computation.
 */

import {
  classifyLga,
  processLgaData,
  tierColor,
  tierLabel,
  type LgaRow,
  type FundingDesertRow,
  type FundingByLgaRow,
  type FundingTier,
} from '@/lib/intelligence/funding-map-utils';

/* ── Test fixtures ────────────────────────────────────────────── */

function makeLga(overrides: Partial<LgaRow> = {}): LgaRow {
  return {
    lga_name: 'Test LGA',
    lga_code: 'LGA001',
    state: 'QLD',
    population: 10000,
    indigenous_pct: 5,
    jh_funding_tracked: 100000,
    jh_org_count: 3,
    recidivism_pct: 40,
    indigenous_rate_ratio: 12,
    cost_per_detention_day: 1500,
    detention_indigenous_pct: 60,
    ndis_youth_participants: 50,
    pipeline_intensity: 0.7,
    ...overrides,
  };
}

function makeDesertRow(overrides: Partial<FundingDesertRow> = {}): FundingDesertRow {
  return {
    lga_name: 'Test LGA',
    lga_code: 'LGA001',
    state: 'QLD',
    population: 10000,
    indigenous_pct: 5,
    total_funding: 0,
    org_count: 0,
    funding_per_capita: 0,
    desert_severity: 'severe',
    ...overrides,
  };
}

const emptyDesertMap = new Map<string, FundingDesertRow>();

/* ── classifyLga tests ────────────────────────────────────────── */

describe('classifyLga', () => {
  it('classifies LGA with zero funding as desert', () => {
    const lga = makeLga({ jh_funding_tracked: 0, jh_org_count: 0 });
    const result = classifyLga(lga, emptyDesertMap);
    expect(result.tier).toBe('desert');
  });

  it('classifies LGA with severe desert_severity as desert', () => {
    const lga = makeLga({ lga_code: 'LGA001', jh_funding_tracked: 500000 });
    const desertMap = new Map([['LGA001', makeDesertRow({ desert_severity: 'severe' })]]);
    const result = classifyLga(lga, desertMap);
    expect(result.tier).toBe('desert');
  });

  it('classifies LGA with critical desert_severity as desert', () => {
    const lga = makeLga({ lga_code: 'LGA002' });
    const desertMap = new Map([['LGA002', makeDesertRow({ lga_code: 'LGA002', desert_severity: 'critical' })]]);
    const result = classifyLga(lga, desertMap);
    expect(result.tier).toBe('desert');
  });

  it('classifies low funding per capita + few orgs as desert', () => {
    // $5/capita, 1 org
    const lga = makeLga({ population: 10000, jh_funding_tracked: 50000, jh_org_count: 1 });
    // 50000 / 10000 = $5/capita < $10, and 1 org <= 1
    const result = classifyLga(lga, emptyDesertMap);
    expect(result.tier).toBe('desert');
  });

  it('classifies low funding per capita as underfunded', () => {
    // $30/capita, 2 orgs
    const lga = makeLga({ population: 10000, jh_funding_tracked: 300000, jh_org_count: 2 });
    const result = classifyLga(lga, emptyDesertMap);
    expect(result.tier).toBe('underfunded');
  });

  it('classifies single org as underfunded even with decent per-capita', () => {
    // $100/capita but only 1 org
    const lga = makeLga({ population: 10000, jh_funding_tracked: 1000000, jh_org_count: 1 });
    const result = classifyLga(lga, emptyDesertMap);
    expect(result.tier).toBe('underfunded');
  });

  it('classifies high funding + many orgs as well-funded', () => {
    // $300/capita, 5 orgs
    const lga = makeLga({ population: 10000, jh_funding_tracked: 3000000, jh_org_count: 5 });
    const result = classifyLga(lga, emptyDesertMap);
    expect(result.tier).toBe('well-funded');
  });

  it('classifies moderate funding as moderate', () => {
    // $100/capita, 3 orgs
    const lga = makeLga({ population: 10000, jh_funding_tracked: 1000000, jh_org_count: 3 });
    const result = classifyLga(lga, emptyDesertMap);
    expect(result.tier).toBe('moderate');
  });

  it('computes fundingPerCapita correctly', () => {
    const lga = makeLga({ population: 5000, jh_funding_tracked: 250000 });
    const result = classifyLga(lga, emptyDesertMap);
    expect(result.fundingPerCapita).toBe(50);
  });

  it('handles null population gracefully', () => {
    const lga = makeLga({ population: null, jh_funding_tracked: 100000 });
    const result = classifyLga(lga, emptyDesertMap);
    expect(result.fundingPerCapita).toBeNull();
  });

  it('handles zero population gracefully', () => {
    const lga = makeLga({ population: 0, jh_funding_tracked: 100000 });
    const result = classifyLga(lga, emptyDesertMap);
    expect(result.fundingPerCapita).toBeNull();
  });

  it('computes annualDetentionCost from cost_per_detention_day', () => {
    const lga = makeLga({ cost_per_detention_day: 1000 });
    const result = classifyLga(lga, emptyDesertMap);
    expect(result.annualDetentionCost).toBe(365000);
  });

  it('handles null cost_per_detention_day', () => {
    const lga = makeLga({ cost_per_detention_day: null });
    const result = classifyLga(lga, emptyDesertMap);
    expect(result.annualDetentionCost).toBeNull();
  });

  it('computes fundingGap as detention cost minus funding', () => {
    const lga = makeLga({ cost_per_detention_day: 1000, jh_funding_tracked: 100000 });
    const result = classifyLga(lga, emptyDesertMap);
    // 365000 - 100000 = 265000
    expect(result.fundingGap).toBe(265000);
  });
});

/* ── processLgaData tests ─────────────────────────────────────── */

describe('processLgaData', () => {
  const sampleLgas: LgaRow[] = [
    makeLga({ lga_name: 'Desert Town', lga_code: 'D01', state: 'QLD', jh_funding_tracked: 0, jh_org_count: 0, population: 5000, indigenous_rate_ratio: 20 }),
    makeLga({ lga_name: 'Underfunded City', lga_code: 'U01', state: 'NSW', jh_funding_tracked: 200000, jh_org_count: 1, population: 10000, indigenous_rate_ratio: 15 }),
    makeLga({ lga_name: 'Moderate Town', lga_code: 'M01', state: 'QLD', jh_funding_tracked: 1000000, jh_org_count: 3, population: 10000, indigenous_rate_ratio: 8 }),
    makeLga({ lga_name: 'Well Funded City', lga_code: 'W01', state: 'NSW', jh_funding_tracked: 5000000, jh_org_count: 10, population: 10000, indigenous_rate_ratio: 5 }),
  ];

  const emptyDeserts: FundingDesertRow[] = [];
  const emptyFundingByLga: FundingByLgaRow[] = [];

  it('returns correct total LGA count', () => {
    const { summary } = processLgaData(sampleLgas, emptyDeserts, emptyFundingByLga);
    expect(summary.totalLgas).toBe(4);
  });

  it('counts tiers correctly', () => {
    const { summary } = processLgaData(sampleLgas, emptyDeserts, emptyFundingByLga);
    expect(summary.desertCount).toBe(1);
    expect(summary.underfundedCount).toBe(1);
    expect(summary.moderateCount).toBe(1);
    expect(summary.wellFundedCount).toBe(1);
  });

  it('computes total funding tracked', () => {
    const { summary } = processLgaData(sampleLgas, emptyDeserts, emptyFundingByLga);
    expect(summary.totalFundingTracked).toBe(0 + 200000 + 1000000 + 5000000);
  });

  it('computes total population', () => {
    const { summary } = processLgaData(sampleLgas, emptyDeserts, emptyFundingByLga);
    expect(summary.totalPopulation).toBe(5000 + 10000 + 10000 + 10000);
  });

  it('computes average indigenous overrep ratio', () => {
    const { summary } = processLgaData(sampleLgas, emptyDeserts, emptyFundingByLga);
    // (20 + 15 + 8 + 5) / 4 = 12
    expect(summary.avgIndigenousOverrep).toBe(12);
  });

  it('sorts classified LGAs: deserts first, then by funding gap', () => {
    const { classified } = processLgaData(sampleLgas, emptyDeserts, emptyFundingByLga);
    expect(classified[0].tier).toBe('desert');
    // Last should be well-funded
    expect(classified[classified.length - 1].tier).toBe('well-funded');
  });

  it('produces state breakdown', () => {
    const { summary } = processLgaData(sampleLgas, emptyDeserts, emptyFundingByLga);
    expect(summary.stateBreakdown.length).toBeGreaterThanOrEqual(2);
    const qld = summary.stateBreakdown.find((s) => s.state === 'QLD');
    expect(qld).toBeDefined();
    expect(qld!.lgaCount).toBe(2);
  });

  it('handles empty input gracefully', () => {
    const { classified, summary } = processLgaData([], [], []);
    expect(classified).toEqual([]);
    expect(summary.totalLgas).toBe(0);
    expect(summary.desertCount).toBe(0);
    expect(summary.avgIndigenousOverrep).toBeNull();
    expect(summary.medianFundingPerCapita).toBeNull();
  });

  it('desert map lookup works correctly', () => {
    const deserts: FundingDesertRow[] = [
      makeDesertRow({ lga_code: 'U01', desert_severity: 'severe' }),
    ];
    const { classified } = processLgaData(sampleLgas, deserts, emptyFundingByLga);
    // U01 should now be desert (overridden by desert severity)
    const u01 = classified.find((l) => l.lga_code === 'U01');
    expect(u01?.tier).toBe('desert');
  });
});

/* ── Utility function tests ──────────────────────────────────── */

describe('tierColor', () => {
  it('returns brand red for desert', () => {
    expect(tierColor('desert')).toBe('#DC2626');
  });

  it('returns emerald for well-funded', () => {
    expect(tierColor('well-funded')).toBe('#059669');
  });
});

describe('tierLabel', () => {
  it('returns human-readable labels', () => {
    expect(tierLabel('desert')).toBe('Funding Desert');
    expect(tierLabel('underfunded')).toBe('Underfunded');
    expect(tierLabel('moderate')).toBe('Moderate');
    expect(tierLabel('well-funded')).toBe('Well Funded');
  });
});
