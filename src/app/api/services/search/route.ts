import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-lite'
import {
  isMissingServicesCompleteError,
  normalizeServiceCatalogRow,
  serviceMatchesCatalogFilters,
} from '@/lib/services/service-catalog'

export async function GET(request: Request) {
  const supabase = createServiceClient()
  
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const location = searchParams.get('location') || ''
  const limit = searchParams.get('limit') || '24'
  
  let supabaseQuery = supabase
    .from('services_complete')
    .select('*')
    .eq('active', true)
    .limit(parseInt(limit))
  
  if (query) {
    supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
  }
  
  // For location-based search, you'd need to implement geospatial queries
  // This is a simplified version
  
  const { data, error } = await supabaseQuery
  
  if (!error) {
    return NextResponse.json({
      success: true,
      data: (data || []).map((row) => normalizeServiceCatalogRow(row as Record<string, unknown>)),
      source: 'services_complete',
    })
  }

  if (!isMissingServicesCompleteError(error)) {
    return NextResponse.json({ success: false, error: error.message })
  }

  const { data: fallbackRows, error: fallbackError } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('updated_at', { ascending: false, nullsFirst: false })
    .limit(500)

  if (fallbackError) {
    return NextResponse.json({ success: false, error: fallbackError.message })
  }

  const normalized = (fallbackRows || [])
    .map((row) => normalizeServiceCatalogRow(row as Record<string, unknown>))
    .filter((service) =>
      serviceMatchesCatalogFilters(service, {
        q: query,
        state: location,
      })
    )
    .slice(0, parseInt(limit))

  return NextResponse.json({
    success: true,
    data: normalized,
    source: 'services',
  })
}
