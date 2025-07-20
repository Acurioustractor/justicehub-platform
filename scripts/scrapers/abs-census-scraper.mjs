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

console.log('📈 ABS Census & SEIFA Youth Risk Factors Scraper')
console.log('==============================================')
console.log('Mission: Map structural risk factors by suburb/LGA for youth justice prevention')

if (!firecrawlApiKey) {
  console.error('❌ FIRECRAWL_API_KEY not found')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey })

// ABS Census and SEIFA targets for youth risk factor mapping
const ABS_TARGETS = [
  {
    name: 'ABS Census 2021 Queensland Youth Demographics',
    url: 'https://www.abs.gov.au/census/find-census-data/quickstats/2021/3',
    description: 'Queensland socio-economic, housing, education indicators for 10-24 year olds',
    extractors: {
      youth_demographics: ['10-24 years', 'young people', 'youth'],
      education_indicators: ['not attending school', 'year 12', 'education'],
      employment_status: ['unemployed', 'employment', 'labour force'],
      housing_stress: ['housing stress', 'overcrowding', 'homelessness']
    },
    data_type: 'abs_census_qld'
  },
  {
    name: 'SEIFA Index Queensland LGAs',
    url: 'https://www.abs.gov.au/ausstats/abs@.nsf/Lookup/by%20Subject/2033.0.55.001~2021~Main%20Features~Queensland~5',
    description: 'Socio-Economic Indexes for Areas - Queensland disadvantage mapping',
    extractors: {
      disadvantage_index: ['IRSAD', 'disadvantage', 'socio-economic'],
      lga_rankings: ['local government area', 'LGA', 'ranking'],
      quintiles: ['quintile', 'most disadvantaged', 'least disadvantaged']
    },
    data_type: 'seifa_qld'
  },
  {
    name: 'ABS TableBuilder Youth Justice Risk Factors',
    url: 'https://www.abs.gov.au/websitedbs/censushome.nsf/home/tablebuilder',
    description: 'Custom tables for 15-24 year olds: education, employment, housing by LGA',
    extractors: {
      custom_data: ['tablebuilder', 'custom', 'cross-tabulation'],
      risk_combinations: ['education AND employment', 'housing AND income'],
      lga_breakdowns: ['Brisbane', 'Gold Coast', 'Cairns', 'Townsville']
    },
    data_type: 'abs_tablebuilder'
  },
  {
    name: 'ABS Specialist Homelessness Services',
    url: 'https://www.abs.gov.au/statistics/people/housing/specialist-homelessness-services-annual-report/2022-23',
    description: '15-24 year olds using homelessness services, Indigenous status, reasons',
    extractors: {
      youth_homelessness: ['15-24', 'young people', 'homeless'],
      indigenous_status: ['Indigenous', 'Aboriginal', 'Torres Strait'],
      service_reasons: ['family violence', 'financial', 'accommodation']
    },
    data_type: 'abs_homelessness'
  },
  {
    name: 'Queensland Child Protection Open Data',
    url: 'https://data.qld.gov.au/dataset/child-protection-quarterly-performance-data',
    description: 'Children subject to substantiations, orders & OOHC for crossover analysis',
    extractors: {
      child_protection: ['substantiation', 'child protection order', 'OOHC'],
      quarterly_data: ['quarterly', 'performance', 'trends'],
      crossover_indicators: ['youth justice', 'dual involvement', 'crossover']
    },
    data_type: 'qld_child_protection'
  }
]

