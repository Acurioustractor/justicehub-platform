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

console.log('🚔 Queensland Police Service Crime Statistics Scraper')
console.log('==================================================')
console.log('Mission: Extract real-time youth crime trends and offender demographics')

if (!firecrawlApiKey) {
  console.error('❌ FIRECRAWL_API_KEY not found')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey })

// QPS Maps & Statistics targets for youth crime data
const QPS_TARGETS = [
  {
    name: 'QPS Juvenile Offenders Statistics',
    url: 'https://www.police.qld.gov.au/maps-and-statistics/crime-statistics',
    description: 'Monthly juvenile offenders (10-17) by offence type, division, region',
    extractors: {
      juvenile_stats: ['juvenile', '10-17', 'young offender', 'youth'],
      offence_types: ['assault', 'property', 'theft', 'drug', 'traffic'],
      demographics: ['indigenous', 'male', 'female', 'repeat']
    },
    data_type: 'qps_juvenile_stats'
  },
  {
    name: 'QPS Crime Trends Portal',
    url: 'https://www.police.qld.gov.au/maps-and-statistics',
    description: 'Interactive crime statistics with demographic filters',
    extractors: {
      trend_data: ['trend', 'monthly', 'quarterly', 'annual'],
      regional_breakdown: ['Brisbane', 'Gold Coast', 'Cairns', 'Townsville'],
      repeat_offending: ['repeat', 'recidivist', 'multiple']
    },
    data_type: 'qps_crime_trends'
  },
  {
    name: 'QPS Annual Crime Report 2024',
    url: 'https://www.police.qld.gov.au/sites/default/files/2024-08/QPS_Annual_Crime_Trends_Report_2023-24.pdf',
    description: 'Ten-year timeseries (offences, victims, offenders by age)',
    extractors: {
      historical_trends: ['10-year', 'timeseries', 'youth crime'],
      demographic_analysis: ['age', 'sex', 'indigenous status'],
      media_context: ['near 10-yr lows', 'youth crime trends']
    },
    data_type: 'qps_annual_report'
  },
  {
    name: 'QPS Regional Crime Statistics',
    url: 'https://www.police.qld.gov.au/maps-and-statistics/crime-statistics/regional-statistics',
    description: 'Regional breakdown of youth offending patterns',
    extractors: {
      regional_data: ['Far North', 'North Coast', 'Central', 'South East'],
      youth_specific: ['juvenile', 'young person', 'under 18'],
      incident_types: ['person offences', 'property offences', 'other offences']
    },
    data_type: 'qps_regional_stats'
  }
]

