/**
 * Data Health Live API Tests
 *
 * Tests for /api/data-health/live endpoint.
 * Verifies response shape, auth checks, and data integrity.
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const BASE_URL = 'http://localhost:3004';

jest.setTimeout(90000);

describe('Data Health Live API', () => {
  // Single shared fetch to avoid overwhelming Supabase connection pool
  let sharedData: any;

  beforeAll(async () => {
    const res = await fetch(`${BASE_URL}/api/data-health/live`, {
      headers: { 'x-health-check': 'true' },
    });
    expect(res.status).toBe(200);
    sharedData = await res.json();
  });

  // --- Authentication ---

  test('returns 401 without proper auth header', async () => {
    const res = await fetch(`${BASE_URL}/api/data-health/live`);
    expect(res.status).toBe(401);
  });

  test('returns 200 with x-health-check header', async () => {
    const res = await fetch(`${BASE_URL}/api/data-health/live`, {
      headers: { 'x-health-check': 'true' },
    });
    expect(res.status).toBe(200);
  });

  test('returns 200 with valid CRON_SECRET bearer token', async () => {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.warn('CRON_SECRET not set, skipping bearer auth test');
      return;
    }
    const res = await fetch(`${BASE_URL}/api/data-health/live`, {
      headers: { authorization: `Bearer ${cronSecret}` },
    });
    expect(res.status).toBe(200);
  });

  // --- Response Shape ---

  test('has all required top-level keys', () => {
    expect(sharedData).toHaveProperty('timestamp');
    expect(sharedData).toHaveProperty('status');
    expect(sharedData).toHaveProperty('tables');
    expect(sharedData).toHaveProperty('linkage');
    expect(sharedData).toHaveProperty('quality');
    expect(sharedData).toHaveProperty('rogs');
    expect(sharedData).toHaveProperty('freshness');
  });

  test('status is one of healthy/degraded/unhealthy', () => {
    expect(['healthy', 'degraded', 'unhealthy']).toContain(sharedData.status);
  });

  test('timestamp is a valid ISO string', () => {
    expect(new Date(sharedData.timestamp).toISOString()).toBe(sharedData.timestamp);
  });

  test('tables have correct shape for known tables', () => {
    const tables = sharedData.tables;
    expect(tables).toBeDefined();
    const interventions = tables['alma_interventions'];
    expect(interventions).toBeDefined();
    expect(typeof interventions.count).toBe('number');
    expect(interventions).toHaveProperty('lastCreated');
    expect(typeof interventions.stale30d).toBe('number');
  });

  test('linkage has correct shape with percentages', () => {
    const { linkage } = sharedData;
    expect(linkage.fundingLinked).toBeDefined();
    expect(typeof linkage.fundingLinked.linked).toBe('number');
    expect(typeof linkage.fundingLinked.total).toBe('number');
    expect(typeof linkage.fundingLinked.pct).toBe('number');
    expect(linkage.fundingLinked.pct).toBeGreaterThanOrEqual(0);
    expect(linkage.fundingLinked.pct).toBeLessThanOrEqual(100);

    expect(linkage.interventionsLinked).toBeDefined();
    expect(linkage.orgsWithState).toBeDefined();
    expect(typeof linkage.indigenousOrgs).toBe('number');
  });

  test('quality has correct shape', () => {
    const { quality } = sharedData;
    expect(typeof quality.missingCost).toBe('number');
    expect(typeof quality.untested).toBe('number');
    expect(typeof quality.zeroFunding).toBe('number');
  });

  test('rogs has correct shape', () => {
    const { rogs } = sharedData;
    expect(rogs).toHaveProperty('latestYear');
    expect(typeof rogs.hasDetentionCosts).toBe('boolean');
  });

  test('freshness entries have correct shape', () => {
    const { freshness } = sharedData;
    expect(Object.keys(freshness).length).toBeGreaterThan(0);
    const firstKey = Object.keys(freshness)[0];
    const entry = freshness[firstKey];
    expect(entry).toHaveProperty('lastRecord');
    expect(typeof entry.isStale).toBe('boolean');
    expect(typeof entry.thresholdHours).toBe('number');
  });

  // --- Data Integrity ---

  test('alma_interventions excludes ai_generated records', () => {
    const count = sharedData.tables['alma_interventions']?.count;
    expect(count).toBeDefined();
    // Should be around 981-1100 (verified+unverified) not 1262+ (including ai_generated)
    expect(count).toBeLessThan(1200);
    expect(count).toBeGreaterThan(500);
  });

  test('organizations count is reasonable', () => {
    const count = sharedData.tables['organizations']?.count;
    expect(count).toBeGreaterThan(10000);
  });

  test('justice_funding count is reasonable', () => {
    const count = sharedData.tables['justice_funding']?.count;
    expect(count).toBeGreaterThan(50000);
  });

  test('funding linkage percentage is reasonable', () => {
    expect(sharedData.linkage.fundingLinked.pct).toBeGreaterThan(50);
  });

  test('rogs latestYear is string or null', () => {
    // latestYear may be null if Supabase times out, but when present must be a string
    const year = sharedData.rogs.latestYear;
    if (year !== null) {
      expect(typeof year).toBe('string');
      expect(year.length).toBeGreaterThan(0);
    }
  });

  // --- Stability ---

  test('returns valid response shape on repeated calls', async () => {
    // 2 sequential calls to verify reliability without exceeding timeout
    for (let i = 0; i < 2; i++) {
      const res = await fetch(`${BASE_URL}/api/data-health/live`, {
        headers: { 'x-health-check': 'true' },
      });
      expect(res.status).toBe(200);
      const result = await res.json();
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('tables');
      expect(result).toHaveProperty('linkage');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(result.status);
    }
  }, 90000);

  // --- Error Handling ---

  test('endpoint returns valid JSON content type', async () => {
    const res = await fetch(`${BASE_URL}/api/data-health/live`, {
      headers: { 'x-health-check': 'true' },
    });
    expect(res.status).toBe(200);
    const contentType = res.headers.get('content-type');
    expect(contentType).toContain('application/json');
  });
});
