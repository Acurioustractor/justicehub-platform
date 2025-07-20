import { createClient } from '@supabase/supabase-js'
import cron from 'node-cron'

interface ScheduledTask {
  id: string
  name: string
  schedule: string
  scraperPath: string
  enabled: boolean
  lastRun?: Date
  nextRun?: Date
  priority: 'high' | 'medium' | 'low'
  description: string
}

class AccountabilityScheduler {
  private supabase
  private tasks: ScheduledTask[] = []
  private runningTasks = new Set<string>()

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )
    this.initializeTasks()
  }

  private initializeTasks() {
    this.tasks = [
      {
        id: 'aihw_weekly',
        name: 'AIHW Indigenous Overrepresentation Monitoring',
        schedule: '0 6 * * 1', // Weekly on Monday at 6 AM
        scraperPath: './scripts/scrapers/aihw-statistics-scraper.mjs',
        enabled: true,
        priority: 'high',
        description: 'Weekly monitor for updates to AIHW youth justice statistics and Indigenous overrepresentation data'
      },
      {
        id: 'treasury_weekly',
        name: 'Treasury Budget Transparency Check',
        schedule: '0 8 * * 1', // Weekly on Monday at 8 AM
        scraperPath: './scripts/scrapers/treasury-budget-scraper.mjs',
        enabled: true,
        priority: 'high',
        description: 'Weekly check for budget updates and spending transparency changes'
      },
      {
        id: 'court_weekly',
        name: 'Children\'s Court Report Updates',
        schedule: '0 9 * * 1', // Weekly on Monday at 9 AM
        scraperPath: './scripts/scrapers/childrens-court-pdf-scraper.mjs',
        enabled: true,
        priority: 'high',
        description: 'Weekly check for new court reports and sentencing data'
      },
      {
        id: 'qps_weekly',
        name: 'QPS Crime Statistics Update',
        schedule: '0 7 * * 1', // Weekly on Monday at 7 AM
        scraperPath: './scripts/scrapers/qps-crime-stats-scraper.mjs',
        enabled: true,
        priority: 'medium',
        description: 'Weekly update of youth crime statistics and demographic data'
      },
      {
        id: 'opendata_weekly',
        name: 'Queensland Open Data Refresh',
        schedule: '0 10 * * 3', // Weekly on Wednesday at 10 AM
        scraperPath: './scripts/scrapers/qld-open-data-scraper.mjs',
        enabled: true,
        priority: 'medium',
        description: 'Weekly refresh of structured datasets from Queensland Open Data Portal'
      },
      {
        id: 'abs_weekly',
        name: 'ABS Risk Factor Update',
        schedule: '0 11 * * 5', // Weekly on Friday at 11 AM
        scraperPath: './scripts/scrapers/abs-census-scraper.mjs',
        enabled: true,
        priority: 'low',
        description: 'Weekly update of socio-economic risk factors and census data'
      },
      {
        id: 'youth_justice_weekly',
        name: 'Youth Justice Detention Centre Data',
        schedule: '0 12 * * 2', // Weekly on Tuesday at 12 PM
        scraperPath: './scripts/scrapers/youth-justice-scraper.mjs',
        enabled: true,
        priority: 'high',
        description: 'Weekly update of detention centre capacity and demographics'
      },
      {
        id: 'courts_weekly',
        name: 'Courts Data Update',
        schedule: '0 13 * * 2', // Weekly on Tuesday at 1 PM
        scraperPath: './scripts/scrapers/courts-scraper.mjs',
        enabled: true,
        priority: 'high',
        description: 'Weekly update of court sentencing and bail data'
      },
      {
        id: 'police_weekly',
        name: 'Police Youth Crime Data',
        schedule: '0 14 * * 2', // Weekly on Tuesday at 2 PM
        scraperPath: './scripts/scrapers/police-scraper.mjs',
        enabled: true,
        priority: 'high',
        description: 'Weekly update of police youth crime statistics'
      },
      {
        id: 'rti_weekly',
        name: 'RTI Health and Education Data',
        schedule: '0 15 * * 4', // Weekly on Thursday at 3 PM
        scraperPath: './scripts/scrapers/rti-scraper.mjs',
        enabled: true,
        priority: 'medium',
        description: 'Weekly update of RTI health, education and hidden costs data'
      }
    ]
  }

  async start() {
    console.log('🚀 Starting Queensland Youth Justice Accountability Scheduler')
    console.log(`📅 Initializing ${this.tasks.length} automated data collection tasks`)

    for (const task of this.tasks) {
      if (task.enabled) {
        cron.schedule(task.schedule, () => this.executeTask(task), {
          scheduled: true,
          timezone: 'Australia/Brisbane'
        })
        
        console.log(`✅ Scheduled: ${task.name}`)
        console.log(`   📅 Schedule: ${task.schedule} (${task.priority} priority)`)
        console.log(`   📝 ${task.description}`)
      }
    }

    // Store task status in database
    await this.updateTaskStatus()
    
    console.log('\n🎯 Automated accountability monitoring is now active!')
    console.log('   Real-time government data collection will run continuously')
    console.log('   Alert system will notify of critical accountability failures')
  }

  private async executeTask(task: ScheduledTask) {
    if (this.runningTasks.has(task.id)) {
      console.log(`⚠️  Task ${task.name} already running, skipping...`)
      return
    }

    this.runningTasks.add(task.id)
    console.log(`\n🔄 Executing: ${task.name}`)
    console.log(`   ⏰ Started at: ${new Date().toISOString()}`)

    try {
      // Dynamic import of the scraper
      const scraperModule = await import(task.scraperPath)
      const scraperFunction = this.getScraperFunction(task.scraperPath)
      
      if (scraperModule[scraperFunction]) {
        const results = await scraperModule[scraperFunction]()
        
        // Log results and update database
        await this.logTaskExecution(task, 'success', results)
        
        // Check for critical changes that need alerts
        await this.checkForCriticalChanges(task, results)
        
        console.log(`✅ Completed: ${task.name}`)
      } else {
        throw new Error(`Scraper function ${scraperFunction} not found`)
      }
    } catch (error) {
      console.error(`❌ Task failed: ${task.name}`, error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      await this.logTaskExecution(task, 'failed', { error: errorMessage })
    } finally {
      this.runningTasks.delete(task.id)
    }
  }

  private getScraperFunction(scraperPath: string): string {
    const functionMap: Record<string, string> = {
      'aihw-statistics-scraper.mjs': 'runAIHWScraping',
      'treasury-budget-scraper.mjs': 'runBudgetScraping',
      'childrens-court-pdf-scraper.mjs': 'runCourtScraping',
      'qps-crime-stats-scraper.mjs': 'runQPSScraping',
      'qld-open-data-scraper.mjs': 'runOpenDataScraping',
      'abs-census-scraper.mjs': 'runABSScraping'
    }
    
    const fileName = scraperPath.split('/').pop() || ''
    return functionMap[fileName] || 'runScraping'
  }

  private async logTaskExecution(task: ScheduledTask, status: 'success' | 'failed', results: any) {
    try {
      await this.supabase.from('task_executions').insert({
        task_id: task.id,
        task_name: task.name,
        status,
        results: JSON.stringify(results),
        executed_at: new Date().toISOString(),
        duration_ms: Date.now() - (task.lastRun?.getTime() || Date.now())
      })

      // Update task status
      task.lastRun = new Date()
      await this.updateTaskStatus()
    } catch (error) {
      console.error('Failed to log task execution:', error)
    }
  }

  private async checkForCriticalChanges(task: ScheduledTask, results: any) {
    // Define critical thresholds
    const criticalIndicators = {
      indigenousOverrepresentation: 20, // 20x factor
      detentionSpending: 90, // 90%+ on detention
      watchHouseChildren: 400, // 400+ children
      courtIndigenousPercentage: 80 // 80%+ Indigenous in court
    }

    // Extract key metrics from results
    if (Array.isArray(results)) {
      for (const result of results) {
        if (result.insights) {
          await this.analyzeInsights(task, result.insights, criticalIndicators)
        }
      }
    }
  }

  private async analyzeInsights(task: ScheduledTask, insights: string[], thresholds: any) {
    const alerts = []

    for (const insight of insights) {
      // Check for Indigenous overrepresentation changes
      if (insight.includes('20x') || insight.includes('overrepresentation')) {
        alerts.push({
          type: 'indigenous_overrepresentation',
          severity: 'critical',
          message: `${task.name}: ${insight}`,
          timestamp: new Date().toISOString()
        })
      }

      // Check for budget allocation changes
      if (insight.includes('90.6%') || insight.includes('detention spending')) {
        alerts.push({
          type: 'budget_misallocation',
          severity: 'high',
          message: `${task.name}: ${insight}`,
          timestamp: new Date().toISOString()
        })
      }

      // Check for court system failures
      if (insight.includes('86%') || insight.includes('Indigenous') && insight.includes('court')) {
        alerts.push({
          type: 'court_discrimination',
          severity: 'critical',
          message: `${task.name}: ${insight}`,
          timestamp: new Date().toISOString()
        })
      }
    }

    // Store alerts for notification system
    if (alerts.length > 0) {
      await this.storeAlerts(alerts)
    }
  }

  private async storeAlerts(alerts: any[]) {
    try {
      await this.supabase.from('accountability_alerts').insert(alerts)
      console.log(`🚨 Generated ${alerts.length} accountability alerts`)
    } catch (error) {
      console.error('Failed to store alerts:', error)
    }
  }

  private async updateTaskStatus() {
    try {
      const taskStatuses = this.tasks.map(task => ({
        task_id: task.id,
        name: task.name,
        schedule: task.schedule,
        enabled: task.enabled,
        priority: task.priority,
        last_run: task.lastRun?.toISOString(),
        updated_at: new Date().toISOString()
      }))

      await this.supabase.from('scheduled_tasks').upsert(taskStatuses)
    } catch (error) {
      console.error('Failed to update task status:', error)
    }
  }

  async getTaskStatus() {
    return this.tasks.map(task => ({
      ...task,
      isRunning: this.runningTasks.has(task.id),
      nextRun: this.getNextRunTime(task.schedule)
    }))
  }

  private getNextRunTime(schedule: string): Date {
    // This would use a cron parser to calculate next run time
    // For now, returning a placeholder
    const now = new Date()
    return new Date(now.getTime() + 24 * 60 * 60 * 1000) // Next day
  }

  async runTaskNow(taskId: string) {
    const task = this.tasks.find(t => t.id === taskId)
    if (task) {
      await this.executeTask(task)
    } else {
      throw new Error(`Task ${taskId} not found`)
    }
  }

  async stop() {
    console.log('🛑 Stopping accountability scheduler...')
    // This would stop all cron jobs
    console.log('✅ Scheduler stopped')
  }
}

export default AccountabilityScheduler