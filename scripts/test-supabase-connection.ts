/**
 * Test script to verify Supabase connection and inspect schema
 * Run with: npx tsx scripts/test-supabase-connection.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing')
  process.exit(1)
}

async function testConnection() {
  console.log('🔍 Testing Supabase Connection...\n')
  
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Test 1: Check stories table
  console.log('1️⃣  Testing stories table...')
  const { data: stories, error: storiesError, count: storiesCount } = await supabase
    .from('stories')
    .select('*', { count: 'exact' })
    .limit(3)

  if (storiesError) {
    console.error('   ❌ Error:', storiesError.message)
  } else {
    console.log(`   ✅ Found ${storiesCount} total stories`)
    if (stories && stories.length > 0) {
      console.log('   📋 Sample story fields:', Object.keys(stories[0]).join(', '))
    }
  }

  // Test 2: Check profiles table
  console.log('\n2️⃣  Testing profiles table...')
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .limit(1)

  if (profilesError) {
    console.error('   ❌ Error:', profilesError.message)
  } else {
    console.log('   ✅ Profiles table accessible')
    if (profiles && profiles.length > 0) {
      console.log('   📋 Profile fields:', Object.keys(profiles[0]).join(', '))
    }
  }

  // Test 3: Check consents table
  console.log('\n3️⃣  Testing consents table...')
  const { data: consents, error: consentsError } = await supabase
    .from('consents')
    .select('*')
    .limit(1)

  if (consentsError) {
    console.error('   ❌ Error:', consentsError.message)
  } else {
    console.log('   ✅ Consents table accessible')
    if (consents && consents.length > 0) {
      console.log('   📋 Consent fields:', Object.keys(consents[0]).join(', '))
    }
  }

  // Test 4: List all tables
  console.log('\n4️⃣  Listing all public tables...')
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')

  if (tablesError) {
    console.error('   ❌ Error:', tablesError.message)
  } else if (tables) {
    console.log('   📊 Available tables:', tables.map(t => t.table_name).join(', '))
  }

  console.log('\n✅ Connection test complete!\n')
}

testConnection().catch(console.error)
