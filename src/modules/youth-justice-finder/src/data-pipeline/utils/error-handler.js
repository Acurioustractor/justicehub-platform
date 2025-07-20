/**
 * Error Handler for Data Pipeline
 * 
 * Centralized error handling, logging, and recovery strategies
 * for the multi-source data pipeline.
 */

import fs from 'fs/promises';
import path from 'path';

export class ErrorHandler {
    constructor(config = {}) {
        this.config = {
            logFile: config.logFile || 'data-pipeline-errors.log',
            maxLogSize: config.maxLogSize || 10 * 1024 * 1024, // 10MB
            maxRetries: config.maxRetries || 3,
            retryDelay: config.retryDelay || 1000,
            enableConsoleLog: config.enableConsoleLog !== false,
            enableFileLog: config.enableFileLog !== false,
            ...config
        };
        
        this.errorCounts = new Map();
        this.retryAttempts = new Map();
        this.circuitBreakers = new Map();
    }

    /**
     * Log error with context information
     * @param {Error|string} error - Error object or message
     * @param {string} source - Source identifier
     * @param {Object} context - Additional context
     */
    async log(error, source = 'unknown', context = {}) {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            source,
            error: error instanceof Error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : { message: String(error) },
            context,
            level: this.getErrorLevel(error, context)
        };

        // Console logging
        if (this.config.enableConsoleLog) {
            this.logToConsole(errorEntry);
        }

        // File logging
        if (this.config.enableFileLog) {
            await this.logToFile(errorEntry);
        }

        // Update error counts
        this.updateErrorCounts(source, errorEntry.level);

        // Check circuit breaker
        this.updateCircuitBreaker(source, errorEntry.level);

