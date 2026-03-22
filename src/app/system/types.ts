// ── System Terminal Config Types ──
// Config-driven model for state/territory youth justice system terminals

export type Department = {
  name: string;
  shortName: string;
  contracts: number;
  totalValue: number;
  period: string;
  category: 'education' | 'youth_justice' | 'child_safety' | 'corrections' | 'health' | 'housing' | 'other';
};

export type Supplier = {
  name: string;
  totalValue: number;
  contracts: number;
  departments: string[];
  note?: string;
};

export type SpotlightLocation = {
  name: string;
  funding: number;
  programs: number;
};

export type RegionalSpotlight = {
  title: string;         // e.g. "North Queensland Spotlight", "Western Sydney Spotlight"
  totalFunding: number;
  records: number;
  orgs: number;
  locations: SpotlightLocation[];
};

export type Voice = {
  quote: string;
  name: string;
  location: string;
  role: string;
};

export type FundingSource = {
  source: string;
  count: number;
  total: number;
};

export type Alternative = {
  name: string;
  cost: number;
  count: number;
  unit: string;
};

export type AlternativeModel = {
  title: string;          // e.g. "The Townsville Model"
  description: string;
  pillars: { tag: string; description: string }[];
  alternatives: Alternative[];
};

export type ScalePathwayStep = {
  name: string;
  highlight?: boolean;    // e.g. Palm Island in teal
};

export type CostComparison = {
  detentionCostPerDay: number;
  communityCostPerDay: number;
  avgKidsInDetention: number;
};

export type SystemConfig = {
  // Identity
  state: string;                // 'QLD', 'NSW', 'VIC', 'NT', 'WA', 'SA', 'TAS', 'ACT', 'National'
  stateFull: string;            // 'Queensland', 'New South Wales', etc.
  slug: string;                 // 'qld', 'nsw', etc. (URL segment)

  // THE MONEY
  departments: Department[];
  topSuppliers: Supplier[];
  spotlight?: RegionalSpotlight;
  fundingBySource: FundingSource[];

  // THE WORDS (dynamic from Supabase, but state-specific query params)
  // commitments, statements, hansard, diaries — all queried by state

  // THE EVIDENCE
  costComparison: CostComparison;

  // THE STORIES
  voices: Voice[];

  // THE ALTERNATIVE
  alternativeModel: AlternativeModel;
  scalePathway?: ScalePathwayStep[];

  // Crossover headline stat (if available)
  crossoverHeadlineStat?: string;  // e.g. "72.9%"
  crossoverHeadlineLabel?: string; // e.g. "of QLD youth justice kids had child protection contact"
};

// ── Helpers (shared across all state pages) ──

export function fmt(n: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n);
}

export function fmtCompact(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return fmt(n);
}

export function fmtNum(n: number): string {
  return new Intl.NumberFormat('en-AU').format(n);
}

export function fmtDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trim() + '...';
}
