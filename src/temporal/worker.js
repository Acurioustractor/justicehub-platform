#!/usr/bin/env node

import { Worker } from '@temporalio/worker'
import { Connection } from '@temporalio/client'
import pino from 'pino'
import dotenv from 'dotenv'
import * as activities from './activities.js'

dotenv.config()

const logger = pino({
  name: 'temporal-worker',
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: { colorize: true }
  } : undefined
})

async function startWorker() {
  try {
    // Connect to Temporal server
    const connection = await Connection.connect({
      address: process.env.TEMPORAL_ADDRESS || 'localhost:7233'
    })

    // Create and run worker
    const worker = await Worker.create({
      connection,
      workflowsPath: new URL('./workflows.js', import.meta.url).pathname,
      activities,
      taskQueue: 'youth-justice-scraper-queue',
      maxConcurrentActivityTaskExecutions: 3, // Limit concurrent scrapers
      maxConcurrentWorkflowTaskExecutions: 1,
      enableLogging: true,
      debugMode: process.env.NODE_ENV === 'development'
    })

    logger.info({
      taskQueue: 'youth-justice-scraper-queue',
      temporalAddress: process.env.TEMPORAL_ADDRESS || 'localhost:7233'
    }, 'Starting Temporal worker for Youth Justice Service Finder')

    // Handle graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down worker...')
      await worker.shutdown()
      process.exit(0)
    }

    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)

    // Start the worker
    await worker.run()
    
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to start Temporal worker')
    process.exit(1)
  }
}

// Start worker if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startWorker()
}

export { startWorker }