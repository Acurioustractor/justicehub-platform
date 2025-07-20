import { createHash, randomBytes, createCipher, createDecipher } from 'crypto';
import { NextRequest } from 'next/server';

/**
 * Security utilities for JusticeHub
 */

// Input validation and sanitization
export class InputValidator {
  // Email validation
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  // Password strength validation
  static isStrongPassword(password: string): { valid: boolean; reasons: string[] } {
    const reasons: string[] = [];
    
    if (password.length < 8) {
      reasons.push('Password must be at least 8 characters long');
    }
    if (!/[a-z]/.test(password)) {
      reasons.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
      reasons.push('Password must contain at least one uppercase letter');
    }
    if (!/\d/.test(password)) {
      reasons.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      reasons.push('Password must contain at least one special character');
    }
    if (password.length > 128) {
      reasons.push('Password must be less than 128 characters');
    }

    return { valid: reasons.length === 0, reasons };
  }

  // Sanitize HTML input
  static sanitizeHtml(input: string): string {
    return input
      .replace(/[<>'"&]/g, (char) => {
        switch (char) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '"': return '&quot;';
          case "'": return '&#x27;';
          case '&': return '&amp;';
          default: return char;
        }
      });
  }

  // SQL injection prevention
  static sanitizeSql(input: string): string {
    return input.replace(/['"\\;]/g, '\\$&');
  }

  // Validate file uploads
  static validateFileUpload(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 10MB limit' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not allowed' };
    }

    // Check file extension matches MIME type
    const extension = file.name.split('.').pop()?.toLowerCase();
    const typeExtensionMap: Record<string, string[]> = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/gif': ['gif'],
      'image/webp': ['webp'],
      'application/pdf': ['pdf'],
      'text/plain': ['txt'],
      'application/msword': ['doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx']
    };

    const expectedExtensions = typeExtensionMap[file.type];
    if (expectedExtensions && extension && !expectedExtensions.includes(extension)) {
      return { valid: false, error: 'File extension does not match file type' };
    }

    return { valid: true };
  }

  // Validate JSON input
  static validateJson(input: string): { valid: boolean; data?: any; error?: string } {
    try {
      const data = JSON.parse(input);
      return { valid: true, data };
    } catch (error) {
      return { valid: false, error: 'Invalid JSON format' };
    }
  }

  // Validate URL
  static isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }
}

// Encryption utilities
export class EncryptionUtils {
  private static readonly algorithm = 'aes-256-gcm';
  private static readonly keyLength = 32;

  // Generate secure random key
  static generateKey(): string {
    return randomBytes(this.keyLength).toString('hex');
  }

  // Generate secure random token
  static generateToken(length: number = 32): string {
    return randomBytes(length).toString('hex');
  }

  // Hash password with salt
  static hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const saltBytes = salt ? Buffer.from(salt, 'hex') : randomBytes(16);
    const hash = createHash('sha256')
      .update(password)
      .update(saltBytes)
      .digest('hex');
    
    return {
      hash,
      salt: saltBytes.toString('hex')
    };
  }

  // Verify password
  static verifyPassword(password: string, hash: string, salt: string): boolean {
    const computed = this.hashPassword(password, salt);
    return computed.hash === hash;
  }

  // Create HMAC signature
  static createSignature(data: string, secret: string): string {
    return createHash('sha256')
      .update(data + secret)
      .digest('hex');
  }

  // Verify HMAC signature
  static verifySignature(data: string, signature: string, secret: string): boolean {
    const expected = this.createSignature(data, secret);
    return signature === expected;
  }
}

// Security headers utility
export class SecurityHeaders {
  static getSecurityHeaders(nonce?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'X-DNS-Prefetch-Control': 'on',
      'X-XSS-Protection': '1; mode=block',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    };

    // Add HSTS in production
    if (process.env.NODE_ENV === 'production') {
      headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
    }

    // Content Security Policy
    const cspDirectives = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.auth0.com${nonce ? ` 'nonce-${nonce}'` : ''}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "media-src 'self' blob:",
      "connect-src 'self' https://api.openai.com https://*.auth0.com https://*.amazonaws.com",
      "frame-src 'self' https://*.auth0.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'"
    ];

    if (process.env.NODE_ENV === 'production') {
      cspDirectives.push('upgrade-insecure-requests');
    }

    headers['Content-Security-Policy'] = cspDirectives.join('; ');

    return headers;
  }
}

// Rate limiting utility
export class RateLimiter {
  private static store = new Map<string, { count: number; resetTime: number; blocked: boolean }>();
  private static blockedIPs = new Set<string>();

  static checkLimit(
    identifier: string, 
    limit: number, 
    windowMs: number,
    blockDuration?: number
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.store.get(identifier);

    // Check if IP is permanently blocked
    if (this.blockedIPs.has(identifier)) {
      return { allowed: false, remaining: 0, resetTime: now + windowMs };
    }

    if (!entry || now > entry.resetTime) {
      this.store.set(identifier, { count: 1, resetTime: now + windowMs, blocked: false });
      return { allowed: true, remaining: limit - 1, resetTime: now + windowMs };
    }

    if (entry.count >= limit) {
      // Block IP temporarily if blockDuration is specified
      if (blockDuration && !entry.blocked) {
        entry.blocked = true;
        entry.resetTime = now + blockDuration;
      }
      return { allowed: false, remaining: 0, resetTime: entry.resetTime };
    }

    entry.count++;
    return { allowed: true, remaining: limit - entry.count, resetTime: entry.resetTime };
  }

  static blockIP(ip: string): void {
    this.blockedIPs.add(ip);
  }

