// Railway-optimized server with better error handling
import { createSimpleServer } from './server-simple.js'
import pino from 'pino'

// Background setup function
async function setupDatabaseAndScrapers() {
  logger.info('🚀 Starting background database setup and scraping...')
  
  try {
    // Import and run database setup
    const setupModule = await import('../../scripts/setup-railway-database.js')
    logger.info('✅ Database setup completed')
    
    // Wait a bit, then start scraping
    setTimeout(async () => {
      try {
        logger.info('🕷️ Starting production scrapers...')
        const scraperModule = await import('../../scripts/run-all-scrapers-production.js')
        logger.info('✅ Scraping completed - database populated with real services')
      } catch (error) {
        logger.error('Scraping failed:', error)
      }
    }, 30000) // Wait 30 seconds before starting scrapers
    
  } catch (error) {
    logger.error('Database setup failed:', error)
  }
}

const logger = pino({
  level: process.env.LOG_LEVEL || 'info'
})

async function startRailwayServer() {
  try {
    // Log startup info
    logger.info('Starting Youth Justice Service Finder on Railway...')
    logger.info('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      DATABASE_URL: process.env.DATABASE_URL ? 'Connected' : 'Missing',
      JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Missing'
    })

    // Check critical environment variables
    if (!process.env.DATABASE_URL) {
      logger.error('DATABASE_URL environment variable is missing!')
      logger.info('Make sure PostgreSQL database is added in Railway dashboard')
    }

    if (!process.env.JWT_SECRET) {
      logger.error('JWT_SECRET environment variable is required for security!')
      logger.error('Please set JWT_SECRET in your environment variables')
      process.exit(1)
    }

    // Setup database and run scrapers in background (don't block startup)
    if (process.env.DATABASE_URL) {
      setupDatabaseAndScrapers().catch(error => {
        logger.error('Background setup failed:', error)
      })
    }

    // Create server
    const server = await createSimpleServer({
      logger: logger
    })

    // Add Railway-specific routes
    server.get('/railway-health', async (request, reply) => {
      return {
        status: 'Railway deployment healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        database: process.env.DATABASE_URL ? 'connected' : 'missing',
        uptime: process.uptime()
      }
    })

    // Start server
    const port = process.env.PORT || 3001
    const host = '0.0.0.0' // Important for Railway

    await server.listen({ 
      port: parseInt(port), 
      host: host 
    })

    logger.info(`✅ Server started successfully on ${host}:${port}`)
    logger.info(`🔍 Health check: http://${host}:${port}/health`)
    logger.info(`🚀 Railway health: http://${host}:${port}/railway-health`)
    logger.info(`📚 API docs: http://${host}:${port}/docs`)

  } catch (error) {
    logger.error('Failed to start server:', error)
    
    // Log detailed error info for debugging
    logger.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    })

    // Exit with error code so Railway knows it failed
    process.exit(1)
  }
}

// Handle process signals
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully')
  process.exit(0)
})

// Start server
startRailwayServer()