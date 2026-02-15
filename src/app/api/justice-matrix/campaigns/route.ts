import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getDb = () => createServiceClient() as any;

/**
 * GET /api/justice-matrix/campaigns
 * List all campaigns with filtering and pagination
 */
export async function GET(request: Request) {
  try {
    const supabase = getDb()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const country = searchParams.get('country')
    const category = searchParams.get('category')
    const ongoing = searchParams.get('ongoing')
    const featured = searchParams.get('featured')
    const search = searchParams.get('search')

    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('justice_matrix_campaigns')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('start_year', { ascending: false })

    // Apply filters
    if (country) {
      query = query.eq('country_code', country)
    }

    if (category) {
      query = query.contains('categories', [category])
    }

    if (ongoing === 'true') {
      query = query.eq('is_ongoing', true)
    } else if (ongoing === 'false') {
      query = query.eq('is_ongoing', false)
    }

    if (featured === 'true') {
      query = query.eq('featured', true)
    }

    if (search) {
      query = query.or(`campaign_name.ilike.%${search}%,lead_organizations.ilike.%${search}%,goals.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Justice Matrix Campaigns API error:', error)
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
    console.error('Justice Matrix Campaigns API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * POST /api/justice-matrix/campaigns
 * Create a new campaign
 */
export async function POST(request: Request) {
  try {
    const supabase = getDb()
    const body = await request.json()

    // Validate required fields
    const required = ['country_region', 'campaign_name', 'lead_organizations', 'goals']
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({
          success: false,
          error: `Missing required field: ${field}`
        }, { status: 400 })
      }
    }

    const { data, error } = await supabase
      .from('justice_matrix_campaigns')
      .insert({
        country_region: body.country_region,
        campaign_name: body.campaign_name,
        lead_organizations: body.lead_organizations,
        goals: body.goals,
        notable_tactics: body.notable_tactics,
        outcome_status: body.outcome_status,
        campaign_link: body.campaign_link,
        start_year: body.start_year,
        end_year: body.end_year,
        is_ongoing: body.is_ongoing ?? true,
        campaign_type: body.campaign_type,
        country_code: body.country_code,
        lat: body.lat,
        lng: body.lng,
        categories: body.categories || [],
        source: body.source || 'manual',
        contributor_org: body.contributor_org,
        verified: body.verified || false,
      })
      .select()
      .single()

    if (error) {
      console.error('Justice Matrix Campaigns API error:', error)
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
    console.error('Justice Matrix Campaigns API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
