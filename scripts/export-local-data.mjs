#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const localUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const localKey = process.env.SUPABASE_SERVICE_KEY

if (!localUrl || !localKey) {
  console.error('Missing local Supabase credentials')
  process.exit(1)
}

const supabase = createClient(localUrl, localKey)

async function exportData() {
  console.log('📦 EXPORTING DATA FROM LOCAL DATABASE')
  console.log('====================================')
  
  const exportData = {
    metadata: {
      exported_at: new Date().toISOString(),
      source_database: localUrl,
      export_version: '1.0'
    },
    tables: {}
  }

  const tablesToExport = [
    'court_statistics',
    'youth_statistics', 
    'budget_allocations',
    'parliamentary_documents',
    'youth_crimes',
    'rti_requests',
    'scraped_content'
  ]

  for (const tableName of tablesToExport) {
    console.log(`\n📋 Exporting ${tableName}...`)
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')

      if (error) {
        console.log(`   ❌ Error: ${error.message}`)
        exportData.tables[tableName] = { error: error.message, data: [] }
      } else {
        console.log(`   ✅ Exported ${data?.length || 0} records`)
        exportData.tables[tableName] = { 
          count: data?.length || 0,
          data: data || [],
          error: null 
        }
        
        // Show sample for verification
        if (data && data.length > 0) {
          const sample = { ...data[0] }
          // Remove long content fields for readability
          Object.keys(sample).forEach(key => {
            if (typeof sample[key] === 'string' && sample[key].length > 100) {
              sample[key] = sample[key].substring(0, 100) + '...'
            }
          })
          console.log(`   📄 Sample:`, sample)
        }
      }
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`)
      exportData.tables[tableName] = { error: err.message, data: [] }
    }
  }

  // Save to file
  const exportFile = './exported-data.json'
  writeFileSync(exportFile, JSON.stringify(exportData, null, 2))
  
  console.log('\n📦 EXPORT COMPLETE')
  console.log('==================')
  console.log(`✅ Data exported to: ${exportFile}`)
  console.log('✅ Ready for production database import')
  
  // Summary
  let totalRecords = 0
  Object.values(exportData.tables).forEach(table => {
    totalRecords += table.count || 0
  })
  
  console.log(`📊 Total records exported: ${totalRecords}`)
  console.log('📋 Tables with data:')
  Object.entries(exportData.tables).forEach(([name, table]) => {
    if (table.count > 0) {
      console.log(`   - ${name}: ${table.count} records`)
    }
  })
}

exportData()