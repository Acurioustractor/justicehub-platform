import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get scraper health status
    const { data: healthData, error: healthError } = await supabase
      .from('scraper_health')
      .select('*')
      .order('data_source')

    if (healthError) {
      throw healthError
    }

    // Get recent runs for each scraper
    const { data: recentRuns, error: runsError } = await supabase
      .from('scraper_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(100)

    if (runsError) {
      throw runsError
    }

    // Calculate health scores
    const healthWithScores = (healthData || []).map(scraper => {
      const scraperRuns = recentRuns?.filter(
        run => run.scraper_name === scraper.scraper_name && 
               run.data_source === scraper.data_source
      ) || []
      
      const last24Hours = scraperRuns.filter(run => {
        const runTime = new Date(run.started_at).getTime()
        const dayAgo = Date.now() - (24 * 60 * 60 * 1000)
        return runTime > dayAgo
      })
      
      const failureRate = last24Hours.length > 0
        ? (last24Hours.filter(run => run.status === 'failed').length / last24Hours.length) * 100
        : 0
      
      // Calculate health score
      let healthScore = 100
      healthScore -= scraper.consecutive_failures * 10
      healthScore -= Math.min(30, failureRate)
      
      if (scraper.last_success_at) {
        const hoursSinceSuccess = (Date.now() - new Date(scraper.last_success_at).getTime()) / (1000 * 60 * 60)
        if (hoursSinceSuccess > 48) healthScore -= 30
        else if (hoursSinceSuccess > 24) healthScore -= 15
      }
      
      return {
        ...scraper,
        health_score: Math.max(0, Math.min(100, healthScore)),
        failure_rate: failureRate,
        recent_runs: scraperRuns.slice(0, 5)
      }
    })

    return NextResponse.json({
      success: true,
      data: healthWithScores,
      summary: {
        total: healthWithScores.length,
        healthy: healthWithScores.filter(s => s.status === 'healthy').length,
        warning: healthWithScores.filter(s => s.status === 'warning').length,
        error: healthWithScores.filter(s => s.status === 'error').length,
        disabled: healthWithScores.filter(s => s.status === 'disabled').length
      }
    })
  } catch (error) {
    console.error('Error fetching scraper health:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scraper health' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { scraper_name, data_source, status, records_scraped, error_message } = body
    
    const supabase = createClient()
    
    // Start a new scraper run
    const { data: runData, error: runError } = await supabase
      .from('scraper_runs')
      .insert({
        scraper_name,
        data_source,
        status: 'started',
        records_found: 0,
        records_processed: 0,
        records_inserted: 0,
        records_updated: 0
      })
      .select()
      .single()

    if (runError) {
      throw runError
    }

    // Update scraper health
    const { error: healthError } = await supabase
      .from('scraper_health')
      .upsert({
        scraper_name,
        data_source,
        last_run_at: new Date().toISOString(),
        status: status || 'healthy'
      }, {
        onConflict: 'scraper_name,data_source'
      })

    if (healthError) {
      throw healthError
    }

    return NextResponse.json({
      success: true,
      run_id: runData.id
    })
  } catch (error) {
    console.error('Error starting scraper run:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to start scraper run' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      run_id, 
      status, 
      records_found, 
      records_processed, 
      records_inserted,
      records_updated,
      error_message,
      warnings
    } = body
    
    const supabase = createClient()
    
    // Update scraper run
    const { data: runData, error: runError } = await supabase
      .from('scraper_runs')
      .update({
        status,
        completed_at: status === 'completed' || status === 'failed' ? new Date().toISOString() : null,
        records_found,
        records_processed,
        records_inserted,
        records_updated,
        error_message,
        warnings
      })
      .eq('id', run_id)
      .select()
      .single()

    if (runError) {
      throw runError
    }

    // Calculate runtime
    const runtime = runData.completed_at && runData.started_at
      ? (new Date(runData.completed_at).getTime() - new Date(runData.started_at).getTime()) / 1000
      : null

    if (runtime) {
      await supabase
        .from('scraper_runs')
        .update({ runtime_seconds: runtime })
        .eq('id', run_id)
    }

    // Update scraper health based on run result
    const healthUpdate: any = {
      scraper_name: runData.scraper_name,
      data_source: runData.data_source,
      last_run_at: runData.completed_at || new Date().toISOString()
    }

    if (status === 'completed') {
      healthUpdate.last_success_at = new Date().toISOString()
      healthUpdate.records_scraped = records_processed || 0
      healthUpdate.consecutive_failures = 0
      healthUpdate.status = 'healthy'
    } else if (status === 'failed') {
      const { data: currentHealth } = await supabase
        .from('scraper_health')
        .select('consecutive_failures, error_count')
        .eq('scraper_name', runData.scraper_name)
        .eq('data_source', runData.data_source)
        .single()

      healthUpdate.consecutive_failures = (currentHealth?.consecutive_failures || 0) + 1
      healthUpdate.error_count = (currentHealth?.error_count || 0) + 1
      healthUpdate.status = healthUpdate.consecutive_failures >= 3 ? 'error' : 'warning'
    }

    await supabase
      .from('scraper_health')
      .upsert(healthUpdate, {
        onConflict: 'scraper_name,data_source'
      })

    // Create alert if needed
    if (status === 'failed' && healthUpdate.consecutive_failures >= 3) {
      await supabase
        .from('scraper_alerts')
        .insert({
          scraper_name: runData.scraper_name,
          data_source: runData.data_source,
          alert_type: 'failure',
          severity: healthUpdate.consecutive_failures >= 5 ? 'critical' : 'high',
          message: `Scraper has failed ${healthUpdate.consecutive_failures} consecutive times`,
          details: {
            error_message,
            run_id,
            consecutive_failures: healthUpdate.consecutive_failures
          }
        })
    }

    return NextResponse.json({
      success: true,
      data: runData
    })
  } catch (error) {
    console.error('Error updating scraper run:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update scraper run' },
      { status: 500 }
    )
  }
}