  static unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
    this.store.delete(ip);
  }

  static isBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  static clearEntry(identifier: string): void {
    this.store.delete(identifier);
  }

  static getStats(): { totalEntries: number; blockedIPs: number } {
    return {
      totalEntries: this.store.size,
      blockedIPs: this.blockedIPs.size
    };
  }
}

// Attack detection utility
export class AttackDetector {
  private static suspiciousPatterns = [
    // SQL Injection patterns
    /(\bunion\b.*\bselect\b)|(\bor\b.*=.*\bor\b)|(\bdrop\b.*\btable\b)/i,
    /(\binsert\b.*\binto\b)|(\bdelete\b.*\bfrom\b)|(\bupdate\b.*\bset\b)/i,
    
    // XSS patterns
    /<script[^>]*>|<\/script>|javascript:|vbscript:|onload=|onerror=|onclick=/i,
    /alert\(|confirm\(|prompt\(|document\.cookie|window\.location/i,
    
    // Path traversal
    /\.\.[\/\\]|\.\.%2f|\.\.%5c/i,
    
    // Command injection
    /[;&|`$(){}[\]]/,
    
    // Common attack tools
    /sqlmap|nikto|nmap|burp|acunetix|nessus|openvas/i,
    
    // Directory traversal and file inclusion
    /\/etc\/passwd|\/proc\/|\.\.\/|\.\.%2F/i,
  ];

  private static maliciousUserAgents = [
    /python-requests|curl|wget|httpie/i,
    /bot|crawler|spider|scraper/i,
    /scanner|audit|pentest/i
  ];

  static detectSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\bunion\b.*\bselect\b)|(\bor\b.*=.*\bor\b)/i,
      /(\binsert\b.*\binto\b)|(\bdelete\b.*\bfrom\b)/i,
      /(\bdrop\b.*\btable\b)|(\btruncate\b.*\btable\b)/i,
      /(--|\/\*|\*\/|;)/,
      /(\bexec\b|\bexecute\b|\bsp_\w+)/i
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  static detectXSS(input: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/i,
      /javascript:/i,
      /vbscript:/i,
      /on\w+\s*=/i,
      /alert\(|confirm\(|prompt\(/i,
      /<iframe|<object|<embed|<form/i
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  static detectPathTraversal(path: string): boolean {
    const traversalPatterns = [
      /\.\.[\/\\]/,
      /\.\.%2f|\.\.%5c/i,
      /\/etc\/|\/proc\/|\/sys\//i,
      /\\windows\\|\\system32\\/i
    ];

    return traversalPatterns.some(pattern => pattern.test(path));
  }

  static detectSuspiciousActivity(req: NextRequest): {
    isSuspicious: boolean;
    reasons: string[];
    riskLevel: 'low' | 'medium' | 'high';
  } {
    const reasons: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    const userAgent = req.headers.get('user-agent') || '';
    const path = req.nextUrl.pathname;
    const query = req.nextUrl.search;
    const referer = req.headers.get('referer') || '';

    // Check User-Agent
    if (this.maliciousUserAgents.some(pattern => pattern.test(userAgent))) {
      reasons.push('Suspicious user agent');
      riskLevel = 'medium';
    }

    // Check for attack patterns in path
    if (this.suspiciousPatterns.some(pattern => pattern.test(path))) {
      reasons.push('Malicious pattern in URL path');
      riskLevel = 'high';
    }

    // Check query parameters
    if (this.suspiciousPatterns.some(pattern => pattern.test(query))) {
      reasons.push('Malicious pattern in query parameters');
      riskLevel = 'high';
    }

    // Check for specific attack types
    if (this.detectSQLInjection(path + query)) {
      reasons.push('SQL injection attempt detected');
      riskLevel = 'high';
    }

    if (this.detectXSS(path + query)) {
      reasons.push('XSS attempt detected');
      riskLevel = 'high';
    }

    if (this.detectPathTraversal(path)) {
      reasons.push('Path traversal attempt detected');
      riskLevel = 'high';
    }

    // Check for admin/config file access attempts
    const sensitiveFiles = [
      '/.env', '/.git', '/config', '/admin', '/wp-admin',
      '/phpmyadmin', '/backup', '/.aws', '/.ssh'
    ];
    
    if (sensitiveFiles.some(file => path.startsWith(file))) {
      reasons.push('Attempt to access sensitive files');
      riskLevel = 'medium';
    }

    // Check for excessive requests (simple check)
    const requestsHeader = req.headers.get('x-request-count');
    if (requestsHeader && parseInt(requestsHeader) > 100) {
      reasons.push('Excessive request rate');
      riskLevel = 'medium';
    }

    return {
      isSuspicious: reasons.length > 0,
      reasons,
      riskLevel
    };
  }
}

// Audit logging utility
export class SecurityAuditLogger {
  static log(event: {
    type: 'security_violation' | 'suspicious_activity' | 'rate_limit' | 'auth_failure' | 'access_denied';
    ip: string;
    userAgent?: string;
    path?: string;
    details?: any;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      ...event
    };

    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.warn('SECURITY EVENT:', logEntry);
    }

    // In production, send to logging service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to logging service (e.g., CloudWatch, Datadog, Splunk)
      this.sendToLoggingService(logEntry);
    }
  }

  private static async sendToLoggingService(logEntry: any): Promise<void> {
    try {
      // Placeholder for external logging service integration
      // Example: Send to CloudWatch Logs, Datadog, or custom logging endpoint
      console.error('SECURITY AUDIT:', JSON.stringify(logEntry));
    } catch (error) {
      console.error('Failed to send security audit log:', error);
    }
  }
}

// Content Security Policy nonce generator
export function generateCSPNonce(): string {
  return randomBytes(16).toString('base64');
}