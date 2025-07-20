#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTableSchemas() {
  console.log('🔍 CHECKING TABLE SCHEMAS')
  console.log('=========================')
  
  const tablesToCheck = [
    'court_sentencing',
    'youth_crime_patterns', 
    'rti_requests',
    'parliamentary_documents',
    'scraper_health'
  ]
  
  for (const tableName of tablesToCheck) {
    console.log(`\n📋 Table: ${tableName}`)
    try {
      // Try to insert a minimal record to see what columns exist
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`   ❌ Error accessing ${tableName}: ${error.message}`)
      } else {
        console.log(`   ✅ Table accessible, ${data?.length || 0} records found`)
        
        // If we have data, show the structure
        if (data && data.length > 0) {
          console.log(`   📊 Columns: ${Object.keys(data[0]).join(', ')}`)
        } else {
          // Try to get schema by attempting an insert
          const { error: insertError } = await supabase
            .from(tableName)
            .insert({})
            .select()
          
          if (insertError) {
            console.log(`   📝 Schema hints from error: ${insertError.message}`)
          }
        }
      }
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`)
    }
  }
  
  // Also check what columns exist in tables we know have data
  console.log('\n📊 TABLES WITH DATA - SHOWING SCHEMAS')
  console.log('====================================')
  
  const tablesWithData = ['court_statistics', 'youth_statistics', 'budget_allocations']
  
  for (const tableName of tablesWithData) {
    console.log(`\n📋 ${tableName}:`)
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (data && data.length > 0) {
        const columns = Object.keys(data[0])
        console.log(`   📊 Columns (${columns.length}): ${columns.join(', ')}`)
      }
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`)
    }
  }
}

checkTableSchemas()