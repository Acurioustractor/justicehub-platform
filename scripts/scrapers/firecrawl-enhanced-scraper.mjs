#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import FirecrawlApp from '@mendable/firecrawl-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
const firecrawlApiKey = process.env.FIRECRAWL_API_KEY

console.log('🔥 Firecrawl Enhanced Scraper')
console.log('============================')
console.log('Using Firecrawl for reliable web scraping of Queensland government data')

if (!firecrawlApiKey) {
  console.error('❌ FIRECRAWL_API_KEY not found in environment variables')
  console.log('💡 To set up Firecrawl:')
  console.log('   1. Go to https://firecrawl.dev and get your API key')
  console.log('   2. Add FIRECRAWL_API_KEY=fc-your-key to your .env.local file')
  console.log('   3. IMPORTANT: Never share your API key publicly!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey })

// Define scraping targets with Firecrawl
const SCRAPING_TARGETS = [
  {
    name: 'Queensland Courts Statistics',
    url: 'https://www.courts.qld.gov.au/about/publications',
    description: 'Official court publications and statistics',
    extractors: {
      publications: 'a[href*="annual-report"], a[href*="statistics"], a[href*="childrens-court"]',
      titles: 'h1, h2, h3',
      dates: 'time, .date, [data-date]'
    },
    dataType: 'court_data'
  },
  {
    name: 'Queensland Police Open Data',
    url: 'https://www.data.qld.gov.au/dataset?tags=crime',
    description: 'Open data portal crime statistics',
    extractors: {
      datasets: '.dataset-item, .package-item',
      titles: '.dataset-heading a, .package-heading a',
      descriptions: '.notes, .description'
    },
    dataType: 'police_data'
  },
  {
    name: 'Youth Justice Department Reports',
    url: 'https://www.families.qld.gov.au/child-family/youth-justice',
    description: 'Department of Youth Justice information',
    extractors: {
      reports: 'a[href*=".pdf"], a[href*="report"]',
      titles: 'h1, h2, h3, .title',
      dates: 'time, .date, .published'
    },
    dataType: 'youth_justice_data'
  },
  {
    name: 'Queensland Budget Papers',
    url: 'https://budget.qld.gov.au',
    description: 'Queensland budget information',
    extractors: {
      documents: 'a[href*="budget"], a[href*=".pdf"]',
      amounts: '[data-amount], .amount, .budget-figure',
      programs: '.program, .service-area'
    },
    dataType: 'budget_data'
  }
]

async function scrapeWithFirecrawl(target) {
  console.log(`\n🔥 Scraping: ${target.name}`)
  console.log(`   URL: ${target.url}`)
  console.log(`   Description: ${target.description}`)
  
  try {
    // Use Firecrawl to scrape the page
    const scrapeResponse = await firecrawl.scrapeUrl(target.url, {
      formats: ['markdown', 'html'],
      includeTags: Object.values(target.extractors),
      excludeTags: ['nav', 'footer', 'aside', '.advertisement'],
      timeout: 30000,
      waitFor: 2000 // Wait for dynamic content
    })
    
    console.log(`   🔍 Response structure:`, JSON.stringify(scrapeResponse, null, 2).substring(0, 200) + '...')
    
    if (!scrapeResponse.success) {
      throw new Error(`Firecrawl scraping failed: ${scrapeResponse.error || 'Unknown error'}`)
    }
    
    // Handle different response structures
    const data = scrapeResponse.data || scrapeResponse
    const markdown = data.markdown || data.content || ''
    const html = data.html || ''
    const metadata = data.metadata || {}
    
    console.log(`   ✅ Successfully scraped ${target.name}`)
    console.log(`   📄 Title: ${metadata?.title || 'No title'}`)
    console.log(`   📝 Content length: ${markdown?.length || 0} characters`)
    
    // Extract specific data based on target type
    const extractedData = await extractDataFromContent(markdown, html, target)
    
    // Store in database
    await storeExtractedData(extractedData, target)
    
    return {
      name: target.name,
      status: 'success',
      dataExtracted: extractedData.length,
      insights: generateInsights(extractedData, target.dataType)
    }
    
  } catch (error) {
    console.error(`   ❌ Error scraping ${target.name}:`, error.message)
    
    return {
      name: target.name,
      status: 'failed',
      error: error.message
    }
  }
}

async function extractDataFromContent(markdown, html, target) {
  const extractedData = []
  
  switch (target.dataType) {
    case 'court_data':
      // Look for youth justice statistics
      const courtMatches = markdown.match(/youth|juvenile|childrens?\s+court|indigenous|bail|detention/gi) || []
      if (courtMatches.length > 0) {
        extractedData.push({
          type: 'court_mention',
          content: markdown.substring(0, 500),
          mentions: courtMatches.length,
          url: target.url,
          scraped_at: new Date().toISOString()
        })
      }
      break
      
    case 'police_data':
      // Look for crime statistics
      const crimeMatches = markdown.match(/offender|crime|youth|juvenile|statistics/gi) || []
      if (crimeMatches.length > 0) {
        extractedData.push({
          type: 'crime_data',
          content: markdown.substring(0, 500),
          mentions: crimeMatches.length,
          url: target.url,
          scraped_at: new Date().toISOString()
        })
      }
      break
      
    case 'youth_justice_data':
      // Look for detention and program data
      const youthMatches = markdown.match(/detention|program|outcome|reoffend|indigenous|cost/gi) || []
      if (youthMatches.length > 0) {
        extractedData.push({
          type: 'youth_justice_mention',
          content: markdown.substring(0, 500),
          mentions: youthMatches.length,
          url: target.url,
          scraped_at: new Date().toISOString()
        })
      }
      break
      
    case 'budget_data':
      // Look for budget figures
      const budgetMatches = markdown.match(/\$[\d,.]+(million|billion|M|B)|\$[\d,]+/gi) || []
      if (budgetMatches.length > 0) {
        extractedData.push({
          type: 'budget_mention',
          content: markdown.substring(0, 500),
          budget_figures: budgetMatches,
          url: target.url,
          scraped_at: new Date().toISOString()
        })
      }
      break
  }
  
  return extractedData
}

async function storeExtractedData(data, target) {
  if (data.length === 0) return
  
  try {
    // Store in scraped_content table with actual schema
    const recordsToInsert = data.map(item => ({
      source: target.name,
      url: item.url,
      title: `${item.type} - ${target.name}`,
      content: item.content,
      metadata: {
        type: item.type,
        mentions: item.mentions || 0,
        budget_figures: item.budget_figures || null,
        extracted_at: item.scraped_at
      },
      scraper_name: 'firecrawl-enhanced',
      data_type: target.dataType,
      scraped_at: item.scraped_at
    }))
    
    const { error } = await supabase
      .from('scraped_content')
      .insert(recordsToInsert)
    
    if (error) {
      console.log(`   ⚠️  Could not store in database: ${error.message}`)
      console.log(`   📝 Would store ${data.length} items`)
    } else {
      console.log(`   ✅ Stored ${data.length} items in database`)
    }
  } catch (error) {
    console.log(`   ⚠️  Database error: ${error.message}`)
  }
}

function generateInsights(data, dataType) {
  const insights = []
  
  if (data.length === 0) {
    insights.push('No relevant data found')
    return insights
  }
  
  switch (dataType) {
    case 'court_data':
      insights.push(`Found ${data[0]?.mentions || 0} youth justice mentions`)
      if (data[0]?.content?.includes('indigenous')) {
        insights.push('Indigenous youth data available')
      }
      break
      
    case 'police_data':
      insights.push(`Found ${data[0]?.mentions || 0} crime statistics mentions`)
      break
      
    case 'youth_justice_data':
      insights.push(`Found ${data[0]?.mentions || 0} youth justice program mentions`)
      if (data[0]?.content?.includes('cost')) {
        insights.push('Cost data potentially available')
      }
      break
      
    case 'budget_data':
      const figures = data[0]?.budget_figures || []
      insights.push(`Found ${figures.length} budget figures`)
      if (figures.length > 0) {
        insights.push(`Sample amounts: ${figures.slice(0, 3).join(', ')}`)
      }
      break
  }
  
  return insights
}

async function runFirecrawlScraping() {
  const timestamp = new Date().toISOString()
  const results = []
  
  console.log(`\n🚀 Starting Firecrawl scraping at ${timestamp}`)
  console.log(`   Targets: ${SCRAPING_TARGETS.length}`)
  console.log('   Mission: Expose hidden youth justice data\n')
  
  for (const target of SCRAPING_TARGETS) {
    const result = await scrapeWithFirecrawl(target)
    results.push(result)
    
    // Be respectful - small delay between requests
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  // Summary
  console.log('\n📊 FIRECRAWL SCRAPING SUMMARY')
  console.log('=============================')
  
  const successful = results.filter(r => r.status === 'success')
  const failed = results.filter(r => r.status === 'failed')
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`)
  console.log(`❌ Failed: ${failed.length}/${results.length}`)
  
  if (successful.length > 0) {
    console.log('\n🔍 Key Findings:')
    successful.forEach(result => {
      console.log(`\n   📋 ${result.name}:`)
      if (result.insights) {
        result.insights.forEach(insight => {
          console.log(`      • ${insight}`)
        })
      }
    })
  }
  
  if (failed.length > 0) {
    console.log('\n⚠️  Failed Targets:')
    failed.forEach(result => {
      console.log(`   • ${result.name}: ${result.error}`)
    })
  }
  
  // Update monitoring
  try {
    await supabase
      .from('scraper_health')
      .upsert({
        scraper_name: 'Firecrawl Enhanced Scraper',
        data_source: 'firecrawl_scraping',
        status: successful.length > failed.length ? 'healthy' : 'warning',
        last_run_at: timestamp,
        last_success_at: successful.length > 0 ? timestamp : null,
        records_scraped: successful.reduce((sum, r) => sum + (r.dataExtracted || 0), 0),
        consecutive_failures: failed.length
      }, { onConflict: 'scraper_name,data_source' })
  } catch (error) {
    console.log('⚠️  Could not update monitoring data')
  }
  
  console.log('\n🎯 Mission Impact:')
  console.log('   Firecrawl enables reliable scraping of dynamic government websites')
  console.log('   This helps expose data that traditional scrapers might miss')
  console.log('   Every successful scrape brings us closer to full transparency')
  
  return results
}

// Execute if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runFirecrawlScraping()
    .then(results => {
      console.log('\n✅ Firecrawl scraping complete!')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Firecrawl scraping failed:', error.message)
      process.exit(1)
    })
}

export { runFirecrawlScraping }