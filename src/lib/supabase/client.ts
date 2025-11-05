'use client'

import { createBrowserClient } from '@supabase/ssr'

/**
 * Create a Supabase client for Client Components
 * This client is used in 'use client' components for interactive features
 *
 * @returns Supabase client configured for browser usage
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

  console.log('🔑 Creating Supabase client:', {
    hasUrl: !!url,
    hasKey: !!key,
    urlPreview: url ? `${url.substring(0, 30)}...` : 'missing',
    keyPreview: key ? `${key.substring(0, 20)}...` : 'missing'
  });

  // During build time, return a placeholder if env vars aren't available
  if (!url || !key) {
    console.warn('Supabase credentials not available, using placeholder client');
    return createBrowserClient(
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

  return createBrowserClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          // Only access document in browser environment
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
          // Only access document in browser environment
          if (typeof document === 'undefined') {
            return
          }
          cookiesToSet.forEach(({ name, value, options }) => {
            let cookie = `${name}=${value}; path=${options?.path || '/'}`

            if (options?.maxAge) {
              cookie += `; max-age=${options.maxAge}`
            }
            if (options?.domain) {
              cookie += `; domain=${options.domain}`
            }
            if (options?.sameSite) {
              cookie += `; SameSite=${options.sameSite}`
            }
            if (options?.secure) {
              cookie += '; Secure'
            }

            console.log('🍪 Setting cookie:', name)
            document.cookie = cookie
          })
        },
      },
    }
  )
}
