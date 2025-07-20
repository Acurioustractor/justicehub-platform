import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    const fiscalYear = searchParams.get('fiscal_year')
    const category = searchParams.get('category')
    
    let query = supabase
      .from('budget_allocations')
      .select('*')
      .order('fiscal_year', { ascending: false })
      .order('amount', { ascending: false })
    
    if (fiscalYear) {
      query = query.eq('fiscal_year', fiscalYear)
    }
    
    if (category) {
      query = query.eq('category', category)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching budget allocations:', error)
      return NextResponse.json({ error: 'Failed to fetch budget allocations' }, { status: 500 })
    }
    
    // Calculate totals
    const totals = data?.reduce((acc, allocation) => {
      const cat = allocation.category || 'other'
      acc[cat] = (acc[cat] || 0) + allocation.amount
      acc.total = (acc.total || 0) + allocation.amount
      return acc
    }, {} as Record<string, number>) || {}
    
    return NextResponse.json({
      allocations: data,
      totals,
      metadata: {
        count: data?.length || 0,
        fiscal_years: Array.from(new Set(data?.map(a => a.fiscal_year) || []))
      }
    })
  } catch (error) {
    console.error('Error in budget allocations API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}