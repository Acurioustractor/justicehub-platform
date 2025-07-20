#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

console.log('📊 LOADING VERIFIED DATA INTO EXISTING TABLES')
console.log('=============================================\n')

async function loadDataIntoExistingTables() {
  try {
    // Load our verified statistics
    const dataPath = join(__dirname, '../data/verified-statistics.json')
    const verifiedData = JSON.parse(readFileSync(dataPath, 'utf8'))
    
    let successCount = 0
    let totalAttempts = 0
    
    // 1. Load Court Statistics (using existing court_statistics table)
    console.log('⚖️  Loading Court Data into court_statistics table...')
    for (const stat of verifiedData.court_statistics) {
      const record = {
        court_type: 'Childrens Court',
        report_period: stat.report_period,
        total_defendants: stat.statistics.total_defendants,
        indigenous_defendants: stat.statistics.indigenous_defendants,
        indigenous_percentage: stat.statistics.indigenous_percentage,
        bail_refused_count: stat.statistics.bail_refused_count,
        bail_refused_percentage: stat.statistics.bail_refused_percentage,
        remanded_custody: stat.statistics.remanded_in_custody,
        average_time_to_sentence_days: stat.statistics.average_days_to_finalization,
        source_document: stat.source_document,
        source_url: stat.source_url
      }
      
      totalAttempts++
      const { data, error } = await supabase
        .from('court_statistics')
        .insert(record)
        .select()
      
      if (!error && data) {
        console.log(`   ✅ ${stat.report_period}: ${stat.statistics.total_defendants.toLocaleString()} defendants (${stat.statistics.indigenous_percentage}% Indigenous)`)
        successCount++
      } else {
        console.log(`   ❌ Failed ${stat.report_period}: ${error?.message || 'Unknown error'}`)
      }
    }
    
    // 2. Load Youth/Detention Data (using existing youth_statistics table)
    console.log('\n🏛️  Loading Youth Detention Data into youth_statistics table...')
    for (const census of verifiedData.youth_detention) {
      const record = {
        date: census.report_date,
        total_youth: census.statistics.total_youth_detention,
        indigenous_youth: census.statistics.indigenous_youth,
        indigenous_percentage: census.statistics.indigenous_percentage,
        // Map to existing columns
        facility_name: 'Queensland Youth Detention (All Centres)',
        program_type: 'detention',
        source_url: census.source_url
      }
      
      totalAttempts++
      const { data, error } = await supabase
        .from('youth_statistics')
        .insert(record)
        .select()
      
      if (!error && data) {
        console.log(`   ✅ ${census.report_date}: ${census.statistics.total_youth_detention} youth (${census.statistics.indigenous_percentage}% Indigenous)`)
        successCount++
      } else {
        console.log(`   ❌ Failed ${census.report_date}: ${error?.message || 'Unknown error'}`)
      }
    }
    
    // 3. Load Police Data (using existing youth_crimes table)
    console.log('\n👮 Loading Police Data into youth_crimes table...')
    for (const police of verifiedData.police_statistics) {
      // Police data needs to be mapped to regional structure
      const record = {
        date: '2024-06-30', // End of fiscal year
        region: 'Queensland (Statewide)',
        offense_type: 'All Offences',
        youth_offenders: police.statistics.youth_offenders,
        repeat_offenders: police.statistics.repeat_offenders,
        repeat_offender_percentage: police.statistics.repeat_offender_percentage,
        source: police.source_document
      }
      
      totalAttempts++
      const { data, error } = await supabase
        .from('youth_crimes')
        .insert(record)
        .select()
      
      if (!error && data) {
        console.log(`   ✅ ${police.report_period}: ${police.statistics.youth_offenders.toLocaleString()} offenders (${police.statistics.repeat_offender_percentage}% repeat)`)
        successCount++
      } else {
        console.log(`   ❌ Failed ${police.report_period}: ${error?.message || 'Unknown error'}`)
      }
    }
    
    // 4. Load Budget Data (using existing budget_allocations table)
    console.log('\n💰 Loading Budget Data into budget_allocations table...')
    for (const budget of verifiedData.budget_data) {
      // Create separate records for each budget category
      const allocations = [
        {
          fiscal_year: budget.fiscal_year,
          program: 'Youth Justice Services - Total',
          category: null,
          amount: budget.allocations.total_youth_justice,
          description: 'Total youth justice allocation',
          source_document: budget.source_document,
          source_url: budget.source_url
        },
        {
          fiscal_year: budget.fiscal_year,
          program: 'Youth Detention Operations',
          category: 'detention',
          amount: budget.allocations.detention_operations,
          description: `${budget.allocations.detention_percentage}% of total budget`,
          source_document: budget.source_document,
          source_url: budget.source_url
        },
        {
          fiscal_year: budget.fiscal_year,
          program: 'Community-Based Programs',
          category: 'community',
          amount: budget.allocations.community_programs,
          description: `${budget.allocations.community_percentage}% of total budget`,
          source_document: budget.source_document,
          source_url: budget.source_url
        }
      ]
      
      for (const alloc of allocations) {
        totalAttempts++
        const { data, error } = await supabase
          .from('budget_allocations')
          .insert(alloc)
          .select()
        
        if (!error && data) {
          console.log(`   ✅ ${alloc.fiscal_year} - ${alloc.program}: $${(alloc.amount/1000000).toFixed(1)}M`)
          successCount++
        } else {
          console.log(`   ❌ Failed ${alloc.program}: ${error?.message || 'Unknown error'}`)
        }
      }
    }
    
    // 5. Store Key Findings in scraped_content
    console.log('\n🔍 Storing Key Findings in scraped_content...')
    for (const audit of verifiedData.audit_findings) {
      const content = {
        source: 'Queensland Audit Office',
        url: audit.source_url,
        title: audit.source_document,
        content: JSON.stringify(audit.key_findings, null, 2),
        metadata: audit.key_findings,
        scraper_name: 'verified-data-loader',
        data_type: 'audit_findings'
      }
      
      totalAttempts++
      const { data, error } = await supabase
        .from('scraped_content')
        .insert(content)
        .select()
      
      if (!error && data) {
        console.log(`   ✅ ${audit.source_document}`)
        console.log(`      True cost: $${audit.key_findings.true_cost_per_day}/day (vs $${audit.key_findings.government_claimed_cost} claimed)`)
        successCount++
      } else {
        console.log(`   ❌ Failed: ${error?.message || 'Unknown error'}`)
      }
    }
    
    // Summary
    console.log('\n\n📊 DATA LOADING SUMMARY')
    console.log('=======================')
    console.log(`Total records attempted: ${totalAttempts}`)
    console.log(`Successfully loaded: ${successCount}`)
    console.log(`Failed: ${totalAttempts - successCount}`)
    console.log(`Success rate: ${Math.round(successCount/totalAttempts*100)}%`)
    
    // Show what's now in the database
    console.log('\n📈 DATABASE CONTENTS:')
    
    const { count: courtCount } = await supabase.from('court_statistics').select('*', { count: 'exact' })
    const { count: youthCount } = await supabase.from('youth_statistics').select('*', { count: 'exact' })
    const { count: budgetCount } = await supabase.from('budget_allocations').select('*', { count: 'exact' })
    const { count: crimeCount } = await supabase.from('youth_crimes').select('*', { count: 'exact' })
    const { count: scrapedCount } = await supabase.from('scraped_content').select('*', { count: 'exact' })
    
    console.log(`   court_statistics: ${courtCount} records`)
    console.log(`   youth_statistics: ${youthCount} records`)
    console.log(`   budget_allocations: ${budgetCount} records`)
    console.log(`   youth_crimes: ${crimeCount} records`)
    console.log(`   scraped_content: ${scrapedCount} records`)
    console.log(`   TOTAL: ${courtCount + youthCount + budgetCount + crimeCount + scrapedCount} records`)
    
    if (successCount > 0) {
      console.log('\n✅ Verified government data successfully loaded!')
      console.log('   All data sourced from official Queensland government reports')
    }
    
  } catch (error) {
    console.error('❌ Loading failed:', error.message)
    process.exit(1)
  }
}

// Run the loader
loadDataIntoExistingTables()