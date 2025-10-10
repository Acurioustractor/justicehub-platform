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
  const limit = parseInt(searchParams.get('limit') || '12')
  const page = parseInt(searchParams.get('page') || '1')
  const category = searchParams.get('category')
  const state = searchParams.get('state')
  const youthSpecific = searchParams.get('youth_specific')
  const indigenousSpecific = searchParams.get('indigenous_specific')

  const from = (page - 1) * limit
  const to = from + limit - 1

  // Use the services_complete view for frontend compatibility
  let query = supabase
    .from('services_complete')
    .select('*', { count: 'exact' })
    .eq('active', true)
    .range(from, to)
    .order('created_at', { ascending: false })

  // Apply filters
  if (category) {
    query = query.contains('categories', [category])
  }

  if (state) {
    query = query.eq('location.state', state)
  }

  if (youthSpecific === 'true') {
    query = query.eq('youth_specific', true)
  }

  if (indigenousSpecific === 'true') {
    query = query.eq('indigenous_specific', true)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('Services API error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    data,
    pagination: {
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  })
}
