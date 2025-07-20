#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🔍 ACTUAL SCRAPED DATA FROM QUEENSLAND GOVERNMENT')
console.log('=================================================')

async function showActualData() {
  // Get scraped content
  const { data: scraped } = await supabase
    .from('scraped_content')
    .select('*')
    .order('scraped_at', { ascending: false })
  
  if (!scraped || scraped.length === 0) {
    console.log('❌ NO SCRAPED DATA FOUND!')
    return
  }
  
  console.log(`\n📊 Found ${scraped.length} scraped records:\n`)
  
  scraped.forEach((item, i) => {
    console.log(`📋 RECORD ${i + 1}:`)
    console.log(`   🌐 Source: ${item.source}`)
    console.log(`   🔗 URL: ${item.source_url}`)
    console.log(`   📝 Type: ${item.type}`)
    console.log(`   🏷️  Data Type: ${item.data_type}`)
    console.log(`   🔢 Mentions: ${item.mentions}`)
    console.log(`   ⏰ Scraped: ${item.scraped_at}`)
    console.log(`   📄 Content Preview:`)
    console.log(`      ${item.content?.substring(0, 300).replace(/\n/g, ' ')}...`)
    console.log('')
  })
  
  // Show actual URLs being scraped
  console.log('🎯 EXACT WEBSITES BEING SCRAPED:')
  console.log('================================')
  
  const uniqueUrls = [...new Set(scraped.map(item => item.source_url))]
  uniqueUrls.forEach((url, i) => {
    console.log(`${i + 1}. ${url}`)
  })
  
  // Check other data tables
  console.log('\n📊 OTHER DATA TABLES:')
  console.log('=====================')
  
  const tables = ['budget_allocations', 'parliamentary_documents', 'scraper_health']
  
  for (const table of tables) {
    const { data, count } = await supabase
      .from(table)
      .select('*')
      .limit(3)
    
    console.log(`\n📋 ${table}: ${count || 0} records`)
    if (data && data.length > 0) {
      console.log(`   Sample: ${JSON.stringify(data[0]).substring(0, 200)}...`)
    }
  }
}

showActualData().catch(console.error)