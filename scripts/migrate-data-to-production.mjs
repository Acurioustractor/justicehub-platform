#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

console.log('🔄 DATA MIGRATION ANALYSIS')
console.log('=========================')

// Local database (has data)
const localUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const localKey = process.env.SUPABASE_SERVICE_KEY
console.log(`Local DB:  ${localUrl}`)

// Production database (from console errors - empty)
const prodUrl = 'https://ivvvkombgqvjyrrmwmbs.supabase.co'
const prodKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2dnZrb21iZ3F2anl5cnJtd21icyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzQwMDg3MDk4LCJleHAiOjIwNTU2NjMwOTh9.uZBn1ZZ8wI7KAQ_xHnkUQKMQnswZyBVR1JlLh4RDznk'
console.log(`Prod DB:   ${prodUrl}`)

const localSupabase = createClient(localUrl, localKey)
const prodSupabase = createClient(prodUrl, prodKey)

async function analyzeDataSituation() {
  console.log('\n📊 LOCAL DATABASE ANALYSIS')
  console.log('===========================')
  
  try {
    // Check local data
    const { data: localCourt, error: localCourtError } = await localSupabase
      .from('court_statistics')
      .select('*')
      .limit(3)
    
    if (localCourtError) {
      console.log('❌ Local court data error:', localCourtError.message)
    } else {
      console.log(`✅ Local court_statistics: ${localCourt?.length || 0} records`)
      if (localCourt?.length > 0) {
        console.log(`   Sample: ${localCourt[0].total_defendants} defendants, ${localCourt[0].indigenous_percentage}% Indigenous`)
      }
    }

    const { data: localBudget, error: localBudgetError } = await localSupabase
      .from('budget_allocations')
      .select('*')
      .limit(3)
    
    if (localBudgetError) {
      console.log('❌ Local budget data error:', localBudgetError.message)
    } else {
      console.log(`✅ Local budget_allocations: ${localBudget?.length || 0} records`)
      if (localBudget?.length > 0) {
        console.log(`   Sample: $${(localBudget[0].amount / 1000000).toFixed(1)}M for ${localBudget[0].program}`)
      }
    }

    const { data: localYouth, error: localYouthError } = await localSupabase
      .from('youth_statistics')
      .select('*')
      .limit(3)
    
    if (localYouthError) {
      console.log('❌ Local youth data error:', localYouthError.message)
    } else {
      console.log(`✅ Local youth_statistics: ${localYouth?.length || 0} records`)
      if (localYouth?.length > 0) {
        console.log(`   Sample: ${localYouth[0].total_youth} youth, ${localYouth[0].indigenous_percentage}% Indigenous`)
      }
    }

  } catch (error) {
    console.log('❌ Local database connection failed:', error.message)
  }

  console.log('\n📊 PRODUCTION DATABASE ANALYSIS')  
  console.log('================================')
  
  try {
    // Check production data
    const { data: prodCourt, error: prodCourtError } = await prodSupabase
      .from('court_statistics')
      .select('*')
      .limit(3)
    
    if (prodCourtError) {
      console.log('❌ Production court data error:', prodCourtError.message)
    } else {
      console.log(`✅ Production court_statistics: ${prodCourt?.length || 0} records`)
    }

    const { data: prodBudget, error: prodBudgetError } = await prodSupabase
      .from('budget_allocations')
      .select('*')
      .limit(3)
    
    if (prodBudgetError) {
      console.log('❌ Production budget data error:', prodBudgetError.message)
    } else {
      console.log(`✅ Production budget_allocations: ${prodBudget?.length || 0} records`)
    }

    const { data: prodYouth, error: prodYouthError } = await prodSupabase
      .from('youth_statistics')
      .select('*')
      .limit(3)
    
    if (prodYouthError) {
      console.log('❌ Production youth data error:', prodYouthError.message)
    } else {
      console.log(`✅ Production youth_statistics: ${prodYouth?.length || 0} records`)
    }

  } catch (error) {
    console.log('❌ Production database connection failed:', error.message)
  }

  console.log('\n🎯 SOLUTION RECOMMENDATIONS')
  console.log('============================')
  console.log('1. OPTION A: Migrate data from local to production database')
  console.log('2. OPTION B: Update production environment variables to use local database')
  console.log('3. OPTION C: Verify which database should be the production one')
  console.log('')
  console.log('The frontend console errors show it\'s trying to connect to:')
  console.log('ivvvkombgqvjyrrmwmbs.supabase.co (production)')
  console.log('')  
  console.log('But we have data in:')
  console.log('oxgkjgurpopntowhxlxm.supabase.co (local)')
  console.log('')
  console.log('This explains why dashboard API works (uses fallback) but Sources page shows 0.')
}

analyzeDataSituation()