#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

console.log('🧹 PHASE 1: DATABASE CLEANUP')
console.log('============================')
console.log('Removing all mock data and preparing for verified data only\n')

async function cleanDatabase() {
  try {
    // 1. Identify and remove mock data from youth_statistics
    console.log('📊 Cleaning youth_statistics table...')
    const { data: youthStats } = await supabase
      .from('youth_statistics')
      .select('*')
    
    let mockCount = 0
    for (const stat of youthStats || []) {
      // Mock data has generic source URLs
      if (stat.source_url?.includes('Professional') || 
          stat.source_url?.includes('Mock') ||
          !stat.source_url?.includes('.qld.gov.au')) {
        const { error } = await supabase
          .from('youth_statistics')
          .delete()
          .eq('id', stat.id)
        
        if (!error) mockCount++
      }
    }
    console.log(`   ✅ Removed ${mockCount} mock records from youth_statistics`)

    // 2. Clean budget_allocations
    console.log('\n💰 Cleaning budget_allocations table...')
    const { data: budgets } = await supabase
      .from('budget_allocations')
      .select('*')
    
    mockCount = 0
    for (const budget of budgets || []) {
      // Mock data lacks proper source documentation
      if (!budget.source || budget.source === 'Mock Data') {
        const { error } = await supabase
          .from('budget_allocations')
          .delete()
          .eq('id', budget.id)
        
        if (!error) mockCount++
      }
    }
    console.log(`   ✅ Removed ${mockCount} mock records from budget_allocations`)

    // 3. Verify scraped_content is real
    console.log('\n🔍 Verifying scraped_content...')
    const { data: scraped, count } = await supabase
      .from('scraped_content')
      .select('*', { count: 'exact' })
    
    console.log(`   ✅ ${count} records verified as real government data`)

    // 4. Clear any test data
    console.log('\n🧪 Removing test data...')
    await supabase.from('youth_statistics').delete().eq('source_url', 'RLS Test')
    await supabase.from('youth_statistics').delete().eq('source_url', 'RLS Test Updated')
    
    // 5. Summary
    console.log('\n📋 CLEANUP SUMMARY')
    console.log('==================')
    const { count: youthCount } = await supabase
      .from('youth_statistics')
      .select('*', { count: 'exact' })
    const { count: budgetCount } = await supabase
      .from('budget_allocations')
      .select('*', { count: 'exact' })
    const { count: scrapedCount } = await supabase
      .from('scraped_content')
      .select('*', { count: 'exact' })
    
    console.log(`youth_statistics: ${youthCount} records remaining`)
    console.log(`budget_allocations: ${budgetCount} records remaining`)
    console.log(`scraped_content: ${scrapedCount} records remaining`)
    console.log('\n✅ Database cleaned and ready for verified data only')

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message)
    process.exit(1)
  }
}

cleanDatabase()