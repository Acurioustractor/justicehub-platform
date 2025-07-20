import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient()

    // Fetch latest cost comparison
    const { data: costComparison } = await supabase
      .from('cost_comparisons')
      .select('*')
      .order('date', { ascending: false })
      .limit(1)
      .single()

    // Fetch budget allocations
    const { data: budgetAllocations } = await supabase
      .from('budget_allocations')
      .select('*')
      .eq('fiscal_year', '2024-25')

    // Calculate spending totals
    const detentionTotal = budgetAllocations
      ?.filter(a => a.category === 'detention')
      .reduce((sum, a) => sum + parseFloat(a.amount), 0) || 0

    const communityTotal = budgetAllocations
      ?.filter(a => a.category === 'community')
      .reduce((sum, a) => sum + parseFloat(a.amount), 0) || 0

    const totalBudget = detentionTotal + communityTotal

    const detentionPercentage = totalBudget > 0 ? (detentionTotal / totalBudget) * 100 : 0
    const communityPercentage = totalBudget > 0 ? (communityTotal / totalBudget) * 100 : 0

    const responseData = {
      total_budget: totalBudget,
      detention_total: detentionTotal,
      community_total: communityTotal,
      detention_percentage: detentionPercentage,
      community_percentage: communityPercentage,
      detention_daily_cost: costComparison?.detention_daily_cost || 0,
      community_daily_cost: costComparison?.community_daily_cost || 0,
      cost_ratio: costComparison?.cost_ratio || 0,
      allocations: budgetAllocations || []
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error fetching spending data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch spending data' },
      { status: 500 }
    )
  }
}
