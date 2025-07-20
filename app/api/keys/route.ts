import { NextRequest, NextResponse } from 'next/server';
import { apiKeyManager } from '@/lib/features/api/rateLimiter';
import { handleDatabaseError } from '@/lib/supabase/errors';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// API key creation schema
const apiKeySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  userId: z.string().optional(),
  organizationId: z.string().optional(),
  rateLimit: z.object({
    windowMs: z.number().min(60000).max(86400000), // 1 minute to 24 hours
    maxRequests: z.number().min(1).max(10000),
  }).default({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
  }),
  allowedEndpoints: z.array(z.string()).default(['*']),
  permissions: z.array(z.string()).default(['read']),
  expiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/).optional(),
});

// GET endpoint for listing API keys
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const organizationId = searchParams.get('organizationId');

    const keys = await apiKeyManager.getApiKeys(
      userId || undefined,
      organizationId || undefined
    );

    // Remove sensitive key values from response
    const safeKeys = keys.map(key => ({
      ...key,
      key: `${key.key.substring(0, 12)}...${key.key.substring(key.key.length - 4)}`,
    }));

    return NextResponse.json({
      success: true,
      data: safeKeys,
    });
  } catch (error) {
    const dbError = handleDatabaseError(error);
    return NextResponse.json({
      success: false,
      error: dbError.message,
    }, { status: dbError.statusCode });
  }
}

// POST endpoint for creating API keys
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    const validatedKey = apiKeySchema.parse(body);

    // Create API key
    const apiKey = await apiKeyManager.createApiKey({
      ...validatedKey,
      enabled: true,
    });

    return NextResponse.json({
      success: true,
      data: apiKey,
      message: 'API key created successfully. Please save the key securely as it will not be shown again.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid API key configuration',
        details: error.errors,
      }, { status: 400 });
    }

    const dbError = handleDatabaseError(error);
    return NextResponse.json({
      success: false,
      error: dbError.message,
    }, { status: dbError.statusCode });
  }
}

// DELETE endpoint for revoking API keys
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const keyId = searchParams.get('id');

    if (!keyId) {
      return NextResponse.json({
        success: false,
        error: 'API key ID is required',
      }, { status: 400 });
    }

    await apiKeyManager.revokeApiKey(keyId);

    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully',
    });
  } catch (error) {
    const dbError = handleDatabaseError(error);
    return NextResponse.json({
      success: false,
      error: dbError.message,
    }, { status: dbError.statusCode });
  }
}