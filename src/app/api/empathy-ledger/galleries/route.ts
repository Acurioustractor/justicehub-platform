import { NextRequest, NextResponse } from 'next/server';
import { getGalleries, isV2Configured } from '@/lib/empathy-ledger/v2-client';

/**
 * GET /api/empathy-ledger/galleries
 *
 * Fetch galleries from Empathy Ledger v2 API with media counts.
 *
 * Query params:
 *   - all: if 'true', return all galleries (same behavior — v2 returns org-scoped)
 *   - page / limit: pagination (default 1 / 50)
 */
export async function GET(request: NextRequest) {
  try {
    if (!isV2Configured) {
      return NextResponse.json({
        galleries: [],
        pagination: { page: 1, limit: 50, total: 0, hasMore: false },
        unavailable_reason: 'EMPATHY_LEDGER_NOT_CONFIGURED',
      });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));

    const result = await getGalleries({ page, limit });

    // Map v2 response to legacy format expected by JusticeHub frontend
    const enrichedGalleries = result.data.map(gallery => ({
      id: gallery.id,
      title: gallery.title,
      slug: gallery.slug,
      description: gallery.description,
      visibility: gallery.visibility,
      status: gallery.status,
      is_public: gallery.visibility === 'public',
      photo_count: gallery.photoCount,
      cover_photo_url: gallery.coverImage,
      created_at: gallery.createdAt,
      updated_at: null,
    }));

    return NextResponse.json({
      galleries: enrichedGalleries,
      pagination: {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        totalPages: Math.ceil(result.pagination.total / result.pagination.limit),
        hasMore: result.pagination.hasMore,
      },
    });
  } catch (error) {
    console.error('EL galleries API error:', error);
    return NextResponse.json({
      galleries: [],
      pagination: { page: 1, limit: 50, total: 0, hasMore: false },
      unavailable_reason: 'EL_QUERY_FAILED',
    });
  }
}
