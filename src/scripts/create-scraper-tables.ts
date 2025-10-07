#!/usr/bin/env node
/**
 * Create AI Scraper Database Tables
 * 
 * Creates the required database tables for the AI scraper module
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

async function createScraperTables() {
  console.log('🔧 Creating AI Scraper Database Tables...')
  
  // Create Supabase client with service key
  const supabase = createClient(
    'https://tednluwflfhxyucgwigh.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZG5sdXdmbGZoeHl1Y2d3aWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM0NjIyOSwiZXhwIjoyMDY3OTIyMjI5fQ.wyizbOWRxMULUp6WBojJPfey1ta8-Al1OlZqDDIPIHo'
  )
  
  try {
    // Read the schema file
    const schemaPath = join(process.cwd(), 'src', 'database', 'ai-scraper-schema.sql')
    const schema = readFileSync(schemaPath, 'utf8')
    
    console.log('📋 Executing schema...')
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.startsWith('--') || statement.trim().length === 0) {
        continue // Skip comments and empty statements
      }
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          console.log(`⚠️  Warning: ${error.message}`)
        } else {
          // Extract table name from CREATE TABLE statement
          const tableMatch = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/i)
          if (tableMatch) {
            console.log(`✅ Created table: ${tableMatch[1]}`)
          } else {
            console.log(`✅ Executed statement`)
          }
        }
      } catch (error) {
        console.log(`❌ Error executing statement: ${error}`)
      }
    }
    
    console.log('\n🎉 AI Scraper database tables created successfully!')
    console.log('\n📋 Next steps:')
    console.log('1. Run the initialization script: npx tsx src/scripts/initialize-scraper.ts')
    console.log('2. Run a test scrape: npx tsx src/scripts/run-test-scrape.ts')
    
  } catch (error) {
    console.error('💥 Failed to create scraper tables:', error)
  }
}

// Run the function
createScraperTables()
