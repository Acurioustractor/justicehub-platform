import pino from 'pino';

const logger = pino({ name: 'rate-limiter' });

export class RateLimiter {
  constructor(options = {}) {
    this.maxRequests = options.maxRequests || 10; // requests per window
    this.windowMs = options.windowMs || 1000; // time window in ms (default 1 second)
    this.requests = [];
    this.name = options.name || 'RateLimiter';
  }

  async throttle() {
    const now = Date.now();
    
    // Remove requests outside the current window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    // If we've hit the limit, wait until the oldest request expires
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest) + 100; // Add 100ms buffer
      
      logger.info({
        limiter: this.name,
        waitTime,
        currentRequests: this.requests.length,
        maxRequests: this.maxRequests
      }, 'Rate limit reached, waiting...');
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Recursive call to recheck after waiting
      return this.throttle();
    }
    
    // Add current request
    this.requests.push(now);
  }

  reset() {
    this.requests = [];
  }
}

// Common rate limiters for different services
export const rateLimiters = {
  // MyCommunityDirectory: respect their API limits
  myCommunityDirectory: new RateLimiter({
    maxRequests: 5, // 5 requests per second (conservative)
    windowMs: 1000,
    name: 'MyCommunityDirectory'
  }),
  
  // Government APIs usually have generous limits
  governmentApi: new RateLimiter({
    maxRequests: 10,
    windowMs: 1000,
    name: 'GovernmentAPI'
  }),
  
  // CKAN APIs
  ckan: new RateLimiter({
    maxRequests: 5,
    windowMs: 1000,
    name: 'CKAN'
  })
};

// Attribution helper
export function createAttribution(source, license = 'CC-BY 4.0') {
  return {
    source,
    license,
    attribution: `Data sourced from ${source.name} under ${license} license`,
    sourceUrl: source.url,
    accessedDate: new Date().toISOString()
  };
}