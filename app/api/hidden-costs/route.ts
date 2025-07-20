import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    const category = searchParams.get('category')
    const stakeholderType = searchParams.get('stakeholder_type')
    
    let query = supabase
      .from('hidden_costs')
      .select('*')
      .order('annual_estimate', { ascending: false })
    
    if (category) {
      query = query.eq('cost_category', category)
    }
    
    if (stakeholderType) {
      query = query.eq('stakeholder_type', stakeholderType)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching hidden costs:', error)
      return NextResponse.json({ error: 'Failed to fetch hidden costs' }, { status: 500 })
    }
    
    // Group costs by category and calculate totals
    const costsByCategory = data?.reduce((acc, cost) => {
      const cat = cost.cost_category
      if (!acc[cat]) {
        acc[cat] = {
          category: cat,
          items: [],
          totalAnnualEstimate: 0
        }
      }
      
      acc[cat].items.push(cost)
      acc[cat].totalAnnualEstimate += cost.annual_estimate || 0
      
      return acc
    }, {} as Record<string, any>) || {}
    
    const totalAnnualCost = Object.values(costsByCategory).reduce(
      (sum, cat: any) => sum + cat.totalAnnualEstimate, 
      0
    )
    
    // Calculate family cost calculations summary
    const { data: familyCosts, error: familyError } = await supabase
      .from('family_cost_calculations')
      .select('*')
      .order('calculation_date', { ascending: false })
      .limit(10)
    
    if (familyError) {
      console.error('Error fetching family costs:', familyError)
    }
    
    const avgFamilyCost = familyCosts?.reduce((acc, calc) => {
      acc.monthlyTotal += calc.total_monthly_cost || 0
      acc.annualTotal += calc.total_annual_cost || 0
      acc.count += 1
      return acc
    }, { monthlyTotal: 0, annualTotal: 0, count: 0 }) || { monthlyTotal: 0, annualTotal: 0, count: 0 }
    
    const averageFamilyCost = avgFamilyCost.count > 0 ? {
      monthly: (avgFamilyCost.monthlyTotal / avgFamilyCost.count).toFixed(2),
      annual: (avgFamilyCost.annualTotal / avgFamilyCost.count).toFixed(2)
    } : null
    
    return NextResponse.json({
      hiddenCosts: data,
      costsByCategory: Object.values(costsByCategory),
      totalAnnualCost,
      familyCosts: {
        calculations: familyCosts,
        averages: averageFamilyCost
      },
      metadata: {
        categories: Object.keys(costsByCategory),
        stakeholderTypes: Array.from(new Set(data?.map(c => c.stakeholder_type).filter(Boolean) || []))
      }
    })
  } catch (error) {
    console.error('Error in hidden costs API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}