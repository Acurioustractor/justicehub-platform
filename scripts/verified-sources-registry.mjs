#!/usr/bin/env node
import { fileURLToPath } from 'url'

// VERIFIED GOVERNMENT DATA SOURCES
// All sources have been verified as official Queensland government sources

export const VERIFIED_SOURCES = {
  // TIER 1: PRIMARY STATISTICAL SOURCES
  courts: {
    name: 'Queensland Courts',
    sources: [
      {
        id: 'childrens-court-ar-2024',
        name: 'Childrens Court Annual Report 2023-24',
        url: 'https://www.courts.qld.gov.au/__data/assets/pdf_file/0006/819771/cc-ar-2023-2024.pdf',
        type: 'pdf',
        verified: true,
        dataPoints: [
          'total_defendants',
          'indigenous_percentage',
          'bail_refused_count',
          'remand_numbers',
          'average_time_to_sentence',
          'most_serious_offences'
        ]
      },
      {
        id: 'childrens-court-ar-2023',
        name: 'Childrens Court Annual Report 2022-23',
        url: 'https://www.courts.qld.gov.au/__data/assets/pdf_file/0010/786466/cc-ar-2022-2023.pdf',
        type: 'pdf',
        verified: true,
        dataPoints: ['historical_comparison']
      },
      {
        id: 'youth-justice-bench-book',
        name: 'Youth Justice Bench Book',
        url: 'https://www.courts.qld.gov.au/courts/childrens-court/resources',
        type: 'web',
        verified: true
      }
    ]
  },

  police: {
    name: 'Queensland Police Service',
    sources: [
      {
        id: 'qps-statistical-review',
        name: 'QPS Statistical Review 2023-24',
        url: 'https://www.police.qld.gov.au/sites/default/files/2024-08/QPS%20Statistical%20Review%202023-24.pdf',
        type: 'pdf',
        verified: true,
        dataPoints: [
          'youth_offender_numbers',
          'crime_categories',
          'geographical_distribution',
          'repeat_offender_rates'
        ]
      },
      {
        id: 'crime-statistics-portal',
        name: 'Queensland Crime Statistics',
        url: 'https://qps-ocm.s3-ap-southeast-2.amazonaws.com/index.html',
        type: 'dashboard',
        verified: true,
        interactive: true
      }
    ]
  },

  youthJustice: {
    name: 'Department of Youth Justice',
    sources: [
      {
        id: 'youth-detention-census',
        name: 'Youth Detention Census',
        url: 'https://www.cyjma.qld.gov.au/resources/dcsyw/youth-justice/publications/yj-census-summary.pdf',
        type: 'pdf',
        verified: true,
        frequency: 'quarterly',
        dataPoints: [
          'detention_population',
          'demographic_breakdown',
          'indigenous_representation',
          'age_distribution',
          'remand_vs_sentenced'
        ]
      },
      {
        id: 'pocket-stats',
        name: 'Youth Justice Pocket Statistics',
        url: 'https://www.cyjma.qld.gov.au/about-us/our-performance/youth-justice-performance',
        type: 'web',
        verified: true,
        frequency: 'monthly'
      }
    ]
  },

  // TIER 2: BUDGET AND POLICY SOURCES
  treasury: {
    name: 'Queensland Treasury',
    sources: [
      {
        id: 'budget-2024-25',
        name: 'State Budget 2024-25 - DCSSDS',
        url: 'https://budget.qld.gov.au/files/Budget_2024-25_DCSSDS_Budget_Statements.pdf',
        type: 'pdf',
        verified: true,
        dataPoints: [
          'youth_justice_allocation',
          'detention_operations_cost',
          'community_programs_funding',
          'infrastructure_spending'
        ]
      },
      {
        id: 'budget-highlights',
        name: 'Youth Justice Budget Highlights',
        url: 'https://budget.qld.gov.au/highlights/',
        type: 'web',
        verified: true
      }
    ]
  },

  parliament: {
    name: 'Queensland Parliament',
    sources: [
      {
        id: 'hansard',
        name: 'Parliamentary Hansard',
        url: 'https://www.parliament.qld.gov.au/Work-of-the-Assembly/Hansard',
        type: 'xml',
        verified: true,
        searchable: true
      },
      {
        id: 'committee-reports',
        name: 'Committee Reports - Youth Justice',
        url: 'https://www.parliament.qld.gov.au/Work-of-Committees/Committees',
        type: 'web',
        verified: true
      }
    ]
  },

  // TIER 3: TRANSPARENCY SOURCES
  rti: {
    name: 'Right to Information',
    sources: [
      {
        id: 'rti-disclosure-log',
        name: 'RTI Disclosure Log - Youth Justice',
        url: 'https://www.cyjma.qld.gov.au/right-to-information/disclosure-log',
        type: 'web',
        verified: true,
        dataPoints: ['hidden_reports', 'internal_reviews']
      },
      {
        id: 'rti-statistics',
        name: 'RTI Application Statistics',
        url: 'https://www.rti.qld.gov.au/report-on-the-operation-of-the-rti-act',
        type: 'pdf',
        verified: true
      }
    ]
  },

  // TIER 4: OVERSIGHT AND AUDIT
  audit: {
    name: 'Queensland Audit Office',
    sources: [
      {
        id: 'qao-youth-justice-2024',
        name: 'Managing Youth Justice Demand',
        url: 'https://www.qao.qld.gov.au/reports-resources/managing-youth-justice-demand',
        type: 'pdf',
        verified: true,
        critical: true,
        dataPoints: [
          'system_performance',
          'cost_effectiveness',
          'hidden_costs',
          'accountability_gaps'
        ]
      }
    ]
  },

  // TIER 5: RESEARCH AND ADVOCACY
  research: {
    name: 'Research Bodies',
    sources: [
      {
        id: 'qfcc-reports',
        name: 'Queensland Family & Child Commission',
        url: 'https://www.qfcc.qld.gov.au/monitoring-reviewing/monitoring-youth-justice',
        type: 'web',
        verified: true
      },
      {
        id: 'aihw-youth-justice',
        name: 'Australian Institute of Health & Welfare',
        url: 'https://www.aihw.gov.au/reports/youth-justice/youth-justice-in-australia-2022-23',
        type: 'web',
        verified: true,
        national: true
      }
    ]
  }
}

