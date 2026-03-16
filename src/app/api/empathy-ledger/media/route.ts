import { NextRequest, NextResponse } from 'next/server';
import { getMedia, isV2Configured } from '@/lib/empathy-ledger/v2-client';

/**
 * GET /api/empathy-ledger/media
 *
 * Fetch media assets from Empathy Ledger v2 API.
 *
 * Query params:
 *   - galleryId: filter by gallery UUID
 *   - category: (legacy — ignored, v2 uses galleryId)
 *   - search: (legacy — not supported in v2, ignored)
 *   - all: if 'true', return all photos (same behavior — v2 returns org-scoped)
 *   - page / limit: pagination (default 1 / 200, max 500)
 */
export async function GET(request: NextRequest) {
  try {
    if (!isV2Configured) {
      return NextResponse.json({
        media: [],
        pagination: { page: 1, limit: 200, total: 0, hasMore: false },
        unavailable_reason: 'EMPATHY_LEDGER_NOT_CONFIGURED',
      });
    }

    const { searchParams } = new URL(request.url);
    const galleryId = searchParams.get('galleryId') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') || '200')));
    const type = searchParams.get('type') || undefined;

    const result = await getMedia({ page, limit, galleryId, type });

    // Map v2 response to legacy format expected by JusticeHub frontend
    const media = result.data.map(asset => ({
      id: asset.id,
      filename: asset.filename || '',
      category: 'gallery',
      storage_path: '',
      url: asset.url || '',
      thumbnail: asset.thumbnailUrl || asset.previewUrl || asset.url || '',
      title: asset.title || asset.filename || '',
      tags: asset.culturalTags || [],
      metadata: {},
      project_code: null,
      collection_id: asset.galleryId,
      created_at: asset.createdAt,
    }));

    return NextResponse.json({
      media,
      pagination: {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        totalPages: Math.ceil(result.pagination.total / result.pagination.limit),
        hasMore: result.pagination.hasMore,
      },
    });
  } catch (error) {
    console.error('EL media API error:', error);
    return NextResponse.json({
      media: [],
      pagination: { page: 1, limit: 200, total: 0, hasMore: false },
      unavailable_reason: 'EL_QUERY_FAILED',
    });
  }
}
