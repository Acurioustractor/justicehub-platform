'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

/**
 * Create a Supabase client for Client Components
 *
 * This client is designed for use in 'use client' components and handles:
 * - Browser-side cookie management for authentication
 * - SSR-compatible initialization
 *
 * @returns Supabase client configured for browser usage
 *
 * @example
 * ```tsx
 * 'use client'
 * import { createClient } from '@/lib/supabase/client'
 *
 * export function MyComponent() {
 *   const supabase = createClient()
 *   // Use supabase client...
 * }
 * ```
 */
export function createClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

  // During build time, return a placeholder if env vars aren't available
  if (!url || !key) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Supabase] Credentials not available, using placeholder client');
    }
    return createBrowserClient<Database>(
      'https://placeholder.supabase.co',
      'placeholder-key',
      {
        cookies: {
          getAll() { return [] },
          setAll() {},
        },
      }
    );
  }

  return createBrowserClient<Database>(
    url,
    key,
    {
      cookies: {
        getAll() {
          if (typeof document === 'undefined') {
            return []
          }
          return document.cookie.split('; ')
            .filter(Boolean)
            .map(c => {
              const [name, ...v] = c.split('=')
              return { name, value: v.join('=') }
            })
        },
        setAll(cookiesToSet) {
          if (typeof document === 'undefined') {
            return
          }
          cookiesToSet.forEach(({ name, value, options }) => {
            let cookie = `${name}=${value}; path=${options?.path || '/'}`
            if (options?.maxAge) cookie += `; max-age=${options.maxAge}`
            if (options?.domain) cookie += `; domain=${options.domain}`
            if (options?.sameSite) cookie += `; SameSite=${options.sameSite}`
            if (options?.secure) cookie += '; Secure'
            document.cookie = cookie
          })
        },
      },
    }
  )
}
