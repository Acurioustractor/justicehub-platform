'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

export type LooseBrowserSupabaseClient = SupabaseClient<any, 'public', any>

/**
 * Lightweight browser client for residual admin/navigation surfaces that do not
 * need the full generated Database type graph during compilation.
 */
export function createClient(): LooseBrowserSupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''

  if (!url || !key) {
    return createBrowserClient<any>('https://placeholder.supabase.co', 'placeholder-key', {
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
    })
  }

  return createBrowserClient<any>(url, key, {
    cookies: {
      getAll() {
        if (typeof document === 'undefined') {
          return []
        }
        return document.cookie
          .split('; ')
          .filter(Boolean)
          .map((cookie) => {
            const [name, ...valueParts] = cookie.split('=')
            return { name, value: valueParts.join('=') }
          })
      },
      setAll(cookiesToSet) {
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

          document.cookie = cookie
        })
      },
    },
  })
}
