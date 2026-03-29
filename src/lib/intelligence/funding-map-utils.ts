/**
 * Funding Map Utilities
 *
 * Data processing logic for the "Million Dollar LGAs" funding map page.
 * Classifies LGAs into funding tiers and computes summary statistics.
 */

export interface LgaRow {
  lga_name: string;
  lga_code: string;
  state: string;
  population: number | null;
  indigenous_pct: number | null;
  jh_funding_tracked: number | null;
  jh_org_count: number | null;
  recidivism_pct: number | null;
  indigenous_rate_ratio: number | null;
  cost_per_detention_day: number | null;
  detention_indigenous_pct: number | null;
  ndis_youth_participants: number | null;
  pipeline_intensity: number | null;
}

export interface FundingDesertRow {
  lga_name: string;
  lga_code: string;
  state: string;
  population: number | null;
  indigenous_pct: number | null;
  total_funding: number | null;
  org_count: number | null;
  funding_per_capita: number | null;
  desert_severity: string | null;
}

export interface FundingByLgaRow {
  lga_name: string;
  lga_code: string;
  state: string;
  total_funding: number | null;
  org_count: number | null;
  source_count: number | null;
}

export type FundingTier = 'desert' | 'underfunded' | 'moderate' | 'well-funded';

export interface ClassifiedLga extends LgaRow {
  tier: FundingTier;
  fundingPerCapita: number | null;
  desertSeverity: string | null;
  annualDetentionCost: number | null;
  fundingGap: number | null;
}

export interface FundingMapSummary {
  totalLgas: number;
  desertCount: number;
  underfundedCount: number;
  moderateCount: number;
  wellFundedCount: number;
  avgIndigenousOverrep: number | null;
  totalFundingTracked: number;
  totalPopulation: number;
  medianFundingPerCapita: number | null;
  stateBreakdown: StateBreakdown[];
}

export interface StateBreakdown {
  state: string;
  lgaCount: number;
  desertCount: number;
  totalFunding: number;
  totalPopulation: number;
  avgIndigenousRatio: number | null;
}

/**
 * Classify an LGA into a funding tier based on funding per capita and org presence.
 *
 * - desert: no funding or < $10/capita and 0-1 orgs
 * - underfunded: < $50/capita or < 2 orgs
 * - moderate: $50-200/capita with some org presence
 * - well-funded: > $200/capita with 3+ orgs
 */
export function classifyLga(
  lga: LgaRow,
  desertMap: Map<string, FundingDesertRow>
): ClassifiedLga {
  const funding = lga.jh_funding_tracked ?? 0;
  const pop = lga.population ?? 0;
  const orgCount = lga.jh_org_count ?? 0;

  const fundingPerCapita = pop > 0 ? funding / pop : null;
  const desertRow = desertMap.get(lga.lga_code);
  const desertSeverity = desertRow?.desert_severity ?? null;

  // Annual detention cost estimate: cost_per_day * 365 * estimated_youth_detainees
  // Using a rough proxy: population * indigenous_pct * overrep_ratio * incarceration_rate
  const annualDetentionCost = lga.cost_per_detention_day
    ? lga.cost_per_detention_day * 365
    : null;

  let tier: FundingTier;

  if (desertSeverity === 'severe' || desertSeverity === 'critical') {
    tier = 'desert';
  } else if (funding === 0 || (fundingPerCapita !== null && fundingPerCapita < 10 && orgCount <= 1)) {
    tier = 'desert';
  } else if (fundingPerCapita !== null && fundingPerCapita < 50 || orgCount < 2) {
    tier = 'underfunded';
  } else if (fundingPerCapita !== null && fundingPerCapita >= 200 && orgCount >= 3) {
    tier = 'well-funded';
  } else {
    tier = 'moderate';
  }

  const fundingGap = annualDetentionCost !== null
    ? annualDetentionCost - funding
    : null;

  return {
    ...lga,
    tier,
    fundingPerCapita,
    desertSeverity,
    annualDetentionCost,
    fundingGap,
  };
}

/**
 * Process all LGA data and produce classified list + summary stats.
 */
