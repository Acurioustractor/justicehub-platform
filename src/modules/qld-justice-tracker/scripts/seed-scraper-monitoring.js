import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Define all scrapers in the system
const scrapers = [
  // Python scrapers
  {
    scraper_name: 'Parliament Scraper',
    data_source: 'parliament_hansard',
    description: 'Scrapes Queensland Parliament Hansard records',
    schedule: 'Daily at 9 AM Brisbane time',
    language: 'Python',
    file_path: 'src/scrapers/parliament_scraper.py'
  },
  {
    scraper_name: 'Parliament Scraper',
    data_source: 'parliament_committees',
    description: 'Scrapes Queensland Parliament Committee reports',
    schedule: 'Daily at 9 AM Brisbane time',
    language: 'Python',
    file_path: 'src/scrapers/parliament_scraper.py'
  },
  {
    scraper_name: 'Parliament QoN Scraper',
    data_source: 'parliament_qon',
    description: 'Scrapes Questions on Notice from Parliament',
    schedule: 'Daily at 9 AM Brisbane time',
    language: 'Python',
    file_path: 'src/scrapers/parliament_qon_scraper.py'
  },
  {
    scraper_name: 'Treasury Budget Scraper',
    data_source: 'treasury_budget',
    description: 'Scrapes Queensland Treasury budget PDFs',
    schedule: 'Daily at 9 AM Brisbane time',
    language: 'Python',
    file_path: 'src/scrapers/treasury_budget_scraper.py'
  },
  {
    scraper_name: 'Budget Scraper',
    data_source: 'budget_website',
    description: 'Scrapes budget data from government websites',
    schedule: 'Daily at 9 AM Brisbane time',
    language: 'Python',
    file_path: 'src/scrapers/budget_scraper.py'
  },
  // JavaScript scrapers
  {
    scraper_name: 'JS Parliament Scraper',
    data_source: 'parliament_hansard',
    description: 'JavaScript version of Parliament Hansard scraper',
    schedule: 'Daily at 3 AM Brisbane time',
    language: 'JavaScript',
    file_path: 'scripts/scrapers/parliament.js'
  },
  {
    scraper_name: 'JS Budget Scraper',
    data_source: 'budget_website',
    description: 'JavaScript version of budget scraper',
    schedule: 'Daily at 2 AM Brisbane time',
    language: 'JavaScript',
    file_path: 'scripts/scrapers/budget.js'
  },
  // Placeholder scrapers for future implementation
  {
    scraper_name: 'Youth Statistics Scraper',
    data_source: 'youth_statistics',
    description: 'Scrapes youth justice statistics from government portals',
    schedule: 'Weekly',
    language: 'Python',
    file_path: 'src/scrapers/youth_stats_scraper.py'
  },
  {
    scraper_name: 'Court Data Scraper',
    data_source: 'court_data',
    description: 'Scrapes court proceedings and youth justice cases',
    schedule: 'Weekly',
    language: 'Python',
    file_path: 'src/scrapers/court_scraper.py'
  },
  {
    scraper_name: 'Police Data Scraper',
    data_source: 'police_data',
    description: 'Scrapes police statistics on youth crime',
    schedule: 'Monthly',
    language: 'Python',
    file_path: 'src/scrapers/police_scraper.py'
  }
]

