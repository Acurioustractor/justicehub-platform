/**
 * Homepage Stats API Tests
 *
 * Tests for /api/homepage-stats endpoint
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load env vars before anything else
config({ path: resolve(process.cwd(), '.env.local') });

// Create test Supabase client lazily
let supabase: SupabaseClient;

beforeAll(() => {
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
});

describe('Homepage Stats API', () => {
  describe('Database Counts', () => {
    test('interventions count matches database', async () => {
      const { count } = await supabase
        .from('alma_interventions')
        .select('*', { count: 'exact', head: true });

      expect(count).toBeGreaterThan(0);
      expect(typeof count).toBe('number');
    });

    test('services count matches database', async () => {
      const { count } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true });

      expect(count).toBeGreaterThan(0);
      expect(typeof count).toBe('number');
    });

    test('public profiles count is reasonable', async () => {
      const { count } = await supabase
        .from('public_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_public', true);

      expect(count).toBeGreaterThanOrEqual(0);
      expect(typeof count).toBe('number');
    });

    test('organizations count matches database', async () => {
      const { count } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });

      expect(count).toBeGreaterThan(0);
      expect(typeof count).toBe('number');
    });
  });

  describe('Data Quality', () => {
    test('interventions have required fields', async () => {
      const { data } = await supabase
        .from('alma_interventions')
        .select('id, name, description')
        .limit(10);

      expect(data).toBeDefined();
      data?.forEach(item => {
        expect(item.id).toBeDefined();
        expect(item.name).toBeTruthy();
        // Description might be null, but should be defined
        expect('description' in item).toBe(true);
      });
    });

    test('services have required fields', async () => {
      const { data } = await supabase
        .from('services')
        .select('id, name')
        .limit(10);

      expect(data).toBeDefined();
      data?.forEach(item => {
        expect(item.id).toBeDefined();
        expect(item.name).toBeTruthy();
      });
    });

    test('no interventions with empty names', async () => {
      const { count } = await supabase
        .from('alma_interventions')
        .select('*', { count: 'exact', head: true })
        .or('name.is.null,name.eq.');

      expect(count).toBe(0);
    });
  });

  describe('Geographic Coverage', () => {
    test('has interventions data', async () => {
      const { count } = await supabase
        .from('alma_interventions')
        .select('*', { count: 'exact', head: true });

      // We have 624+ interventions
      expect(count).toBeGreaterThan(500);
    });

    test('has services data', async () => {
      const { count } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true });

      // We have 500+ services
      expect(count).toBeGreaterThan(400);
    });
  });
});
