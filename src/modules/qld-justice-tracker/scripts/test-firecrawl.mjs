#!/usr/bin/env node
import FirecrawlApp from '@mendable/firecrawl-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') })

const firecrawlApiKey = process.env.FIRECRAWL_API_KEY

console.log('🔥 Firecrawl Quick Test')
console.log('======================')

if (!firecrawlApiKey) {
  console.error('❌ FIRECRAWL_API_KEY not found')
  process.exit(1)
}

const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey })

async function quickTest() {
  try {
    console.log('🧪 Testing with Queensland Courts website...')
    
    const result = await firecrawl.scrapeUrl('https://www.courts.qld.gov.au/about/publications', {
      formats: ['markdown'],
      timeout: 15000
    })
    
    console.log('✅ Success!')
    console.log(`📄 Title: ${result.metadata?.title || 'No title'}`)
    console.log(`📝 Content length: ${result.markdown?.length || 0} characters`)
    
    // Look for youth justice keywords
    const youthKeywords = result.markdown?.match(/youth|juvenile|childrens?\s+court|indigenous/gi) || []
    console.log(`🔍 Youth justice mentions: ${youthKeywords.length}`)
    
    if (youthKeywords.length > 0) {
      console.log(`   Examples: ${youthKeywords.slice(0, 5).join(', ')}`)
    }
    
    console.log('\n🎯 Firecrawl is working perfectly!')
    console.log('   Ready to scrape Queensland government data')
    console.log('   Enhanced coverage for youth justice transparency')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

quickTest()