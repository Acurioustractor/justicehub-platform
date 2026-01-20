/**
 * Empathy Ledger Sync API
 *
 * GET /api/sync/empathy-ledger - Fetch media from Empathy Ledger Content Hub
 *
 * Query Parameters:
 * - organization: Organization slug (e.g., 'oonchiumpa')
 * - type: Media type filter (image, video, audio)
 * - elder_approved: Filter to elder-approved only (true/false)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  empathyLedgerSync,
  ORGANIZATION_ID_MAP,
  type SyncOptions,
} from '@/services/empathy-ledger-sync';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const orgSlug = searchParams.get('organization');
  const mediaType = searchParams.get('type') as 'image' | 'video' | 'audio' | null;
  const elderApproved = searchParams.get('elder_approved') === 'true';
  const limit = parseInt(searchParams.get('limit') || '50');

  // Build sync options
  const options: SyncOptions = {
    limit,
    elderApprovedOnly: elderApproved,
  };

  if (mediaType) {
    options.mediaType = mediaType;
  }

  try {
    let media;

    if (orgSlug) {
      // Fetch for specific organization
      const orgId = ORGANIZATION_ID_MAP[orgSlug];
      if (!orgId) {
        return NextResponse.json(
          {
            error: 'Unknown organization',
            available: Object.keys(ORGANIZATION_ID_MAP),
          },
          { status: 400 }
        );
      }

      media = await empathyLedgerSync.fetchOrganizationMedia(orgSlug, options);
    } else {
      // Fetch all media (for JusticeHub project)
      const response = await empathyLedgerSync.fetchMedia({
        ...options,
        projectCode: 'justicehub',
      });
      media = response.media;
    }

    return NextResponse.json({
      success: true,
      count: media.length,
      media,
      source: {
        name: 'Empathy Ledger',
        api: 'Content Hub v1',
        organization: orgSlug || 'all',
      },
    });
  } catch (error) {
    console.error('Empathy Ledger sync error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
        fallback: 'Using local database content',
      },
      { status: 503 }
    );
  }
}

// Health check endpoint
export async function HEAD() {
  const healthy = await empathyLedgerSync.healthCheck();

  if (healthy) {
    return new NextResponse(null, { status: 200 });
  }

  return new NextResponse(null, { status: 503 });
}
