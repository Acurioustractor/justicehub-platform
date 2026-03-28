import { NextRequest, NextResponse } from 'next/server';
import { runCivicScopeBridge } from '@/lib/cron/civicscope-bridge';

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
 * CivicScope Bridge Cron
 *
 * Pulls youth-justice-relevant parliamentary data from civic_ministerial_statements
 * and civic_hansard into alma_research_findings with finding_type = 'parliamentary'.
 *
 * Deduplicates by validation_source key: "civicscope:<table>:<id>"
 * Best-effort links findings to organizations and interventions.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stats = await runCivicScopeBridge();
    return NextResponse.json({
      ok: true,
      ...stats,
    });
  } catch (err: any) {
    console.error('[CivicBridge API] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