        return errorEntry;
    }

    /**
     * Determine error severity level
     * @param {Error|string} error - Error
     * @param {Object} context - Context
     * @returns {string} Error level
     */
    getErrorLevel(error, context) {
        if (context.level) {
            return context.level;
        }

        const errorMessage = error instanceof Error ? error.message : String(error);
        const lowerMessage = errorMessage.toLowerCase();

        // Critical errors
        if (lowerMessage.includes('authentication') || 
            lowerMessage.includes('unauthorized') ||
            lowerMessage.includes('forbidden')) {
            return 'critical';
        }

        // High priority errors
        if (lowerMessage.includes('rate limit') ||
            lowerMessage.includes('quota exceeded') ||
            lowerMessage.includes('service unavailable')) {
            return 'high';
        }

        // Medium priority errors
        if (lowerMessage.includes('timeout') ||
            lowerMessage.includes('connection') ||
            lowerMessage.includes('network')) {
            return 'medium';
        }

        // Default to low
        return 'low';
    }

    /**
     * Log to console with formatting
     * @param {Object} errorEntry - Error entry
     */
    logToConsole(errorEntry) {
        const colors = {
            critical: '\x1b[31m', // Red
            high: '\x1b[33m',     // Yellow
            medium: '\x1b[36m',   // Cyan
            low: '\x1b[37m',      // White
            reset: '\x1b[0m'
        };

        const color = colors[errorEntry.level] || colors.low;
        const reset = colors.reset;

        console.error(
            `${color}[${errorEntry.timestamp}] ${errorEntry.level.toUpperCase()} - ${errorEntry.source}${reset}\n` +
            `${color}Error: ${errorEntry.error.message}${reset}\n` +
            (Object.keys(errorEntry.context).length > 0 ? 
                `${color}Context: ${JSON.stringify(errorEntry.context, null, 2)}${reset}\n` : '') +
            `${color}---${reset}`
        );
    }

    /**
     * Log to file with rotation
     * @param {Object} errorEntry - Error entry
     */
    async logToFile(errorEntry) {
        try {
            const logLine = JSON.stringify(errorEntry) + '\n';
            
            // Check file size and rotate if needed
            await this.rotateLogIfNeeded();
            
            // Append to log file
            await fs.appendFile(this.config.logFile, logLine);
        } catch (fileError) {
            console.error('Failed to write to log file:', fileError.message);
        }
    }

    /**
     * Rotate log file if it exceeds max size
     */
    async rotateLogIfNeeded() {
        try {
            const stats = await fs.stat(this.config.logFile);
            
            if (stats.size > this.config.maxLogSize) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const archiveFile = `${this.config.logFile}.${timestamp}`;
                
                await fs.rename(this.config.logFile, archiveFile);
                console.log(`Log file rotated to: ${archiveFile}`);
            }
        } catch (error) {
            // File doesn't exist yet, that's okay
            if (error.code !== 'ENOENT') {
                console.error('Log rotation error:', error.message);
            }
        }
    }

    /**
     * Update error counts for monitoring
     * @param {string} source - Source identifier
     * @param {string} level - Error level
     */
    updateErrorCounts(source, level) {
        if (!this.errorCounts.has(source)) {
            this.errorCounts.set(source, {
                critical: 0,
                high: 0,
                medium: 0,
                low: 0,
                total: 0,
                lastError: null
            });
        }

        const counts = this.errorCounts.get(source);
        counts[level]++;
        counts.total++;
        counts.lastError = new Date().toISOString();

        this.errorCounts.set(source, counts);
    }

    /**
     * Update circuit breaker status
     * @param {string} source - Source identifier
     * @param {string} level - Error level
     */
    updateCircuitBreaker(source, level) {
        if (!this.circuitBreakers.has(source)) {
            this.circuitBreakers.set(source, {
                state: 'closed', // closed, open, half-open
                errorCount: 0,
                lastError: null,
                nextAttempt: null,
                threshold: 5,
                timeout: 300000 // 5 minutes
            });
        }

        const breaker = this.circuitBreakers.get(source);
        
        if (level === 'critical' || level === 'high') {
            breaker.errorCount++;
            breaker.lastError = new Date().toISOString();
            
            if (breaker.errorCount >= breaker.threshold && breaker.state === 'closed') {
                breaker.state = 'open';
                breaker.nextAttempt = new Date(Date.now() + breaker.timeout).toISOString();
                console.warn(`Circuit breaker opened for source: ${source}`);
            }
        }

        this.circuitBreakers.set(source, breaker);
    }

    /**
     * Check if source is available (circuit breaker)
     * @param {string} source - Source identifier
     * @returns {boolean} True if source is available
     */
    isSourceAvailable(source) {
        const breaker = this.circuitBreakers.get(source);
        
        if (!breaker || breaker.state === 'closed') {
            return true;
        }

        if (breaker.state === 'open') {
            if (new Date() > new Date(breaker.nextAttempt)) {
                // Try half-open state
                breaker.state = 'half-open';
                this.circuitBreakers.set(source, breaker);
                return true;
            }
            return false;
        }

        // Half-open state
        return true;
    }

    /**
     * Record successful operation (reset circuit breaker)
     * @param {string} source - Source identifier
     */
    recordSuccess(source) {
        const breaker = this.circuitBreakers.get(source);
        
        if (breaker) {
            breaker.state = 'closed';
            breaker.errorCount = 0;
            breaker.lastError = null;
            breaker.nextAttempt = null;
            this.circuitBreakers.set(source, breaker);
        }
    }

    /**
     * Execute operation with retry logic
     * @param {Function} operation - Operation to execute
     * @param {string} source - Source identifier
     * @param {Object} options - Retry options
     * @returns {Promise} Operation result
     */
    async executeWithRetry(operation, source, options = {}) {
        const {
            maxRetries = this.config.maxRetries,
            retryDelay = this.config.retryDelay,
            backoffMultiplier = 2,
            retryCondition = (error) => true
        } = options;

        const retryKey = `${source}-${Date.now()}`;
        this.retryAttempts.set(retryKey, 0);

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                // Check circuit breaker
                if (!this.isSourceAvailable(source)) {
                    throw new Error(`Circuit breaker open for source: ${source}`);
                }

                const result = await operation();
                
                // Record success
                this.recordSuccess(source);
                this.retryAttempts.delete(retryKey);
                
                return result;
            } catch (error) {
                this.retryAttempts.set(retryKey, attempt + 1);
                
                await this.log(error, source, {
                    attempt: attempt + 1,
                    maxRetries: maxRetries + 1,
                    retryKey
                });

                if (attempt === maxRetries || !retryCondition(error)) {
                    this.retryAttempts.delete(retryKey);
                    throw error;
                }

                // Calculate delay with exponential backoff
                const delay = retryDelay * Math.pow(backoffMultiplier, attempt);
                await this.sleep(delay);
            }
        }
    }

    /**
     * Sleep for specified milliseconds
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise} Promise that resolves after sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get error statistics
     * @param {string} source - Source identifier (optional)
     * @returns {Object} Error statistics
     */
    getErrorStats(source = null) {
        if (source) {
            return {
                source,
                errors: this.errorCounts.get(source) || null,
                circuitBreaker: this.circuitBreakers.get(source) || null,
                retryAttempts: Array.from(this.retryAttempts.entries())
                    .filter(([key]) => key.startsWith(source))
                    .length
            };
        }

        // All sources
        const stats = {
            totalSources: this.errorCounts.size,
            errors: Object.fromEntries(this.errorCounts),
            circuitBreakers: Object.fromEntries(this.circuitBreakers),
            activeRetries: this.retryAttempts.size
        };

        // Calculate totals
        stats.totalErrors = Array.from(this.errorCounts.values())
            .reduce((sum, counts) => sum + counts.total, 0);
        
        stats.openCircuitBreakers = Array.from(this.circuitBreakers.values())
            .filter(breaker => breaker.state === 'open').length;

        return stats;
    }

    /**
     * Clear error history
     * @param {string} source - Source to clear (optional, clears all if not specified)
     */
    clearErrors(source = null) {
        if (source) {
            this.errorCounts.delete(source);
            this.circuitBreakers.delete(source);
            
            // Clear retry attempts for this source
            for (const [key] of this.retryAttempts) {
                if (key.startsWith(source)) {
                    this.retryAttempts.delete(key);
                }
            }
        } else {
            this.errorCounts.clear();
            this.circuitBreakers.clear();
            this.retryAttempts.clear();
        }
    }

    /**
     * Export error logs
     * @param {string} outputFile - Output file path
     * @param {Object} options - Export options
     */
    async exportLogs(outputFile, options = {}) {
        const {
            format = 'json',
            startDate = null,
            endDate = null,
            sources = [],
            levels = []
        } = options;

        try {
            // Read log file
            const logContent = await fs.readFile(this.config.logFile, 'utf8');
            const logLines = logContent.split('\n').filter(line => line.trim());
            
            let logs = logLines.map(line => {
                try {
                    return JSON.parse(line);
                } catch {
                    return null;
                }
            }).filter(Boolean);

            // Apply filters
            if (startDate) {
                logs = logs.filter(log => new Date(log.timestamp) >= new Date(startDate));
            }
            
            if (endDate) {
                logs = logs.filter(log => new Date(log.timestamp) <= new Date(endDate));
            }
            
            if (sources.length > 0) {
                logs = logs.filter(log => sources.includes(log.source));
            }
            
            if (levels.length > 0) {
                logs = logs.filter(log => levels.includes(log.level));
            }

            // Export in requested format
            let content;
            if (format === 'csv') {
                content = this.convertLogsToCSV(logs);
            } else {
                content = JSON.stringify(logs, null, 2);
            }

            await fs.writeFile(outputFile, content);
            console.log(`Exported ${logs.length} log entries to: ${outputFile}`);
            
        } catch (error) {
            console.error('Failed to export logs:', error.message);
            throw error;
        }
    }

    /**
     * Convert logs to CSV format
     * @param {Array} logs - Log entries
     * @returns {string} CSV content
     */
    convertLogsToCSV(logs) {
        if (logs.length === 0) return '';

        const headers = ['timestamp', 'source', 'level', 'error_message', 'context'];
        const rows = logs.map(log => [
            log.timestamp,
            log.source,
            log.level,
            log.error.message.replace(/"/g, '""'),
            JSON.stringify(log.context).replace(/"/g, '""')
        ]);

        return [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
    }
}

export default ErrorHandler;