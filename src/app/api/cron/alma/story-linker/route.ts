import { NextRequest, NextResponse } from 'next/server';
import { runStoryLinker } from '@/lib/cron/story-linker';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  return token === secret;
}

/**
 * ALMA Story Linker Cron
 *
 * Auto-tags EL stories with CONTAINED tour-stop regions and links
 * to relevant organizations and interventions.
 *
 * GET /api/cron/alma/story-linker?batch=50
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const batch = parseInt(
      request.nextUrl.searchParams.get('batch') || '50',
      10
    );
    const stats = await runStoryLinker(batch);

    return NextResponse.json({
      ok: true,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[StoryLinker] Cron error:', err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
