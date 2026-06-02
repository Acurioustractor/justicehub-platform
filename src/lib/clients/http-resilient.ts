/**
 * Resilient HTTP helper for sibling-product SDK clients.
 *
 * Three things:
 *   1. Retry with exponential backoff for transient errors (5xx, network).
 *   2. Per-host circuit breaker so a CivicGraph outage cannot block a render
 *      for 30 seconds across every component.
 *   3. In-memory TTL cache so we are not hammering siblings for repeat reads.
 *
 * The sibling products (CivicGraph public API, Empathy Ledger accountability
 * endpoints) may not be live yet — these clients must degrade gracefully and
 * return a stubbed response when the breaker is open or the host is unset.
 */

const BREAKER_FAILURE_THRESHOLD = 3;
const BREAKER_COOLDOWN_MS = 30_000;
const DEFAULT_RETRY_COUNT = 2;
const DEFAULT_RETRY_BACKOFF_MS = 300;

interface BreakerState {
  failures: number;
  openedAt: number | null;
}

const breakers = new Map<string, BreakerState>();

function breakerKey(host: string): string {
  return host || 'unknown';
}

function isBreakerOpen(host: string): boolean {
  const state = breakers.get(breakerKey(host));
  if (!state || state.openedAt === null) return false;
  if (Date.now() - state.openedAt > BREAKER_COOLDOWN_MS) {
    // Half-open: clear so the next request gets a chance.
    breakers.set(breakerKey(host), { failures: 0, openedAt: null });
    return false;
  }
  return true;
}

function recordSuccess(host: string): void {
  breakers.set(breakerKey(host), { failures: 0, openedAt: null });
}

function recordFailure(host: string): void {
  const current = breakers.get(breakerKey(host)) ?? { failures: 0, openedAt: null };
  const failures = current.failures + 1;
  const openedAt = failures >= BREAKER_FAILURE_THRESHOLD ? Date.now() : current.openedAt;
  breakers.set(breakerKey(host), { failures, openedAt });
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export interface ResilientFetchOptions {
  url: string;
  init?: RequestInit;
  /** Cache key — if omitted, the URL+method is used. */
  cacheKey?: string;
  /** Cache TTL in ms. Set to 0 to disable caching. */
  cacheTtlMs?: number;
  /** Number of retry attempts on transient failures. */
  retries?: number;
  /** Base backoff in ms (doubles per attempt). */
  retryBackoffMs?: number;
  /** Per-call timeout in ms. */
  timeoutMs?: number;
}

export interface ResilientFetchResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  /** True when the result came from the breaker stub or cache, not a live call. */
  degraded: boolean;
  error?: string;
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return 'invalid-url';
  }
}

export async function resilientFetch<T>(
  options: ResilientFetchOptions
): Promise<ResilientFetchResult<T>> {
  const { url, init, cacheTtlMs = 0, retries = DEFAULT_RETRY_COUNT } = options;
  const host = hostOf(url);
  const key = options.cacheKey ?? `${init?.method ?? 'GET'} ${url}`;

  // Cache hit
  if (cacheTtlMs > 0) {
    const cached = cacheGet<T>(key);
    if (cached !== null) {
      return { ok: true, status: 200, data: cached, degraded: false };
    }
  }

  // Breaker open
  if (isBreakerOpen(host)) {
    return {
      ok: false,
      status: 503,
      data: null,
      degraded: true,
      error: `Circuit breaker open for ${host}`,
    };
  }

  const backoff = options.retryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
  let lastError: string | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = options.timeoutMs ? setTimeout(() => controller.abort(), options.timeoutMs) : null;

    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      if (timeout) clearTimeout(timeout);

      if (response.status >= 500) {
        lastError = `Upstream ${response.status}`;
        recordFailure(host);
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, backoff * Math.pow(2, attempt)));
          continue;
        }
        return { ok: false, status: response.status, data: null, degraded: false, error: lastError };
      }

      if (!response.ok) {
        recordSuccess(host); // 4xx is a client problem, not a sibling outage
        const body = (await response.json().catch(() => null)) as T | null;
        return { ok: false, status: response.status, data: body, degraded: false };
      }

      const data = (await response.json()) as T;
      recordSuccess(host);
      if (cacheTtlMs > 0) cacheSet(key, data, cacheTtlMs);
      return { ok: true, status: response.status, data, degraded: false };
    } catch (err) {
      if (timeout) clearTimeout(timeout);
      lastError = err instanceof Error ? err.message : 'fetch failed';
      recordFailure(host);
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, backoff * Math.pow(2, attempt)));
      }
    }
  }

  return {
    ok: false,
    status: 0,
    data: null,
    degraded: true,
    error: lastError ?? 'unknown',
  };
}

/** Test-only: wipe breaker + cache state. */
export function resetResilientFetch(): void {
  breakers.clear();
  cache.clear();
}
