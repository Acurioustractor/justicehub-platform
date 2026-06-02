/**
 * CivicScope SDK Client (sibling product: CivicGraph / grantscope)
 *
 * Fetches from the CivicGraph public API. Per FY27 launch ops plan §7.3, this
 * endpoint may not be live yet — when the breaker is open or the env var is
 * unset, this client returns a realistic stub response and degrades silently.
 *
 * Env:
 *   CIVIC_SCOPE_API_URL   — base URL, e.g. https://civicgraph.au/api/v1
 *   CIVIC_SCOPE_API_KEY   — optional bearer for premium endpoints
 *
 * TODO(post-launch): Switch stubs off when CivicGraph public API ships
 * (tracked: act-global-infrastructure §7.3).
 */

import { resilientFetch } from './clients/http-resilient';

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes per brief

function baseUrl(): string | null {
  return process.env.CIVIC_SCOPE_API_URL ?? null;
}

function authHeaders(): Record<string, string> {
  const key = process.env.CIVIC_SCOPE_API_KEY;
  return key ? { authorization: `Bearer ${key}` } : {};
}

export interface CivicScopeOpportunity {
  id: string;
  name: string;
  funder: string;
  amountMin?: number | null;
  amountMax?: number | null;
  deadline?: string | null;
  categories: string[];
  focusAreas: string[];
  fitScore?: number | null;
  url?: string | null;
  source: 'civicgraph' | 'stub';
}

export interface CivicScopeFundingForLga {
  lgaCode: string;
  lgaName: string;
  state: string;
  totalFundingAud: number;
  entityCount: number;
  topFunders: Array<{ name: string; amountAud: number }>;
  source: 'civicgraph' | 'stub';
}

export interface CivicScopeEntityProfile {
  abn: string;
  canonicalName: string;
  entityType: string | null;
  sector: string | null;
  state: string | null;
  postcode: string | null;
  isCommunityControlled: boolean;
  totalIncomeAud?: number | null;
  fundingSources: Array<{ source: string; total: number }>;
  source: 'civicgraph' | 'stub';
}

function stubOpportunitiesForAbn(abn: string): CivicScopeOpportunity[] {
  return [
    {
      id: `stub-opp-${abn}-1`,
      name: 'Stub: Community-Led Justice Grant',
      funder: 'Stub Foundation',
      amountMin: 25_000,
      amountMax: 150_000,
      deadline: null,
      categories: ['youth-justice'],
      focusAreas: ['community-led', 'prevention'],
      fitScore: 0.7,
      url: null,
      source: 'stub',
    },
  ];
}

function stubFundingForLga(lgaCode: string): CivicScopeFundingForLga {
  return {
    lgaCode,
    lgaName: 'Stub LGA',
    state: 'NSW',
    totalFundingAud: 0,
    entityCount: 0,
    topFunders: [],
    source: 'stub',
  };
}

function stubEntityProfile(abn: string): CivicScopeEntityProfile {
  return {
    abn,
    canonicalName: 'Stub Entity (CivicGraph offline)',
    entityType: null,
    sector: null,
    state: null,
    postcode: null,
    isCommunityControlled: false,
    fundingSources: [],
    source: 'stub',
  };
}

export const civicScopeClient = {
  /**
   * Surface grant opportunities scored for an organisation by ABN.
   * Returns stub data when CivicGraph is not configured or unreachable.
   */
  async getOpportunitiesForOrg(abn: string): Promise<CivicScopeOpportunity[]> {
    const base = baseUrl();
    if (!base || !abn) return stubOpportunitiesForAbn(abn || 'unknown');

    const result = await resilientFetch<{ opportunities: CivicScopeOpportunity[] }>({
      url: `${base.replace(/\/$/, '')}/opportunities?abn=${encodeURIComponent(abn)}`,
      init: { headers: authHeaders() },
      cacheTtlMs: CACHE_TTL_MS,
      timeoutMs: 5_000,
    });

    if (!result.ok || !result.data) return stubOpportunitiesForAbn(abn);
    return result.data.opportunities ?? [];
  },

  /**
   * Funding flowing into an LGA, by code (e.g. ABS LGA_CODE_2021).
   */
  async getFundingForLGA(lgaCode: string): Promise<CivicScopeFundingForLga> {
    const base = baseUrl();
    if (!base || !lgaCode) return stubFundingForLga(lgaCode || 'unknown');

    const result = await resilientFetch<{ funding: CivicScopeFundingForLga }>({
      url: `${base.replace(/\/$/, '')}/lga/${encodeURIComponent(lgaCode)}/funding`,
      init: { headers: authHeaders() },
      cacheTtlMs: CACHE_TTL_MS,
      timeoutMs: 5_000,
    });

    if (!result.ok || !result.data) return stubFundingForLga(lgaCode);
    return result.data.funding;
  },

  /**
   * Full entity profile across funding sources (justice, contracts, donations).
   */
  async getEntityProfile(abn: string): Promise<CivicScopeEntityProfile> {
    const base = baseUrl();
    if (!base || !abn) return stubEntityProfile(abn || 'unknown');

    const result = await resilientFetch<{ entity: CivicScopeEntityProfile }>({
      url: `${base.replace(/\/$/, '')}/entity/${encodeURIComponent(abn)}`,
      init: { headers: authHeaders() },
      cacheTtlMs: CACHE_TTL_MS,
      timeoutMs: 5_000,
    });

    if (!result.ok || !result.data) return stubEntityProfile(abn);
    return result.data.entity;
  },
};
