/**
 * Empathy Ledger Integration Tests
 *
 * Tests connectivity and data sync with the Empathy Ledger platform
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load env vars
config({ path: resolve(process.cwd(), '.env.local') });

// Empathy Ledger client
let empathyClient: SupabaseClient;

// JusticeHub client
let justicehubClient: SupabaseClient;

beforeAll(() => {
  empathyClient = createClient(
    process.env.EMPATHY_LEDGER_URL || 'https://yvnuayzslukamizrlhwb.supabase.co',
    process.env.EMPATHY_LEDGER_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bnVheXpzbHVrYW1penJsaHdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNDQ4NTAsImV4cCI6MjA3MTgyMDg1MH0.UV8JOXSwANMl72lRjw-9d4CKniHSlDk9hHZpKHYN6Bs'
  );

  justicehubClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
});

describe('Empathy Ledger Connection', () => {
  test('can connect to Empathy Ledger database', async () => {
    // Simple connectivity test - check if we can query stories
    const { data, error } = await empathyClient
      .from('stories')
      .select('id')
      .limit(1);

    // Should not have connection error
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  test('can read public stories from Empathy Ledger', async () => {
    const { data, count, error } = await empathyClient
      .from('stories')
      .select('id, title, is_public', { count: 'exact' })
      .eq('is_public', true)
      .limit(10);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(count).toBeGreaterThanOrEqual(0);

    // If there are public stories, they should have is_public = true
    data?.forEach(story => {
      expect(story.is_public).toBe(true);
    });
  });

  test('respects RLS policies on profiles', async () => {
    // Profiles table has RLS - anon key may not have full access
    const { data, error } = await empathyClient
      .from('profiles')
      .select('id')
      .limit(5);

    // May get an error due to RLS, or empty data - both are acceptable
    // The key is we don't get a connection error
    if (error) {
      // RLS error is expected
      expect(error.message).toMatch(/infinite|policy|permission|recursion/i);
    }
  });
});

describe('Empathy Ledger Data Structure', () => {
  test('stories have expected fields', async () => {
    const { data, error } = await empathyClient
      .from('stories')
      .select('id, title, content, is_public, privacy_level, created_at')
      .eq('is_public', true)
      .limit(5);

    expect(error).toBeNull();

    data?.forEach(story => {
      expect(story.id).toBeDefined();
      expect(typeof story.is_public).toBe('boolean');
      expect(story.created_at).toBeDefined();
    });
  });

  test('can query organizations', async () => {
    const { data, error } = await empathyClient
      .from('organizations')
      .select('id, name')
      .limit(5);

    // May have RLS restrictions
    if (error) {
      expect(error.message).toMatch(/infinite|policy|permission|recursion/i);
    } else {
      expect(data).toBeDefined();
    }
  });

  test('can query projects', async () => {
    const { data, error } = await empathyClient
      .from('projects')
      .select('id, name')
      .limit(5);

    // May have RLS restrictions
    if (error) {
      expect(error.message).toMatch(/infinite|policy|permission|recursion/i);
    } else {
      expect(data).toBeDefined();
    }
  });
});

describe('JusticeHub Sync Readiness', () => {
  test('JusticeHub has public_profiles table', async () => {
    const { count, error } = await justicehubClient
      .from('public_profiles')
      .select('*', { count: 'exact', head: true });

    expect(error).toBeNull();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('JusticeHub profiles can link to Empathy Ledger', async () => {
    // Check if empathy_ledger_profile_id column exists
    const { data, error } = await justicehubClient
      .from('public_profiles')
      .select('id, empathy_ledger_profile_id')
      .limit(1);

    expect(error).toBeNull();
    // If column exists, query should succeed
    expect(data).toBeDefined();
  });

  test('JusticeHub blog_posts can link to Empathy Ledger transcripts', async () => {
    // Check if empathy_ledger_transcript_id column exists
    const { data, error } = await justicehubClient
      .from('blog_posts')
      .select('id, empathy_ledger_transcript_id')
      .limit(1);

    // May not have blog_posts table or column
    if (error) {
      // Table or column may not exist - that's ok for this test
      expect(error.code).toBeDefined();
    } else {
      expect(data).toBeDefined();
    }
  });

  test('can count synced profiles', async () => {
    const { count, error } = await justicehubClient
      .from('public_profiles')
      .select('*', { count: 'exact', head: true })
      .not('empathy_ledger_profile_id', 'is', null);

    expect(error).toBeNull();
    // May be 0 if no profiles have been synced yet
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

describe('Data Integrity Checks', () => {
  test('Empathy Ledger stories have valid privacy levels', async () => {
    const validPrivacyLevels = ['public', 'community', 'private'];

    const { data, error } = await empathyClient
      .from('stories')
      .select('privacy_level')
      .limit(100);

    expect(error).toBeNull();

    data?.forEach(story => {
      if (story.privacy_level) {
        expect(validPrivacyLevels).toContain(story.privacy_level);
      }
    });
  });

  test('public stories match is_public flag', async () => {
    // All stories with is_public=true should have privacy_level='public' or null
    const { data, error } = await empathyClient
      .from('stories')
      .select('is_public, privacy_level')
      .eq('is_public', true)
      .limit(50);

    expect(error).toBeNull();

    data?.forEach(story => {
      expect(story.is_public).toBe(true);
      // privacy_level should be 'public' or null for public stories
      if (story.privacy_level) {
        expect(story.privacy_level).toBe('public');
      }
    });
  });
});