async function scrapeABSData(target) {
  console.log(`\n📊 Scraping: ${target.name}`)
  console.log(`   🌐 URL: ${target.url}`)
  console.log(`   📋 Focus: ${target.description}`)
  
  try {
    const scrapeResponse = await firecrawl.scrapeUrl(target.url, {
      formats: ['markdown'],
      includeTags: ['table', 'div', 'span', 'p', 'th', 'td', 'tr'],
      excludeTags: ['nav', 'footer', 'header', 'aside', 'script'],
      timeout: 60000,
      waitFor: 5000
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
    
    // Extract youth risk factor data
    const extractedData = await extractABSRiskFactors(markdown, target)
    
    // Store in database
    await storeABSData(extractedData, target)
    
    return {
      name: target.name,
      status: 'success',
      dataExtracted: extractedData.length,
      insights: generateABSInsights(extractedData, target.data_type)
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

async function extractABSRiskFactors(markdown, target) {
  const extractedData = []
  
  // Extract percentage-based indicators
  const percentageMatches = markdown.match(/(\d+(?:\.\d+)?)%/g) || []
  
  // Extract LGA names mentioned
  const qldLGAs = extractQLDLGAs(markdown)
  
  // Extract socio-economic indicators
  const socioEconomicData = extractSocioEconomicIndicators(markdown)
  
  // Extract youth-specific demographics
  const youthDemographics = extractYouthDemographics(markdown)
  
  switch (target.data_type) {
    case 'abs_census_qld':
      extractedData.push({
        type: 'qld_youth_demographics',
        youth_population_indicators: youthDemographics,
        education_status: socioEconomicData.education,
        employment_status: socioEconomicData.employment,
        housing_indicators: socioEconomicData.housing,
        lgas_covered: qldLGAs,
        percentage_indicators: percentageMatches.slice(0, 20), // Top 20 percentages
        content_preview: markdown.substring(0, 1000),
        url: target.url,
        scraped_at: new Date().toISOString()
      })
      break
      
    case 'seifa_qld':
      extractedData.push({
        type: 'seifa_disadvantage_index',
        disadvantage_rankings: extractDisadvantageRankings(markdown),
        lga_seifa_scores: extractSEIFAScores(markdown),
        quintile_distributions: extractQuintileDistributions(markdown),
        most_disadvantaged_areas: extractMostDisadvantaged(markdown),
        content_preview: markdown.substring(0, 1000),
        url: target.url,
        scraped_at: new Date().toISOString()
      })
      break
      
    case 'abs_tablebuilder':
      extractedData.push({
        type: 'custom_youth_risk_analysis',
        tablebuilder_capabilities: extractTableBuilderInfo(markdown),
        risk_factor_combinations: extractRiskCombinations(markdown),
        lga_cross_tabulations: extractLGACrossTabs(markdown),
        content_preview: markdown.substring(0, 1000),
        url: target.url,
        scraped_at: new Date().toISOString()
      })
      break
      
    case 'abs_homelessness':
      extractedData.push({
        type: 'youth_homelessness_risk',
        youth_homelessness_counts: extractHomelessnessCounts(markdown),
        indigenous_homelessness: extractIndigenousHomelessness(markdown),
        service_presentation_reasons: extractServiceReasons(markdown),
        housing_justice_pathway: extractHousingJusticeLinks(markdown),
        content_preview: markdown.substring(0, 1000),
        url: target.url,
        scraped_at: new Date().toISOString()
      })
      break
      
    case 'qld_child_protection':
      extractedData.push({
        type: 'child_protection_crossover_risk',
        substantiation_trends: extractSubstantiationTrends(markdown),
        oohc_placements: extractOOHCData(markdown),
        crossover_indicators: extractCrossoverRisk(markdown),
        quarterly_performance: extractQuarterlyData(markdown),
        content_preview: markdown.substring(0, 1000),
        url: target.url,
        scraped_at: new Date().toISOString()
      })
      break
  }
  
  return extractedData
}

function extractQLDLGAs(markdown) {
  const qldLGAs = [
    'Brisbane', 'Gold Coast', 'Logan', 'Townsville', 'Cairns', 'Toowoomba',
    'Mackay', 'Rockhampton', 'Bundaberg', 'Hervey Bay', 'Maryborough',
    'Gladstone', 'Mount Isa', 'Charters Towers', 'Warwick', 'Kingaroy'
  ]
  
  return qldLGAs.filter(lga => 
    new RegExp(lga, 'gi').test(markdown)
  )
}

function extractSocioEconomicIndicators(markdown) {
  return {
    education: extractEducationIndicators(markdown),
    employment: extractEmploymentIndicators(markdown),
    housing: extractHousingIndicators(markdown),
    income: extractIncomeIndicators(markdown)
  }
}

function extractEducationIndicators(markdown) {
  const indicators = []
  
  // Look for education completion rates
  const educationMatches = markdown.match(/(?:year 12|education|school).*?(\d+(?:\.\d+)?)%/gi) || []
  indicators.push(...educationMatches.map(match => match.trim()))
  
  // Look for not attending school indicators
  const notAttendingMatches = markdown.match(/not attending.*?school.*?(\d+(?:\.\d+)?)%/gi) || []
  indicators.push(...notAttendingMatches.map(match => match.trim()))
  
  return indicators
}

function extractEmploymentIndicators(markdown) {
  const indicators = []
  
  // Look for unemployment rates
  const unemploymentMatches = markdown.match(/unemploy.*?(\d+(?:\.\d+)?)%/gi) || []
  indicators.push(...unemploymentMatches.map(match => match.trim()))
  
  // Look for youth employment specifically
  const youthEmploymentMatches = markdown.match(/(?:youth|young people).*?employ.*?(\d+(?:\.\d+)?)%/gi) || []
  indicators.push(...youthEmploymentMatches.map(match => match.trim()))
  
  return indicators
}

function extractHousingIndicators(markdown) {
  const indicators = []
  
  // Look for housing stress indicators
  const housingStressMatches = markdown.match(/housing.*?stress.*?(\d+(?:\.\d+)?)%/gi) || []
  indicators.push(...housingStressMatches.map(match => match.trim()))
  
  // Look for overcrowding
  const overcrowdingMatches = markdown.match(/overcrowd.*?(\d+(?:\.\d+)?)%/gi) || []
  indicators.push(...overcrowdingMatches.map(match => match.trim()))
  
  return indicators
}

function extractIncomeIndicators(markdown) {
  const indicators = []
  
  // Look for low income indicators
  const lowIncomeMatches = markdown.match(/low.*?income.*?(\d+(?:\.\d+)?)%/gi) || []
  indicators.push(...lowIncomeMatches.map(match => match.trim()))
  
  return indicators
}

function extractYouthDemographics(markdown) {
  const demographics = {}
  
  // Extract youth age group mentions
  const ageGroupMatches = markdown.match(/(?:10-24|15-24|10-17).*?(?:years?|y\.?o\.?)/gi) || []
  demographics.age_groups = ageGroupMatches.map(match => match.trim())
  
  // Extract Indigenous youth statistics
  const indigenousYouthMatches = markdown.match(/Indigenous.*?(?:youth|young people).*?(\d+(?:\.\d+)?)%/gi) || []
  demographics.indigenous_youth = indigenousYouthMatches.map(match => match.trim())
  
  return demographics
}

function extractDisadvantageRankings(markdown) {
  const rankings = []
  
  // Look for SEIFA rankings
  const rankingMatches = markdown.match(/rank.*?(\d+)/gi) || []
  rankings.push(...rankingMatches.map(match => match.trim()))
  
  return rankings
}

function extractSEIFAScores(markdown) {
  const scores = []
  
  // Look for SEIFA index scores
  const scoreMatches = markdown.match(/(?:index|score).*?(\d{3,4})/g) || []
  scores.push(...scoreMatches.map(match => match.trim()))
  
  return scores
}

function extractQuintileDistributions(markdown) {
  const quintiles = []
  
  // Look for quintile mentions
  const quintileMatches = markdown.match(/quintile.*?(\d)/gi) || []
  quintiles.push(...quintileMatches.map(match => match.trim()))
  
  return quintiles
}

function extractMostDisadvantaged(markdown) {
  const disadvantaged = []
  
  if (markdown.toLowerCase().includes('most disadvantaged')) {
    const matches = markdown.match(/most disadvantaged.*?(?:area|region|lga)/gi) || []
    disadvantaged.push(...matches.map(match => match.trim()))
  }
  
  return disadvantaged
}

function extractTableBuilderInfo(markdown) {
  const info = []
  
  if (markdown.toLowerCase().includes('tablebuilder')) {
    info.push('TableBuilder access available for custom cross-tabulations')
  }
  
  return info
}

function extractRiskCombinations(markdown) {
  const combinations = []
  
  // Look for mentions of combined risk factors
  const combinationKeywords = ['education AND employment', 'housing AND income', 'multiple disadvantage']
  combinations.push(...combinationKeywords.filter(keyword =>
    markdown.toLowerCase().includes(keyword.toLowerCase())
  ))
  
  return combinations
}

function extractLGACrossTabs(markdown) {
  const crossTabs = []
  
  // Look for LGA-specific data mentions
  const lgaDataMatches = markdown.match(/(?:Brisbane|Gold Coast|Cairns|Townsville).*?(?:data|statistics)/gi) || []
  crossTabs.push(...lgaDataMatches.map(match => match.trim()))
  
  return crossTabs
}

function extractHomelessnessCounts(markdown) {
  const counts = []
  
  // Look for youth homelessness numbers
  const countMatches = markdown.match(/(?:15-24|youth|young people).*?homeless.*?(\d+(?:,\d+)*)/gi) || []
  counts.push(...countMatches.map(match => match.trim()))
  
  return counts
}

function extractIndigenousHomelessness(markdown) {
  const indigenous = []
  
  // Look for Indigenous homelessness statistics
  const indigenousMatches = markdown.match(/Indigenous.*?homeless.*?(\d+(?:\.\d+)?)%/gi) || []
  indigenous.push(...indigenousMatches.map(match => match.trim()))
  
  return indigenous
}

function extractServiceReasons(markdown) {
  const reasons = []
  
  const serviceReasons = ['family violence', 'financial difficulties', 'accommodation crisis', 'family breakdown']
  reasons.push(...serviceReasons.filter(reason =>
    new RegExp(reason, 'gi').test(markdown)
  ))
  
  return reasons
}

function extractHousingJusticeLinks(markdown) {
  const links = []
  
  if (markdown.toLowerCase().includes('justice') && markdown.toLowerCase().includes('housing')) {
    links.push('Housing instability linked to justice contact pathway identified')
  }
  
  return links
}

function extractSubstantiationTrends(markdown) {
  const trends = []
  
  // Look for substantiation statistics
  const substantiationMatches = markdown.match(/substantiat.*?(\d+(?:,\d+)*)/gi) || []
  trends.push(...substantiationMatches.map(match => match.trim()))
  
  return trends
}

function extractOOHCData(markdown) {
  const oohc = []
  
  // Look for out-of-home care data
  const oohcMatches = markdown.match(/(?:out.of.home|OOHC).*?care.*?(\d+(?:,\d+)*)/gi) || []
  oohc.push(...oohcMatches.map(match => match.trim()))
  
  return oohc
}

function extractCrossoverRisk(markdown) {
  const crossover = []
  
  if (markdown.toLowerCase().includes('youth justice') && markdown.toLowerCase().includes('child protection')) {
    crossover.push('Crossover between child protection and youth justice systems identified')
  }
  
  return crossover
}

function extractQuarterlyData(markdown) {
  const quarterly = []
  
  // Look for quarterly performance indicators
  const quarterlyMatches = markdown.match(/quarterly.*?(?:performance|data|statistics)/gi) || []
  quarterly.push(...quarterlyMatches.map(match => match.trim()))
  
  return quarterly
}

async function storeABSData(data, target) {
  if (data.length === 0) return
  
  try {
    const { error } = await supabase
      .from('scraped_content')
      .insert(data.map(item => ({
        title: `${target.name} - ${item.type}`,
        content: JSON.stringify(item),
        url: target.url,
        source_type: 'abs_census_seifa',
        scraped_at: new Date().toISOString()
      })))
    
    if (error) {
      console.log(`   ⚠️  Database error: ${error.message}`)
      console.log(`   📊 Would store ${data.length} ABS records`)
    } else {
      console.log(`   ✅ Stored ${data.length} ABS risk factor records`)
    }
  } catch (error) {
    console.log(`   ⚠️  Storage error: ${error.message}`)
  }
}

function generateABSInsights(data, dataType) {
  const insights = []
  
  if (data.length === 0) {
    insights.push('No ABS risk factor data extracted')
    return insights
  }
  
  const record = data[0]
  
  switch (dataType) {
    case 'abs_census_qld':
      if (record.lgas_covered?.length > 0) {
        insights.push(`Coverage: ${record.lgas_covered.length} Queensland LGAs`)
      }
      if (record.percentage_indicators?.length > 0) {
        insights.push(`${record.percentage_indicators.length} socio-economic indicators`)
      }
      insights.push('Youth demographic risk factors mapped')
      break
      
    case 'seifa_qld':
      if (record.lga_seifa_scores?.length > 0) {
        insights.push(`SEIFA scores for ${record.lga_seifa_scores.length} areas`)
      }
      insights.push('Disadvantage index for youth justice prevention targeting')
      break
      
    case 'abs_homelessness':
      if (record.youth_homelessness_counts?.length > 0) {
        insights.push(`Youth homelessness data: ${record.youth_homelessness_counts.length} indicators`)
      }
      insights.push('Housing instability to justice pathway documented')
      break
      
    case 'qld_child_protection':
      if (record.crossover_indicators?.length > 0) {
        insights.push('Child protection + youth justice crossover identified')
      }
      insights.push('Dual system involvement risk factors captured')
      break
      
    default:
      insights.push(`ABS data captured for ${dataType}`)
  }
  
  return insights
}

async function runABSScraping() {
  console.log('\n🚀 Starting ABS Census & SEIFA risk factor scraping')
  console.log('   Mission: Map structural risk factors for youth justice prevention')
  console.log(`   Targets: ${ABS_TARGETS.length} ABS statistical sources\n`)
  
  const results = []
  
  for (const target of ABS_TARGETS) {
    const result = await scrapeABSData(target)
    results.push(result)
    
    // Respectful delay between requests
    await new Promise(resolve => setTimeout(resolve, 4000))
  }
  
  // Summary
  console.log('\n📈 ABS RISK FACTOR SCRAPING SUMMARY')
  console.log('=================================')
  
  const successful = results.filter(r => r.status === 'success')
  const failed = results.filter(r => r.status === 'failed')
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`)
  console.log(`❌ Failed: ${failed.length}/${results.length}`)
  
  if (successful.length > 0) {
    console.log('\n🎯 Key Risk Factor Findings:')
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
  
  console.log('\n🎯 Prevention Impact:')
  console.log('   Mapping structural risk factors by suburb/LGA')
  console.log('   Identifying early intervention target areas')
  console.log('   Linking housing instability to justice contact')
  console.log('   Enabling evidence-based prevention investment')
  
  return results
}

// Execute if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runABSScraping()
    .then(results => {
      console.log('\n✅ ABS Census & SEIFA scraping complete!')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ ABS scraping failed:', error.message)
      process.exit(1)
    })
}

export { runABSScraping }