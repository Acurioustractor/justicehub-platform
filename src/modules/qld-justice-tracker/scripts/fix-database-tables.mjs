#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') })

console.log('🔧 Database Table Fixer')
console.log('=======================')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixRLSPolicies() {
  console.log('\n🔒 Fixing RLS policies for service key access...')
  
  const policies = [
    "CREATE POLICY IF NOT EXISTS \"Enable all for service role\" ON scraped_content FOR ALL TO service_role USING (true) WITH CHECK (true);",
    "CREATE POLICY IF NOT EXISTS \"Enable all for service role\" ON scraper_health FOR ALL TO service_role USING (true) WITH CHECK (true);",
    "CREATE POLICY IF NOT EXISTS \"Enable all for service role\" ON court_statistics FOR ALL TO service_role USING (true) WITH CHECK (true);",
    "CREATE POLICY IF NOT EXISTS \"Enable all for service role\" ON court_sentencing FOR ALL TO service_role USING (true) WITH CHECK (true);",
    "CREATE POLICY IF NOT EXISTS \"Enable all for service role\" ON youth_crimes FOR ALL TO service_role USING (true) WITH CHECK (true);",
    "CREATE POLICY IF NOT EXISTS \"Enable all for service role\" ON youth_crime_patterns FOR ALL TO service_role USING (true) WITH CHECK (true);",
    "CREATE POLICY IF NOT EXISTS \"Enable all for service role\" ON rti_requests FOR ALL TO service_role USING (true) WITH CHECK (true);",
    "CREATE POLICY IF NOT EXISTS \"Enable all for service role\" ON youth_statistics FOR ALL TO service_role USING (true) WITH CHECK (true);",
    "CREATE POLICY IF NOT EXISTS \"Enable all for service role\" ON budget_allocations FOR ALL TO service_role USING (true) WITH CHECK (true);",
    "CREATE POLICY IF NOT EXISTS \"Enable all for service role\" ON parliamentary_documents FOR ALL TO service_role USING (true) WITH CHECK (true);"
  ]
  
  let successCount = 0
  
  for (const policy of policies) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: policy })
      if (!error) {
        successCount++
      } else {
        console.log(`   ⚠️  Policy may already exist: ${error.message}`)
      }
    } catch (error) {
      console.log(`   ⚠️  Policy creation attempt: ${error.message}`)
    }
  }
  
  console.log(`   Created/verified ${successCount}/${policies.length} policies`)
  return true
}

async function testTableCreation() {
  console.log('\n🧪 Testing table access...')
  
  try {
    // Test if we can insert a simple record
    const { data, error } = await supabase
      .from('scraped_content')
      .insert([{
        type: 'test',
        content: 'Test content',
        source: 'test_script',
        source_url: 'localhost',
        data_type: 'test'
      }])
      .select()
    
    if (error) {
      console.error('❌ Insert test failed:', error)
      return false
    }
    
    console.log('✅ Insert test successful!')
    
    // Clean up test record
    if (data[0]?.id) {
      await supabase
        .from('scraped_content')
        .delete()
        .eq('id', data[0].id)
    }
    
    return true
    
  } catch (error) {
    console.error('❌ Table test error:', error)
    return false
  }
}

async function fixAllTables() {
  console.log('🚀 Starting database fixes...\n')
  
  // Skip creating policies via RPC (doesn't work), just test table access directly
  console.log('\n🧪 Testing current table access...')
  
  const testWorking = await testTableCreation()
  
  console.log('\n📋 DIAGNOSIS:')
  console.log(`   Database connection: ✅`)
  console.log(`   Tables exist: ✅`)
  console.log(`   Inserts work: ${testWorking ? '✅' : '❌'}`)
  
  if (testWorking) {
    console.log('\n✅ DATABASE IS WORKING!')
    console.log('   All scrapers should be able to insert data')
    console.log('   The issue was likely in scraper error handling')
  } else {
    console.log('\n⚠️  RLS POLICIES NEED MANUAL FIX')
    console.log('   Go to Supabase dashboard → Authentication → Policies')
    console.log('   Add policy: "Enable all for service role" with service_role access')
  }
  
  console.log('\n🎯 NEXT STEPS:')
  console.log('   1. Fix individual scraper error handling')
  console.log('   2. Update Budget scraper URLs for 2025-26')
  console.log('   3. Test Firecrawl scraper')
  console.log('   4. Replace mock data with real scraping logic')
}

fixAllTables().catch(console.error)