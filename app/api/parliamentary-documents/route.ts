import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    const documentType = searchParams.get('document_type')
    const mentionsYouthJustice = searchParams.get('mentions_youth_justice')
    const mentionsSpending = searchParams.get('mentions_spending')
    const mentionsIndigenous = searchParams.get('mentions_indigenous')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    let query = supabase
      .from('parliamentary_documents')
      .select('id, document_type, title, date, author, url, mentions_youth_justice, mentions_spending, mentions_indigenous, scraped_date')
      .order('date', { ascending: false })
      .limit(limit)
    
    if (documentType) {
      query = query.eq('document_type', documentType)
    }
    
    if (mentionsYouthJustice === 'true') {
      query = query.eq('mentions_youth_justice', true)
    }
    
    if (mentionsSpending === 'true') {
      query = query.eq('mentions_spending', true)
    }
    
    if (mentionsIndigenous === 'true') {
      query = query.eq('mentions_indigenous', true)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching parliamentary documents:', error)
      return NextResponse.json({ error: 'Failed to fetch parliamentary documents' }, { status: 500 })
    }
    
    // Count documents by type and mentions
    const stats = data?.reduce((acc, doc) => {
      // Count by type
      const type = doc.document_type || 'unknown'
      acc.byType[type] = (acc.byType[type] || 0) + 1
      
      // Count mentions
      if (doc.mentions_youth_justice) acc.mentionsYouthJustice += 1
      if (doc.mentions_spending) acc.mentionsSpending += 1
      if (doc.mentions_indigenous) acc.mentionsIndigenous += 1
      
      return acc
    }, {
      byType: {} as Record<string, number>,
      mentionsYouthJustice: 0,
      mentionsSpending: 0,
      mentionsIndigenous: 0
    }) || {
      byType: {},
      mentionsYouthJustice: 0,
      mentionsSpending: 0,
      mentionsIndigenous: 0
    }
    
    return NextResponse.json({
      documents: data,
      statistics: stats,
      metadata: {
        count: data?.length || 0,
        documentTypes: Object.keys(stats.byType),
        dateRange: {
          start: data?.[data.length - 1]?.date,
          end: data?.[0]?.date
        }
      }
    })
  } catch (error) {
    console.error('Error in parliamentary documents API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}