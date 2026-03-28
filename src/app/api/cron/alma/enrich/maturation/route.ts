import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { runMaturationScan } from '@/lib/cron/evidence-maturation';

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
 * Evidence Maturation Tracker Cron
 *
 * Scans all ALMA interventions and flags those that may need
 * their evidence level upgraded based on new evidence, cost data,
 * or evaluation reports. Never auto-promotes — logs candidates
 * in alma_maturation_log for human review.
 *
 * Schedule: Weekly (via Vercel cron)
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sb = createServiceClient();
    const result = await runMaturationScan(sb);

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Maturation Cron] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
