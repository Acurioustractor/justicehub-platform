import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function calculateTransparencyScore() {
  const scores = {
    budget_documents: {
      weight: 25,
      score: 70,  // PDFs available but not machine-readable
      status: 'partial'
    },
    real_time_data: {
      weight: 25,
      score: 10,  // No real-time data
      status: 'poor'
    },
    hidden_costs: {
      weight: 25,
      score: 0,   // Not tracked at all
      status: 'none'
    },
    outcome_data: {
      weight: 25,
      score: 40,  // Limited outcome reporting
      status: 'limited'
    }
  }
  
  const totalScore = Object.values(scores).reduce((sum, cat) => 
    sum + (cat.score * cat.weight / 100), 0
  )
  
  return {
    overall_score: Math.round(totalScore),
    grade: totalScore < 40 ? 'D' : totalScore < 60 ? 'C' : totalScore < 80 ? 'B' : 'A',
    categories: scores
  }
}

export async function GET() {
  try {
    const supabase = createClient()
    
    // Fetch parliamentary documents
    const { data: parliamentDocs } = await supabase
      .from('parliamentary_documents')
      .select('*')
      .eq('mentions_youth_justice', true)
      .order('date', { ascending: false })
      .limit(5)
    
    const { count: docCount } = await supabase
      .from('parliamentary_documents')
      .select('*', { count: 'exact', head: true })
      .eq('mentions_youth_justice', true)

    // Calculate transparency score
    const transparencyScore = calculateTransparencyScore()

    const responseData = {
      transparency: transparencyScore,
      documents: {
        total: docCount || 0,
        recent: parliamentDocs?.map(doc => ({
          title: doc.title,
          date: doc.date,
          type: doc.document_type
        })) || []
      }
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error fetching transparency data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transparency data' },
      { status: 500 }
    )
  }
}
