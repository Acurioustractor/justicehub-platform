/**
 * Production Pipeline Service
 * 
 * Automated data extraction service that runs scheduled jobs
 * and maintains the service database.
 */

import { PipelineManager } from './data-pipeline/orchestration/pipeline-manager.js';
import { DatabaseManager } from './database/database-manager.js';
import cron from 'node-cron';
import express from 'express';
import { createServer } from 'http';

class PipelineService {
    constructor() {
        this.pipeline = new PipelineManager({
            batchSize: parseInt(process.env.BATCH_SIZE) || 100,
            maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS) || 2,
            enableDeduplication: true,
            minQualityScore: 0.1
        });
        
        this.database = new DatabaseManager();
        this.app = express();
        this.server = null;
        this.isRunning = false;
        this.lastRunStatus = null;
        
        this.setupExpress();
        this.setupScheduler();
        this.setupEventHandlers();
    }
    
    setupExpress() {
        this.app.use(express.json());
        
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'pipeline-service',
                timestamp: new Date().toISOString(),
                isRunning: this.isRunning,
                lastRun: this.lastRunStatus,
                uptime: process.uptime()
            });
        });
        
        // Pipeline status endpoint
        this.app.get('/status', (req, res) => {
            const stats = this.pipeline.getStats();
            res.json({
                pipeline: stats,
                database: {
                    connected: this.database.isConnected
                },
                lastRun: this.lastRunStatus
            });
        });
        
        // Manual trigger endpoint
        this.app.post('/trigger', async (req, res) => {
            if (this.isRunning) {
                return res.status(409).json({
                    error: 'Pipeline is already running'
                });
            }
            
            try {
                console.log('📡 Manual pipeline trigger requested');
                this.runPipeline();
                res.json({
                    message: 'Pipeline started successfully',
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    error: 'Failed to start pipeline',
                    message: error.message
                });
            }
        });
        
        // Statistics endpoint
        this.app.get('/statistics', async (req, res) => {
            try {
                const stats = await this.database.getStatistics();
                res.json(stats);
            } catch (error) {
                res.status(500).json({
                    error: 'Failed to get statistics',
                    message: error.message
                });
            }
        });
    }
    
    setupScheduler() {
        const schedule = process.env.PIPELINE_SCHEDULE || '0 2 * * *'; // Daily at 2 AM
        
        console.log(`📅 Pipeline scheduled: ${schedule}`);
        
        cron.schedule(schedule, () => {
            console.log('⏰ Scheduled pipeline execution starting...');
            this.runPipeline();
        }, {
            scheduled: true,
            timezone: "Australia/Brisbane"
        });
        
        // Also run every 6 hours for high-frequency sources
        cron.schedule('0 */6 * * *', () => {
            console.log('⚡ High-frequency pipeline execution starting...');
            this.runHighFrequencyUpdate();
        }, {
            scheduled: true,
            timezone: "Australia/Brisbane"
        });
    }
    
    setupEventHandlers() {
        this.pipeline.on('jobCompleted', (job) => {
            console.log(`✅ Job completed: ${job.source} - ${job.result.servicesProcessed} services`);
        });
        
        this.pipeline.on('jobFailed', (job) => {
            console.error(`❌ Job failed: ${job.source} - ${job.error?.message}`);
        });
        
        this.pipeline.on('pipelineCompleted', (stats) => {
            console.log(`🎉 Pipeline completed: ${stats.servicesProcessed} services processed`);
            this.isRunning = false;
            this.lastRunStatus = {
                timestamp: new Date().toISOString(),
                status: 'completed',
                stats: stats
            };
        });
        
        this.pipeline.on('pipelineError', (error) => {
            console.error(`💥 Pipeline error: ${error.message}`);
            this.isRunning = false;
            this.lastRunStatus = {
                timestamp: new Date().toISOString(),
                status: 'failed',
                error: error.message
            };
        });
        
        // Graceful shutdown
        process.on('SIGTERM', () => this.shutdown());
        process.on('SIGINT', () => this.shutdown());
    }
    
    async start() {
        try {
            console.log('🚀 Starting Youth Justice Service Finder Pipeline Service...');
            
            // Initialize database
            await this.database.initialize();
            console.log('✅ Database connected');
            
            // Start HTTP server
            const port = process.env.PORT || 3002;
            this.server = createServer(this.app);
            
            this.server.listen(port, () => {
                console.log(`🌐 Pipeline service listening on port ${port}`);
                console.log(`📊 Health check: http://localhost:${port}/health`);
                console.log(`📈 Status: http://localhost:${port}/status`);
            });
            
            // Run initial extraction if no data exists
            const stats = await this.database.getStatistics();
            if (stats.total_services === 0) {
                console.log('📦 No existing data found, running initial extraction...');
                setTimeout(() => this.runPipeline(), 5000); // Wait 5 seconds for startup
            }
            
            console.log('✅ Pipeline service started successfully');
            
        } catch (error) {
            console.error('💥 Failed to start pipeline service:', error);
            process.exit(1);
        }
    }
    
    async runPipeline() {
        if (this.isRunning) {
            console.log('⚠️  Pipeline already running, skipping...');
            return;
        }
        
        this.isRunning = true;
        console.log('🔄 Starting full pipeline execution...');
        
        try {
            const sources = [
                {
                    name: 'acnc',
                    limit: 500,
                    config: { youthOnly: true }
                },
                {
                    name: 'qld-data',
                    limit: 50,
                    config: { datasets: ['youthJusticeCentres'] }
                },
                {
                    name: 'vic-cso',
                    limit: 100,
                    config: {}
                }
            ];
            
            let totalProcessed = 0;
            
            for (const source of sources) {
                console.log(`🏛️  Processing ${source.name}...`);
                
                const jobId = this.pipeline.createJob({
                    source: source.name,
                    type: 'extraction',
                    limit: source.limit,
                    enableDeduplication: true,
                    enableQualityAssessment: true,
                    storeResults: true,
                    ...source.config
                });
                
                // Wait for job completion
                await new Promise((resolve) => {
                    const onCompleted = (job) => {
                        if (job.id === jobId) {
                            totalProcessed += job.result.servicesProcessed || 0;
                            this.pipeline.off('jobCompleted', onCompleted);
                            this.pipeline.off('jobFailed', onFailed);
                            resolve();
                        }
                    };
                    
                    const onFailed = (job) => {
                        if (job.id === jobId) {
                            this.pipeline.off('jobCompleted', onCompleted);
                            this.pipeline.off('jobFailed', onFailed);
                            resolve();
                        }
                    };
                    
                    this.pipeline.on('jobCompleted', onCompleted);
                    this.pipeline.on('jobFailed', onFailed);
                });
            }
            
            // Store results in database
            if (totalProcessed > 0) {
                console.log(`💾 Storing ${totalProcessed} services in database...`);
                // The pipeline jobs already store results if storeResults: true
                
                // Run cleanup
                await this.database.cleanup({ removeLowestQuality: false });
                console.log('🧹 Database cleanup completed');
            }
            
            console.log(`✅ Pipeline execution completed: ${totalProcessed} services processed`);
            
        } catch (error) {
            console.error('💥 Pipeline execution failed:', error);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }
    
    async runHighFrequencyUpdate() {
        console.log('⚡ Running high-frequency update...');
        
        // Only update ACNC (which updates more frequently)
        const jobId = this.pipeline.createJob({
            source: 'acnc',
            type: 'extraction',
            limit: 100,
            enableDeduplication: true,
            enableQualityAssessment: true,
            storeResults: true,
            youthOnly: true
        });
        
        console.log('✅ High-frequency update scheduled');
    }
    
    async shutdown() {
        console.log('🛑 Shutting down pipeline service...');
        
        if (this.server) {
            this.server.close();
        }
        
        await this.pipeline.cleanup();
        await this.database.close();
        
        console.log('✅ Pipeline service shut down gracefully');
        process.exit(0);
    }
}

// Start the service
const service = new PipelineService();
service.start().catch(console.error);

export default PipelineService;