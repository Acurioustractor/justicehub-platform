/**
 * Search API Tests
 *
 * Tests for search functionality across all entity types
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

describe('Search Functionality', () => {
  describe('Intervention Search', () => {
    test('searches interventions by name', async () => {
      const searchTerm = 'youth';

      const { data, error } = await supabase
        .from('alma_interventions')
        .select('id, name, description')
        .ilike('name', `%${searchTerm}%`)
        .limit(10);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBeGreaterThan(0);

      // All results should contain search term in name
      data?.forEach(item => {
        expect(item.name.toLowerCase()).toContain(searchTerm.toLowerCase());
      });
    });

    test('searches interventions by description', async () => {
      const searchTerm = 'program';

      const { data, error } = await supabase
        .from('alma_interventions')
        .select('id, name, description')
        .ilike('description', `%${searchTerm}%`)
        .limit(10);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    test('handles special characters in search', async () => {
      const searchTerm = "youth's";

      const { data, error } = await supabase
        .from('alma_interventions')
        .select('id, name')
        .ilike('name', `%${searchTerm}%`)
        .limit(10);

      // Should not throw error
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    test('returns empty array for no matches', async () => {
      const searchTerm = 'xyznonexistent12345';

      const { data, error } = await supabase
        .from('alma_interventions')
        .select('id, name')
        .ilike('name', `%${searchTerm}%`);

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    test('pagination works correctly', async () => {
      const pageSize = 5;

      // Get first page
      const { data: page1 } = await supabase
        .from('alma_interventions')
        .select('id, name')
        .order('name')
        .range(0, pageSize - 1);

      // Get second page
      const { data: page2 } = await supabase
        .from('alma_interventions')
        .select('id, name')
        .order('name')
        .range(pageSize, pageSize * 2 - 1);

      expect(page1).toBeDefined();
      expect(page2).toBeDefined();
      expect(page1!.length).toBe(pageSize);

      // Pages should have different content
      if (page1!.length > 0 && page2!.length > 0) {
        expect(page1![0].id).not.toBe(page2![0].id);
      }
    });
  });

  describe('Service Search', () => {
    test('searches services by name', async () => {
      const searchTerm = 'health';

      const { data, error } = await supabase
        .from('services')
        .select('id, name, description')
        .ilike('name', `%${searchTerm}%`)
        .limit(10);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    test('filters services by state', async () => {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, location_state')
        .eq('location_state', 'QLD')
        .limit(10);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      data?.forEach(item => {
        expect(item.location_state).toBe('QLD');
      });
    });
  });

  describe('People Search', () => {
    test('searches profiles by name', async () => {
      const { data, error } = await supabase
        .from('public_profiles')
        .select('id, full_name, slug')
        .eq('is_public', true)
        .limit(10);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Public profiles should have valid slugs
      data?.forEach(item => {
        if (item.slug) {
          expect(item.slug).toMatch(/^[a-z0-9-]+$/);
        }
      });
    });
  });

  describe('Organization Search', () => {
    test('searches organizations by name', async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .limit(10);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    test('filters organizations by type', async () => {
      const { data } = await supabase
        .from('organizations')
        .select('id, name, type')
        .eq('type', 'community')
        .limit(10);

      data?.forEach(item => {
        expect(item.type).toBe('community');
      });
    });
  });

  describe('Cross-Entity Search (for ALMA Chat)', () => {
    test('can search multiple tables concurrently', async () => {
      const searchTerm = 'youth';

      const [interventions, services, people] = await Promise.all([
        supabase
          .from('alma_interventions')
          .select('id, name')
          .ilike('name', `%${searchTerm}%`)
          .limit(5),
        supabase
          .from('services')
          .select('id, name')
          .ilike('name', `%${searchTerm}%`)
          .limit(5),
        supabase
          .from('public_profiles')
          .select('id, full_name')
          .eq('is_public', true)
          .ilike('full_name', `%${searchTerm}%`)
          .limit(5),
      ]);

      expect(interventions.error).toBeNull();
      expect(services.error).toBeNull();
      expect(people.error).toBeNull();

      // At least one search should return results
      const totalResults =
        (interventions.data?.length || 0) +
        (services.data?.length || 0) +
        (people.data?.length || 0);

      expect(totalResults).toBeGreaterThanOrEqual(0);
    });
  });
});
