import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getDb = () => createServiceClient() as any;

/**
 * GET /api/justice-matrix/discovered/[id]
 * Get a single discovered item
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getDb()
    const { id } = await params

    const { data, error } = await supabase
      .from('justice_matrix_discovered')
      .select(`
        *,
        source:justice_matrix_sources(name, source_type, region)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: 'Discovered item not found'
        }, { status: 404 })
      }
      console.error('Justice Matrix Discovered API error:', error)
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
    console.error('Justice Matrix Discovered API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * PUT /api/justice-matrix/discovered/[id]
 * Update a discovered item (review action)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getDb()
    const { id } = await params
    const body = await request.json()

    // Handle different review actions
    if (body.action === 'approve') {
      // Approve: create the case/campaign and update status
      const discoveryResult = await supabase
        .from('justice_matrix_discovered')
        .select('*')
        .eq('id', id)
        .single()

      if (discoveryResult.error) {
        return NextResponse.json({
          success: false,
          error: 'Discovered item not found'
        }, { status: 404 })
      }

      const discovery = discoveryResult.data
      let approvedId = null

      if (discovery.item_type === 'case') {
        // Create case from discovery
        const caseData = {
          jurisdiction: body.jurisdiction || discovery.extracted_jurisdiction,
          case_citation: body.case_citation || discovery.extracted_title,
          year: body.year || discovery.extracted_year,
          court: body.court,
          strategic_issue: body.strategic_issue || discovery.extracted_summary,
          key_holding: body.key_holding,
          authoritative_link: discovery.source_url,
          region: body.region,
          country_code: body.country_code || discovery.extracted_country_code,
          lat: body.lat || discovery.extracted_lat,
          lng: body.lng || discovery.extracted_lng,
          categories: body.categories || discovery.extracted_categories,
          outcome: body.outcome,
          precedent_strength: body.precedent_strength,
          source: 'ai_scraped',
          verified: true,
          verified_by: body.reviewed_by,
          verified_at: new Date().toISOString(),
        }

        const caseResult = await supabase
          .from('justice_matrix_cases')
          .insert(caseData)
          .select()
          .single()

        if (caseResult.error) {
          return NextResponse.json({
            success: false,
            error: `Failed to create case: ${caseResult.error.message}`
          }, { status: 500 })
        }

        approvedId = caseResult.data.id

        // Update discovery with approved_case_id
        await supabase
          .from('justice_matrix_discovered')
          .update({
            status: 'approved',
            approved_case_id: approvedId,
            reviewed_by: body.reviewed_by,
            reviewed_at: new Date().toISOString(),
            review_notes: body.review_notes,
          })
          .eq('id', id)

      } else if (discovery.item_type === 'campaign') {
        // Create campaign from discovery
        const campaignData = {
          country_region: body.country_region || discovery.extracted_jurisdiction,
          campaign_name: body.campaign_name || discovery.extracted_title,
          lead_organizations: body.lead_organizations,
          goals: body.goals || discovery.extracted_summary,
          notable_tactics: body.notable_tactics,
          outcome_status: body.outcome_status,
          campaign_link: discovery.source_url,
          is_ongoing: body.is_ongoing ?? true,
          start_year: body.start_year || discovery.extracted_year,
          country_code: body.country_code || discovery.extracted_country_code,
          lat: body.lat || discovery.extracted_lat,
          lng: body.lng || discovery.extracted_lng,
          categories: body.categories || discovery.extracted_categories,
          source: 'ai_scraped',
          verified: true,
          verified_by: body.reviewed_by,
          verified_at: new Date().toISOString(),
        }

        const campaignResult = await supabase
          .from('justice_matrix_campaigns')
          .insert(campaignData)
          .select()
          .single()

        if (campaignResult.error) {
          return NextResponse.json({
            success: false,
            error: `Failed to create campaign: ${campaignResult.error.message}`
          }, { status: 500 })
        }

        approvedId = campaignResult.data.id

        // Update discovery with approved_campaign_id
        await supabase
          .from('justice_matrix_discovered')
          .update({
            status: 'approved',
            approved_campaign_id: approvedId,
            reviewed_by: body.reviewed_by,
            reviewed_at: new Date().toISOString(),
            review_notes: body.review_notes,
          })
          .eq('id', id)
      }

      return NextResponse.json({
        success: true,
        message: `${discovery.item_type} approved and created`,
        approved_id: approvedId
      })

    } else if (body.action === 'reject') {
      // Reject: just update status
      const { data, error } = await supabase
        .from('justice_matrix_discovered')
        .update({
          status: 'rejected',
          reviewed_by: body.reviewed_by,
          reviewed_at: new Date().toISOString(),
          review_notes: body.review_notes,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Discovery rejected',
        data
      })

    } else if (body.action === 'duplicate') {
      // Mark as duplicate
      const { data, error } = await supabase
        .from('justice_matrix_discovered')
        .update({
          status: 'duplicate',
          potential_duplicate_id: body.duplicate_of_id,
          reviewed_by: body.reviewed_by,
          reviewed_at: new Date().toISOString(),
          review_notes: body.review_notes,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Marked as duplicate',
        data
      })

    } else {
      // Just update extracted fields
      const { data, error } = await supabase
        .from('justice_matrix_discovered')
        .update({
          extracted_title: body.extracted_title,
          extracted_jurisdiction: body.extracted_jurisdiction,
          extracted_year: body.extracted_year,
          extracted_categories: body.extracted_categories,
          extracted_summary: body.extracted_summary,
          extracted_lat: body.extracted_lat,
          extracted_lng: body.extracted_lng,
          extracted_country_code: body.extracted_country_code,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data
      })
    }
  } catch (error) {
    console.error('Justice Matrix Discovered API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/justice-matrix/discovered/[id]
 * Delete a discovered item
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getDb()
    const { id } = await params

    const { error } = await supabase
      .from('justice_matrix_discovered')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Justice Matrix Discovered API error:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Discovered item deleted successfully'
    })
  } catch (error) {
    console.error('Justice Matrix Discovered API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
