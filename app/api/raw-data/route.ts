import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Use service key for API routes to access all data
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function GET() {
  try {
    // Get all scraped content
    const { data: scrapedContent, error: scrapedError } = await supabase
      .from('scraped_content')
      .select('*')
      .order('scraped_at', { ascending: false })

    if (scrapedError) {
      console.error('Error fetching scraped content:', scrapedError)
    }

    // Get other tables
    const tables = ['budget_allocations', 'parliamentary_documents', 'scraper_health']
    const allData: any = { 
      scraped_content: scrapedContent || [],
      last_updated: new Date().toISOString()
    }

    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*')
      if (error) {
        console.error(`Error fetching ${table}:`, error)
        allData[table] = []
      } else {
        allData[table] = data || []
      }
    }

    // Add summary stats
    allData.summary = {
      total_scraped_records: allData.scraped_content.length,
      total_budget_records: allData.budget_allocations.length,
      total_parliament_records: allData.parliamentary_documents.length,
      total_health_records: allData.scraper_health.length,
      data_sources: Array.from(new Set(allData.scraped_content.map((item: any) => item.source))),
      last_scrape: allData.scraped_content[0]?.scraped_at || null
    }

    return NextResponse.json(allData)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data', details: error },
      { status: 500 }
    )
  }
}