// Seed validation rules
const validationRules = [
  // Budget data validation
  {
    data_source: 'budget_website',
    rule_name: 'amount_required',
    rule_type: 'required_field',
    field_name: 'amount',
    validation_logic: { required: true },
    error_message: 'Budget amount is required',
    severity: 'error'
  },
  {
    data_source: 'budget_website',
    rule_name: 'amount_format',
    rule_type: 'format',
    field_name: 'amount',
    validation_logic: { pattern: '^\\$?[0-9,]+(\\.\\d{2})?$' },
    error_message: 'Amount must be in valid currency format',
    severity: 'error'
  },
  {
    data_source: 'treasury_budget',
    rule_name: 'year_range',
    rule_type: 'range',
    field_name: 'year',
    validation_logic: { min: 2020, max: 2030 },
    error_message: 'Year must be between 2020 and 2030',
    severity: 'warning'
  },
  // Parliament data validation
  {
    data_source: 'parliament_hansard',
    rule_name: 'date_required',
    rule_type: 'required_field',
    field_name: 'date',
    validation_logic: { required: true },
    error_message: 'Hansard date is required',
    severity: 'error'
  },
  {
    data_source: 'parliament_qon',
    rule_name: 'question_number_format',
    rule_type: 'format',
    field_name: 'question_number',
    validation_logic: { pattern: '^QON\\d{4}-\\d{4}$' },
    error_message: 'Question number must be in format QON####-####',
    severity: 'warning'
  },
  // Youth statistics validation
  {
    data_source: 'youth_statistics',
    rule_name: 'percentage_range',
    rule_type: 'range',
    field_name: 'indigenous_percentage',
    validation_logic: { min: 0, max: 100 },
    error_message: 'Percentage must be between 0 and 100',
    severity: 'error'
  }
]

// Seed selector alternatives for self-healing
const selectorAlternatives = [
  {
    scraper_name: 'Parliament Scraper',
    data_source: 'parliament_hansard',
    field_name: 'content',
    primary_selector: '.hansard-content',
    alternative_selectors: [
      'div[class*="hansard"]',
      'main .content',
      '#hansard-text'
    ],
    xpath_alternatives: [
      '//div[@class="hansard-content"]',
      '//main//div[contains(@class, "content")]'
    ]
  },
  {
    scraper_name: 'Budget Scraper',
    data_source: 'budget_website',
    field_name: 'amount',
    primary_selector: '.budget-amount',
    alternative_selectors: [
      'td.amount',
      'span[class*="amount"]',
      '.financial-value'
    ],
    xpath_alternatives: [
      '//td[contains(@class, "amount")]',
      '//span[contains(text(), "$")]'
    ]
  },
  {
    scraper_name: 'Treasury Budget Scraper',
    data_source: 'treasury_budget',
    field_name: 'table',
    primary_selector: 'table.budget-table',
    alternative_selectors: [
      'table[class*="financial"]',
      '.data-table',
      'table:contains("Budget")'
    ],
    xpath_alternatives: [
      '//table[contains(@class, "budget")]',
      '//table[.//th[contains(text(), "Amount")]]'
    ]
  }
]

