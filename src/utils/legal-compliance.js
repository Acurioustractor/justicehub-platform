// Legal compliance utilities for ethical web scraping in Australia
import axios from 'axios';
import pino from 'pino';
import { URL } from 'url';

const logger = pino({ name: 'legal-compliance' });

export class LegalComplianceChecker {
  constructor() {
    this.robotsCache = new Map();
    this.rateLimit = new Map(); // Track request rates per domain
    this.blockedDomains = new Set();
  }

  /**
   * Check if scraping is allowed by robots.txt
   */
  async checkRobotsPermission(url, userAgent = '*') {
    try {
      const domain = new URL(url).hostname;
      
      // Check cache first
      if (this.robotsCache.has(domain)) {
        const robotsData = this.robotsCache.get(domain);
        return this.parseRobotsForPath(robotsData, url, userAgent);
      }

      // Fetch robots.txt
      const robotsUrl = `https://${domain}/robots.txt`;
      
      try {
        const response = await axios.get(robotsUrl, {
          timeout: 5000,
          headers: {
            'User-Agent': 'Youth-Justice-Service-Finder-Bot (+https://github.com/Acurioustractor/Youth-Justice-Service-Finder)'
          }
        });
        
        this.robotsCache.set(domain, response.data);
        logger.info({ domain, robotsUrl }, 'Retrieved robots.txt');
        
        return this.parseRobotsForPath(response.data, url, userAgent);
        
      } catch (error) {
        // If robots.txt doesn't exist, assume scraping is allowed
        if (error.response?.status === 404) {
          logger.info({ domain }, 'No robots.txt found, assuming allowed');
          this.robotsCache.set(domain, '');
          return { allowed: true, reason: 'No robots.txt found' };
        }
        
        logger.warn({ domain, error: error.message }, 'Failed to fetch robots.txt');
        return { allowed: false, reason: 'Cannot verify robots.txt' };
      }
      
    } catch (error) {
      logger.error({ url, error: error.message }, 'Error checking robots permission');
      return { allowed: false, reason: 'Invalid URL or network error' };
    }
  }

  /**
   * Parse robots.txt content for specific path
   */
  parseRobotsForPath(robotsContent, url, userAgent) {
    if (!robotsContent.trim()) {
      return { allowed: true, reason: 'Empty robots.txt' };
    }

    const urlPath = new URL(url).pathname;
    const lines = robotsContent.split('\n').map(line => line.trim());
    
    let currentUserAgent = null;
    let isRelevantSection = false;
    let disallowedPaths = [];
    let allowedPaths = [];
    
    for (const line of lines) {
      if (line.startsWith('User-agent:')) {
        const agent = line.substring(11).trim();
        currentUserAgent = agent;
        isRelevantSection = (agent === '*' || agent === userAgent);
      } else if (isRelevantSection && line.startsWith('Disallow:')) {
        const path = line.substring(9).trim();
        if (path) disallowedPaths.push(path);
      } else if (isRelevantSection && line.startsWith('Allow:')) {
        const path = line.substring(6).trim();
        if (path) allowedPaths.push(path);
      }
    }

    // Check if path is explicitly allowed
    for (const allowedPath of allowedPaths) {
      if (urlPath.startsWith(allowedPath)) {
        return { allowed: true, reason: `Explicitly allowed: ${allowedPath}` };
      }
    }

    // Check if path is disallowed
    for (const disallowedPath of disallowedPaths) {
      if (urlPath.startsWith(disallowedPath)) {
        return { allowed: false, reason: `Disallowed by robots.txt: ${disallowedPath}` };
      }
    }

    return { allowed: true, reason: 'No specific restrictions found' };
  }

  /**
   * Check and enforce rate limiting
   */
  checkRateLimit(url, maxRequestsPerMinute = 30) {
    const domain = new URL(url).hostname;
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    
    const key = `${domain}:${minute}`;
    const currentCount = this.rateLimit.get(key) || 0;
    
    if (currentCount >= maxRequestsPerMinute) {
      logger.warn({ domain, currentCount, limit: maxRequestsPerMinute }, 'Rate limit exceeded');
      return { allowed: false, waitTime: 60 - (now % 60000) };
    }
    
    this.rateLimit.set(key, currentCount + 1);
    
    // Clean old entries
    this.cleanOldRateLimitEntries();
    
    return { allowed: true, requestCount: currentCount + 1 };
  }

  /**
   * Clean old rate limit entries
   */
  cleanOldRateLimitEntries() {
    const currentMinute = Math.floor(Date.now() / 60000);
    
    for (const [key, _] of this.rateLimit.entries()) {
      const [, minute] = key.split(':');
      if (parseInt(minute) < currentMinute - 5) { // Keep 5 minutes of history
        this.rateLimit.delete(key);
      }
    }
  }

  /**
   * Check if domain is blocked
   */
  isDomainBlocked(url) {
    const domain = new URL(url).hostname;
    return this.blockedDomains.has(domain);
  }

  /**
   * Block a domain
   */
  blockDomain(url, reason) {
    const domain = new URL(url).hostname;
    this.blockedDomains.add(domain);
    logger.warn({ domain, reason }, 'Domain blocked');
  }

