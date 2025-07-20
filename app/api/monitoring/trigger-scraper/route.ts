import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { scraper_name, data_source, force = false } = body
    
    const supabase = createClient()
    
    // Check if scraper is already running
    const { data: runningCheck } = await supabase
      .from('scraper_runs')
      .select('*')
      .eq('scraper_name', scraper_name)
      .eq('data_source', data_source)
      .eq('status', 'started')
      .order('started_at', { ascending: false })
      .limit(1)
      .single()

    if (runningCheck && !force) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Scraper is already running',
          run_id: runningCheck.id 
        },
        { status: 409 }
      )
    }

    // Create a new run entry
    const { data: newRun, error: runError } = await supabase
      .from('scraper_runs')
      .insert({
        scraper_name,
        data_source,
        status: 'started',
        metadata: { triggered_by: 'manual', force }
      })
      .select()
      .single()

    if (runError) {
      throw runError
    }

    // Map data source to scraper command
    const scraperCommands: Record<string, string> = {
      'parliament_hansard': 'python src/scrapers/parliament_scraper.py --source hansard',
      'parliament_committees': 'python src/scrapers/parliament_scraper.py --source committees',
      'parliament_qon': 'python src/scrapers/parliament_qon_scraper.py',
      'treasury_budget': 'python src/scrapers/treasury_budget_scraper.py',
      'budget_website': 'python src/scrapers/budget_scraper.py',
      'youth_statistics': 'npm run scrape:youth-stats',
      'court_data': 'npm run scrape:court-data',
      'police_data': 'npm run scrape:police-data'
    }

    const command = scraperCommands[data_source]
    
    if (!command) {
      // Update run as failed
      await supabase
        .from('scraper_runs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: `No scraper command found for data source: ${data_source}`
        })
        .eq('id', newRun.id)

      return NextResponse.json(
        { success: false, error: 'Unknown data source' },
        { status: 400 }
      )
    }

    // Execute scraper asynchronously
    // In production, this would be better handled by a job queue
    executeScraperAsync(command, newRun.id, scraper_name, data_source, supabase)

    return NextResponse.json({
      success: true,
      message: 'Scraper triggered successfully',
      run_id: newRun.id,
      command
    })
  } catch (error) {
    console.error('Error triggering scraper:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to trigger scraper' },
      { status: 500 }
    )
  }
}

async function executeScraperAsync(
  command: string, 
  runId: number, 
  scraperName: string,
  dataSource: string,
  supabase: any
) {
  try {
    console.log(`Executing scraper: ${command}`)
    
    // Execute the command
    const { stdout, stderr } = await execAsync(command, {
      env: {
        ...process.env,
        SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    })

    // Parse output to extract metrics
    const metrics = parseScraperOutput(stdout)
    
    // Update run as completed
    await supabase
      .from('scraper_runs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        records_found: metrics.records_found || 0,
        records_processed: metrics.records_processed || 0,
        records_inserted: metrics.records_inserted || 0,
        records_updated: metrics.records_updated || 0,
        metadata: { stdout: stdout.slice(-1000), stderr: stderr.slice(-1000) }
      })
      .eq('id', runId)

    // Update scraper health
    await supabase
      .from('scraper_health')
      .upsert({
        scraper_name: scraperName,
        data_source: dataSource,
        last_run_at: new Date().toISOString(),
        last_success_at: new Date().toISOString(),
        records_scraped: metrics.records_processed || 0,
        consecutive_failures: 0,
        status: 'healthy'
      }, {
        onConflict: 'scraper_name,data_source'
      })

  } catch (error: any) {
    console.error(`Scraper execution failed:`, error)
    
    // Update run as failed
    await supabase
      .from('scraper_runs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error.message,
        error_stack: error.stack
      })
      .eq('id', runId)

    // Update scraper health
    const { data: currentHealth } = await supabase
      .from('scraper_health')
      .select('consecutive_failures')
      .eq('scraper_name', scraperName)
      .eq('data_source', dataSource)
      .single()

    const consecutiveFailures = (currentHealth?.consecutive_failures || 0) + 1
    
    await supabase
      .from('scraper_health')
      .upsert({
        scraper_name: scraperName,
        data_source: dataSource,
        last_run_at: new Date().toISOString(),
        consecutive_failures: consecutiveFailures,
        error_count: consecutiveFailures,
        status: consecutiveFailures >= 3 ? 'error' : 'warning'
      }, {
        onConflict: 'scraper_name,data_source'
      })

    // Create alert
    if (consecutiveFailures >= 3) {
      await supabase
        .from('scraper_alerts')
        .insert({
          scraper_name: scraperName,
          data_source: dataSource,
          alert_type: 'failure',
          severity: consecutiveFailures >= 5 ? 'critical' : 'high',
          message: `Manual scraper trigger failed: ${error.message}`,
          details: {
            run_id: runId,
            error: error.message,
            consecutive_failures: consecutiveFailures
          }
        })
    }
  }
}

function parseScraperOutput(output: string): any {
  const metrics = {
    records_found: 0,
    records_processed: 0,
    records_inserted: 0,
    records_updated: 0
  }

  // Try to parse common output patterns
  const patterns = {
    records_found: /(?:found|discovered|total):\s*(\d+)/i,
    records_processed: /(?:processed|scraped):\s*(\d+)/i,
    records_inserted: /(?:inserted|added|new):\s*(\d+)/i,
    records_updated: /(?:updated|modified):\s*(\d+)/i
  }

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = output.match(pattern)
    if (match) {
      metrics[key as keyof typeof metrics] = parseInt(match[1])
    }
  }

  // If no specific patterns found, try to parse JSON output
  try {
    const jsonMatch = output.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const jsonData = JSON.parse(jsonMatch[0])
      Object.assign(metrics, jsonData)
    }
  } catch (e) {
    // Ignore JSON parse errors
  }

  return metrics
}