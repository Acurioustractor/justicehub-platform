#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  console.log('URL:', supabaseUrl ? 'Set' : 'Missing')
  console.log('Key:', supabaseKey ? 'Set' : 'Missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSources() {
  console.log('🔍 Checking database for sources data...\n')
  
  try {
    // Check court_statistics
    console.log('1. Court Statistics:')
    const { data: court, error: courtError } = await supabase
      .from('court_statistics')
      .select('source_document, source_url, verified_date, page_references, report_period')
      .order('report_period', { ascending: false })
      .limit(3)
    
    if (courtError) {
      console.log('   ❌ Error:', courtError.message)
    } else if (court && court.length > 0) {
      console.log(`   ✅ Found ${court.length} records`)
      court.forEach(record => {
        console.log(`   - ${record.source_document || 'No document'} (${record.report_period})`)
        console.log(`     URL: ${record.source_url ? 'Set' : 'Missing'}`)
        console.log(`     Verified: ${record.verified_date || 'No date'}`)
      })
    } else {
      console.log('   ⚠️  No data found')
    }
    
    // Check youth_detention_statistics
    console.log('\n2. Youth Detention Statistics:')
    const { data: detention, error: detentionError } = await supabase
      .from('youth_detention_statistics')
      .select('source_document, source_url, report_date, snapshot_date')
      .order('snapshot_date', { ascending: false })
      .limit(3)
    
    if (detentionError) {
      console.log('   ❌ Error:', detentionError.message)
    } else if (detention && detention.length > 0) {
      console.log(`   ✅ Found ${detention.length} records`)
      detention.forEach(record => {
        console.log(`   - ${record.source_document || 'No document'} (${record.snapshot_date})`)
        console.log(`     URL: ${record.source_url ? 'Set' : 'Missing'}`)
      })
    } else {
      console.log('   ⚠️  No data found')
    }
    
    // Check budget_allocations  
    console.log('\n3. Budget Allocations:')
    const { data: budget, error: budgetError } = await supabase
      .from('budget_allocations')
      .select('source_document, source_url, fiscal_year, created_at')
      .order('fiscal_year', { ascending: false })
      .limit(3)
    
    if (budgetError) {
      console.log('   ❌ Error:', budgetError.message)
    } else if (budget && budget.length > 0) {
      console.log(`   ✅ Found ${budget.length} records`)
      budget.forEach(record => {
        console.log(`   - ${record.source_document || 'No document'} (${record.fiscal_year})`)
        console.log(`     URL: ${record.source_url ? 'Set' : 'Missing'}`)
      })
    } else {
      console.log('   ⚠️  No data found')
    }
    
    // Check police_statistics
    console.log('\n4. Police Statistics:')
    const { data: police, error: policeError } = await supabase
      .from('police_statistics')
      .select('source_document, source_url, verified_date, report_period')
      .order('report_period', { ascending: false })
      .limit(3)
    
    if (policeError) {
      console.log('   ❌ Error:', policeError.message)
    } else if (police && police.length > 0) {
      console.log(`   ✅ Found ${police.length} records`)
      police.forEach(record => {
        console.log(`   - ${record.source_document || 'No document'} (${record.report_period})`)
        console.log(`     URL: ${record.source_url ? 'Set' : 'Missing'}`)
      })
    } else {
      console.log('   ⚠️  No data found')
    }
    
    // Check audit_findings
    console.log('\n5. Audit Findings:')
    const { data: audit, error: auditError } = await supabase
      .from('audit_findings')
      .select('source_document, source_url, verified_date, report_date')
      .order('report_date', { ascending: false })
      .limit(3)
    
    if (auditError) {
      console.log('   ❌ Error:', auditError.message)
    } else if (audit && audit.length > 0) {
      console.log(`   ✅ Found ${audit.length} records`)
      audit.forEach(record => {
        console.log(`   - ${record.source_document || 'No document'} (${record.report_date})`)
        console.log(`     URL: ${record.source_url ? 'Set' : 'Missing'}`)
      })
    } else {
      console.log('   ⚠️  No data found')
    }
    
  } catch (error) {
    console.error('❌ Script error:', error.message)
  }
}

checkSources()