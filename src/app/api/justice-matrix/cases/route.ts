import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getDb = () => createServiceClient() as any;

/**
 * GET /api/justice-matrix/cases
 * List all cases with filtering and pagination
 */
export async function GET(request: Request) {
  try {
    const supabase = getDb()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const region = searchParams.get('region')
    const outcome = searchParams.get('outcome')
    const category = searchParams.get('category')
    const country = searchParams.get('country')
    const featured = searchParams.get('featured')
    const search = searchParams.get('search')

    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('justice_matrix_cases')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('year', { ascending: false })

    // Apply filters
    if (region && region !== 'all') {
      query = query.eq('region', region)
    }

    if (outcome) {
      query = query.eq('outcome', outcome)
    }

    if (category) {
      query = query.contains('categories', [category])
    }

    if (country) {
      query = query.eq('country_code', country)
    }

    if (featured === 'true') {
      query = query.eq('featured', true)
    }

    if (search) {
      query = query.or(`case_citation.ilike.%${search}%,jurisdiction.ilike.%${search}%,strategic_issue.ilike.%${search}%,key_holding.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Justice Matrix Cases API error:', error)
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
  } catch (error) {
    console.error('Justice Matrix Cases API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * POST /api/justice-matrix/cases
 * Create a new case
 */
export async function POST(request: Request) {
  try {
    const supabase = getDb()
    const body = await request.json()

    // Validate required fields
    const required = ['jurisdiction', 'case_citation', 'year', 'court', 'strategic_issue', 'key_holding']
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({
          success: false,
          error: `Missing required field: ${field}`
        }, { status: 400 })
      }
    }

    const { data, error } = await supabase
      .from('justice_matrix_cases')
      .insert({
        jurisdiction: body.jurisdiction,
        case_citation: body.case_citation,
        year: body.year,
        court: body.court,
        strategic_issue: body.strategic_issue,
        key_holding: body.key_holding,
        authoritative_link: body.authoritative_link,
        region: body.region,
        country_code: body.country_code,
        lat: body.lat,
        lng: body.lng,
        categories: body.categories || [],
        outcome: body.outcome,
        precedent_strength: body.precedent_strength,
        case_type: body.case_type,
        source: body.source || 'manual',
        contributor_org: body.contributor_org,
        verified: body.verified || false,
      })
      .select()
      .single()

    if (error) {
      console.error('Justice Matrix Cases API error:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data
    }, { status: 201 })
  } catch (error) {
    console.error('Justice Matrix Cases API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
