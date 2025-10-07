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
  const limit = searchParams.get('limit') || '12'
  const page = searchParams.get('page') || '1'
  
  const from = (parseInt(page) - 1) * parseInt(limit)
  const to = from + parseInt(limit) - 1
  
  const { data, error, count } = await supabase
    .from('services')
    .select(`
      *,
      organization:organizations(name, website_url)
    `, { count: 'exact' })
    .eq('active', true)
    .range(from, to)
  
  if (error) {
    return NextResponse.json({ success: false, error: error.message })
  }
  
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit)
    }
  })
}