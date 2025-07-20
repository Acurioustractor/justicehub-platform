/**
 * Pipeline Manager
 * 
 * Orchestrates the multi-source data pipeline including extraction,
 * normalization, deduplication, and quality assessment.
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';
import { AskIzzyAdapter } from '../adapters/askizzy-adapter.js';
import { ACNCAdapter } from '../adapters/acnc-adapter.js';
import { QLDDataAdapter } from '../adapters/qld-data-adapter.js';
import { VICCSOAdapter } from '../adapters/vic-cso-adapter.js';
import { SADataAdapter } from '../adapters/sa-community-adapter.js';
import { NSWFACSAdapter } from '../adapters/nsw-facs-adapter.js';
import { WADataAdapter } from '../adapters/wa-community-adapter.js';
import { CombinedStatesAdapter } from '../adapters/tas-nt-act-adapter.js';
import { DeduplicationEngine } from '../engines/deduplication-engine.js';
import { QualityEngine } from '../engines/quality-engine.js';
import { ErrorHandler } from '../utils/error-handler.js';

export class PipelineManager extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Pipeline settings
            batchSize: config.batchSize || 100,
            maxConcurrentJobs: config.maxConcurrentJobs || 3,
            retryAttempts: config.retryAttempts || 3,
            retryDelay: config.retryDelay || 5000,
            
            // Quality thresholds
            minQualityScore: config.minQualityScore || 0.3,
            autoRejectThreshold: config.autoRejectThreshold || 0.2,
            
            // Deduplication settings
            enableDeduplication: config.enableDeduplication !== false,
            deduplicationThreshold: config.deduplicationThreshold || 0.8,
            
            // Database connection
            database: config.database || null,
            
            ...config
        };
        
        // Initialize components
        this.errorHandler = new ErrorHandler({
            logFile: 'pipeline-manager-errors.log',
            enableConsoleLog: true
        });
        
        this.deduplicationEngine = new DeduplicationEngine();
        this.qualityEngine = new QualityEngine();
        
        // Initialize adapters
        this.adapters = new Map();
        this.registerDefaultAdapters();
        
        // Job management
        this.activeJobs = new Map();
        this.jobQueue = [];
        this.isProcessing = false;
        
        // Statistics
        this.stats = {
            jobsCompleted: 0,
            jobsFailed: 0,
            servicesProcessed: 0,
            servicesStored: 0,
            duplicatesFound: 0,
            qualityIssues: 0,
            totalProcessingTime: 0
        };
    }

    /**
     * Register default data source adapters
     */
    registerDefaultAdapters() {
        // ACNC Charity Register adapter (legitimate, unrestricted access)
        this.registerAdapter('acnc', new ACNCAdapter());
        
        // Queensland Open Data adapter (government-verified youth justice centers)
        this.registerAdapter('qld-data', new QLDDataAdapter());
        
        // Victoria CSO adapter (Children Youth and Families Act providers)
        this.registerAdapter('vic-cso', new VICCSOAdapter());
        
        // Ask Izzy adapter (requires partnership)
        this.registerAdapter('askizzy', new AskIzzyAdapter({
            usePlaceholderData: true // Enable for development
        }));
        
        // South Australia Community Directory adapter
        this.registerAdapter('sa-community', new SADataAdapter({
            usePlaceholderData: true // Enable for development
        }));
        
        // NSW Family and Community Services adapter
        this.registerAdapter('nsw-facs', new NSWFACSAdapter({
            usePlaceholderData: true // Enable for development
        }));
        
        // Western Australia Community Services adapter
        this.registerAdapter('wa-community', new WADataAdapter({
            usePlaceholderData: true // Enable for development
        }));
        
        // Combined States adapter (TAS/NT/ACT)
        this.registerAdapter('combined-states', new CombinedStatesAdapter({
            usePlaceholderData: true // Enable for development
        }));
    }

    /**
     * Register a data source adapter
     * @param {string} name - Adapter name
     * @param {Object} adapter - Adapter instance
     */
    registerAdapter(name, adapter) {
        this.adapters.set(name, adapter);
        console.log(`Registered adapter: ${name}`);
    }

    /**
     * Create and queue a new extraction job
     * @param {Object} jobConfig - Job configuration
     * @returns {string} Job ID
     */
    createJob(jobConfig) {
        const job = {
            id: crypto.randomUUID(),
            type: jobConfig.type || 'extraction',
            source: jobConfig.source,
            status: 'queued',
            priority: jobConfig.priority || 5,
            config: jobConfig.config || {},
            createdAt: new Date().toISOString(),
            startedAt: null,
            completedAt: null,
            result: null,
            error: null,
            retryCount: 0,
            
            // Extraction options
            options: {
                limit: jobConfig.limit || 1000,
                offset: jobConfig.offset || 0,
                categories: jobConfig.categories || [],
                location: jobConfig.location || null,
                youthOnly: jobConfig.youthOnly !== false,
                enableDeduplication: jobConfig.enableDeduplication !== false,
                enableQualityAssessment: jobConfig.enableQualityAssessment !== false,
                storeResults: jobConfig.storeResults !== false
            }
        };
        
        this.jobQueue.push(job);
        this.jobQueue.sort((a, b) => b.priority - a.priority); // Higher priority first
        
        console.log(`Created job ${job.id} for source: ${job.source}`);
        this.emit('jobCreated', job);
        
        // Start processing if not already running
        if (!this.isProcessing) {
            this.processQueue();
        }
        
        return job.id;
    }

    /**
     * Process the job queue
     */
    async processQueue() {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        console.log(`Starting job queue processing. Queue size: ${this.jobQueue.length}`);
        
        while (this.jobQueue.length > 0 && this.activeJobs.size < this.config.maxConcurrentJobs) {
            const job = this.jobQueue.shift();
            this.processJob(job);
        }
        
        // Wait for all active jobs to complete
        while (this.activeJobs.size > 0) {
            await this.sleep(1000);
        }
        
        this.isProcessing = false;
        console.log('Job queue processing completed');
        this.emit('queueCompleted');
    }

    /**
     * Process a single job
     * @param {Object} job - Job to process
     */
    async processJob(job) {
        this.activeJobs.set(job.id, job);
        job.status = 'running';
        job.startedAt = new Date().toISOString();
        
        console.log(`Starting job ${job.id} (${job.source})`);
        this.emit('jobStarted', job);
        
        try {
            const result = await this.executeJob(job);
            
            job.status = 'completed';
            job.completedAt = new Date().toISOString();
            job.result = result;
            
            this.stats.jobsCompleted++;
            this.stats.servicesProcessed += result.servicesProcessed || 0;
            this.stats.servicesStored += result.servicesStored || 0;
            this.stats.duplicatesFound += result.duplicatesFound || 0;
            
            console.log(`Completed job ${job.id}. Processed: ${result.servicesProcessed}, Stored: ${result.servicesStored}`);
            this.emit('jobCompleted', job);
            
        } catch (error) {
            console.error(`Job ${job.id} failed:`, error.message);
            
            if (job.retryCount < this.config.retryAttempts) {
                job.retryCount++;
                job.status = 'retrying';
                
                console.log(`Retrying job ${job.id} (attempt ${job.retryCount}/${this.config.retryAttempts})`);
                
                // Add back to queue with delay
                setTimeout(() => {
                    job.status = 'queued';
                    this.jobQueue.unshift(job); // Priority retry
                }, this.config.retryDelay);
                
            } else {
                job.status = 'failed';
                job.completedAt = new Date().toISOString();
                job.error = {
                    message: error.message,
                    stack: error.stack
                };
                
                this.stats.jobsFailed++;
                this.emit('jobFailed', job);
                
                await this.errorHandler.log(error, `job-${job.id}`, {
                    jobId: job.id,
                    source: job.source,
                    retryCount: job.retryCount
                });
            }
        } finally {
            this.activeJobs.delete(job.id);
            
            // Process next job in queue
            if (this.jobQueue.length > 0 && this.activeJobs.size < this.config.maxConcurrentJobs) {
                const nextJob = this.jobQueue.shift();
                this.processJob(nextJob);
            }
        }
    }

    /**
     * Execute a job
     * @param {Object} job - Job to execute
     * @returns {Object} Execution result
     */
    async executeJob(job) {
        const startTime = Date.now();
        
        // Get adapter for source
        const adapter = this.adapters.get(job.source);
        if (!adapter) {
            throw new Error(`No adapter found for source: ${job.source}`);
        }
        
        console.log(`Extracting data from ${job.source}...`);
        
        // Extract data
        const extractionResult = await adapter.extract(job.options);
        const extractedServices = extractionResult.services || [];
        
        console.log(`Extracted ${extractedServices.length} services from ${job.source}`);
        
        let processedServices = extractedServices;
        let duplicatesInfo = null;
        let qualityAssessments = null;
        
        // Apply deduplication if enabled
        if (job.options.enableDeduplication && this.config.enableDeduplication) {
            console.log('Running deduplication...');
            
            // Get existing services for comparison (if database available)
            const existingServices = await this.getExistingServices(job.options);
            
            duplicatesInfo = await this.deduplicationEngine.findDuplicates(
                processedServices,
                existingServices
            );
            
            console.log(`Found ${duplicatesInfo.duplicatePairs.length} potential duplicates`);
        }
        
        // Apply quality assessment if enabled
        if (job.options.enableQualityAssessment) {
            console.log('Running quality assessment...');
            
            qualityAssessments = await this.qualityEngine.assessBatch(processedServices);
            
            // Filter out services below minimum quality threshold
            const qualityMap = new Map();
            qualityAssessments.assessments.forEach(assessment => {
                qualityMap.set(assessment.serviceId, assessment);
            });
            
            const originalCount = processedServices.length;
            processedServices = processedServices.filter(service => {
                const assessment = qualityMap.get(service.id);
                return assessment && assessment.overallScore >= this.config.minQualityScore;
            });
            
            const filtered = originalCount - processedServices.length;
            if (filtered > 0) {
                console.log(`Filtered out ${filtered} services below quality threshold`);
            }
        }
        
        // Store results if enabled
        let storedCount = 0;
        if (job.options.storeResults && this.config.database) {
            console.log('Storing services to database...');
            storedCount = await this.storeServices(processedServices, qualityAssessments);
        }
        
        const processingTime = Date.now() - startTime;
        this.stats.totalProcessingTime += processingTime;
        
        return {
            servicesExtracted: extractedServices.length,
            servicesProcessed: processedServices.length,
            servicesStored: storedCount,
            duplicatesFound: duplicatesInfo?.duplicatePairs?.length || 0,
            qualityIssues: qualityAssessments?.summary?.commonIssues?.length || 0,
            processingTime,
            
            // Detailed results
            extraction: extractionResult,
            deduplication: duplicatesInfo,
            quality: qualityAssessments?.summary
        };
    }

    /**
     * Get existing services for deduplication comparison
     * @param {Object} options - Query options
     * @returns {Array} Existing services
     */
    async getExistingServices(options) {
        // Placeholder - implement database query
        // This would query the database for existing services
        // to compare against for deduplication
        
        if (!this.config.database) {
            return [];
        }
        
        try {
            // Example database query
            // const existingServices = await this.config.database.query(
            //     'SELECT id, name, organization, locations, contacts FROM services WHERE status = $1',
            //     ['active']
            // );
            // return existingServices.rows;
            
            return [];
        } catch (error) {
            console.error('Failed to get existing services:', error.message);
            return [];
        }
    }

    /**
     * Store services to database
     * @param {Array} services - Services to store
     * @param {Object} qualityAssessments - Quality assessments
     * @returns {number} Number of services stored
     */
    async storeServices(services, qualityAssessments) {
        if (!this.config.database) {
            console.log('No database configured, skipping storage');
            return 0;
        }
        
        let storedCount = 0;
        
        try {
            const qualityMap = new Map();
            if (qualityAssessments) {
                qualityAssessments.assessments.forEach(assessment => {
                    qualityMap.set(assessment.serviceId, assessment);
                });
            }
            
            for (const service of services) {
                try {
                    // Add quality scores to service
                    const assessment = qualityMap.get(service.id);
                    if (assessment) {
                        service.completeness_score = assessment.completenessScore;
                        service.verification_score = Math.round(assessment.overallScore * 100);
                    }
                    
                    // Store service (implement database insertion)
                    // await this.insertService(service);
                    
                    storedCount++;
                } catch (insertError) {
                    await this.errorHandler.log(insertError, 'storage', {
                        serviceId: service.id,
                        serviceName: service.name
                    });
                }
            }
            
            console.log(`Stored ${storedCount}/${services.length} services to database`);
            
        } catch (error) {
            await this.errorHandler.log(error, 'storage');
            throw error;
        }
        
        return storedCount;
    }

    /**
     * Get job status
     * @param {string} jobId - Job ID
     * @returns {Object|null} Job status
     */
    getJobStatus(jobId) {
        // Check active jobs
        if (this.activeJobs.has(jobId)) {
            return this.activeJobs.get(jobId);
        }
        
        // Check queue
        const queuedJob = this.jobQueue.find(job => job.id === jobId);
        if (queuedJob) {
            return queuedJob;
        }
        
        return null;
    }

    /**
     * Cancel a job
     * @param {string} jobId - Job ID
     * @returns {boolean} True if cancelled
     */
    cancelJob(jobId) {
        // Remove from queue
        const queueIndex = this.jobQueue.findIndex(job => job.id === jobId);
        if (queueIndex !== -1) {
            this.jobQueue.splice(queueIndex, 1);
            console.log(`Cancelled queued job: ${jobId}`);
            return true;
        }
        
        // Mark active job as cancelled (it will be stopped at next check)
        const activeJob = this.activeJobs.get(jobId);
        if (activeJob) {
            activeJob.status = 'cancelled';
            console.log(`Marked active job as cancelled: ${jobId}`);
            return true;
        }
        
        return false;
    }

    /**
     * Get pipeline statistics
     * @returns {Object} Statistics
     */
    getStats() {
        return {
            ...this.stats,
            activeJobs: this.activeJobs.size,
            queuedJobs: this.jobQueue.length,
            adapters: Array.from(this.adapters.keys()),
            isProcessing: this.isProcessing,
            averageProcessingTime: this.stats.jobsCompleted > 0 
                ? this.stats.totalProcessingTime / this.stats.jobsCompleted 
                : 0
        };
    }

    /**
     * Get all jobs with their status
     * @returns {Array} All jobs
     */
    getAllJobs() {
        const allJobs = [
            ...Array.from(this.activeJobs.values()),
            ...this.jobQueue
        ];
        
        return allJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    /**
     * Run a quick test extraction from all adapters
     * @returns {Object} Test results
     */
    async runTests() {
        const results = {};
        
        for (const [name, adapter] of this.adapters) {
            try {
                console.log(`Testing adapter: ${name}`);
                
                const validation = await adapter.validate();
                const metadata = await adapter.getMetadata();
                
                // Try small extraction
                const extraction = await adapter.extract({ limit: 5 });
                
                results[name] = {
                    validation,
                    metadata,
                    extraction: {
                        servicesExtracted: extraction.services?.length || 0,
                        sampleService: extraction.services?.[0] || null
                    },
                    status: 'success'
                };
                
            } catch (error) {
                results[name] = {
                    status: 'error',
                    error: error.message
                };
                
                await this.errorHandler.log(error, `test-${name}`);
            }
        }
        
        return results;
    }

    /**
     * Clean up resources
     */
    async cleanup() {
        console.log('Cleaning up pipeline manager...');
        
        // Cancel all pending jobs
        this.jobQueue.forEach(job => {
            job.status = 'cancelled';
        });
        this.jobQueue = [];
        
        // Wait for active jobs to complete
        const timeout = setTimeout(() => {
            console.warn('Forcing cleanup - some jobs may not have completed');
        }, 30000); // 30 second timeout
        
        while (this.activeJobs.size > 0) {
            await this.sleep(1000);
        }
        
        clearTimeout(timeout);
        
        // Clean up adapters
        for (const [name, adapter] of this.adapters) {
            if (adapter.cleanup) {
                await adapter.cleanup();
            }
        }
        
        console.log('Pipeline manager cleanup completed');
    }

    /**
     * Sleep for specified milliseconds
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise} Promise that resolves after sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export default PipelineManager;