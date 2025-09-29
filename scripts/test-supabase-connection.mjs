/**
 * Test script to verify Supabase connection and inspect schema
 * Run with: node scripts/test-supabase-connection.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load .env.local
const envPath = join(process.cwd(), '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const envVars = {}

envContent.split('\n').forEach(line => {
  const trimmed = line.trim()
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=')
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim()
    }
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables in .env.local')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing')
  process.exit(1)
}

console.log('🔍 Testing Supabase Connection...')
console.log('📍 URL:', supabaseUrl, '\n')

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  // Test 1: Check stories table
  console.log('1️⃣  Testing stories table...')
  const { data: stories, error: storiesError, count: storiesCount } = await supabase
    .from('stories')
    .select('*', { count: 'exact', head: false })
    .limit(2)

  if (storiesError) {
    console.error('   ❌ Error:', storiesError.message)
  } else {
    console.log(`   ✅ Found ${storiesCount} total stories`)
    if (stories && stories.length > 0) {
      console.log('   📋 Story fields:', Object.keys(stories[0]).join(', '))
      console.log('   📄 Sample story:', JSON.stringify(stories[0], null, 2).substring(0, 500) + '...')
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
    console.error('   ⚠️  Error:', consentsError.message)
    console.log('   (Consent table might have a different name)')
  } else {
    console.log('   ✅ Consents table accessible')
    if (consents && consents.length > 0) {
      console.log('   📋 Consent fields:', Object.keys(consents[0]).join(', '))
    }
  }

  console.log('\n✅ Connection test complete!\n')
}

testConnection().catch(console.error)
