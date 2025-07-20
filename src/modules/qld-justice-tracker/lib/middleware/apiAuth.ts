import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter, apiKeyManager, defaultRateLimits } from '@/lib/features/api/rateLimiter';

export interface ApiAuthResult {
  success: boolean;
  apiKey?: any;
  error?: string;
  rateLimitHeaders?: Record<string, string>;
}

/**
 * Middleware for API authentication and rate limiting
 */
export async function authenticateApiRequest(
  request: NextRequest,
  endpoint: string,
  requiredPermission: string = 'read'
): Promise<ApiAuthResult> {
  try {
    const apiKeyHeader = request.headers.get('x-api-key');
    let apiKey = null;
    let rateLimitConfig = defaultRateLimits.public;

    // Validate API key if provided
    if (apiKeyHeader) {
      apiKey = await apiKeyManager.validateApiKey(apiKeyHeader);
      
      if (!apiKey) {
        return {
          success: false,
          error: 'Invalid or expired API key',
        };
      }

      // Check permissions
      if (!apiKeyManager.hasPermission(apiKey, endpoint, requiredPermission)) {
        return {
          success: false,
          error: 'Insufficient permissions for this endpoint',
        };
      }

      // Use API key specific rate limits
      rateLimitConfig = {
        windowMs: apiKey.rateLimit.windowMs,
        maxRequests: apiKey.rateLimit.maxRequests,
      } as any;
      
      // Update usage tracking
      await apiKeyManager.updateUsage(apiKey.id);
    }

    // Apply rate limiting
    const rateLimitKey = rateLimiter.generateKey(request, 'api');
    const rateLimitResult = await rateLimiter.checkRateLimit(rateLimitKey, rateLimitConfig);

    // Prepare rate limit headers
    const rateLimitHeaders = {
      'X-RateLimit-Limit': rateLimitResult.limit.toString(),
      'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
    };

    if (!rateLimitResult.success) {
      return {
        success: false,
        error: 'Rate limit exceeded',
        rateLimitHeaders: {
          ...rateLimitHeaders,
          'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
        },
      };
    }

    return {
      success: true,
      apiKey,
      rateLimitHeaders,
    };
  } catch (error) {
    console.error('API authentication error:', error);
    return {
      success: false,
      error: 'Authentication service error',
    };
  }
}

/**
 * Create error response with rate limit headers
 */
export function createApiErrorResponse(
  message: string,
  status: number = 400,
  headers?: Record<string, string>
): NextResponse {
  const response = NextResponse.json({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  }, { status });

  // Add rate limit headers if provided
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

/**
 * Create success response with rate limit headers
 */
export function createApiSuccessResponse(
  data: any,
  headers?: Record<string, string>
): NextResponse {
  const response = NextResponse.json({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  });

  // Add rate limit headers if provided
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

/**
 * API route wrapper with authentication and rate limiting
 */
export function withApiAuth(
  endpoint: string,
  requiredPermission: string = 'read'
) {
  return function (
    handler: (request: NextRequest, context: { apiKey?: any }) => Promise<NextResponse>
  ) {
    return async function (request: NextRequest, context?: any): Promise<NextResponse> {
      // Authenticate request
      const authResult = await authenticateApiRequest(request, endpoint, requiredPermission);

      if (!authResult.success) {
        return createApiErrorResponse(
          authResult.error || 'Authentication failed',
          authResult.error === 'Rate limit exceeded' ? 429 : 401,
          authResult.rateLimitHeaders
        );
      }

      try {
        // Call the actual handler
        const response = await handler(request, { apiKey: authResult.apiKey });

        // Add rate limit headers to successful responses
        if (authResult.rateLimitHeaders) {
          Object.entries(authResult.rateLimitHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
        }

        return response;
      } catch (error) {
        console.error('API handler error:', error);
        return createApiErrorResponse(
          'Internal server error',
          500,
          authResult.rateLimitHeaders
        );
      }
    };
  };
}