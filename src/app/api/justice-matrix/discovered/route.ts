import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getDb = () => createServiceClient() as any;

/**
 * GET /api/justice-matrix/discovered
 * List discovered items pending review
 */
export async function GET(request: Request) {
  try {
    const supabase = getDb()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')
    const status = searchParams.get('status') || 'pending'
    const itemType = searchParams.get('item_type')
    const sourceId = searchParams.get('source_id')

    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('justice_matrix_discovered')
      .select(`
        *,
        source:justice_matrix_sources(name, source_type, region)
      `, { count: 'exact' })
      .range(from, to)
      .order('discovered_at', { ascending: false })

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (itemType) {
      query = query.eq('item_type', itemType)
    }

    if (sourceId) {
      query = query.eq('source_id', sourceId)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Justice Matrix Discovered API error:', error)
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
    console.error('Justice Matrix Discovered API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * POST /api/justice-matrix/discovered
 * Add a new discovery to the queue
 */
export async function POST(request: Request) {
  try {
    const supabase = getDb()
    const body = await request.json()

    // Validate required fields
    if (!body.source_url || !body.item_type || !body.raw_data) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: source_url, item_type, raw_data'
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('justice_matrix_discovered')
      .insert({
        source_id: body.source_id,
        source_url: body.source_url,
        item_type: body.item_type,
        raw_data: body.raw_data,
        extracted_title: body.extracted_title,
        extracted_jurisdiction: body.extracted_jurisdiction,
        extracted_year: body.extracted_year,
        extracted_categories: body.extracted_categories,
        extracted_summary: body.extracted_summary,
        extracted_lat: body.extracted_lat,
        extracted_lng: body.extracted_lng,
        extracted_country_code: body.extracted_country_code,
        extraction_confidence: body.extraction_confidence,
        similarity_score: body.similarity_score,
        potential_duplicate_id: body.potential_duplicate_id,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Justice Matrix Discovered API error:', error)
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
    console.error('Justice Matrix Discovered API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