export function processLgaData(
  lgas: LgaRow[],
  deserts: FundingDesertRow[],
  _fundingByLga: FundingByLgaRow[]
): { classified: ClassifiedLga[]; summary: FundingMapSummary } {
  const desertMap = new Map<string, FundingDesertRow>();
  for (const d of deserts) {
    desertMap.set(d.lga_code, d);
  }

  const classified = lgas.map((lga) => classifyLga(lga, desertMap));

  // Sort: deserts first, then by funding gap descending
  classified.sort((a, b) => {
    const tierOrder: Record<FundingTier, number> = {
      desert: 0,
      underfunded: 1,
      moderate: 2,
      'well-funded': 3,
    };
    const tierDiff = tierOrder[a.tier] - tierOrder[b.tier];
    if (tierDiff !== 0) return tierDiff;
    // Within same tier, sort by funding gap (largest gap first)
    return (b.fundingGap ?? 0) - (a.fundingGap ?? 0);
  });

  // Compute summary
  const desertCount = classified.filter((l) => l.tier === 'desert').length;
  const underfundedCount = classified.filter((l) => l.tier === 'underfunded').length;
  const moderateCount = classified.filter((l) => l.tier === 'moderate').length;
  const wellFundedCount = classified.filter((l) => l.tier === 'well-funded').length;

  const ratios = classified
    .map((l) => l.indigenous_rate_ratio)
    .filter((r): r is number => r !== null && r > 0);
  const avgIndigenousOverrep = ratios.length > 0
    ? ratios.reduce((a, b) => a + b, 0) / ratios.length
    : null;

  const totalFundingTracked = classified.reduce(
    (s, l) => s + (l.jh_funding_tracked ?? 0),
    0
  );

  const totalPopulation = classified.reduce(
    (s, l) => s + (l.population ?? 0),
    0
  );

  const perCapitas = classified
    .map((l) => l.fundingPerCapita)
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b);
  const medianFundingPerCapita = perCapitas.length > 0
    ? perCapitas[Math.floor(perCapitas.length / 2)]
    : null;

  // State breakdown
  const stateMap = new Map<string, ClassifiedLga[]>();
  for (const lga of classified) {
    const arr = stateMap.get(lga.state) ?? [];
    arr.push(lga);
    stateMap.set(lga.state, arr);
  }

  const stateBreakdown: StateBreakdown[] = [];
  for (const [state, lgaList] of stateMap.entries()) {
    const stateRatios = lgaList
      .map((l) => l.indigenous_rate_ratio)
      .filter((r): r is number => r !== null && r > 0);

    stateBreakdown.push({
      state,
      lgaCount: lgaList.length,
      desertCount: lgaList.filter((l) => l.tier === 'desert').length,
      totalFunding: lgaList.reduce((s, l) => s + (l.jh_funding_tracked ?? 0), 0),
      totalPopulation: lgaList.reduce((s, l) => s + (l.population ?? 0), 0),
      avgIndigenousRatio: stateRatios.length > 0
        ? stateRatios.reduce((a, b) => a + b, 0) / stateRatios.length
        : null,
    });
  }

  stateBreakdown.sort((a, b) => b.desertCount - a.desertCount);

  return {
    classified,
    summary: {
      totalLgas: classified.length,
      desertCount,
      underfundedCount,
      moderateCount,
      wellFundedCount,
      avgIndigenousOverrep,
      totalFundingTracked,
      totalPopulation,
      medianFundingPerCapita,
      stateBreakdown,
    },
  };
}

/**
 * Get the display color for a funding tier (brand colors).
 */
export function tierColor(tier: FundingTier): string {
  switch (tier) {
    case 'desert':
      return '#DC2626'; // Urgent Red
    case 'underfunded':
      return '#F59E0B'; // Amber
    case 'moderate':
      return '#6B7280'; // Gray
    case 'well-funded':
      return '#059669'; // Emerald
  }
}

/**
 * Get display label for a tier.
 */
export function tierLabel(tier: FundingTier): string {
  switch (tier) {
    case 'desert':
      return 'Funding Desert';
    case 'underfunded':
      return 'Underfunded';
    case 'moderate':
      return 'Moderate';
    case 'well-funded':
      return 'Well Funded';
  }
}
