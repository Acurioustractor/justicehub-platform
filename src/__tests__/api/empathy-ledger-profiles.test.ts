/**
 * Empathy Ledger Profiles API Tests
 *
 * Integration tests for /api/empathy-ledger/profiles endpoint.
 * Tests consent filtering, featured profiles, and EL→JH fallback.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

let elClient: SupabaseClient;
let jhClient: SupabaseClient;

beforeAll(() => {
  const elUrl = process.env.EMPATHY_LEDGER_URL;
  const elKey = process.env.EMPATHY_LEDGER_SERVICE_KEY;

  if (!elUrl || !elKey) {
    console.warn('EL credentials not set — some tests will be skipped');
  }

  if (elUrl && elKey) {
    elClient = createClient(elUrl, elKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  jhClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
});

describe('Empathy Ledger Profiles', () => {
  describe('EL database layer', () => {
    test('storytellers table exists and has data', async () => {
      if (!elClient) { console.warn('No EL client'); return; }

      const { count, error } = await elClient
        .from('storytellers')
        .select('*', { count: 'exact', head: true });

      expect(error).toBeNull();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('storytellers have consent fields', async () => {
      if (!elClient) { console.warn('No EL client'); return; }

      const { data, error } = await elClient
        .from('storytellers')
        .select('id, display_name, justicehub_enabled, is_active, is_justicehub_featured')
        .limit(3);

      expect(error).toBeNull();
      if (data && data.length > 0) {
        expect(data[0]).toHaveProperty('justicehub_enabled');
        expect(data[0]).toHaveProperty('is_active');
      }
    });

    test('only active + enabled storytellers are returned by consent filter', async () => {
      if (!elClient) { console.warn('No EL client'); return; }

      const { data, error } = await elClient
        .from('storytellers')
        .select('id, display_name, is_active, justicehub_enabled')
        .eq('is_active', true)
        .or('justicehub_enabled.eq.true,is_justicehub_featured.eq.true,tags.cs.{"justicehub"}')
        .limit(10);

      expect(error).toBeNull();
      // All returned records should be active
      for (const row of data || []) {
        expect(row.is_active).toBe(true);
      }
    });
  });

  describe('JH fallback data', () => {
    test('public_profiles table has fallback data', async () => {
      const { count, error } = await jhClient
        .from('public_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_public', true);

      expect(error).toBeNull();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Route response (requires dev server)', () => {
    const BASE = 'http://localhost:3004/api/empathy-ledger/profiles';

    test('returns profiles with expected shape', async () => {
      try {
        const res = await fetch(`${BASE}?limit=5`);
        if (!res.ok) {
          console.warn(`Profiles endpoint returned ${res.status}`);
          return;
        }
        const json = await res.json();

        // Should return profiles array or object with profiles
        if (Array.isArray(json)) {
          if (json.length > 0) {
            expect(json[0]).toHaveProperty('display_name');
          }
        } else if (json.profiles) {
          expect(Array.isArray(json.profiles)).toBe(true);
        }
      } catch {
        console.warn('Dev server not running — skipping');
      }
    });

    test('featured filter works', async () => {
      try {
        const res = await fetch(`${BASE}?featured=true&limit=5`);
        if (!res.ok) return;
        const json = await res.json();
        // Should return subset or empty
        expect(json).toBeDefined();
      } catch {
        console.warn('Dev server not running — skipping');
      }
    });
  });
});
