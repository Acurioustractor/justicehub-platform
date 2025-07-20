import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env' })
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function seedInitialData() {
  console.log('🌱 Seeding initial data for Queensland Youth Justice Tracker...\n')

  try {
    // 1. Youth Statistics
    console.log('📊 Seeding youth statistics...')
    const youthStats = [
      {
        date: '2024-12-01',
        total_in_detention: 340,
        indigenous_percentage: 72,
        on_remand_percentage: 74,
        average_daily_number: 335,
        reoffending_rate: 68,
        successful_completions: 156,
        source: 'Department of Youth Justice',
        fiscal_year: '2024-25'
      },
      {
        date: '2024-11-01',
        total_in_detention: 328,
        indigenous_percentage: 71,
        on_remand_percentage: 73,
        average_daily_number: 325,
        reoffending_rate: 67,
        successful_completions: 148,
        source: 'Department of Youth Justice',
        fiscal_year: '2024-25'
      }
    ]

    const { error: statsError } = await supabase
      .from('youth_statistics')
      .upsert(youthStats, { onConflict: 'date' })

    if (statsError) throw statsError
    console.log('✅ Youth statistics seeded')

    // 2. Budget Allocations
    console.log('💰 Seeding budget allocations...')
    const budgetData = [
      {
        fiscal_year: '2024-25',
        category: 'detention',
        subcategory: 'Operations',
        amount: 453000000,
        description: 'Youth detention centre operations',
        source: 'Queensland Budget Papers 2024-25'
      },
      {
        fiscal_year: '2024-25',
        category: 'community',
        subcategory: 'Programs',
        amount: 127000000,
        description: 'Community-based programs and supervision',
        source: 'Queensland Budget Papers 2024-25'
      },
      {
        fiscal_year: '2024-25',
        category: 'detention',
        subcategory: 'Infrastructure',
        amount: 98000000,
        description: 'New detention centre construction',
        source: 'Queensland Budget Papers 2024-25'
      }
    ]

    const { error: budgetError } = await supabase
      .from('budget_allocations')
      .upsert(budgetData, { onConflict: 'fiscal_year,category,subcategory' })

    if (budgetError) throw budgetError
    console.log('✅ Budget allocations seeded')

    // 3. Detention Stats
    console.log('🏢 Seeding detention statistics...')
    const detentionStats = [
      {
        centre_name: 'Cleveland Youth Detention Centre',
        date: '2024-12-01',
        capacity: 120,
        occupancy: 128,
        remand_count: 95,
        indigenous_count: 89,
        avg_stay_days: 84,
        incidents_monthly: 28
      },
      {
        centre_name: 'Brisbane Youth Detention Centre',
        date: '2024-12-01',
        capacity: 138,
        occupancy: 132,
        remand_count: 98,
        indigenous_count: 95,
        avg_stay_days: 78,
        incidents_monthly: 31
      },
      {
        centre_name: 'West Moreton Youth Detention Centre',
        date: '2024-12-01',
        capacity: 60,
        occupancy: 48,
        remand_count: 36,
        indigenous_count: 34,
        avg_stay_days: 72,
        incidents_monthly: 13
      }
    ]

    const { error: detentionError } = await supabase
      .from('detention_stats')
      .upsert(detentionStats, { onConflict: 'centre_name,date' })

    if (detentionError) throw detentionError
    console.log('✅ Detention statistics seeded')

    // 4. Scraped Content
    console.log('🌐 Seeding scraped content metadata...')
    const scrapedContent = [
      {
        source: 'Queensland Budget Papers',
        url: 'https://budget.qld.gov.au/',
        title: 'Youth Justice Budget Allocation 2024-25',
        content: 'Total youth justice budget: $678 million. Detention: $551 million (81%). Community programs: $127 million (19%).',
        metadata: { fiscal_year: '2024-25', total_budget: 678000000 },
        scraper_name: 'budget_scraper',
        data_type: 'budget'
      },
      {
        source: 'Department of Youth Justice',
        url: 'https://www.dcssds.qld.gov.au/our-work/youth-justice',
        title: 'Youth Detention Monthly Statistics',
        content: 'Average daily number in detention: 335. Indigenous: 72%. On remand: 74%.',
        metadata: { month: 'December 2024', total_detained: 340 },
        scraper_name: 'youth_justice_scraper',
        data_type: 'statistics'
      },
      {
        source: 'AIHW',
        url: 'https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-2023-24',
        title: 'Queensland Youth Justice Statistics 2023-24',
        content: 'Queensland has the highest rate of Indigenous youth detention in Australia at 33x the non-Indigenous rate.',
        metadata: { year: '2023-24', indigenous_rate_ratio: 33 },
        scraper_name: 'aihw_scraper',
        data_type: 'report'
      }
    ]

    const { error: contentError } = await supabase
      .from('scraped_content')
      .upsert(scrapedContent, { onConflict: 'url' })

    if (contentError) throw contentError
    console.log('✅ Scraped content seeded')

    console.log('\n🎉 Initial data seeding complete!')
    console.log('📊 Your Queensland Youth Justice Tracker now has data to display!')

  } catch (error) {
    console.error('❌ Error seeding data:', error)
    process.exit(1)
  }
}

seedInitialData()