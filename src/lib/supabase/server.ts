import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

/**
 * Create a Supabase client for Server Components, Server Actions, and Route Handlers
 *
 * This is the recommended way to access Supabase from the server in Next.js 14+.
 * It handles cookie-based authentication automatically.
 *
 * @returns Supabase client configured for server-side usage
 *
 * @example
 * ```tsx
 * // In a Server Component
 * import { createClient } from '@/lib/supabase/server'
 *
 * export default async function Page() {
 *   const supabase = await createClient()
 *   const { data } = await supabase.from('posts').select('*')
 *   return <div>{data?.length} posts</div>
 * }
 * ```
 *
 * @example
 * ```tsx
 * // In an API Route
 * import { createClient } from '@/lib/supabase/server'
 * import { NextResponse } from 'next/server'
 *
 * export async function GET() {
 *   const supabase = await createClient()
 *   const { data } = await supabase.from('posts').select('*')
 *   return NextResponse.json(data)
 * }
 * ```
 */
export async function createClient() {
  const cookieStore = await cookies()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
    )
  }

  return createServerClient<Database>(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if middleware refreshes user sessions.
          }
        },
      },
    }
  )
}

/**
 * Create a Supabase admin client with service role key
 *
 * WARNING: This bypasses Row Level Security. Only use for admin operations
 * that require elevated privileges (e.g., user management, migrations).
 *
 * @returns Supabase admin client with full database access
 */
export async function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'Missing Supabase admin credentials. Set SUPABASE_SERVICE_ROLE_KEY in .env.local'
    )
  }

  // Admin client doesn't need cookies since it uses service role
  return createServerClient<Database>(
    url,
    serviceKey,
    {
      cookies: {
        getAll() { return [] },
        setAll() {},
      },
    }
  )
}
