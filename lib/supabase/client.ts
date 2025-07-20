import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Singleton instance for client-side
let clientInstance: ReturnType<typeof createSupabaseClient<Database>> | null = null

// Validation
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required environment variables for Supabase client')
}

export function createClient() {
  // Legacy function for backward compatibility
  return getSupabaseClient()
}

export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not configured')
  }

  if (!clientInstance && typeof window !== 'undefined') {
    // Only create singleton on client-side
    clientInstance = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-application-name': 'qld-youth-justice-tracker',
        },
      },
    })
  } else if (typeof window === 'undefined') {
    // Server-side: always create new instance
    return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: {
        schema: 'public',
      },
    })
  }

  return clientInstance!
}