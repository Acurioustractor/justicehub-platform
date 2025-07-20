#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_KEY not found in environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🏛️ Running Court & Police Data Migration')
console.log('========================================')

async function runMigration() {
  try {
    // Read the migration file
    const migrationPath = join(__dirname, '../supabase/migrations/003_court_police_data.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')
    
    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)
    
    console.log(`\n📋 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      
      // Extract table/index name for logging
      const tableMatch = statement.match(/CREATE TABLE (\w+)/i)
      const indexMatch = statement.match(/CREATE INDEX (\w+)/i)
      const triggerMatch = statement.match(/CREATE TRIGGER (\w+)/i)
      const policyMatch = statement.match(/CREATE POLICY/i)
      
      let description = ''
      if (tableMatch) description = `Creating table: ${tableMatch[1]}`
      else if (indexMatch) description = `Creating index: ${indexMatch[1]}`
      else if (triggerMatch) description = `Creating trigger: ${triggerMatch[1]}`
      else if (policyMatch) description = `Creating RLS policy`
      else if (statement.includes('ALTER TABLE')) description = 'Enabling RLS'
      else description = `Statement ${i + 1}`
      
      process.stdout.write(`   ${description}...`)
      
      try {
        // For now, we'll create tables using individual operations
        if (tableMatch) {
          const tableName = tableMatch[1]
          
          // Check if table already exists
          const { data: existing } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true })
          
          if (existing !== null) {
            console.log(' ✅ Already exists')
            continue
          }
        }
        
        // Since we can't run raw SQL, we'll need to use the Supabase dashboard
        // For now, let's check what tables we need
        console.log(' ⏭️  Needs manual creation')
        
      } catch (error) {
        console.log(` ❌ Error: ${error.message}`)
      }
    }
    
    console.log('\n📋 Checking which tables need to be created:')
    
    const tables = ['court_statistics', 'court_sentencing', 'youth_crimes', 'youth_crime_patterns']
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error && error.code === '42P01') {
        console.log(`   ❌ ${table} - Needs creation`)
      } else if (!error) {
        console.log(`   ✅ ${table} - Already exists`)
      } else {
        console.log(`   ⚠️  ${table} - Unknown status: ${error.message}`)
      }
    }
    
    console.log('\n💡 To create missing tables:')
    console.log('   1. Go to your Supabase dashboard')
    console.log('   2. Navigate to SQL Editor')
    console.log('   3. Copy and run the migration from:')
    console.log(`      ${migrationPath}`)
    console.log('\n   OR use the Supabase CLI:')
    console.log('   supabase db push')
    
  } catch (error) {
    console.error('\n❌ Migration error:', error.message)
    process.exit(1)
  }
}

runMigration()