async function scrapeQPSData(target) {
  console.log(`\n🚔 Scraping: ${target.name}`)
  console.log(`   🌐 URL: ${target.url}`)
  console.log(`   📋 Focus: ${target.description}`)
  
  try {
    const scrapeResponse = await firecrawl.scrapeUrl(target.url, {
      formats: ['markdown'],
      includeTags: ['table', 'div', 'span', 'p', 'th', 'td'],
      excludeTags: ['nav', 'footer', 'header', 'aside', 'script'],
      timeout: 45000,
      waitFor: 3000
    })
    
    if (!scrapeResponse.success) {
      throw new Error(`Firecrawl failed: ${scrapeResponse.error || 'Unknown error'}`)
    }
    
    const data = scrapeResponse.data || scrapeResponse
    const markdown = data.markdown || data.content || ''
    const metadata = data.metadata || {}
    
    console.log(`   ✅ Scraped successfully`)
    console.log(`   📄 Title: ${metadata?.title || 'No title'}`)
    console.log(`   📝 Content: ${markdown?.length || 0} characters`)
    
    // Extract youth crime statistics
    const extractedData = await extractQPSStatistics(markdown, target)
    
    // Store in database
    await storeQPSData(extractedData, target)
    
    return {
      name: target.name,
      status: 'success',
      dataExtracted: extractedData.length,
      insights: generateQPSInsights(extractedData, target.data_type)
    }
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`)
    return {
      name: target.name,
      status: 'failed',
      error: error.message
    }
  }
}

async function extractQPSStatistics(markdown, target) {
  const extractedData = []
  
  // Extract juvenile offender statistics
  const juvenileStats = extractJuvenileStats(markdown)
  
  // Extract demographic breakdowns
  const demographics = extractDemographics(markdown)
  
  // Extract trend data
  const trends = extractTrendData(markdown)
  
  // Extract regional statistics
  const regionalData = extractRegionalData(markdown)
  
  switch (target.data_type) {
    case 'qps_juvenile_stats':
      extractedData.push({
        type: 'juvenile_offender_statistics',
        juvenile_offender_count: juvenileStats.total_count,
        age_breakdown: juvenileStats.age_groups,
        offence_types: juvenileStats.offence_categories,
        indigenous_percentage: demographics.indigenous_percentage,
        repeat_offender_indicators: juvenileStats.repeat_flags,
        content_preview: markdown.substring(0, 1000),
        url: target.url,
        scraped_at: new Date().toISOString()
      })
      break
      
    case 'qps_crime_trends':
      extractedData.push({
        type: 'crime_trend_analysis',
        monthly_trends: trends.monthly_data,
        demographic_filters: demographics.available_filters,
        regional_breakdown: regionalData.regions,
        youth_crime_indicators: trends.youth_specific,
        content_preview: markdown.substring(0, 1000),
        url: target.url,
        scraped_at: new Date().toISOString()
      })
      break
      
    case 'qps_annual_report':
      extractedData.push({
        type: 'annual_crime_report',
        ten_year_trends: trends.historical_data,
        youth_crime_context: trends.youth_context,
        demographic_analysis: demographics.detailed_breakdown,
        media_talking_points: trends.key_findings,
        content_preview: markdown.substring(0, 1000),
        url: target.url,
        scraped_at: new Date().toISOString()
      })
      break
      
    case 'qps_regional_stats':
      extractedData.push({
        type: 'regional_crime_statistics',
        regional_breakdown: regionalData.detailed_regions,
        youth_specific_data: regionalData.youth_data,
        incident_categorization: regionalData.incident_types,
        content_preview: markdown.substring(0, 1000),
        url: target.url,
        scraped_at: new Date().toISOString()
      })
      break
  }
  
  return extractedData
}

function extractJuvenileStats(markdown) {
  const stats = {
    total_count: null,
    age_groups: [],
    offence_categories: [],
    repeat_flags: []
  }
  
  // Look for juvenile/youth offender counts
  const juvenileCountMatch = markdown.match(/(?:juvenile|youth).*?offenders?.*?(\d+(?:,\d+)*)/gi)
  if (juvenileCountMatch) {
    const numbers = juvenileCountMatch[0].match(/(\d+(?:,\d+)*)/g)
    stats.total_count = numbers ? numbers[0] : null
  }
  
  // Extract age group mentions
  const ageMatches = markdown.match(/(?:10-17|10 to 17|aged? \d+-\d+)/gi) || []
  stats.age_groups = ageMatches.map(match => match.trim())
  
  // Extract offence types
  const offenceTypes = ['assault', 'theft', 'property', 'drug', 'traffic', 'other']
  stats.offence_categories = offenceTypes.filter(type => 
    new RegExp(type, 'gi').test(markdown)
  )
  
  // Look for repeat offending indicators
  const repeatMatches = markdown.match(/(?:repeat|multiple|recidivist).*?offend/gi) || []
  stats.repeat_flags = repeatMatches.map(match => match.trim())
  
  return stats
}

function extractDemographics(markdown) {
  const demographics = {
    indigenous_percentage: null,
    gender_breakdown: {},
    available_filters: []
  }
  
  // Extract Indigenous percentage
  const indigenousMatch = markdown.match(/Indigenous.*?(\d+(?:\.\d+)?)%/gi)
  if (indigenousMatch) {
    const percentage = indigenousMatch[0].match(/(\d+(?:\.\d+)?)/)[0]
    demographics.indigenous_percentage = percentage + '%'
  }
  
  // Extract gender information
  const maleMatch = markdown.match(/male.*?(\d+(?:\.\d+)?)%/gi)
  const femaleMatch = markdown.match(/female.*?(\d+(?:\.\d+)?)%/gi)
  
  if (maleMatch) demographics.gender_breakdown.male = maleMatch[0]
  if (femaleMatch) demographics.gender_breakdown.female = femaleMatch[0]
  
  // Extract available demographic filters
  const filterKeywords = ['age', 'sex', 'indigenous', 'region', 'offence type']
  demographics.available_filters = filterKeywords.filter(keyword =>
    new RegExp(keyword, 'gi').test(markdown)
  )
  
  return demographics
}

function extractTrendData(markdown) {
  const trends = {
    monthly_data: [],
    historical_data: [],
    youth_context: [],
    youth_specific: [],
    key_findings: []
  }
  
  // Extract monthly/quarterly references
  const monthlyMatches = markdown.match(/(?:monthly|quarterly).*?(?:increase|decrease|stable)/gi) || []
  trends.monthly_data = monthlyMatches.map(match => match.trim())
  
  // Extract historical trend context
  const historicalMatches = markdown.match(/(?:10-year|decade|historical).*?(?:trend|low|high)/gi) || []
  trends.historical_data = historicalMatches.map(match => match.trim())
  
  // Extract youth-specific trend mentions
  const youthTrendMatches = markdown.match(/youth crime.*?(?:near.*?lows?|increasing|decreasing)/gi) || []
  trends.youth_specific = youthTrendMatches.map(match => match.trim())
  
  // Extract key findings for media/advocacy
  if (markdown.toLowerCase().includes('near 10-yr lows')) {
    trends.key_findings.push('Youth crime near 10-year lows')
  }
  
  return trends
}

function extractRegionalData(markdown) {
  const regionalData = {
    regions: [],
    detailed_regions: {},
    youth_data: {},
    incident_types: []
  }
  
  // Extract Queensland regions
  const qldRegions = ['Brisbane', 'Gold Coast', 'Cairns', 'Townsville', 'Mackay', 'Rockhampton']
  regionalData.regions = qldRegions.filter(region =>
    new RegExp(region, 'gi').test(markdown)
  )
  
  // Extract incident type categories
  const incidentTypes = ['person offences', 'property offences', 'other offences', 'drug offences']
  regionalData.incident_types = incidentTypes.filter(type =>
    new RegExp(type.replace(' ', '.*'), 'gi').test(markdown)
  )
  
  return regionalData
}

async function storeQPSData(data, target) {
  if (data.length === 0) return
  
  try {
    const { error } = await supabase
      .from('scraped_content')
      .insert(data.map(item => ({
        title: `${target.name} - ${item.type}`,
        content: JSON.stringify(item),
        url: target.url,
        source_type: 'qps_crime_stats',
        metadata: {
          data_type: target.data_type,
          extractors: target.extractors
        },
        scraped_at: new Date().toISOString()
      })))
    
    if (error) {
      console.log(`   ⚠️  Database error: ${error.message}`)
      console.log(`   📊 Would store ${data.length} QPS records`)
    } else {
      console.log(`   ✅ Stored ${data.length} QPS statistics`)
    }
  } catch (error) {
    console.log(`   ⚠️  Storage error: ${error.message}`)
  }
}

function generateQPSInsights(data, dataType) {
  const insights = []
  
  if (data.length === 0) {
    insights.push('No QPS statistics extracted')
    return insights
  }
  
  const record = data[0]
  
  switch (dataType) {
    case 'qps_juvenile_stats':
      if (record.juvenile_offender_count) {
        insights.push(`Juvenile offender count: ${record.juvenile_offender_count}`)
      }
      if (record.indigenous_percentage) {
        insights.push(`Indigenous representation: ${record.indigenous_percentage}`)
      }
      if (record.offence_types?.length > 0) {
        insights.push(`${record.offence_types.length} offence categories tracked`)
      }
      break
      
    case 'qps_annual_report':
      insights.push('Ten-year crime trends captured')
      if (record.youth_crime_context?.length > 0) {
        insights.push(`Youth crime context: ${record.youth_crime_context.length} indicators`)
      }
      break
      
    case 'qps_regional_stats':
      if (record.regional_breakdown?.regions?.length > 0) {
        insights.push(`Regional coverage: ${record.regional_breakdown.regions.length} areas`)
      }
      break
      
    default:
      insights.push(`QPS crime statistics captured for ${dataType}`)
  }
  
  return insights
}

async function runQPSScraping() {
  const timestamp = new Date().toISOString()
  const results = []
  
  console.log('\n🚀 Starting QPS crime statistics scraping')
  console.log('   Mission: Extract real-time youth crime data for accountability')
  console.log(`   Targets: ${QPS_TARGETS.length} QPS statistical sources\n`)
  
  for (const target of QPS_TARGETS) {
    const result = await scrapeQPSData(target)
    results.push(result)
    
    // Respectful delay between requests
    await new Promise(resolve => setTimeout(resolve, 3000))
  }
  
  // Summary
  console.log('\n🚔 QPS CRIME STATISTICS SCRAPING SUMMARY')
  console.log('======================================')
  
  const successful = results.filter(r => r.status === 'success')
  const failed = results.filter(r => r.status === 'failed')
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`)
  console.log(`❌ Failed: ${failed.length}/${results.length}`)
  
  if (successful.length > 0) {
    console.log('\n📊 Key Crime Statistics Findings:')
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
    console.log('\n⚠️  Failed Sources:')
    failed.forEach(result => {
      console.log(`   • ${result.name}: ${result.error}`)
    })
  }
  
  console.log('\n🎯 Accountability Impact:')
  console.log('   Real-time youth crime tracking for evidence-based advocacy')
  console.log('   Demographic breakdowns exposing systemic inequalities')
  console.log('   Regional analysis for targeted intervention strategies')
  console.log('   Trend analysis challenging government narratives')
  
  return results
}

// Execute if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runQPSScraping()
    .then(results => {
      console.log('\n✅ QPS crime statistics scraping complete!')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ QPS scraping failed:', error.message)
      process.exit(1)
    })
}

export { runQPSScraping }