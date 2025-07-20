import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Get latest statistics directly (avoid circular dependency)
    const { data: detentionStats } = await supabase
      .from('youth_detention_statistics')
      .select('*')
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single()
    
    const { data: budgetData } = await supabase
      .from('budget_allocations')
      .select('*')
      .order('fiscal_year', { ascending: false })
      .limit(1)
      .single()
    
    // Transform to match the expected format
    const responseData = {
      timestamp: new Date().toISOString(),
      spending: {
        total_budget: budgetData?.total_amount || 489100000,
        detention_total: budgetData?.detention_operations || 443000000,
        community_total: budgetData?.community_programs || 37100000,
        detention_percentage: budgetData?.detention_percentage || 90.6,
        community_percentage: budgetData?.community_percentage || 7.6,
        detention_daily_cost: budgetData?.cost_per_detention_day || 857,
        community_daily_cost: 41,
        cost_ratio: Math.round((budgetData?.cost_per_detention_day || 857) / 41)
      },
      indigenous: {
        detention_percentage: detentionStats?.indigenous_percentage || 73.4,
        population_percentage: 4.6,
        overrepresentation_factor: Math.round((detentionStats?.indigenous_percentage || 73.4) / 4.6 * 10) / 10,
        min_factor: 15,
        max_factor: 20
      },
      trends: {
        dates: [],
        detention_percentages: [],
        community_percentages: []
      }
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}