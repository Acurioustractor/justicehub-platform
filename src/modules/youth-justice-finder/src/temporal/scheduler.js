#!/usr/bin/env node

import { Client, Connection } from '@temporalio/client'
import { ScheduleOverlapPolicy } from '@temporalio/client'
import pino from 'pino'
import dotenv from 'dotenv'

dotenv.config()

const logger = pino({
  name: 'temporal-scheduler',
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: { colorize: true }
  } : undefined
})

async function setupSchedules() {
  try {
    // Connect to Temporal server
    const connection = await Connection.connect({
      address: process.env.TEMPORAL_ADDRESS || 'localhost:7233'
    })

    const client = new Client({ connection })

    logger.info('Setting up scheduled workflows for Youth Justice Service Finder')

    // Schedule 1: Daily data updates at 2 AM
    try {
      await client.schedule.create({
        scheduleId: 'daily-data-update',
        schedule: {
          action: {
            type: 'startWorkflow',
            workflowType: 'dailyDataUpdateWorkflow',
            taskQueue: 'youth-justice-scraper-queue',
            workflowId: 'daily-update-' + new Date().toISOString().split('T')[0],
            workflowExecutionTimeout: '2 hours',
            workflowTaskTimeout: '1 minute'
          },
          spec: {
            // Run daily at 2:00 AM AEST (Brisbane time)
            calendars: [{
              hour: '2',
              minute: '0',
              timeZone: 'Australia/Brisbane'
            }]
          },
          policies: {
            overlap: ScheduleOverlapPolicy.SKIP, // Skip if previous run is still active
            catchupWindow: '1 hour' // Allow catchup within 1 hour if missed
          }
        },
        memo: {
          description: 'Daily automated scraping of all youth justice service databases',
          version: '1.0',
          createdBy: 'Youth Justice Service Finder Setup'
        }
      })
      
      logger.info('✅ Daily data update schedule created (2:00 AM AEST)')
    } catch (error) {
      if (error.message.includes('already exists')) {
        logger.info('Daily data update schedule already exists')
      } else {
        throw error
      }
    }

    // Schedule 2: Weekly maintenance on Sundays at 1 AM
    try {
      await client.schedule.create({
        scheduleId: 'weekly-maintenance',
        schedule: {
          action: {
            type: 'startWorkflow',
            workflowType: 'weeklyMaintenanceWorkflow',
            taskQueue: 'youth-justice-scraper-queue',
            workflowId: 'weekly-maintenance-' + new Date().toISOString().split('T')[0],
            workflowExecutionTimeout: '1 hour',
            workflowTaskTimeout: '1 minute'
          },
          spec: {
            // Run weekly on Sundays at 1:00 AM AEST
            calendars: [{
              hour: '1',
              minute: '0',
              dayOfWeek: '0', // Sunday
              timeZone: 'Australia/Brisbane'
            }]
          },
          policies: {
            overlap: ScheduleOverlapPolicy.SKIP,
            catchupWindow: '2 hours'
          }
        },
        memo: {
          description: 'Weekly maintenance tasks including data cleanup and duplicate detection',
          version: '1.0',
          createdBy: 'Youth Justice Service Finder Setup'
        }
      })

      logger.info('✅ Weekly maintenance schedule created (Sundays 1:00 AM AEST)')
    } catch (error) {
      if (error.message.includes('already exists')) {
        logger.info('Weekly maintenance schedule already exists')
      } else {
        throw error
      }
    }

    // Schedule 3: High-priority scrapers every 6 hours during business hours
    try {
      await client.schedule.create({
        scheduleId: 'priority-scrapers-update',
        schedule: {
          action: {
            type: 'startWorkflow',
            workflowType: 'singleScraperWorkflow',
            args: ['legal-aid'],
            taskQueue: 'youth-justice-scraper-queue',
            workflowId: 'priority-update-' + Date.now(),
            workflowExecutionTimeout: '30 minutes',
            workflowTaskTimeout: '1 minute'
          },
          spec: {
            // Run every 6 hours during business hours (6 AM, 12 PM, 6 PM AEST)
            calendars: [{
              hour: '6,12,18',
              minute: '0',
              timeZone: 'Australia/Brisbane'
            }]
          },
          policies: {
            overlap: ScheduleOverlapPolicy.SKIP,
            catchupWindow: '30 minutes'
          }
        },
        memo: {
          description: 'Frequent updates of high-priority scrapers during business hours',
          version: '1.0',
          createdBy: 'Youth Justice Service Finder Setup'
        }
      })

      logger.info('✅ Priority scrapers schedule created (every 6 hours during business hours)')
    } catch (error) {
      if (error.message.includes('already exists')) {
        logger.info('Priority scrapers schedule already exists')
      } else {
        throw error
      }
    }

    logger.info('🎉 All schedules configured successfully!')
    logger.info(`
📅 Schedule Summary:
• Daily Updates: Every day at 2:00 AM AEST (comprehensive scraping)
• Weekly Maintenance: Sundays at 1:00 AM AEST (cleanup and deduplication)  
• Priority Updates: Every 6 hours during business hours (high-priority sources)

🔍 Monitor schedules: http://localhost:8080 (Temporal Web UI)
📊 View workflow history and status in the Temporal dashboard
`)

    await connection.close()
    
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to setup schedules')
    process.exit(1)
  }
}

// Helper function to list existing schedules
export async function listSchedules() {
  try {
    const connection = await Connection.connect({
      address: process.env.TEMPORAL_ADDRESS || 'localhost:7233'
    })

    const client = new Client({ connection })
    
    const schedules = await client.schedule.list()
    
    logger.info('📋 Current schedules:')
    for await (const schedule of schedules) {
      logger.info(`• ${schedule.scheduleId}: ${schedule.memo?.description || 'No description'}`)
    }

    await connection.close()
    
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to list schedules')
  }
}

// Helper function to trigger a workflow manually
export async function triggerWorkflow(workflowType, args = []) {
  try {
    const connection = await Connection.connect({
      address: process.env.TEMPORAL_ADDRESS || 'localhost:7233'
    })

    const client = new Client({ connection })
    
    const workflowId = `manual-${workflowType}-${Date.now()}`
    
    const result = await client.workflow.start(workflowType, {
      args,
      taskQueue: 'youth-justice-scraper-queue',
      workflowId,
      workflowExecutionTimeout: '1 hour'
    })

    logger.info(`🚀 Started workflow ${workflowType} with ID: ${workflowId}`)
    logger.info(`📍 Track progress: http://localhost:8080/namespaces/default/workflows/${workflowId}`)
    
    await connection.close()
    return { workflowId, runId: result.firstExecutionRunId }
    
  } catch (error) {
    logger.error({ error: error.message }, `Failed to trigger workflow ${workflowType}`)
    throw error
  }
}

// CLI commands
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2]
  
  switch (command) {
    case 'setup':
      setupSchedules()
      break
    case 'list':
      listSchedules()
      break
    case 'trigger':
      const workflowType = process.argv[3]
      const args = process.argv.slice(4)
      if (!workflowType) {
        console.log('Usage: node scheduler.js trigger <workflowType> [args...]')
        process.exit(1)
      }
      triggerWorkflow(workflowType, args)
      break
    default:
      console.log(`
Usage: node scheduler.js <command>

Commands:
  setup     - Create scheduled workflows
  list      - List existing schedules  
  trigger   - Manually trigger a workflow

Examples:
  node scheduler.js setup
  node scheduler.js list
  node scheduler.js trigger dailyDataUpdateWorkflow
  node scheduler.js trigger singleScraperWorkflow legal-aid
`)
      break
  }
}

export { setupSchedules }