async function seedMonitoringData() {
  console.log('Starting scraper monitoring seed...')

  try {
    // 1. Seed scraper health records
    console.log('\n1. Seeding scraper health records...')
    for (const scraper of scrapers) {
      const { error } = await supabase
        .from('scraper_health')
        .upsert({
          scraper_name: scraper.scraper_name,
          data_source: scraper.data_source,
          status: 'healthy',
          last_run_at: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(), // Random time in last 24h
          last_success_at: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
          next_scheduled_run: new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000).toISOString(),
          records_scraped: Math.floor(Math.random() * 1000),
          error_count: 0,
          consecutive_failures: 0,
          average_runtime_seconds: Math.random() * 300 + 30 // 30-330 seconds
        }, {
          onConflict: 'scraper_name,data_source'
        })

      if (error) {
        console.error(`Error seeding ${scraper.scraper_name}:`, error)
      } else {
        console.log(`✓ Seeded ${scraper.scraper_name} - ${scraper.data_source}`)
      }
    }

    // 2. Seed some sample scraper runs
    console.log('\n2. Seeding sample scraper runs...')
    for (const scraper of scrapers.slice(0, 5)) { // Just seed runs for first 5 scrapers
      // Create 5 sample runs per scraper
      for (let i = 0; i < 5; i++) {
        const startTime = new Date(Date.now() - (i + 1) * 6 * 60 * 60 * 1000) // Every 6 hours
        const runtime = Math.random() * 300 + 30
        const status = Math.random() > 0.8 ? 'failed' : 'completed'
        
        const { error } = await supabase
          .from('scraper_runs')
          .insert({
            scraper_name: scraper.scraper_name,
            data_source: scraper.data_source,
            status: status,
            started_at: startTime.toISOString(),
            completed_at: new Date(startTime.getTime() + runtime * 1000).toISOString(),
            runtime_seconds: runtime,
            records_found: Math.floor(Math.random() * 500),
            records_processed: Math.floor(Math.random() * 500),
            records_inserted: Math.floor(Math.random() * 100),
            records_updated: Math.floor(Math.random() * 50),
            error_message: status === 'failed' ? 'Connection timeout' : null
          })

        if (error) {
          console.error(`Error seeding run:`, error)
        }
      }
      console.log(`✓ Seeded 5 runs for ${scraper.scraper_name}`)
    }

    // 3. Seed data quality metrics
    console.log('\n3. Seeding data quality metrics...')
    const dataSources = ['parliament_hansard', 'parliament_qon', 'treasury_budget', 'budget_website']
    
    for (const source of dataSources) {
      // Create metrics for last 7 days
      for (let i = 0; i < 7; i++) {
        const metricDate = new Date()
        metricDate.setDate(metricDate.getDate() - i)
        
        const { error } = await supabase
          .from('data_quality_metrics')
          .upsert({
            data_source: source,
            metric_date: metricDate.toISOString().split('T')[0],
            completeness_score: Math.random() * 30 + 70, // 70-100%
            validation_pass_rate: Math.random() * 20 + 80, // 80-100%
            missing_fields: Math.random() > 0.7 ? ['field1', 'field2'] : [],
            validation_failures: [],
            anomalies_detected: Math.random() > 0.9 ? [{ type: 'spike', severity: 'medium' }] : [],
            record_count: Math.floor(Math.random() * 1000) + 100
          }, {
            onConflict: 'data_source,metric_date'
          })

        if (error) {
          console.error(`Error seeding quality metrics:`, error)
        }
      }
      console.log(`✓ Seeded quality metrics for ${source}`)
    }

    // 4. Seed validation rules
    console.log('\n4. Seeding validation rules...')
    for (const rule of validationRules) {
      const { error } = await supabase
        .from('data_validation_rules')
        .insert(rule)

      if (error && !error.message.includes('duplicate')) {
        console.error(`Error seeding rule:`, error)
      }
    }
    console.log(`✓ Seeded ${validationRules.length} validation rules`)

    // 5. Seed selector alternatives
    console.log('\n5. Seeding selector alternatives...')
    for (const selector of selectorAlternatives) {
      const { error } = await supabase
        .from('selector_alternatives')
        .upsert(selector, {
          onConflict: 'scraper_name,data_source,field_name'
        })

      if (error) {
        console.error(`Error seeding selector:`, error)
      }
    }
    console.log(`✓ Seeded ${selectorAlternatives.length} selector alternatives`)

    // 6. Create some sample alerts
    console.log('\n6. Creating sample alerts...')
    const alerts = [
      {
        scraper_name: 'Parliament Scraper',
        data_source: 'parliament_hansard',
        alert_type: 'failure',
        severity: 'high',
        message: 'Scraper failed 3 consecutive times - connection timeout',
        details: { consecutive_failures: 3, last_error: 'ETIMEDOUT' },
        is_resolved: false
      },
      {
        scraper_name: 'Budget Scraper',
        data_source: 'budget_website',
        alert_type: 'data_quality',
        severity: 'medium',
        message: 'Data completeness dropped below 80%',
        details: { completeness_score: 75, previous_score: 95 },
        is_resolved: false
      },
      {
        scraper_name: 'Treasury Budget Scraper',
        data_source: 'treasury_budget',
        alert_type: 'anomaly',
        severity: 'low',
        message: 'Unusual spike in record count detected',
        details: { current_count: 2500, average_count: 500, z_score: 4.2 },
        is_resolved: true,
        resolved_at: new Date().toISOString()
      }
    ]

    for (const alert of alerts) {
      const { error } = await supabase
        .from('scraper_alerts')
        .insert(alert)

      if (error) {
        console.error(`Error creating alert:`, error)
      }
    }
    console.log(`✓ Created ${alerts.length} sample alerts`)

    console.log('\n✅ Scraper monitoring seed completed successfully!')
    console.log('\nYou can now view the monitoring dashboard at: http://localhost:3001/monitoring')

  } catch (error) {
    console.error('Seed failed:', error)
    process.exit(1)
  }
}

// Run the seed
seedMonitoringData()