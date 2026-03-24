import { createServiceClient } from '@/lib/supabase/service';

/**
 * Detention cost data from ROGS (Report on Government Services).
 * Always fetched live from our rogs_justice_spending table — never hardcoded.
 */

export interface DetentionCostByState {
  state: string;
  dailyCost: number;
  annualCost: number;
  avgDailyPopulation: number;
  totalSpend: number; // $'000
  financialYear: string;
}

export interface DetentionCosts {
  byState: Record<string, DetentionCostByState>;
  national: DetentionCostByState;
  financialYear: string;
}

const STATE_CODES = ['nsw', 'vic', 'qld', 'wa', 'sa', 'tas', 'act', 'nt'] as const;

/**
 * Fetch latest detention cost data from ROGS table 17A.20.
 * Returns per-state daily/annual costs and national figures.
 * Caches nothing — always live from Supabase.
 */
export async function getDetentionCosts(): Promise<DetentionCosts> {
  const supabase = createServiceClient() as any;

  // Get cost per day per young person (Table 17A.20)
  const { data: costRows } = await supabase
    .from('rogs_justice_spending')
    .select('financial_year, description1, unit, nsw, vic, qld, wa, sa, tas, act, nt, aust')
    .eq('rogs_table', '17A.20')
    .eq('measure', 'Cost per young person subject to detention-based supervision')
    .eq('service_type', 'Detention-based supervision')
    .order('financial_year', { ascending: false })
    .limit(10);

  // Find the latest year that has cost-per-day data
  const latestYear = costRows?.[0]?.financial_year || '2024-25';
  const yearRows = (costRows || []).filter((r: any) => r.financial_year === latestYear);

  const dailyRow = yearRows.find((r: any) => r.description1 === 'Cost per average day per young person');
  const popRow = yearRows.find((r: any) => r.unit === 'no.');
  const spendRow = yearRows.find((r: any) =>
    r.description1 === 'Government real recurrent expenditure' && r.unit === "$'000"
  );

  const byState: Record<string, DetentionCostByState> = {};

  for (const code of STATE_CODES) {
    const daily = parseFloat(dailyRow?.[code]) || 0;
    byState[code.toUpperCase()] = {
      state: code.toUpperCase(),
      dailyCost: daily,
      annualCost: Math.round(daily * 365),
      avgDailyPopulation: parseFloat(popRow?.[code]) || 0,
      totalSpend: parseFloat(spendRow?.[code]) || 0,
      financialYear: latestYear,
    };
  }

  const nationalDaily = parseFloat(dailyRow?.aust) || 0;
  const national: DetentionCostByState = {
    state: 'AUST',
    dailyCost: nationalDaily,
    annualCost: Math.round(nationalDaily * 365),
    avgDailyPopulation: parseFloat(popRow?.aust) || 0,
    totalSpend: parseFloat(spendRow?.aust) || 0,
    financialYear: latestYear,
  };

  return { byState, national, financialYear: latestYear };
}

/**
 * Quick helper: get the national average annual detention cost.
 * Use getDetentionCosts() for full state breakdown.
 */
export async function getNationalDetentionCost(): Promise<{ daily: number; annual: number; year: string }> {
  const costs = await getDetentionCosts();
  return {
    daily: costs.national.dailyCost,
    annual: costs.national.annualCost,
    year: costs.national.financialYear,
  };
}