  /**
   * Comprehensive compliance check
   */
  async checkCompliance(url, options = {}) {
    const {
      userAgent = 'Youth-Justice-Service-Finder-Bot',
      maxRequestsPerMinute = 30,
      respectRobots = true
    } = options;

    try {
      // Check if domain is blocked
      if (this.isDomainBlocked(url)) {
        return {
          allowed: false,
          reason: 'Domain is blocked',
          checks: { domainBlocked: true }
        };
      }

      // Check rate limiting
      const rateLimitCheck = this.checkRateLimit(url, maxRequestsPerMinute);
      if (!rateLimitCheck.allowed) {
        return {
          allowed: false,
          reason: 'Rate limit exceeded',
          waitTime: rateLimitCheck.waitTime,
          checks: { rateLimit: false }
        };
      }

      // Check robots.txt if required
      let robotsCheck = { allowed: true, reason: 'Robots check skipped' };
      if (respectRobots) {
        robotsCheck = await this.checkRobotsPermission(url, userAgent);
        if (!robotsCheck.allowed) {
          return {
            allowed: false,
            reason: robotsCheck.reason,
            checks: { robots: false, rateLimit: true }
          };
        }
      }

      return {
        allowed: true,
        reason: 'All checks passed',
        checks: {
          domainBlocked: false,
          rateLimit: true,
          robots: robotsCheck.allowed
        },
        requestCount: rateLimitCheck.requestCount
      };

    } catch (error) {
      logger.error({ url, error: error.message }, 'Compliance check failed');
      return {
        allowed: false,
        reason: 'Compliance check error',
        error: error.message
      };
    }
  }

  /**
   * Generate compliance report
   */
  generateReport() {
    return {
      robotsCacheSize: this.robotsCache.size,
      rateLimitEntries: this.rateLimit.size,
      blockedDomains: Array.from(this.blockedDomains),
      cachedDomains: Array.from(this.robotsCache.keys())
    };
  }
}

/**
 * Terms of Service checker
 */
export class TermsOfServiceChecker {
  constructor() {
    this.tosCache = new Map();
    this.allowedTerms = [
      'research purposes',
      'non-commercial use',
      'educational use',
      'public benefit',
      'community service'
    ];
    this.prohibitedTerms = [
      'automated access prohibited',
      'scraping prohibited',
      'bot access denied',
      'commercial use prohibited'
    ];
  }

  /**
   * Analyze terms of service for scraping permissions
   */
  async analyzeTermsOfService(baseUrl) {
    try {
      const domain = new URL(baseUrl).hostname;
      
      if (this.tosCache.has(domain)) {
        return this.tosCache.get(domain);
      }

      const tosUrls = [
        `${baseUrl}/terms`,
        `${baseUrl}/terms-of-service`,
        `${baseUrl}/terms-and-conditions`,
        `${baseUrl}/legal`,
        `${baseUrl}/robots.txt`
      ];

      for (const tosUrl of tosUrls) {
        try {
          const response = await axios.get(tosUrl, {
            timeout: 10000,
            headers: {
              'User-Agent': 'Youth-Justice-Service-Finder-Bot'
            }
          });

          const analysis = this.analyzeTermsContent(response.data);
          this.tosCache.set(domain, { ...analysis, url: tosUrl });
          
          logger.info({ domain, tosUrl, analysis }, 'Analyzed terms of service');
          return analysis;

        } catch (error) {
          // Continue to next URL
          continue;
        }
      }

      // No ToS found
      const defaultAnalysis = {
        found: false,
        recommendation: 'proceed_with_caution',
        reason: 'No terms of service found',
        confidence: 0.5
      };
      
      this.tosCache.set(domain, defaultAnalysis);
      return defaultAnalysis;

    } catch (error) {
      logger.error({ baseUrl, error: error.message }, 'ToS analysis failed');
      return {
        found: false,
        recommendation: 'avoid',
        reason: 'Error analyzing terms of service',
        confidence: 0
      };
    }
  }

  /**
   * Analyze terms of service content
   */
  analyzeTermsContent(content) {
    const lowerContent = content.toLowerCase();
    
    let prohibitedScore = 0;
    let allowedScore = 0;
    let foundProhibited = [];
    let foundAllowed = [];

    // Check for prohibited terms
    for (const term of this.prohibitedTerms) {
      if (lowerContent.includes(term)) {
        prohibitedScore += 1;
        foundProhibited.push(term);
      }
    }

    // Check for allowed terms
    for (const term of this.allowedTerms) {
      if (lowerContent.includes(term)) {
        allowedScore += 1;
        foundAllowed.push(term);
      }
    }

    // Determine recommendation
    let recommendation, reason, confidence;
    
    if (prohibitedScore > 0) {
      recommendation = 'avoid';
      reason = `Prohibited terms found: ${foundProhibited.join(', ')}`;
      confidence = 0.8 + (prohibitedScore * 0.1);
    } else if (allowedScore > 0) {
      recommendation = 'proceed';
      reason = `Allowed terms found: ${foundAllowed.join(', ')}`;
      confidence = 0.7 + (allowedScore * 0.1);
    } else {
      recommendation = 'proceed_with_caution';
      reason = 'No clear prohibitions or permissions found';
      confidence = 0.5;
    }

    return {
      found: true,
      recommendation,
      reason,
      confidence: Math.min(confidence, 1.0),
      prohibitedScore,
      allowedScore,
      foundProhibited,
      foundAllowed
    };
  }
}

export default { LegalComplianceChecker, TermsOfServiceChecker };