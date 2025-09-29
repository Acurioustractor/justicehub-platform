'use client'

import { createBrowserClient } from '@supabase/ssr'

/**
 * Create a Supabase client for Client Components
 * This client is used in 'use client' components for interactive features
 *
 * @returns Supabase client configured for browser usage
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
