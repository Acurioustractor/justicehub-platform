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

  try {
    // Get total services
    const { count: totalServices } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Get total organizations
    const { count: totalOrganizations } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Get total locations
    const { count: totalLocations } = await supabase
      .from('service_locations')
      .select('*', { count: 'exact', head: true })

    // Get total contacts
    const { count: totalContacts } = await supabase
      .from('service_contacts')
      .select('*', { count: 'exact', head: true })

    // Get services by region
    const { data: regionData } = await supabase
      .from('services')
      .select('location_city')
      .eq('is_active', true)

    const byRegion: Record<string, number> = {}
    regionData?.forEach((service) => {
      if (service.location_city) {
        byRegion[service.location_city] = (byRegion[service.location_city] || 0) + 1
      }
    })

    // Get services by category
    const { data: categoryData } = await supabase
      .from('services')
      .select('categories')
      .eq('is_active', true)

    const byCategory: Record<string, number> = {}
    categoryData?.forEach((service) => {
      if (service.categories && Array.isArray(service.categories)) {
        service.categories.forEach((category: string) => {
          byCategory[category] = (byCategory[category] || 0) + 1
        })
      }
    })

    // Get youth-specific and indigenous-specific counts
    const { count: youthSpecificCount } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('youth_specific', true)

    const { count: indigenousSpecificCount } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('indigenous_specific', true)

    return NextResponse.json({
      success: true,
      stats: {
        total_services: totalServices || 0,
        total_organizations: totalOrganizations || 0,
        total_locations: totalLocations || 0,
        total_contacts: totalContacts || 0,
        youth_specific_services: youthSpecificCount || 0,
        indigenous_specific_services: indigenousSpecificCount || 0,
        by_region: byRegion,
        by_category: byCategory,
      }
    })
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch statistics'
    }, { status: 500 })
  }
}
