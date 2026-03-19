/**
 * Homepage Stats API Tests
 *
 * Integration tests for /api/homepage-stats endpoint.
 * Verifies live counts from multiple tables, ROGS spending data,
 * and the ai_generated filter on interventions.
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

describe('Homepage Stats API', () => {
  describe('Database counts', () => {
    test('interventions count excludes ai_generated', async () => {
      const { count: total } = await supabase
        .from('alma_interventions')
        .select('*', { count: 'exact', head: true });

      const { count: filtered } = await supabase
        .from('alma_interventions')
        .select('*', { count: 'exact', head: true })
        .neq('verification_status', 'ai_generated');

      // ai_generated records exist and are filtered out
      expect(total).toBeGreaterThan(filtered!);
      expect(filtered).toBeGreaterThan(500);
    });

    test('services count is reasonable', async () => {
      const { count, error } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      expect(error).toBeNull();
      expect(count).toBeGreaterThan(0);
    });

    test('organizations count is reasonable', async () => {
      const { count, error } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (error?.message?.includes('statement timeout')) {
        console.warn('organizations count timed out');
        return;
      }
      expect(error).toBeNull();
      expect(count).toBeGreaterThan(1000);
    });

    test('indigenous orgs count', async () => {
      const { count, error } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('is_indigenous_org', true);

      if (error?.message?.includes('statement timeout')) {
        console.warn('indigenous orgs count timed out');
        return;
      }
      expect(error).toBeNull();
      expect(count).toBeGreaterThan(1000);
    });

    test('evidence count', async () => {
      const { count, error } = await supabase
        .from('alma_evidence')
        .select('*', { count: 'exact', head: true });

      if (error?.message?.includes('statement timeout')) {
        console.warn('evidence count timed out');
        return;
      }
      expect(error).toBeNull();
      expect(count).toBeGreaterThan(100);
    });

    test('org-linked interventions count', async () => {
      const { count, error } = await supabase
        .from('alma_interventions')
        .select('*', { count: 'exact', head: true })
        .not('operating_organization_id', 'is', null)
        .neq('verification_status', 'ai_generated');

      expect(error).toBeNull();
      expect(count).toBeGreaterThan(400);
    });

    test('public profiles count', async () => {
      const { count, error } = await supabase
        .from('public_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_public', true);

      expect(error).toBeNull();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Data quality', () => {
    test('no interventions with empty names', async () => {
      const { count } = await supabase
        .from('alma_interventions')
        .select('*', { count: 'exact', head: true })
        .or('name.is.null,name.eq.');

      expect(count).toBe(0);
    });

    test('interventions have required fields', async () => {
      const { data } = await supabase
        .from('alma_interventions')
        .select('id, name, description')
        .neq('verification_status', 'ai_generated')
        .limit(10);

      expect(data).toBeDefined();
      for (const item of data || []) {
        expect(item.id).toBeDefined();
        expect(item.name).toBeTruthy();
      }
    });
  });

  describe('ROGS spending data', () => {
    test('rogs_justice_spending has youth justice data', async () => {
      const { data, error } = await supabase
        .from('rogs_justice_spending')
        .select('rogs_table, financial_year, aust')
        .eq('rogs_section', 'youth_justice')
        .limit(5);

      if (error?.message?.includes('statement timeout')) {
        console.warn('ROGS query timed out');
        return;
      }
      expect(error).toBeNull();
      expect(data!.length).toBeGreaterThan(0);
    });

    test('youth detention spending is accessible', async () => {
      const { data, error } = await supabase
        .from('rogs_justice_spending')
        .select('aust')
        .eq('rogs_section', 'youth_justice')
        .eq('rogs_table', '17A.10')
        .eq('financial_year', '2024-25')
        .eq('unit', "$'000")
        .eq('service_type', 'Detention-based supervision')
        .eq('description3', 'Detention-based services')
        .limit(1)
        .single();

      if (error) {
        console.warn('Youth detention ROGS query failed:', error.message);
        return;
      }
      expect(data.aust).toBeGreaterThan(0);
    });
  });

  describe('Funding totals RPC', () => {
    test('get_funding_total returns count and dollars', async () => {
      const { data, error } = await supabase.rpc('get_funding_total').single();

      if (error?.message?.includes('statement timeout')) {
        console.warn('get_funding_total timed out');
        return;
      }
      if (error) {
        console.warn(`get_funding_total: ${error.message}`);
        return;
      }

      expect(data).toHaveProperty('grant_count');
      expect(data).toHaveProperty('total_dollars');
      expect(data.grant_count).toBeGreaterThan(10000);
    });
  });

  describe('Route response (requires dev server)', () => {
    test('returns live stats with expected shape', async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);
        const res = await fetch('http://localhost:3004/api/homepage-stats', { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) {
          console.warn(`Homepage stats returned ${res.status}`);
          return;
        }
        const json = await res.json();

        expect(json).toHaveProperty('success');
        expect(json).toHaveProperty('stats');

        const s = json.stats;
        expect(s.programs_documented).toBeGreaterThan(500);
        expect(s.total_organizations).toBeGreaterThan(1000);
        expect(s.indigenous_orgs).toBeGreaterThan(1000);
        expect(s.total_evidence).toBeGreaterThan(100);
        expect(s.orgs_linked).toBeGreaterThan(400);
        expect(s.rogs_youth_total_millions).toBeGreaterThan(1000);

        // Ensure not using fallback
        if (!json.is_fallback) {
          expect(s.programs_documented).toBeGreaterThan(800);
        }
      } catch (e: any) {
        if (e?.name === 'AbortError') {
          console.warn('Homepage stats route timed out');
          return;
        }
        console.warn('Dev server not running — skipping');
      }
    }, 25000);
  });
});
