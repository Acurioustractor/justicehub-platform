import { createClient, SupabaseClient } from '@supabase/supabase-js'

interface ScraperRunOptions {
  scraperName: string
  dataSource: string
  description?: string
}

interface ScraperMetrics {
  recordsFound: number
  recordsProcessed: number
  recordsInserted: number
  recordsUpdated: number
  validationFailures?: any[]
  warnings?: string[]
}

interface DataQualityCheck {
  missingFields: string[]
  validationErrors: any[]
  anomalies: any[]
  completenessScore: number
  validationPassRate: number
}

export class ScraperManager {
  private supabase: SupabaseClient
  private currentRunId: number | null = null
  private startTime: number = 0
  private scraperName: string = ''
  private dataSource: string = ''

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = supabaseKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    
    if (!url || !key) {
      throw new Error('Supabase credentials not provided')
    }
    
    this.supabase = createClient(url, key)
  }

  /**
   * Start a new scraper run
   */
  async startRun(options: ScraperRunOptions): Promise<number> {
    this.scraperName = options.scraperName
    this.dataSource = options.dataSource
    this.startTime = Date.now()

    try {
      // Create a new run record
      const { data: runData, error: runError } = await this.supabase
        .from('scraper_runs')
        .insert({
          scraper_name: options.scraperName,
          data_source: options.dataSource,
          status: 'started',
          started_at: new Date().toISOString(),
          metadata: {
            description: options.description,
            start_time: this.startTime
          }
        })
        .select()
        .single()

      if (runError) throw runError

      this.currentRunId = runData.id

      // Update scraper health
      await this.supabase
        .from('scraper_health')
        .upsert({
          scraper_name: options.scraperName,
          data_source: options.dataSource,
          last_run_at: new Date().toISOString(),
          status: 'healthy'
        }, {
          onConflict: 'scraper_name,data_source'
        })

      console.log(`✅ Started scraper run #${this.currentRunId} for ${options.scraperName}`)
      return this.currentRunId!
    } catch (error) {
      console.error('Failed to start scraper run:', error)
      throw error
    }
  }

  /**
   * Complete a scraper run successfully
   */
  async completeRun(metrics: ScraperMetrics): Promise<void> {
    if (!this.currentRunId) {
      throw new Error('No active scraper run')
    }

    const runtime = (Date.now() - this.startTime) / 1000

    try {
      // Update run record
      const { error: runError } = await this.supabase
        .from('scraper_runs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          runtime_seconds: runtime,
          records_found: metrics.recordsFound,
          records_processed: metrics.recordsProcessed,
          records_inserted: metrics.recordsInserted,
          records_updated: metrics.recordsUpdated,
          warnings: metrics.warnings || []
        })
        .eq('id', this.currentRunId)

      if (runError) throw runError

      // Update scraper health
      await this.supabase
        .from('scraper_health')
        .upsert({
          scraper_name: this.scraperName,
          data_source: this.dataSource,
          last_run_at: new Date().toISOString(),
          last_success_at: new Date().toISOString(),
          records_scraped: metrics.recordsProcessed,
          consecutive_failures: 0,
          status: 'healthy',
          average_runtime_seconds: runtime
        }, {
          onConflict: 'scraper_name,data_source'
        })

      console.log(`✅ Completed scraper run #${this.currentRunId} in ${runtime.toFixed(2)}s`)
      console.log(`   Processed: ${metrics.recordsProcessed}, Inserted: ${metrics.recordsInserted}, Updated: ${metrics.recordsUpdated}`)
      
      this.currentRunId = null
    } catch (error) {
      console.error('Failed to complete scraper run:', error)
      throw error
    }
  }

  /**
   * Fail a scraper run
   */
  async failRun(error: Error | string, retry: boolean = true): Promise<void> {
    if (!this.currentRunId) {
      throw new Error('No active scraper run')
    }

    const errorMessage = error instanceof Error ? error.message : error
    const errorStack = error instanceof Error ? error.stack : undefined

    try {
      // Update run record
      await this.supabase
        .from('scraper_runs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          runtime_seconds: (Date.now() - this.startTime) / 1000,
          error_message: errorMessage,
          error_stack: errorStack
        })
        .eq('id', this.currentRunId)

      // Get current health to update consecutive failures
      const { data: currentHealth } = await this.supabase
        .from('scraper_health')
        .select('consecutive_failures, error_count')
        .eq('scraper_name', this.scraperName)
        .eq('data_source', this.dataSource)
        .single()

      const consecutiveFailures = (currentHealth?.consecutive_failures || 0) + 1
      const errorCount = (currentHealth?.error_count || 0) + 1

      // Update scraper health
      await this.supabase
        .from('scraper_health')
        .upsert({
          scraper_name: this.scraperName,
          data_source: this.dataSource,
          last_run_at: new Date().toISOString(),
          consecutive_failures: consecutiveFailures,
          error_count: errorCount,
          status: consecutiveFailures >= 3 ? 'error' : 'warning'
        }, {
          onConflict: 'scraper_name,data_source'
        })

      // Create alert if needed
      if (consecutiveFailures >= 3) {
        await this.createAlert({
          type: 'failure',
          severity: consecutiveFailures >= 5 ? 'critical' : 'high',
          message: `Scraper has failed ${consecutiveFailures} consecutive times`,
          details: {
            error: errorMessage,
            consecutive_failures: consecutiveFailures,
            should_retry: retry
          }
        })
      }

      console.error(`❌ Failed scraper run #${this.currentRunId}: ${errorMessage}`)
      this.currentRunId = null
    } catch (error) {
      console.error('Failed to record scraper failure:', error)
      throw error
    }
  }

  /**
   * Log a warning during scraping
   */
  async logWarning(message: string, details?: any): Promise<void> {
    if (!this.currentRunId) return

    console.warn(`⚠️  ${message}`, details)

    // Add to run warnings
    const { data: runData } = await this.supabase
      .from('scraper_runs')
      .select('warnings')
      .eq('id', this.currentRunId)
      .single()

    const warnings = runData?.warnings || []
    warnings.push({
      message,
      details,
      timestamp: new Date().toISOString()
    })

    await this.supabase
      .from('scraper_runs')
      .update({ warnings })
      .eq('id', this.currentRunId)
  }

  /**
   * Create an alert
   */
  async createAlert(options: {
    type: 'failure' | 'data_quality' | 'performance' | 'anomaly' | 'missing_data'
    severity: 'critical' | 'high' | 'medium' | 'low'
    message: string
    details?: any
  }): Promise<void> {
    try {
      await this.supabase
        .from('scraper_alerts')
        .insert({
          scraper_name: this.scraperName,
          data_source: this.dataSource,
          alert_type: options.type,
          severity: options.severity,
          message: options.message,
          details: options.details || {},
          is_resolved: false
        })

      console.log(`🚨 Alert created: ${options.message}`)
    } catch (error) {
      console.error('Failed to create alert:', error)
    }
  }

  /**
   * Check data quality
   */
  async checkDataQuality(records: any[]): Promise<DataQualityCheck> {
    const result: DataQualityCheck = {
      missingFields: [],
      validationErrors: [],
      anomalies: [],
      completenessScore: 100,
      validationPassRate: 100
    }

    if (records.length === 0) {
      result.completenessScore = 0
      return result
    }

    // Get validation rules
    const { data: rules } = await this.supabase
      .from('data_validation_rules')
      .select('*')
      .eq('data_source', this.dataSource)
      .eq('is_active', true)

    // Check for missing required fields
    const requiredFields = (rules || [])
      .filter(r => r.rule_type === 'required_field')
      .map(r => r.field_name)

    const fieldCounts: Record<string, number> = {}
    
    records.forEach(record => {
      requiredFields.forEach(field => {
        if (!record[field] || record[field] === '') {
          fieldCounts[field] = (fieldCounts[field] || 0) + 1
        }
      })
    })

    result.missingFields = Object.keys(fieldCounts)
    result.completenessScore = Math.max(0, 100 - (result.missingFields.length * 10))

    // Store quality metrics
    await this.supabase
      .from('data_quality_metrics')
      .upsert({
        data_source: this.dataSource,
        metric_date: new Date().toISOString().split('T')[0],
        completeness_score: result.completenessScore,
        validation_pass_rate: result.validationPassRate,
        missing_fields: result.missingFields,
        validation_failures: result.validationErrors,
        anomalies_detected: result.anomalies,
        record_count: records.length
      }, {
        onConflict: 'data_source,metric_date'
      })

    return result
  }

  /**
   * Retry failed scraper with exponential backoff
   */
  async retryWithBackoff(
    scraperFunction: () => Promise<void>,
    maxRetries: number = 3,
    initialDelay: number = 1000
  ): Promise<void> {
    let retries = 0
    let delay = initialDelay

    while (retries < maxRetries) {
      try {
        await scraperFunction()
        return
      } catch (error) {
        retries++
        
        if (retries >= maxRetries) {
          throw error
        }

        console.log(`🔄 Retrying (${retries}/${maxRetries}) after ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        delay *= 2 // Exponential backoff
      }
    }
  }

  /**
   * Get scraper health status
   */
  async getHealth(): Promise<any> {
    const { data, error } = await this.supabase
      .from('scraper_health')
      .select('*')
      .eq('scraper_name', this.scraperName)
      .eq('data_source', this.dataSource)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Update rate limit info
   */
  async updateRateLimit(requestsUsed: number = 1): Promise<void> {
    // This would track rate limit usage
    // Implementation depends on your rate limiting strategy
  }
}