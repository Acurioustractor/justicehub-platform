import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const facilityName = searchParams.get('facility_name')
    const programType = searchParams.get('program_type')
    
    let query = supabase
      .from('youth_statistics')
      .select('*')
      .order('date', { ascending: false })
    
    if (startDate) {
      query = query.gte('date', startDate)
    }
    
    if (endDate) {
      query = query.lte('date', endDate)
    }
    
    if (facilityName) {
      query = query.eq('facility_name', facilityName)
    }
    
    if (programType) {
      query = query.eq('program_type', programType)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching youth statistics:', error)
      return NextResponse.json({ error: 'Failed to fetch youth statistics' }, { status: 500 })
    }
    
    // Calculate averages and trends
    const summary = data?.reduce((acc, stat) => {
      acc.totalYouth += stat.total_youth || 0
      acc.totalIndigenous += stat.indigenous_youth || 0
      acc.records += 1
      
      if (stat.average_age) {
        acc.ageSum += stat.average_age
        acc.ageCount += 1
      }
      
      if (stat.average_stay_days) {
        acc.staySum += stat.average_stay_days
        acc.stayCount += 1
      }
      
      return acc
    }, {
      totalYouth: 0,
      totalIndigenous: 0,
      records: 0,
      ageSum: 0,
      ageCount: 0,
      staySum: 0,
      stayCount: 0
    }) || {
      totalYouth: 0,
      totalIndigenous: 0,
      records: 0,
      ageSum: 0,
      ageCount: 0,
      staySum: 0,
      stayCount: 0
    }
    
    const averages = {
      indigenousPercentage: summary.totalYouth > 0 
        ? (summary.totalIndigenous / summary.totalYouth * 100).toFixed(1) 
        : 0,
      averageAge: summary.ageCount > 0 
        ? (summary.ageSum / summary.ageCount).toFixed(1) 
        : null,
      averageStayDays: summary.stayCount > 0 
        ? (summary.staySum / summary.stayCount).toFixed(1) 
        : null
    }
    
    return NextResponse.json({
      statistics: data,
      summary: {
        totalRecords: summary.records,
        totalYouth: summary.totalYouth,
        totalIndigenous: summary.totalIndigenous,
        averages
      },
      metadata: {
        facilities: Array.from(new Set(data?.map(s => s.facility_name).filter(Boolean) || [])),
        dateRange: {
          start: data?.[data.length - 1]?.date,
          end: data?.[0]?.date
        }
      }
    })
  } catch (error) {
    console.error('Error in youth statistics API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}