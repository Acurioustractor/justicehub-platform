#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('📤 EXPORTING ALL RAW DATA')
console.log('========================')

async function exportAllData() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  
  // Get all scraped content
  const { data: scrapedContent } = await supabase
    .from('scraped_content')
    .select('*')
    .order('scraped_at', { ascending: false })
  
  // Get all other tables
  const tables = ['budget_allocations', 'parliamentary_documents', 'scraper_health', 'court_statistics', 'youth_crimes']
  const allData = { scraped_content: scrapedContent }
  
  for (const table of tables) {
    const { data } = await supabase.from(table).select('*')
    allData[table] = data || []
  }
  
  // Export as JSON
  const jsonFile = `raw-data-export-${timestamp}.json`
  fs.writeFileSync(jsonFile, JSON.stringify(allData, null, 2))
  
  // Export scraped content as readable text
  const textFile = `scraped-content-${timestamp}.txt`
  let textContent = 'QUEENSLAND YOUTH JUSTICE TRACKER - RAW SCRAPED CONTENT\n'
  textContent += '='.repeat(60) + '\n\n'
  
  if (scrapedContent && scrapedContent.length > 0) {
    scrapedContent.forEach((item, i) => {
      textContent += `RECORD ${i + 1}\n`
      textContent += '-'.repeat(20) + '\n'
      textContent += `Source: ${item.source}\n`
      textContent += `URL: ${item.source_url}\n`
      textContent += `Type: ${item.type}\n`
      textContent += `Mentions: ${item.mentions}\n`
      textContent += `Scraped: ${item.scraped_at}\n`
      textContent += `Content:\n${item.content}\n\n`
      textContent += '='.repeat(60) + '\n\n'
    })
  } else {
    textContent += 'NO SCRAPED CONTENT FOUND\n'
  }
  
  fs.writeFileSync(textFile, textContent)
  
  // Create summary
  console.log('\n📊 BRUTAL HONEST SUMMARY:')
  console.log('========================')
  console.log(`Total scraped records: ${scrapedContent?.length || 0}`)
  
  if (scrapedContent && scrapedContent.length > 0) {
    console.log('\n🔍 WHAT WE ACTUALLY HAVE:')
    scrapedContent.forEach((item, i) => {
      console.log(`\n${i + 1}. ${item.source}`)
      console.log(`   URL: ${item.source_url}`)
      console.log(`   Content type: ${item.type}`)
      console.log(`   Keywords found: ${item.mentions}`)
      console.log(`   What it actually is: ${item.content?.substring(0, 150)}...`)
    })
    
    console.log('\n❌ WHAT WE DON\'T HAVE:')
    console.log('- Actual detention rates')
    console.log('- Indigenous overrepresentation statistics')
    console.log('- Cost per youth detained')
    console.log('- Reoffending rates')
    console.log('- Program effectiveness data')
    console.log('- Real government financial data')
    console.log('- Meaningful youth justice statistics')
    
    console.log('\n💭 REALITY CHECK:')
    console.log('The scrapers are collecting basic website content,')
    console.log('not the deep government data you want for reform.')
    console.log('We need to target specific reports, PDFs, and datasets.')
    
  } else {
    console.log('\n❌ NO DATA AT ALL!')
    console.log('The scrapers haven\'t collected anything meaningful.')
  }
  
  console.log(`\n📁 Files created:`)
  console.log(`   ${jsonFile} - All data in JSON format`)
  console.log(`   ${textFile} - Human-readable scraped content`)
  
  return { jsonFile, textFile, totalRecords: scrapedContent?.length || 0 }
}

exportAllData().catch(console.error)