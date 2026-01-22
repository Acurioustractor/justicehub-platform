import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

// Helper to bypass type issues with new tables
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getDb = () => createServiceClient() as any;

/**
 * GET /api/justice-matrix/campaigns/[id]
 * Get a single campaign by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getDb()
    const { id } = await params

    const { data, error } = await supabase
      .from('justice_matrix_campaigns')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: 'Campaign not found'
        }, { status: 404 })
      }
      console.error('Justice Matrix Campaigns API error:', error)
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
    console.error('Justice Matrix Campaigns API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * PUT /api/justice-matrix/campaigns/[id]
 * Update a campaign
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
      .from('justice_matrix_campaigns')
      .update({
        country_region: body.country_region,
        campaign_name: body.campaign_name,
        lead_organizations: body.lead_organizations,
        goals: body.goals,
        notable_tactics: body.notable_tactics,
        outcome_status: body.outcome_status,
        campaign_link: body.campaign_link,
        start_year: body.start_year,
        end_year: body.end_year,
        is_ongoing: body.is_ongoing,
        campaign_type: body.campaign_type,
        country_code: body.country_code,
        lat: body.lat,
        lng: body.lng,
        categories: body.categories,
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
          error: 'Campaign not found'
        }, { status: 404 })
      }
      console.error('Justice Matrix Campaigns API error:', error)
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
    console.error('Justice Matrix Campaigns API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/justice-matrix/campaigns/[id]
 * Delete a campaign
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getDb()
    const { id } = await params

    const { error } = await supabase
      .from('justice_matrix_campaigns')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Justice Matrix Campaigns API error:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Campaign deleted successfully'
    })
  } catch (error) {
    console.error('Justice Matrix Campaigns API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
