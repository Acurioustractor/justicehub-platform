export type ScrapeStrategy = 'firecrawl' | 'direct_http' | 'playwright';

export interface StrategyInput {
  sourceId: string;
  sourceType: string;
  url: string;
  reliabilityScore?: number;
  hasDynamicSelectors?: boolean;
  recentFailureRate?: number;
}

export interface ScrapeStrategyPlan {
  sourceId: string;
  primary: ScrapeStrategy;
  fallbacks: ScrapeStrategy[];
  rationale: string;
}

function isLikelyDynamicSite(url: string): boolean {
  return /(grants|search|portal|opportunity|program)/i.test(url);
}

export function chooseScrapeStrategy(input: StrategyInput): ScrapeStrategyPlan {
  const reliability = input.reliabilityScore ?? 0.7;
  const failureRate = input.recentFailureRate ?? 0.1;
  const dynamic = Boolean(input.hasDynamicSelectors) || isLikelyDynamicSite(input.url);

  if (dynamic && (failureRate > 0.25 || reliability < 0.5)) {
    return {
      sourceId: input.sourceId,
      primary: 'playwright',
      fallbacks: ['firecrawl', 'direct_http'],
      rationale: 'Dynamic target with lower reliability; browser-first strategy',
    };
  }

  if (dynamic) {
    return {
      sourceId: input.sourceId,
      primary: 'firecrawl',
      fallbacks: ['playwright', 'direct_http'],
      rationale: 'Dynamic target but stable enough for Firecrawl main extraction',
    };
  }

  if (failureRate > 0.3) {
    return {
      sourceId: input.sourceId,
      primary: 'firecrawl',
      fallbacks: ['direct_http', 'playwright'],
      rationale: 'Recent failures indicate need for resilient parser and fallback',
    };
  }

  return {
    sourceId: input.sourceId,
    primary: 'direct_http',
    fallbacks: ['firecrawl', 'playwright'],
    rationale: 'Static or straightforward source; low-cost fetch-first strategy',
  };
}
