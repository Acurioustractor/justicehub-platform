import { createServiceClient } from '@/lib/supabase/service-lite'
import {
  normalizeServiceCatalogRow,
  serviceMatchesCatalogFilters,
} from '@/lib/services/service-catalog'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()

    const { searchParams } = new URL(request.url)
    const limit = Math.max(1, Math.min(parseInt(searchParams.get('limit') || '12'), 1000))
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const category = searchParams.get('category')
    const state = searchParams.get('state')
    const youthSpecific = searchParams.get('youth_specific')
    const indigenousSpecific = searchParams.get('indigenous_specific')
    const q = searchParams.get('q')

    const from = (page - 1) * limit
    const to = from + limit - 1

    const fallbackLimit = Math.min(Math.max(limit * page * 2, limit), 1000)
    const { data: fallbackRows, error: fallbackError, count: fallbackCount } = await supabase
      .from('services')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(fallbackLimit)

    if (fallbackError) {
      // Same as above — return empty success so the consumer page still renders.
      console.error('Services fallback API error (services):', fallbackError)
      return NextResponse.json({
        success: true,
        data: [],
        source: 'services',
        error: fallbackError.message,
        pagination: { total: 0, page, limit, totalPages: 0 },
      })
    }

    const filtered = (fallbackRows || [])
      .map((row) => normalizeServiceCatalogRow(row as Record<string, unknown>))
      .filter((service) =>
        serviceMatchesCatalogFilters(service, {
          q,
          category,
          state,
          youthSpecific,
          indigenousSpecific,
        })
      )

    const paged = filtered.slice(from, to + 1)
    const total = category || state || youthSpecific || indigenousSpecific || q
      ? filtered.length
      : fallbackCount || filtered.length

    return NextResponse.json({
      success: true,
      data: paged,
      source: 'services',
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Services API unexpected error:', error);
    return NextResponse.json({
      success: true,
      data: [],
      source: 'error-fallback',
      error: error instanceof Error ? error.message : 'Internal server error',
      pagination: { total: 0, page: 1, limit: 0, totalPages: 0 },
    });
  }
}
