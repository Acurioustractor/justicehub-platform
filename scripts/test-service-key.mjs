import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

console.log('🔐 Testing Service Role Key...\n')
console.log('URL:', supabaseUrl)
console.log('Service Key:', supabaseServiceKey ? `✅ Found (${supabaseServiceKey.substring(0, 20)}...)` : '❌ Missing')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\n❌ Missing required environment variables')
  console.log('Please ensure .env.local has:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL')
  console.log('- SUPABASE_SERVICE_KEY')
  process.exit(1)
}

// Create client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testServiceKey() {
  console.log('\n📊 Testing service role capabilities...\n')
  
  try {
    // Test 1: Can we query system tables?
    console.log('1. Testing system access...')
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5)
    
    if (tablesError) {
      // Try alternative approach
      const { data: testData, error: testError } = await supabase
        .from('budget_allocations')
        .select('id')
        .limit(1)
      
      if (!testError) {
        console.log('   ✅ Service key is valid and can access data')
      } else {
        console.log('   ❌ Service key might be invalid:', testError.message)
        return false
      }
    } else {
      console.log('   ✅ Can access system tables')
      console.log('   Found tables:', tables?.map(t => t.table_name).join(', '))
    }
    
    // Test 2: Check if monitoring tables exist
    console.log('\n2. Checking monitoring tables...')
    const monitoringTables = [
      'scraper_health',
      'scraper_runs', 
      'data_quality_metrics',
      'scraper_alerts',
      'rate_limit_configs'
    ]
    
    let missingTables = []
    for (const table of monitoringTables) {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1)
      
      if (error) {
        console.log(`   ❌ Table '${table}' not found`)
        missingTables.push(table)
      } else {
        console.log(`   ✅ Table '${table}' exists`)
      }
    }
    
    // Test 3: Try to insert test data
    if (missingTables.length === 0) {
      console.log('\n3. Testing write permissions...')
      const { error: insertError } = await supabase
        .from('scraper_health')
        .upsert({
          scraper_name: 'Test Scraper',
          data_source: 'test',
          status: 'healthy',
          last_successful_run: new Date().toISOString()
        }, {
          onConflict: 'scraper_name,data_source'
        })
      
      if (!insertError) {
        console.log('   ✅ Can write to monitoring tables')
        // Clean up
        await supabase
          .from('scraper_health')
          .delete()
          .eq('scraper_name', 'Test Scraper')
      } else {
        console.log('   ❌ Cannot write:', insertError.message)
      }
    }
    
    // Summary
    console.log('\n📋 Summary:')
    console.log(`- Service key is ${supabaseServiceKey ? 'valid' : 'invalid'}`)
    console.log(`- Missing ${missingTables.length} monitoring tables`)
    
    if (missingTables.length > 0) {
      console.log('\n⚠️  Monitoring tables need to be created')
      console.log('\n📋 Unfortunately, even with service role key, we cannot create tables via JS client')
      console.log('   This is a Supabase limitation - DDL operations require dashboard access')
      console.log('\n🔗 Please go to your Supabase Dashboard:')
      console.log(`   ${supabaseUrl.replace('.supabase.co', '.supabase.com')}/dashboard/project/ivvvkombgqvjyrrmwmbs/sql/new`)
      console.log('\n📋 The SQL migration is in your clipboard - just paste and run!')
    } else {
      console.log('\n✅ All monitoring tables exist!')
      console.log('🚀 You can now run: npm run scrape:monitored')
    }
    
    return true
    
  } catch (error) {
    console.error('❌ Error testing service key:', error.message)
    return false
  }
}

// Run the test
testServiceKey()