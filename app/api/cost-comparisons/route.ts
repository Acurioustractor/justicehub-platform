import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    const limit = parseInt(searchParams.get('limit') || '10')
    
    const { data, error } = await supabase
      .from('cost_comparisons')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('Error fetching cost comparisons:', error)
      return NextResponse.json({ error: 'Failed to fetch cost comparisons' }, { status: 500 })
    }
    
    // Get the latest comparison for current values
    const latest = data?.[0]
    
    // Calculate average ratios
    const averages = data?.reduce((acc, comparison) => {
      acc.detentionCost += comparison.detention_daily_cost
      acc.communityCost += comparison.community_daily_cost
      acc.costRatio += comparison.cost_ratio || 0
      acc.detentionPercentage += comparison.detention_spending_percentage || 0
      acc.communityPercentage += comparison.community_spending_percentage || 0
      acc.count += 1
      return acc
    }, {
      detentionCost: 0,
      communityCost: 0,
      costRatio: 0,
      detentionPercentage: 0,
      communityPercentage: 0,
      count: 0
    }) || {
      detentionCost: 0,
      communityCost: 0,
      costRatio: 0,
      detentionPercentage: 0,
      communityPercentage: 0,
      count: 0
    }
    
    const avgData = averages.count > 0 ? {
      detentionDailyCost: (averages.detentionCost / averages.count).toFixed(2),
      communityDailyCost: (averages.communityCost / averages.count).toFixed(2),
      costRatio: (averages.costRatio / averages.count).toFixed(1),
      detentionSpendingPercentage: (averages.detentionPercentage / averages.count).toFixed(1),
      communitySpendingPercentage: (averages.communityPercentage / averages.count).toFixed(1)
    } : null
    
    return NextResponse.json({
      comparisons: data,
      latest,
      averages: avgData,
      metadata: {
        count: data?.length || 0,
        dateRange: {
          start: data?.[data.length - 1]?.date,
          end: data?.[0]?.date
        }
      }
    })
  } catch (error) {
    console.error('Error in cost comparisons API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}