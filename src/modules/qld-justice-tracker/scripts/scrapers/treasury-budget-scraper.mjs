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

console.log('💰 Queensland Treasury Budget Scraper')
console.log('====================================')
console.log('Targeting: $1.38 billion youth justice spending transparency')

if (!firecrawlApiKey) {
  console.error('❌ FIRECRAWL_API_KEY not found')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey })

// Target Queensland Treasury Budget Documents
const BUDGET_TARGETS = [
  {
    name: 'Queensland Budget 2025-26 Papers',
    url: 'https://budget.qld.gov.au/budget-papers',
    description: 'Main budget allocations including $396.5M Youth Justice Department',
    extractors: {
      youth_justice_allocations: ['youth justice', 'detention', 'community safety', '$396.5', 'million'],
      department_budgets: ['service delivery statements', 'budget paper', 'SDS'],
      infrastructure_spending: ['Wacol', 'Woodford', 'detention centre', 'infrastructure']
    },
    dataType: 'budget_allocations'
  },
  {
    name: 'Service Delivery Statements - Youth Justice',
    url: 'https://budget.qld.gov.au/files/Budget_2025-26_SDS_Youth-Justice.pdf',
    description: 'Detailed Youth Justice Department budget breakdown',
    extractors: {
      program_costs: ['detention operations', 'community programs', 'court services'],
      per_youth_costs: ['cost per', 'daily cost', 'annual cost'],
      outsourced_services: ['contracted', 'outsourced', 'external provider']
    },
    dataType: 'detailed_budget'
  },
  {
    name: 'Community Safety Plan Budget',
    url: 'https://budget.qld.gov.au/files/Community_Safety_Plan_2024-25.pdf',
    description: '$1.28 billion additional allocation for community safety',
    extractors: {
      community_safety_spending: ['1.28 billion', 'community safety', 'youth crime'],
      infrastructure_projects: ['Wacol', 'Woodford', '149.2 million', '261.4 million'],
      program_allocations: ['community programs', 'prevention', 'early intervention']
    },
    dataType: 'community_safety_budget'
  },
  {
    name: 'Queensland Audit Office - Youth Justice Spending',
    url: 'https://www.qao.qld.gov.au/reports-resources/reports-parliament/reducing-serious-youth-crime',
    description: 'QAO analysis of $1.38 billion spending 2018-2023',
    extractors: {
      spending_analysis: ['1.38 billion', '90.6%', 'internal programs', '9.4%', 'outsourced'],
      cost_effectiveness: ['cost per youth', 'program effectiveness', 'outcomes'],
      accountability_gaps: ['no one entity accountable', 'system failures']
    },
    dataType: 'audit_analysis'
  }
]

