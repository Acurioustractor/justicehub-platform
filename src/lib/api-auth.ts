import { NextRequest } from 'next/server';
import { db } from '@/server/db';
import { apiKeys, apiKeyUsageLogs } from '@/server/db/schema/api-keys';
import { eq, and, gt } from 'drizzle-orm';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import type { ApiScope } from '@/server/db/schema/api-keys';

export interface ApiAuthResult {
  authenticated: boolean;
  apiKey?: {
    id: string;
    organizationId: string;
    scopes: string[];
    rateLimit: number;
  };
  error?: string;
}

/**
 * Hash an API key for storage
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Generate a new API key
 */
export function generateApiKey(): { key: string; hashedKey: string; prefix: string } {
  const key = `jh_${uuidv4().replace(/-/g, '')}`;
  const hashedKey = hashApiKey(key);
  const prefix = key.substring(0, 8);
  
  return { key, hashedKey, prefix };
}

/**
 * Authenticate API request
 */
export async function authenticateApiRequest(
  req: NextRequest,
  requiredScopes: ApiScope[] = []
): Promise<ApiAuthResult> {
  try {
    // Extract API key from header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authenticated: false, error: 'Missing API key' };
    }

    const apiKey = authHeader.substring(7);
    const hashedKey = hashApiKey(apiKey);

    // Look up API key
    const [keyRecord] = await db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.key, hashedKey),
          eq(apiKeys.isActive, true)
        )
      )
      .limit(1);

    if (!keyRecord) {
      return { authenticated: false, error: 'Invalid API key' };
    }

    // Check expiration
    if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
      return { authenticated: false, error: 'API key expired' };
    }

    // Check scopes
    const keyScopes = keyRecord.scopes as string[];
    const hasRequiredScopes = requiredScopes.every(scope => keyScopes.includes(scope));
    
    if (!hasRequiredScopes) {
      return { authenticated: false, error: 'Insufficient permissions' };
    }

    // Update last used
    await db
      .update(apiKeys)
      .set({
        lastUsedAt: new Date(),
        lastUsedIp: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        updatedAt: new Date(),
      })
      .where(eq(apiKeys.id, keyRecord.id));

    return {
      authenticated: true,
      apiKey: {
        id: keyRecord.id,
        organizationId: keyRecord.organizationId,
        scopes: keyScopes,
        rateLimit: keyRecord.rateLimit || 1000,
      },
    };
  } catch (error) {
    console.error('API authentication error:', error);
    return { authenticated: false, error: 'Authentication failed' };
  }
}

/**
 * Log API usage
 */
export async function logApiUsage(
  apiKeyId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTime?: number,
  errorMessage?: string,
  requestBody?: any
): Promise<void> {
  try {
    await db.insert(apiKeyUsageLogs).values({
      id: uuidv4(),
      apiKeyId,
      endpoint,
      method,
      statusCode,
      responseTime,
      ipAddress: undefined, // Will be set by middleware
      userAgent: undefined, // Will be set by middleware
      requestBody: requestBody ? JSON.stringify(requestBody) : undefined,
      errorMessage,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Error logging API usage:', error);
  }
}

/**
 * Check rate limit for API key
 */
export async function checkRateLimit(
  apiKeyId: string,
  limit: number
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  // Count requests in the last hour
  const [result] = await db
    .select({ count: db.$count(apiKeyUsageLogs) })
    .from(apiKeyUsageLogs)
    .where(
      and(
        eq(apiKeyUsageLogs.apiKeyId, apiKeyId),
        gt(apiKeyUsageLogs.createdAt, oneHourAgo)
      )
    );

  const used = Number(result.count);
  const remaining = Math.max(0, limit - used);
  const resetAt = new Date(oneHourAgo.getTime() + 60 * 60 * 1000);

  return {
    allowed: remaining > 0,
    remaining,
    resetAt,
  };
}

/**
 * Webhook signature verification
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = createHash('sha256')
    .update(`${secret}:${payload}`)
    .digest('hex');
  
  return signature === expectedSignature;
}

/**
 * Generate webhook signature
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  return createHash('sha256')
    .update(`${secret}:${payload}`)
    .digest('hex');
}