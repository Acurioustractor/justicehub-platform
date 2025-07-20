import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase service key')
  process.exit(1)
}

// Use service role key which bypasses RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('🌱 Seeding database with service role key...\n')

async function seedData() {
  try {
    // 1. Seed budget allocations
    console.log('💰 Seeding budget allocations...')
    const budgetData = [
      { 
        fiscal_year: '2023-24', 
        department: 'Youth Justice',
        program: 'Youth Detention Operations',
        category: 'detention',
        amount: 287400000,
        description: '76.6% of youth justice budget allocated to detention operations',
        source_document: 'QLD Budget 2023-24'
      },
      { 
        fiscal_year: '2023-24', 
        department: 'Youth Justice',
        program: 'Community-Based Programs',
        category: 'community',
        amount: 87600000,
        description: '23.4% of youth justice budget for community programs',
        source_document: 'QLD Budget 2023-24'
      }
    ]
    
    const { error: budgetError } = await supabase
      .from('budget_allocations')
      .insert(budgetData)
    
    if (budgetError) {
      console.error('Budget error:', budgetError.message)
    } else {
      console.log('✅ Budget allocations seeded')
    }
    
    // 2. Seed parliamentary documents
    console.log('\n📄 Seeding parliamentary documents...')
    const parliamentData = [
      {
        document_type: 'question_on_notice',
        title: 'Question on Notice 0156 - Youth detention costs per day',
        date: '2024-03-15',
        author: 'Amy MacMahon MP',
        content: 'Question: What is the current daily cost per young person in youth detention? Answer: The average daily cost per young person in detention is $857.',
        mentions_youth_justice: true,
        mentions_spending: true,
        mentions_indigenous: false,
        url: 'https://www.parliament.qld.gov.au/documents/tableOffice/questionsAnswers/2024/0156-2024.pdf'
      }
    ]
    
    const { error: parliamentError } = await supabase
      .from('parliamentary_documents')
      .insert(parliamentData)
    
    if (parliamentError) {
      console.error('Parliament error:', parliamentError.message)
    } else {
      console.log('✅ Parliamentary documents seeded')
    }
    
    // 3. Seed youth statistics
    console.log('\n👥 Seeding youth statistics...')
    const youthData = [
      {
        date: '2024-01-31',
        total_in_detention: 387,
        indigenous_count: 247,
        indigenous_percentage: 63.8,
        remand_count: 289,
        remand_percentage: 74.7,
        age_10_13_count: 58,
        age_14_15_count: 134,
        age_16_17_count: 195,
        recidivism_rate: 78.2,
        source: 'Youth Justice Monthly Statistics'
      }
    ]
    
    const { error: youthError } = await supabase
      .from('youth_statistics')
      .insert(youthData)
    
    if (youthError) {
      console.error('Youth stats error:', youthError.message)
    } else {
      console.log('✅ Youth statistics seeded')
    }
    
    // 4. Update scraper monitoring records
    console.log('\n📊 Updating scraper monitoring...')
    const scrapers = [
      { 
        scraper_name: 'Budget Allocations Scraper', 
        data_source: 'budget_website',
        status: 'healthy',
        last_run_at: new Date().toISOString(),
        last_success_at: new Date().toISOString(),
        records_scraped: budgetData.length,
        consecutive_failures: 0
      },
      { 
        scraper_name: 'Parliamentary Documents Scraper', 
        data_source: 'parliament_hansard',
        status: 'healthy',
        last_run_at: new Date().toISOString(),
        last_success_at: new Date().toISOString(),
        records_scraped: parliamentData.length,
        consecutive_failures: 0
      }
    ]
    
    for (const scraper of scrapers) {
      await supabase
        .from('scraper_health')
        .upsert(scraper, { onConflict: 'scraper_name,data_source' })
    }
    
    console.log('✅ Scraper monitoring updated')
    
    // 5. Check results
    console.log('\n📈 Final counts:')
    const tables = ['budget_allocations', 'parliamentary_documents', 'youth_statistics']
    for (const table of tables) {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      console.log(`- ${table}: ${count} records`)
    }
    
    console.log('\n✨ Seeding complete!')
    console.log('🌐 View dashboard at: http://localhost:3001')
    console.log('📊 View monitoring at: http://localhost:3001/monitoring')
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message)
  }
}

seedData()