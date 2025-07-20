#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

console.log('🧪 Testing Scraper Data Insertion')
console.log('=================================')
console.log('This script tests if scrapers can insert data after RLS fix\n')

// Check environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY')
  console.error('Check your .env.local file')
  process.exit(1)
}

console.log('✅ Environment variables loaded')
console.log(`   Supabase URL: ${supabaseUrl}`)
console.log(`   Service Key: ${supabaseServiceKey.substring(0, 20)}...`)

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testDatabaseConnection() {
  console.log('\n🔌 Testing database connection...')
  
  try {
    // Test a simple query
    const { data, error } = await supabase
      .from('budget_allocations')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Database connection failed:', error.message)
      return false
    }
    
    console.log('✅ Database connection successful')
    return true
  } catch (error) {
    console.error('❌ Connection error:', error.message)
    return false
  }
}

async function testDataInsertion() {
  console.log('\n📝 Testing data insertion...')
  
  const testData = {
    fiscal_year: '2025-26',
    department: 'Test Department',
    program: 'RLS Policy Test',
    category: 'community',
    amount: 1000000,
    description: 'Test insertion after RLS fix',
    source_url: 'https://test.example.com',
    source_document: 'Test Document',
    scraped_date: new Date().toISOString()
  }
  
  try {
    const { data, error } = await supabase
      .from('budget_allocations')
      .insert([testData])
      .select()
    
    if (error) {
      console.error('❌ Insertion failed:', error.message)
      console.error('   Error details:', error)
      console.error('\n⚠️  RLS policies may still be blocking insertions')
      console.error('   Please run the fix-rls-policies-comprehensive.sql script in Supabase')
      return false
    }
    
    console.log('✅ Test data inserted successfully!')
    console.log(`   Inserted record ID: ${data[0].id}`)
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...')
    const { error: deleteError } = await supabase
      .from('budget_allocations')
      .delete()
      .eq('program', 'RLS Policy Test')
    
    if (deleteError) {
      console.error('⚠️  Warning: Could not clean up test data:', deleteError.message)
    } else {
      console.log('✅ Test data cleaned up')
    }
    
    return true
  } catch (error) {
    console.error('❌ Insertion error:', error.message)
    return false
  }
}

async function checkTableCounts() {
  console.log('\n📊 Checking current data in tables...')
  
  const tables = [
    'budget_allocations',
    'parliamentary_documents',
    'youth_statistics',
    'cost_comparisons',
    'scraper_health',
    'scraper_runs'
  ]
  
  let totalRecords = 0
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`   ${table}: ❌ Error - ${error.message}`)
      } else {
        console.log(`   ${table}: ${count || 0} records`)
        totalRecords += count || 0
      }
    } catch (error) {
      console.log(`   ${table}: ❌ Error - ${error.message}`)
    }
  }
  
  console.log(`\n📈 Total records across all tables: ${totalRecords}`)
  return totalRecords
}

async function runTests() {
  console.log('Starting tests...\n')
  
  // Test 1: Database connection
  const connectionOk = await testDatabaseConnection()
  if (!connectionOk) {
    console.error('\n❌ Cannot proceed without database connection')
    process.exit(1)
  }
  
  // Test 2: Data insertion
  const insertionOk = await testDataInsertion()
  
  // Test 3: Check existing data
  const recordCount = await checkTableCounts()
  
  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📋 TEST SUMMARY')
  console.log('='.repeat(50))
  console.log(`Database Connection: ${connectionOk ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Data Insertion: ${insertionOk ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Total Records: ${recordCount}`)
  
  if (!insertionOk) {
    console.log('\n⚠️  ACTION REQUIRED:')
    console.log('1. Go to Supabase SQL Editor')
    console.log('2. Run the script: scripts/fix-rls-policies-comprehensive.sql')
    console.log('3. Run this test again to verify the fix')
    console.log('\nSee RLS_FIX_INSTRUCTIONS.md for detailed steps')
  } else {
    console.log('\n✅ All tests passed! Scrapers can now insert data.')
    console.log('Next steps:')
    console.log('1. Run individual scrapers to collect data')
    console.log('2. Monitor the scraper health dashboard')
    console.log('3. Check that data appears in the frontend')
  }
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test script failed:', error)
  process.exit(1)
})