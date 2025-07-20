#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'
import { validator } from '../../lib/validation/data-validator.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

console.log('📊 VERIFIED DATA LOADER')
console.log('======================')
console.log('Loading manually verified statistics from official government reports\n')

async function loadVerifiedData() {
  try {
    // Load verified statistics
    const dataPath = join(__dirname, '../../data/verified-statistics.json')
    const verifiedData = JSON.parse(readFileSync(dataPath, 'utf8'))
    
    console.log(`Loaded ${Object.keys(verifiedData).length - 1} data categories`)
    console.log(`Data quality: ${verifiedData.metadata.data_quality}\n`)
    
    let totalRecords = 0
    let successCount = 0
    
    // 1. Load Court Statistics
    console.log('⚖️  Loading Court Statistics...')
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
        source_url: stat.source_url,
        scraped_at: new Date().toISOString(),
        data_verified: true,
        data_quality_grade: 'A'
      }
      
      const { error } = await supabase
        .from('court_statistics')
        .upsert(record, { onConflict: 'report_period,court_type' })
      
      if (!error) {
        console.log(`   ✅ ${stat.source_document}`)
        successCount++
      } else {
        console.log(`   ❌ Failed: ${error.message}`)
      }
      totalRecords++
    }
    
    // 2. Load Youth Detention Data
    console.log('\n🏛️  Loading Youth Detention Census...')
    for (const census of verifiedData.youth_detention) {
      const record = {
        date: census.report_date,
        total_youth: census.statistics.total_youth_detention,
        indigenous_percentage: census.statistics.indigenous_percentage,
        on_remand_percentage: census.statistics.remand_percentage,
        average_daily_number: census.statistics.total_youth_detention,
        source_url: census.source_url,
        source: census.source_document,
        capacity_percentage: census.statistics.capacity_percentage,
        data_verified: true
      }
      
      const { error } = await supabase
        .from('youth_statistics')
        .upsert(record, { onConflict: 'date' })
      
      if (!error) {
        console.log(`   ✅ ${census.source_document}`)
        successCount++
      } else {
        console.log(`   ❌ Failed: ${error.message}`)
      }
      totalRecords++
    }
    
    // 3. Load Budget Allocations
    console.log('\n💰 Loading Budget Data...')
    for (const budget of verifiedData.budget_data) {
      // Load main categories
      const categories = [
        {
          category: 'Youth Justice Total',
          amount: budget.allocations.total_youth_justice,
          description: 'Total youth justice allocation'
        },
        {
          category: 'Detention Operations',
          subcategory: 'Facilities and Operations',
          amount: budget.allocations.detention_operations,
          description: `${budget.allocations.detention_percentage}% of total budget`
        },
        {
          category: 'Community Programs',
          subcategory: 'Prevention and Diversion',
          amount: budget.allocations.community_programs,
          description: `${budget.allocations.community_percentage}% of total budget`
        }
      ]
      
      for (const cat of categories) {
        const record = {
          fiscal_year: budget.fiscal_year,
          category: cat.category,
          subcategory: cat.subcategory,
          amount: cat.amount,
          description: cat.description,
          source: budget.source_document,
          source_url: budget.source_url,
          data_verified: true
        }
        
        const { error } = await supabase
          .from('budget_allocations')
          .upsert(record, { onConflict: 'fiscal_year,category,subcategory' })
        
        if (!error) {
          console.log(`   ✅ ${cat.category}: $${(cat.amount/1000000).toFixed(1)}M`)
          successCount++
        } else {
          console.log(`   ❌ Failed: ${error.message}`)
        }
        totalRecords++
      }
    }
    
    // 4. Store key findings in scraped_content
    console.log('\n🔍 Storing Key Findings...')
    for (const audit of verifiedData.audit_findings) {
      const content = {
        source: 'Queensland Audit Office',
        url: audit.source_url,
        title: audit.source_document,
        content: JSON.stringify(audit.key_findings, null, 2),
        metadata: {
          key_findings: audit.key_findings,
          report_date: audit.report_date,
          verified: true
        },
        scraper_name: 'verified-data-loader',
        data_type: 'audit_findings',
        scraped_at: new Date().toISOString()
      }
      
      const { error } = await supabase
        .from('scraped_content')
        .insert(content)
      
      if (!error) {
        console.log(`   ✅ ${audit.source_document}`)
        console.log(`      - True cost: $${audit.key_findings.true_cost_per_day}/day`)
        console.log(`      - Hidden costs: ${audit.key_findings.hidden_cost_percentage}%`)
        successCount++
      } else {
        console.log(`   ❌ Failed: ${error.message}`)
      }
      totalRecords++
    }
    
    // Summary
    console.log('\n\n📊 LOADING SUMMARY')
    console.log('==================')
    console.log(`Total records processed: ${totalRecords}`)
    console.log(`Successfully loaded: ${successCount}`)
    console.log(`Failed: ${totalRecords - successCount}`)
    console.log('\n✅ All data manually verified from official government sources')
    console.log('   Data quality grade: A (Direct from published reports)')
    
  } catch (error) {
    console.error('❌ Loading failed:', error.message)
    process.exit(1)
  }
}

// Run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  loadVerifiedData()
}