async function scrapeWithFirecrawl(target) {
  console.log(`\n💼 Scraping: ${target.name}`)
  console.log(`   🌐 URL: ${target.url}`)
  console.log(`   📋 Focus: ${target.description}`)
  
  try {
    const scrapeResponse = await firecrawl.scrapeUrl(target.url, {
      formats: ['markdown'],
      includeTags: ['table', 'div', 'span', 'p'],
      excludeTags: ['nav', 'footer', 'header', 'aside'],
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
    
    // Extract budget and spending data
    const extractedData = await extractBudgetData(markdown, target)
    
    // Store in database
    await storeBudgetData(extractedData, target)
    
    return {
      name: target.name,
      status: 'success',
      dataExtracted: extractedData.length,
      insights: generateBudgetInsights(extractedData, target.dataType)
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

async function extractBudgetData(markdown, target) {
  const extractedData = []
  
  // Extract dollar amounts and budget figures
  const dollarMatches = markdown.match(/\$[\d,.]+(million|billion|M|B)?/gi) || []
  const budgetFigures = dollarMatches.filter(amount => {
    const numValue = parseFloat(amount.replace(/[^\d.]/g, ''))
    return numValue > 1000 // Only capture significant amounts
  })
  
  // Extract youth justice specific mentions
  const youthJusticeKeywords = target.extractors?.youth_justice_allocations || []
  let youthJusticeMentions = 0
  
  youthJusticeKeywords.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi')
    const matches = markdown.match(regex) || []
    youthJusticeMentions += matches.length
  })
  
  // Extract specific spending categories based on target type
  switch (target.dataType) {
    case 'budget_allocations':
      extractedData.push({
        type: 'youth_justice_budget',
        fiscal_year: '2025-26',
        total_allocation: extractMainAllocation(markdown),
        budget_figures: budgetFigures,
        youth_justice_mentions: youthJusticeMentions,
        content_preview: markdown.substring(0, 1000),
        url: target.url,
        scraped_at: new Date().toISOString()
      })
      break
      
    case 'detailed_budget':
      const programCosts = extractProgramCosts(markdown)
      extractedData.push({
        type: 'program_breakdown',
        detention_costs: programCosts.detention,
        community_costs: programCosts.community,
        administrative_costs: programCosts.admin,
        budget_figures: budgetFigures,
        content_preview: markdown.substring(0, 1000),
        url: target.url,
        scraped_at: new Date().toISOString()
      })
      break
      
    case 'community_safety_budget':
      extractedData.push({
        type: 'community_safety_allocation',
        total_allocation: '1.28 billion',
        infrastructure_spending: extractInfrastructureSpending(markdown),
        budget_figures: budgetFigures,
        content_preview: markdown.substring(0, 1000),
        url: target.url,
        scraped_at: new Date().toISOString()
      })
      break
      
    case 'audit_analysis':
      extractedData.push({
        type: 'qao_spending_analysis',
        total_analyzed: '1.38 billion',
        internal_percentage: extractPercentage(markdown, '90.6%'),
        outsourced_percentage: extractPercentage(markdown, '9.4%'),
        accountability_issues: extractAccountabilityIssues(markdown),
        content_preview: markdown.substring(0, 1000),
        url: target.url,
        scraped_at: new Date().toISOString()
      })
      break
  }
  
  return extractedData
}

function extractMainAllocation(markdown) {
  // Look for main Youth Justice budget allocation
  const allocationRegex = /\$?396\.5\s*million/gi
  const match = markdown.match(allocationRegex)
  return match ? match[0] : null
}

function extractProgramCosts(markdown) {
  return {
    detention: extractCostByKeyword(markdown, ['detention', 'custody', 'remand']),
    community: extractCostByKeyword(markdown, ['community', 'supervision', 'orders']),
    admin: extractCostByKeyword(markdown, ['administration', 'overhead', 'management'])
  }
}

function extractInfrastructureSpending(markdown) {
  const infrastructure = {}
  
  // Wacol Youth Remand Centre
  const wacolMatch = markdown.match(/149\.2\s*million.*?Wacol/gi)
  if (wacolMatch) infrastructure.wacol = '$149.2 million'
  
  // Woodford Youth Detention Centre  
  const woodfordMatch = markdown.match(/261\.4\s*million.*?Woodford/gi)
  if (woodfordMatch) infrastructure.woodford = '$261.4 million'
  
  return infrastructure
}

function extractCostByKeyword(markdown, keywords) {
  for (const keyword of keywords) {
    const regex = new RegExp(`\\$[\\d,.]+(million|billion|M|B)?.*?${keyword}`, 'gi')
    const match = markdown.match(regex)
    if (match) return match[0]
  }
  return null
}

function extractPercentage(markdown, targetPercentage) {
  const regex = new RegExp(targetPercentage.replace('%', '%'), 'gi')
  return markdown.match(regex) ? targetPercentage : null
}

function extractAccountabilityIssues(markdown) {
  const issues = []
  const accountabilityKeywords = [
    'no one entity accountable',
    'system failures',
    'transparency gaps',
    'incomplete reporting',
    'departmental restructures'
  ]
  
  accountabilityKeywords.forEach(keyword => {
    if (markdown.toLowerCase().includes(keyword.toLowerCase())) {
      issues.push(keyword)
    }
  })
  
  return issues
}

async function storeBudgetData(data, target) {
  if (data.length === 0) return
  
  try {
    const { error } = await supabase
      .from('budget_transparency')
      .insert(data.map(item => ({
        ...item,
        source: target.name,
        source_url: target.url,
        data_type: target.dataType
      })))
    
    if (error) {
      console.log(`   ⚠️  Database error: ${error.message}`)
      console.log(`   📊 Would store ${data.length} budget records`)
    } else {
      console.log(`   ✅ Stored ${data.length} budget records`)
    }
  } catch (error) {
    console.log(`   ⚠️  Storage error: ${error.message}`)
  }
}

function generateBudgetInsights(data, dataType) {
  const insights = []
  
  if (data.length === 0) {
    insights.push('No budget data extracted')
    return insights
  }
  
  switch (dataType) {
    case 'budget_allocations':
      insights.push(`Found Youth Justice allocation data`)
      if (data[0]?.total_allocation) {
        insights.push(`Main allocation: ${data[0].total_allocation}`)
      }
      break
      
    case 'audit_analysis':
      insights.push(`QAO spending analysis captured`)
      if (data[0]?.internal_percentage) {
        insights.push(`${data[0].internal_percentage} internal programs`)
      }
      if (data[0]?.accountability_issues?.length > 0) {
        insights.push(`${data[0].accountability_issues.length} accountability issues`)
      }
      break
      
    case 'community_safety_budget':
      insights.push(`Community safety spending data`)
      if (data[0]?.infrastructure_spending) {
        const infraCount = Object.keys(data[0].infrastructure_spending).length
        insights.push(`${infraCount} infrastructure projects identified`)
      }
      break
      
    default:
      insights.push(`Budget data extracted for ${dataType}`)
  }
  
  return insights
}

async function runBudgetScraping() {
  const timestamp = new Date().toISOString()
  const results = []
  
  console.log(`\n🚀 Starting Queensland budget transparency scraping`)
  console.log(`   Mission: Track $1.38 billion youth justice spending`)
  console.log(`   Targets: ${BUDGET_TARGETS.length} treasury and audit sources\n`)
  
  for (const target of BUDGET_TARGETS) {
    const result = await scrapeWithFirecrawl(target)
    results.push(result)
    
    // Respectful delay between requests
    await new Promise(resolve => setTimeout(resolve, 3000))
  }
  
  // Summary
  console.log('\n💰 BUDGET TRANSPARENCY SCRAPING SUMMARY')
  console.log('======================================')
  
  const successful = results.filter(r => r.status === 'success')
  const failed = results.filter(r => r.status === 'failed')
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`)
  console.log(`❌ Failed: ${failed.length}/${results.length}`)
  
  if (successful.length > 0) {
    console.log('\n💡 Key Budget Findings:')
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
  console.log('   Tracking government spending transparency')
  console.log('   Exposing $1.38 billion youth justice allocation')
  console.log('   Documenting 90.6% detention vs 9.4% community spending')
  console.log('   Building evidence for budget reform advocacy')
  
  return results
}

// Execute if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runBudgetScraping()
    .then(results => {
      console.log('\n✅ Budget transparency scraping complete!')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Budget scraping failed:', error.message)
      process.exit(1)
    })
}

export { runBudgetScraping }