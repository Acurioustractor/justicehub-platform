import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getDb = () => createServiceClient() as any;

/**
 * GET /api/justice-matrix/cases/[id]
 * Get a single case by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getDb()
    const { id } = await params

    const { data, error } = await supabase
      .from('justice_matrix_cases')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: 'Case not found'
        }, { status: 404 })
      }
      console.error('Justice Matrix Cases API error:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data
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
 * PUT /api/justice-matrix/cases/[id]
 * Update a case
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getDb()
    const { id } = await params
    const body = await request.json()

    const { data, error } = await supabase
      .from('justice_matrix_cases')
      .update({
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
        categories: body.categories,
        outcome: body.outcome,
        precedent_strength: body.precedent_strength,
        case_type: body.case_type,
        featured: body.featured,
        featured_at: body.featured ? new Date().toISOString() : null,
        verified: body.verified,
        verified_by: body.verified_by,
        verified_at: body.verified ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: 'Case not found'
        }, { status: 404 })
      }
      console.error('Justice Matrix Cases API error:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data
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
 * DELETE /api/justice-matrix/cases/[id]
 * Delete a case
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getDb()
    const { id } = await params

    const { error } = await supabase
      .from('justice_matrix_cases')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Justice Matrix Cases API error:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Case deleted successfully'
    })
  } catch (error) {
    console.error('Justice Matrix Cases API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
