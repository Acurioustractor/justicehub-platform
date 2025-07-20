import { createClient } from '@supabase/supabase-js'
import { type Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// For server components
export const createServerSupabaseClient = async () => {
  const { cookies } = await import('next/headers')
  const cookieStore = cookies()
  
  return createClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}