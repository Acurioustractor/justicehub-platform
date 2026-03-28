import { NextRequest, NextResponse } from 'next/server';
import { runGraphScoring } from '@/lib/cron/graph-score';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  return token === secret;
}

/**
 * Graph Score Cron — scores every org by evidence-graph connectivity.
 *
 * GET /api/cron/alma/graph-score
 * Optional: ?regionOnly=true (only tour-stop states)
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const regionOnly = url.searchParams.get('regionOnly') === 'true';

  try {
    const stats = await runGraphScoring({ regionOnly });
    return NextResponse.json({
      success: true,
      mode: 'graph-score',
      regionOnly,
      ...stats,
    });
  } catch (err) {
    console.error('[GraphScore] Cron error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
