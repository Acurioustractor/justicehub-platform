#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { pdfExtractor } from '../../lib/extractors/pdf-extractor.mjs'
import { validator } from '../../lib/validation/data-validator.mjs'
import { VERIFIED_SOURCES } from '../verified-sources-registry.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

console.log('⚖️  PROFESSIONAL COURTS DATA SCRAPER')
console.log('====================================')
console.log('Extracting verified data from Queensland Courts official reports\n')

async function scrapeCourtData() {
  const results = {
    success: 0,
    failed: 0,
    data: []
  }

  try {
    // Get verified court sources
    const courtSources = VERIFIED_SOURCES.courts.sources.filter(s => s.type === 'pdf')
    
    for (const source of courtSources) {
      console.log(`\n📄 Processing: ${source.name}`)
      console.log(`   URL: ${source.url}`)
      
      try {
        // Extract data from PDF
        const extractedData = await pdfExtractor.extractFromURL(source.url, {
          name: source.name,
          dataType: 'court_statistics',
          sourceId: source.id
        })
        
        // Validate data
        const validation = await validator.validateRecord(extractedData)
        console.log(`   📊 Validation Score: ${validation.score}/100 (Grade: ${validation.grade})`)
        
        if (validation.valid) {
          // Extract specific court statistics
          const courtStats = {
            court_type: 'Childrens Court',
            report_period: extractedData.report_period || '2023-24',
            total_defendants: extractedData.total_defendants,
            indigenous_defendants: extractedData.indigenous_percentage 
              ? Math.round(extractedData.total_defendants * extractedData.indigenous_percentage / 100)
              : null,
            indigenous_percentage: extractedData.indigenous_percentage,
            bail_refused_count: extractedData.bail_refused_count,
            average_time_to_sentence_days: extractedData.average_days_to_sentence,
            source_document: source.name,
            source_url: source.url,
            data_quality_score: validation.score,
            data_quality_grade: validation.grade,
            scraped_at: new Date().toISOString()
          }
          
          // Remove null values
          Object.keys(courtStats).forEach(key => {
            if (courtStats[key] === null || courtStats[key] === undefined) {
              delete courtStats[key]
            }
          })
          
          // Store in database
          const { error } = await supabase
            .from('court_statistics')
            .upsert(courtStats, { 
              onConflict: 'report_period,court_type',
              ignoreDuplicates: false 
            })
          
          if (error) {
            console.log(`   ⚠️  Database error: ${error.message}`)
          } else {
            console.log(`   ✅ Stored court statistics successfully`)
            results.success++
            results.data.push(courtStats)
          }
          
          // Store audit record
          const auditRecord = validator.createAuditRecord(extractedData, validation)
          await supabase
            .from('data_audit_trail')
            .insert(auditRecord)
            .catch(() => {}) // Ignore if audit table doesn't exist
          
        } else {
          console.log(`   ❌ Data validation failed:`)
          validation.issues.forEach(issue => console.log(`      - ${issue}`))
          results.failed++
        }
        
      } catch (error) {
        console.log(`   ❌ Failed to process: ${error.message}`)
        results.failed++
      }
    }
    
    // Summary
    console.log('\n\n📊 SCRAPING SUMMARY')
    console.log('===================')
    console.log(`✅ Successful: ${results.success}`)
    console.log(`❌ Failed: ${results.failed}`)
    
    if (results.data.length > 0) {
      console.log('\n📈 Key Findings:')
      results.data.forEach(stat => {
        console.log(`\n   ${stat.source_document}:`)
        if (stat.total_defendants) {
          console.log(`   - Total defendants: ${stat.total_defendants.toLocaleString()}`)
        }
        if (stat.indigenous_percentage) {
          console.log(`   - Indigenous representation: ${stat.indigenous_percentage}%`)
        }
        if (stat.bail_refused_count) {
          console.log(`   - Bail refused: ${stat.bail_refused_count.toLocaleString()}`)
        }
        console.log(`   - Data quality: ${stat.data_quality_grade} (${stat.data_quality_score}/100)`)
      })
    }
    
    console.log('\n✅ Professional courts data extraction complete')
    console.log('   All data verified from official government sources')
    
  } catch (error) {
    console.error('❌ Scraper failed:', error.message)
    process.exit(1)
  }
}

// Run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  scrapeCourtData()
}