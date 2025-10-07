import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
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
  
  // Get total services count
  const { count: totalServices, error: servicesError } = await supabase
    .from('services')
    .select('*', { count: 'exact' })
    .eq('active', true)
  
  if (servicesError) {
    return NextResponse.json({ success: false, error: servicesError.message })
  }
  
  // Get organizations count
  const { count: totalOrganizations, error: orgsError } = await supabase
    .from('organizations')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
  
  if (orgsError) {
    return NextResponse.json({ success: false, error: orgsError.message })
  }
  
  // Simple stats object
  const stats = {
    total_services: totalServices || 0,
    total_organizations: totalOrganizations || 0,
    total_locations: 0, // Implement based on your data
    total_contacts: 0, // Implement based on your data
    by_region: {}, // Implement based on your data
    by_category: {} // Implement based on your data
  }
  
  return NextResponse.json({
    success: true,
    stats
  })
}