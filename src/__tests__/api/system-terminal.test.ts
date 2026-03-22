/**
 * System Terminal Dashboard Tests
 *
 * Integration tests verifying the live data queries used by /system.
 * Ensures counts are accurate, per-state breakdowns are non-zero,
 * and the ai_generated filter is applied to interventions.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

let supabase: SupabaseClient;

beforeAll(() => {
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
});

jest.setTimeout(60000);

describe('System Terminal — Live Data', () => {
  const STATES = ['QLD', 'NSW', 'VIC', 'NT'];

  describe('Funding counts per state', () => {
    test('each tracked state has funding records', async () => {
      for (const state of STATES) {
        const { count } = await supabase
          .from('justice_funding')
          .select('id', { count: 'exact', head: true })
          .eq('state', state);

        expect(count).toBeGreaterThan(0);
      }
    });

    test('total funding count is accurate (no truncation)', async () => {
      const { count: total } = await supabase
        .from('justice_funding')
        .select('id', { count: 'exact', head: true });

      // We know there are 70K+ records — if this drops below 50K something is wrong
      expect(total).toBeGreaterThan(50000);
    });

    test('QLD has the most funding records (state procurement data)', async () => {
      const counts: Record<string, number> = {};
      for (const state of STATES) {
        const { count } = await supabase
          .from('justice_funding')
          .select('id', { count: 'exact', head: true })
          .eq('state', state);
        counts[state] = count || 0;
      }

      expect(counts['QLD']).toBeGreaterThan(counts['NSW']);
      expect(counts['QLD']).toBeGreaterThan(counts['VIC']);
      expect(counts['QLD']).toBeGreaterThan(counts['NT']);
    });
  });

  describe('Interventions', () => {
    test('verified interventions exist for each state via geography', async () => {
      for (const state of STATES) {
        const { data } = await supabase
          .from('alma_interventions')
          .select('id')
          .neq('verification_status', 'ai_generated')
          .contains('geography', [state])
          .limit(1);

        expect(data?.length).toBeGreaterThan(0);
      }
    });

    test('ai_generated filter removes records', async () => {
      const { count: total } = await supabase
        .from('alma_interventions')
        .select('id', { count: 'exact', head: true });

      const { count: filtered } = await supabase
        .from('alma_interventions')
        .select('id', { count: 'exact', head: true })
        .neq('verification_status', 'ai_generated');

      expect(total).toBeGreaterThan(filtered!);
      expect(filtered).toBeGreaterThan(900);
    });
  });

  describe('Organizations per state', () => {
    test('each state has tracked organizations', async () => {
      for (const state of STATES) {
        const { count } = await supabase
          .from('organizations')
          .select('id', { count: 'exact', head: true })
          .eq('state', state);

        expect(count).toBeGreaterThan(0);
      }
    });
  });

  describe('Civic data (QLD)', () => {
    test('ministerial statements exist', async () => {
      const { count } = await supabase
        .from('civic_ministerial_statements')
        .select('id', { count: 'exact', head: true });

      expect(count).toBeGreaterThan(100);
    });

    test('hansard speeches exist', async () => {
      const { count } = await supabase
        .from('civic_hansard')
        .select('id', { count: 'exact', head: true });

      expect(count).toBeGreaterThan(50);
    });

    test('charter commitments are filtered to youth justice', async () => {
      const { count } = await supabase
        .from('civic_charter_commitments')
        .select('id', { count: 'exact', head: true })
        .eq('youth_justice_relevant', true);

      expect(count).toBeGreaterThan(10);
    });
  });
});
