/**
 * @deprecated Use the modular clients instead:
 * - Client Components: `import { createClient } from '@/lib/supabase/client'`
 * - Server Components: `import { createClient } from '@/lib/supabase/server'`
 *
 * This legacy export is kept for backwards compatibility but will be removed
 * in a future version.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn(
        "[Supabase] Missing credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
      );
      return createClient<Database>('https://placeholder.supabase.co', 'placeholder-key');
    }

    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
}

/**
 * @deprecated Use `createClient` from `@/lib/supabase/client` or `@/lib/supabase/server` instead
 */
export const supabase = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(target, prop) {
    const client = getSupabaseClient();
    const value = client[prop as keyof typeof client];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});