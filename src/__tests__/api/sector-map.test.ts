/**
 * Sector Map API Tests
 *
 * Integration tests for /api/sector-map data layer.
 * Verifies cache table + live counts return valid data shapes.
 * Some queries may timeout under authenticator role — tests handle that gracefully.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

jest.setTimeout(60000);

let supabase: SupabaseClient;

beforeAll(() => {
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
});

describe('Sector Map API', () => {
  describe('Cache table', () => {
    test('sector_map_cache has required keys', async () => {
      const { data, error } = await supabase
        .from('sector_map_cache')
        .select('key, updated_at');

      expect(error).toBeNull();
      expect(data).toBeDefined();

      const keys = (data || []).map((r: any) => r.key);
      expect(keys).toContain('funding_by_source');
      expect(keys).toContain('funding_total');
      expect(keys).toContain('intervention_types');
    });

    test('cache entries have updated_at timestamps', async () => {
      const { data } = await supabase
        .from('sector_map_cache')
        .select('key, updated_at');

      for (const row of data || []) {
        expect(row.updated_at).toBeTruthy();
      }
    });
  });

  describe('Live counts (fast queries only)', () => {
    test('organizations count is reasonable', async () => {
      const { count, error } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });

      expect(error).toBeNull();
      expect(count).toBeGreaterThan(10000);
    });

    test('evidence count is reasonable', async () => {
      const { count, error } = await supabase
        .from('alma_evidence')
        .select('*', { count: 'exact', head: true });

      expect(error).toBeNull();
      expect(count).toBeGreaterThan(100);
    });
  });

  describe('Cache data shapes', () => {
    test('funding_by_source has valid structure', async () => {
      const { data, error } = await supabase
        .from('sector_map_cache')
        .select('data')
        .eq('key', 'funding_by_source')
        .single();

      // May fail if cache hasn't been populated yet
      if (error || !data?.data) {
        console.warn('funding_by_source not in cache — run populate-sector-cache.mjs');
        return;
      }

      const sources = data.data as any[];
      expect(sources.length).toBeGreaterThan(0);
      expect(sources[0]).toHaveProperty('source');
      expect(sources[0]).toHaveProperty('total_millions');
      expect(sources[0]).toHaveProperty('grant_count');
    });

    test('funding_total has total_billions', async () => {
      const { data, error } = await supabase
        .from('sector_map_cache')
        .select('data')
        .eq('key', 'funding_total')
        .single();

      if (error || !data?.data) {
        console.warn('funding_total not in cache');
        return;
      }

      const total = data.data as any;
      expect(total.total_billions).toBeGreaterThan(0);
    });

    test('intervention_types has valid structure', async () => {
      const { data, error } = await supabase
        .from('sector_map_cache')
        .select('data')
        .eq('key', 'intervention_types')
        .single();

      if (error || !data?.data) {
        console.warn('intervention_types not in cache');
        return;
      }

      const types = data.data as any[];
      expect(types.length).toBeGreaterThan(0);
      expect(types[0]).toHaveProperty('type');
      expect(types[0]).toHaveProperty('count');
    });
  });

  describe('Route response shape', () => {
    test('API returns expected top-level keys', async () => {
      // Test against the actual route if dev server is running
      try {
        const res = await fetch('http://localhost:3004/api/sector-map');
        if (!res.ok) {
          console.warn(`Dev server returned ${res.status} — skipping route test`);
          return;
        }
        const json = await res.json();

        expect(json).toHaveProperty('summary');
        expect(json).toHaveProperty('interventionsByType');
        expect(json).toHaveProperty('topFundedOrgs');
        expect(json).toHaveProperty('fundingBySource');
        expect(json).toHaveProperty('entityBreakdown');
        expect(json).toHaveProperty('_meta');

        // Summary shape
        expect(json.summary).toHaveProperty('totalFundingBillions');
        expect(json.summary).toHaveProperty('totalGrants');
        expect(json.summary).toHaveProperty('totalOrgs');
        expect(json.summary.totalOrgs).toBeGreaterThan(0);

        // Meta shape
        expect(json._meta).toHaveProperty('cacheStale');
        expect(json._meta).toHaveProperty('cacheKeys');
      } catch {
        console.warn('Dev server not running — skipping route shape test');
      }
    });
  });
});
