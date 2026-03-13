import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

export type LooseSupabaseClient = SupabaseClient<any, 'public', any>;

/**
 * Lightweight service-role client for residual routes that do not benefit from
 * pulling the full generated Database type graph into compilation.
 */
export function createServiceClient(): LooseSupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase service role configuration');
  }

  return createSupabaseClient<any>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: (url, options = {}) => fetch(url, { ...options, cache: 'no-store' }),
    },
  });
}
