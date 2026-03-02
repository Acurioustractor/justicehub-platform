import { createClient } from '@supabase/supabase-js';

/**
 * Create a Supabase client for Signal Engine operations.
 * Uses service role key if available, falls back to anon key.
 * Service role is needed for writing to signal_events/signal_content tables.
 */
export function createSignalEngineClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: (fetchUrl, options = {}) => {
        return fetch(fetchUrl, { ...options, cache: 'no-store' });
      },
    },
  });
}