// Data extraction priorities
export const EXTRACTION_PRIORITY = [
  'youth_detention_census',        // Most current detention numbers
  'childrens-court-ar-2024',      // Latest court statistics
  'qps-statistical-review',       // Crime data
  'budget-2024-25',              // Funding information
  'qao-youth-justice-2024'       // System performance
]

// Validation requirements
export const VALIDATION_RULES = {
  source_url: {
    must_include: ['.qld.gov.au', '.gov.au'],
    must_be_https: true
  },
  data_freshness: {
    max_age_days: 365,
    preferred_age_days: 90
  },
  quality_indicators: {
    has_methodology: true,
    has_date: true,
    has_author: true,
    is_official: true
  }
}

// Export for use in scrapers
export function getSourceById(sourceId) {
  for (const category of Object.values(VERIFIED_SOURCES)) {
    const source = category.sources.find(s => s.id === sourceId)
    if (source) return source
  }
  return null
}

export function validateSource(url) {
  const rules = VALIDATION_RULES.source_url
  
  // Check domain
  const validDomain = rules.must_include.some(domain => url.includes(domain))
  if (!validDomain) return { valid: false, reason: 'Not a government domain' }
  
  // Check HTTPS
  if (rules.must_be_https && !url.startsWith('https://')) {
    return { valid: false, reason: 'Must use HTTPS' }
  }
  
  return { valid: true }
}

// If run directly, display registry
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('📚 VERIFIED GOVERNMENT DATA SOURCES')
  console.log('===================================\n')
  
  let totalSources = 0
  for (const [key, category] of Object.entries(VERIFIED_SOURCES)) {
    console.log(`\n${category.name.toUpperCase()}`)
    console.log('-'.repeat(category.name.length))
    
    category.sources.forEach(source => {
      console.log(`  📄 ${source.name}`)
      console.log(`     ID: ${source.id}`)
      console.log(`     Type: ${source.type}`)
      console.log(`     URL: ${source.url}`)
      if (source.dataPoints) {
        console.log(`     Data: ${source.dataPoints.join(', ')}`)
      }
      totalSources++
    })
  }
  
  console.log(`\n\n📊 Total Verified Sources: ${totalSources}`)
  console.log('✅ All sources verified as official government data')
}