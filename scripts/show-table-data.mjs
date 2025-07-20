#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function showTableData() {
  console.log('📊 SHOWING ACTUAL TABLE DATA')
  console.log('===========================')
  
  // Check court_statistics
  console.log('\n⚖️  Court Statistics:')
  const { data: court, error: courtError } = await supabase
    .from('court_statistics')
    .select('*')
    .limit(3)
  
  if (courtError) {
    console.log('   ❌ Error:', courtError.message)
  } else if (court && court.length > 0) {
    console.log(`   ✅ Found ${court.length} records`)
    console.log('   Columns:', Object.keys(court[0]).join(', '))
    court.forEach((record, i) => {
      console.log(`   Record ${i + 1}:`, JSON.stringify(record, null, 2))
    })
  } else {
    console.log('   ⚠️  No data found')
  }
  
  // Check youth_statistics
  console.log('\n🏛️  Youth Statistics:')
  const { data: youth, error: youthError } = await supabase
    .from('youth_statistics')
    .select('*')
    .limit(3)
  
  if (youthError) {
    console.log('   ❌ Error:', youthError.message)
  } else if (youth && youth.length > 0) {
    console.log(`   ✅ Found ${youth.length} records`)
    console.log('   Columns:', Object.keys(youth[0]).join(', '))
    youth.forEach((record, i) => {
      console.log(`   Record ${i + 1}:`, JSON.stringify(record, null, 2))
    })
  } else {
    console.log('   ⚠️  No data found')
  }
  
  // Check budget_allocations
  console.log('\n💰 Budget Allocations:')
  const { data: budget, error: budgetError } = await supabase
    .from('budget_allocations')
    .select('*')
    .limit(3)
  
  if (budgetError) {
    console.log('   ❌ Error:', budgetError.message)
  } else if (budget && budget.length > 0) {
    console.log(`   ✅ Found ${budget.length} records`)
    console.log('   Columns:', Object.keys(budget[0]).join(', '))
    budget.forEach((record, i) => {
      console.log(`   Record ${i + 1}:`, JSON.stringify(record, null, 2))
    })
  } else {
    console.log('   ⚠️  No data found')
  }
}

showTableData()