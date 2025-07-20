import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Test if tables exist by trying to query them
    const tables = [
      'scraper_health',
      'scraper_runs', 
      'data_quality_metrics',
      'scraper_alerts',
      'rate_limit_configs'
    ]
    
    const tableStatus: Record<string, boolean> = {}
    
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        tableStatus[table] = !error
      } catch (e) {
        tableStatus[table] = false
      }
    }
    
    // If tables don't exist, return setup instructions
    const allTablesExist = Object.values(tableStatus).every(status => status)
    
    if (!allTablesExist) {
      return NextResponse.json({
        success: false,
        message: 'Monitoring tables not found',
        tables: tableStatus,
        instructions: {
          step1: 'Run the migration file at: supabase/migrations/002_scraper_monitoring.sql',
          step2: 'Or copy the SQL and run it directly in Supabase SQL Editor',
          step3: 'Then run: node scripts/seed-monitoring.mjs'
        }
      })
    }
    
    // Seed initial data if tables are empty
    const { data: healthData } = await supabase
      .from('scraper_health')
      .select('*')
      .limit(1)
    
    if (!healthData || healthData.length === 0) {
      // Seed scrapers
      const scrapers = [
        {
          scraper_name: 'Parliament Hansard',
          data_source: 'parliament_hansard',
          status: 'healthy',
          last_run_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          last_success_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          records_scraped: 156,
          error_count: 0,
          consecutive_failures: 0,
          average_runtime_seconds: 125.5
        },
        {
          scraper_name: 'Parliament Committees',
          data_source: 'parliament_committees',
          status: 'healthy',
          last_run_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          last_success_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          records_scraped: 89,
          error_count: 0,
          consecutive_failures: 0,
          average_runtime_seconds: 98.2
        },
        {
          scraper_name: 'Parliament QoN',
          data_source: 'parliament_qon',
          status: 'warning',
          last_run_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          last_success_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
          records_scraped: 0,
          error_count: 2,
          consecutive_failures: 1,
          average_runtime_seconds: 45.8
        },
        {
          scraper_name: 'Treasury Budget',
          data_source: 'treasury_budget',
          status: 'error',
          last_run_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          last_success_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          records_scraped: 0,
          error_count: 5,
          consecutive_failures: 3,
          average_runtime_seconds: 215.3
        },
        {
          scraper_name: 'Budget Website',
          data_source: 'budget_website',
          status: 'healthy',
          last_run_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          last_success_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          records_scraped: 234,
          error_count: 0,
          consecutive_failures: 0,
          average_runtime_seconds: 156.7
        },
        {
          scraper_name: 'Youth Statistics',
          data_source: 'youth_statistics',
          status: 'healthy',
          last_run_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          last_success_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          records_scraped: 45,
          error_count: 1,
          consecutive_failures: 0,
          average_runtime_seconds: 67.9
        },
        {
          scraper_name: 'Court Data',
          data_source: 'court_data',
          status: 'disabled',
          last_run_at: null,
          last_success_at: null,
          records_scraped: 0,
          error_count: 0,
          consecutive_failures: 0,
          average_runtime_seconds: 0
        },
        {
          scraper_name: 'Police Data',
          data_source: 'police_data',
          status: 'disabled',
          last_run_at: null,
          last_success_at: null,
          records_scraped: 0,
          error_count: 0,
          consecutive_failures: 0,
          average_runtime_seconds: 0
        }
      ]
      
      for (const scraper of scrapers) {
        await supabase
          .from('scraper_health')
          .upsert(scraper, {
            onConflict: 'scraper_name,data_source'
          })
      }
      
      // Add sample alerts
      const alerts = [
        {
          scraper_name: 'Treasury Budget',
          data_source: 'treasury_budget',
          alert_type: 'failure',
          severity: 'critical',
          message: 'Scraper has failed 3 consecutive times - PDF parsing error',
          details: { error: 'Unable to extract tables from PDF', consecutive_failures: 3 },
          is_resolved: false
        },
        {
          scraper_name: 'Parliament QoN',
          data_source: 'parliament_qon',
          alert_type: 'missing_data',
          severity: 'medium',
          message: 'No new Questions on Notice found in last 24 hours',
          details: { last_successful_scrape: '2025-06-15', expected_frequency: 'daily' },
          is_resolved: false
        }
      ]
      
      for (const alert of alerts) {
        await supabase
          .from('scraper_alerts')
          .insert(alert)
      }
      
      return NextResponse.json({
        success: true,
        message: 'Monitoring system setup complete',
        seeded: {
          scrapers: scrapers.length,
          alerts: alerts.length
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Monitoring system is ready',
      tables: tableStatus
    })
    
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to setup monitoring system' },
      { status: 500 }
    )
  }
}