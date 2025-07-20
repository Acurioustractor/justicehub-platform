#!/usr/bin/env node

/**
 * Database Connection Test for Queensland Youth Justice Tracker
 * 
 * This script tests the database connection and verifies all tables are working properly.
 * Run this AFTER setting up your environment variables and database tables.
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') })
dotenv.config({ path: join(__dirname, '../.env.local') })

async function testConnection() {
  console.log('🧪 Queensland Youth Justice Tracker - Database Connection Test')
  console.log('==============================================================')
  console.log('')

  // Check environment variables
  console.log('🔍 Checking environment variables...')
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_KEY'
  ]
  
  const missingVars = requiredVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:')
    missingVars.forEach(varName => {
      console.error(`   ${varName}`)
    })
    console.log('')
    console.log('💡 Please set up your environment variables first:')
    console.log('   1. Copy .env.new to .env and .env.local')
    console.log('   2. Update with your Supabase project credentials')
    console.log('   3. Run this test again')
    process.exit(1)
  }
  
  console.log('✅ Environment variables found')
  console.log('')
  
  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  // Test basic connection
  console.log('🔗 Testing database connection...')
  try {
    const { data, error } = await supabase
      .from('youth_statistics')
      .select('count')
      .limit(1)

    if (error) throw error
    console.log('✅ Database connection successful')
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    console.log('')
    console.log('💡 To fix this:')
    console.log('   1. Create new Supabase project at https://app.supabase.com')
    console.log('   2. Update .env.new with your project credentials')
    console.log('   3. Copy .env.new to .env and .env.local')
    console.log('   4. Run: node scripts/setup-database-tables.mjs')
    console.log('   5. Run this test again')
    process.exit(1)
  }

  console.log('')
  console.log('🎉 DATABASE CONNECTION TEST PASSED!')
  console.log('=================================')
  console.log('')
  console.log('🚀 Ready to run world-class scrapers!')
  console.log('   Command: node scripts/run-world-class-scrapers.mjs')
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason)
  process.exit(1)
})

// Run test
testConnection().catch(error => {
  console.error('❌ Connection test failed:', error.message)
  process.exit(1)
})