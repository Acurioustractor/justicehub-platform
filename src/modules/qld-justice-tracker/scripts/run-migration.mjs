import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

console.log('🔧 Using Service Role Key to run migration...\n')

// Create client with service role key (has admin permissions)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  try {
    // Read the migration file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '002_scraper_monitoring.sql')
    const sql = readFileSync(migrationPath, 'utf8')
    
    console.log('📄 Running migration: 002_scraper_monitoring.sql')
    console.log('   Creating monitoring tables...\n')
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    let successCount = 0
    let errorCount = 0
    
    for (const statement of statements) {
      try {
        // Skip if it's just a comment
        if (statement.startsWith('--') || statement.length < 10) continue
        
        // Extract what we're creating
        const match = statement.match(/CREATE\s+(TABLE|TYPE|INDEX|TRIGGER|FUNCTION|POLICY|OR REPLACE FUNCTION)\s+(?:IF NOT EXISTS\s+)?(\S+)/i)
        const objectType = match?.[1] || 'Statement'
        const objectName = match?.[2] || ''
        
        console.log(`   Creating ${objectType}: ${objectName}...`)
        
        // Execute the statement
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        }).single()
        
        if (error) {
          // Try direct execution as fallback
          const { error: directError } = await supabase
            .from('_sql')
            .insert({ query: statement + ';' })
          
          if (directError) {
            throw directError
          }
        }
        
        successCount++
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`)
        errorCount++
      }
    }
    
    console.log(`\n📊 Migration Summary:`)
    console.log(`   ✅ Successful statements: ${successCount}`)
    console.log(`   ❌ Failed statements: ${errorCount}`)
    
    // Test if tables were created
    console.log('\n🔍 Verifying tables...')
    const tables = [
      'scraper_health',
      'scraper_runs',
      'data_quality_metrics',
      'scraper_alerts',
      'rate_limit_configs'
    ]
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (!error) {
          console.log(`   ✅ Table '${table}' exists`)
        } else {
          console.log(`   ❌ Table '${table}' not found`)
        }
      } catch (e) {
        console.log(`   ❌ Table '${table}' not found`)
      }
    }
    
    console.log('\n✨ Migration complete!')
    console.log('\n🚀 You can now run: npm run scrape:monitored')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.log('\n💡 Alternative: Run the migration manually in Supabase Dashboard')
    console.log('   The SQL is still in your clipboard!')
  }
}

// Unfortunately, Supabase JS client doesn't support raw SQL execution
// Let me try a different approach
console.log('⚠️  The Supabase JS client cannot run raw SQL migrations directly.')
console.log('\n📋 I need to use the Supabase Dashboard for this.')
console.log('\nBUT - I can now create the tables individually using the service key!')

async function createTablesIndividually() {
  console.log('\n🔨 Creating tables using service role key...\n')
  
  try {
    // Test if we already have the tables
    const { data: existingTables } = await supabase
      .from('scraper_health')
      .select('id')
      .limit(1)
    
    if (existingTables) {
      console.log('✅ Monitoring tables already exist!')
      return true
    }
  } catch (e) {
    // Tables don't exist, let's create them
  }
  
  console.log('❌ Cannot create tables via JS client - SQL DDL requires dashboard access')
  console.log('\n📋 Please use the Supabase Dashboard:')
  console.log('1. Go to: https://ivvvkombgqvjyrrmwmbs.supabase.com/dashboard/project/ivvvkombgqvjyrrmwmbs/sql/new')
  console.log('2. The SQL is in your clipboard - paste it!')
  console.log('3. Click Run')
  
  return false
}

// Try to create tables
createTablesIndividually()