/**
 * Rate Limiter for API Requests
 * 
 * Implements token bucket algorithm for rate limiting API requests
 * to respect source API limits and prevent being blocked.
 */

export class RateLimiter {
    constructor(maxRequests = 60, windowMs = 60000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.tokens = maxRequests;
        this.lastRefill = Date.now();
        this.requestQueue = [];
        this.isProcessingQueue = false;
    }

    /**
     * Wait for rate limit to allow request
     * @returns {Promise} Promise that resolves when request can proceed
     */
    async wait() {
        return new Promise((resolve) => {
            this.requestQueue.push(resolve);
            this.processQueue();
        });
    }

    /**
     * Process the request queue
     */
    async processQueue() {
        if (this.isProcessingQueue || this.requestQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;

        while (this.requestQueue.length > 0) {
            this.refillTokens();

            if (this.tokens > 0) {
                // Allow request to proceed
                this.tokens--;
                const resolve = this.requestQueue.shift();
                resolve();
            } else {
                // Wait until next refill
                const waitTime = this.getTimeToNextRefill();
                await this.sleep(waitTime);
            }
        }

        this.isProcessingQueue = false;
    }

    /**
     * Refill tokens based on elapsed time
     */
    refillTokens() {
        const now = Date.now();
        const elapsed = now - this.lastRefill;
        
        if (elapsed >= this.windowMs) {
            // Refill all tokens
            this.tokens = this.maxRequests;
            this.lastRefill = now;
        } else {
            // Partial refill based on elapsed time
            const tokensToAdd = Math.floor((elapsed / this.windowMs) * this.maxRequests);
            this.tokens = Math.min(this.maxRequests, this.tokens + tokensToAdd);
            
            if (tokensToAdd > 0) {
                this.lastRefill = now;
            }
        }
    }

    /**
     * Get time in ms until next token refill
     * @returns {number} Milliseconds to wait
     */
    getTimeToNextRefill() {
        const elapsed = Date.now() - this.lastRefill;
        const timeToNext = this.windowMs - elapsed;
        return Math.max(0, timeToNext);
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
     * Check if request can proceed immediately
     * @returns {boolean} True if request can proceed
     */
    canProceed() {
        this.refillTokens();
        return this.tokens > 0;
    }

    /**
     * Get current rate limit status
     * @returns {Object} Status information
     */
    getStatus() {
        this.refillTokens();
        
        return {
            tokens: this.tokens,
            maxRequests: this.maxRequests,
            windowMs: this.windowMs,
            queueLength: this.requestQueue.length,
            timeToNextRefill: this.getTimeToNextRefill(),
            utilizationPercent: Math.round(((this.maxRequests - this.tokens) / this.maxRequests) * 100)
        };
    }

    /**
     * Reset rate limiter
     */
    reset() {
        this.tokens = this.maxRequests;
        this.lastRefill = Date.now();
        this.requestQueue = [];
        this.isProcessingQueue = false;
    }
}

/**
 * Adaptive Rate Limiter
 * 
 * Automatically adjusts rate based on API responses and errors
 */
export class AdaptiveRateLimiter extends RateLimiter {
    constructor(initialRequests = 60, windowMs = 60000) {
        super(initialRequests, windowMs);
        this.initialMaxRequests = initialRequests;
        this.successCount = 0;
        this.errorCount = 0;
        this.lastAdjustment = Date.now();
        this.adjustmentInterval = 300000; // 5 minutes
    }

    /**
     * Record successful request
     */
    recordSuccess() {
        this.successCount++;
        this.adjustRate();
    }

    /**
     * Record failed request (rate limited or error)
     * @param {string} errorType - Type of error ('rate_limit', 'server_error', etc.)
     */
    recordError(errorType = 'unknown') {
        this.errorCount++;
        
        if (errorType === 'rate_limit') {
            // Immediately reduce rate
            this.maxRequests = Math.max(1, Math.floor(this.maxRequests * 0.5));
            console.log(`Rate limit hit, reducing to ${this.maxRequests} requests per ${this.windowMs}ms`);
        }
        
        this.adjustRate();
    }

    /**
     * Adjust rate based on success/error ratio
     */
    adjustRate() {
        const now = Date.now();
        
        if (now - this.lastAdjustment < this.adjustmentInterval) {
            return;
        }

        const totalRequests = this.successCount + this.errorCount;
        
        if (totalRequests < 10) {
            return; // Need more data
        }

        const successRate = this.successCount / totalRequests;
        const oldRate = this.maxRequests;

        if (successRate > 0.95 && this.errorCount === 0) {
            // Increase rate cautiously
            this.maxRequests = Math.min(
                this.initialMaxRequests * 2,
                Math.floor(this.maxRequests * 1.1)
            );
        } else if (successRate < 0.8) {
            // Decrease rate
            this.maxRequests = Math.max(1, Math.floor(this.maxRequests * 0.8));
        }

        if (oldRate !== this.maxRequests) {
            console.log(`Adjusted rate limit: ${oldRate} → ${this.maxRequests} requests per ${this.windowMs}ms (success rate: ${(successRate * 100).toFixed(1)}%)`);
        }

        // Reset counters
        this.successCount = 0;
        this.errorCount = 0;
        this.lastAdjustment = now;
    }

    /**
     * Get adaptive rate limiter status
     * @returns {Object} Extended status information
     */
    getStatus() {
        const baseStatus = super.getStatus();
        
        const totalRequests = this.successCount + this.errorCount;
        const successRate = totalRequests > 0 ? this.successCount / totalRequests : 0;
        
        return {
            ...baseStatus,
            adaptive: {
                initialMaxRequests: this.initialMaxRequests,
                successCount: this.successCount,
                errorCount: this.errorCount,
                successRate: Math.round(successRate * 100),
                lastAdjustment: new Date(this.lastAdjustment).toISOString(),
                nextAdjustment: new Date(this.lastAdjustment + this.adjustmentInterval).toISOString()
            }
        };
    }
}

export default RateLimiter;