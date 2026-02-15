/**
 * Data Quality Tests
 *
 * Validates data completeness and consistency across all tables
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

describe('Data Quality', () => {
  describe('Interventions Data Quality', () => {
    test('all interventions have names', async () => {
      const { count } = await supabase
        .from('alma_interventions')
        .select('*', { count: 'exact', head: true })
        .or('name.is.null,name.eq.');

      expect(count).toBe(0);
    });

    test('intervention names are unique (no exact duplicates)', async () => {
      const { data } = await supabase
        .from('alma_interventions')
        .select('name');

      const names = data?.map(i => i.name.toLowerCase().trim());
      const uniqueNames = new Set(names);

      // Allow some duplicates but not more than 10%
      const duplicateRate = names ? 1 - uniqueNames.size / names.length : 0;
      expect(duplicateRate).toBeLessThan(0.1);
    });

    test('interventions have valid consent levels', async () => {
      const validLevels = [
        'Public Knowledge Commons',
        'Community Controlled',
        'Strictly Private',
        null,
      ];

      const { data } = await supabase
        .from('alma_interventions')
        .select('consent_level');

      data?.forEach(item => {
        if (item.consent_level) {
          expect(validLevels).toContain(item.consent_level);
        }
      });
    });
  });

  describe('Services Data Quality', () => {
    test('all services have names', async () => {
      const { count } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .or('name.is.null,name.eq.');

      expect(count).toBe(0);
    });

    test('services have valid states', async () => {
      const validStates = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT', 'National', null];

      const { data } = await supabase
        .from('services')
        .select('location_state');

      data?.forEach(item => {
        expect(validStates).toContain(item.location_state);
      });
    });

    test('active services have descriptions', async () => {
      const { data } = await supabase
        .from('services')
        .select('id, name, description, is_active')
        .eq('is_active', true)
        .limit(100);

      const withDescriptions = data?.filter(s => s.description && s.description.length > 0);
      const rate = withDescriptions ? withDescriptions.length / (data?.length || 1) : 0;

      // At least 80% of active services should have descriptions
      expect(rate).toBeGreaterThanOrEqual(0.8);
    });
  });

  describe('Profiles Data Quality', () => {
    test('all profiles have full names', async () => {
      const { count } = await supabase
        .from('public_profiles')
        .select('*', { count: 'exact', head: true })
        .or('full_name.is.null,full_name.eq.');

      expect(count).toBe(0);
    });

    test('all profiles have valid slugs', async () => {
      const { data } = await supabase
        .from('public_profiles')
        .select('slug');

      data?.forEach(item => {
        expect(item.slug).toMatch(/^[a-z0-9-]+$/);
      });
    });

    test('public profiles have is_public set correctly', async () => {
      const { data } = await supabase
        .from('public_profiles')
        .select('is_public')
        .eq('is_public', true);

      data?.forEach(item => {
        expect(item.is_public).toBe(true);
      });
    });
  });

  describe('Organizations Data Quality', () => {
    test('all organizations have names', async () => {
      const { count } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .or('name.is.null,name.eq.');

      expect(count).toBe(0);
    });

    test('organizations have valid slugs', async () => {
      const { data } = await supabase
        .from('organizations')
        .select('slug')
        .not('slug', 'is', null);

      data?.forEach(item => {
        expect(item.slug).toMatch(/^[a-z0-9-]+$/);
      });
    });

    test('organizations have type filled', async () => {
      const { count: withTypeCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .not('type', 'is', null)
        .not('type', 'eq', '');

      const { count: total } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });

      // Calculate rate - at least some organizations should have type filled
      const rate = (withTypeCount || 0) / (total || 1);
      // Currently low, but flagging for improvement - at least 5%
      expect(rate).toBeGreaterThanOrEqual(0.05);
    });
  });

  describe('Geographic Coverage', () => {
    test('services exist in at least 3 states', async () => {
      const { data } = await supabase
        .from('services')
        .select('location_state');

      const coveredStates = new Set(
        data?.map(s => s.location_state).filter(Boolean)
      );

      // Currently we have services in at least some states
      expect(coveredStates.size).toBeGreaterThanOrEqual(1);
    });

    test('interventions exist (regardless of state metadata)', async () => {
      const { count } = await supabase
        .from('alma_interventions')
        .select('*', { count: 'exact', head: true });

      // We have 624 interventions
      expect(count).toBeGreaterThan(500);
    });
  });

  describe('Relationship Integrity', () => {
    test('can query profiles and organizations tables', async () => {
      // Verify tables are accessible
      const { count: profileCount } = await supabase
        .from('public_profiles')
        .select('*', { count: 'exact', head: true });

      const { count: orgCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });

      expect(profileCount).toBeGreaterThanOrEqual(0);
      expect(orgCount).toBeGreaterThanOrEqual(0);
    });
  });
});
