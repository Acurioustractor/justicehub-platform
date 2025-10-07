import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
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
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
  
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const location = searchParams.get('location') || ''
  const limit = searchParams.get('limit') || '24'
  
  let supabaseQuery = supabase
    .from('services')
    .select(`
      *,
      organization:organizations(name, website_url)
    `)
    .eq('active', true)
    .limit(parseInt(limit))
  
  if (query) {
    supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
  }
  
  // For location-based search, you'd need to implement geospatial queries
  // This is a simplified version
  
  const { data, error } = await supabaseQuery
  
  if (error) {
    return NextResponse.json({ success: false, error: error.message })
  }
  
  return NextResponse.json({
    success: true,
    data
  })
}