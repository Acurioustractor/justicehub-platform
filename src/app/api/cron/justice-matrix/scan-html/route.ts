/**
 * Vercel cron: daily bounded trigger of the HTML (Playwright) scan path.
 *
 * ⚠️ SCAFFOLD — SAFE STUB BY DESIGN.
 *
 * The HTML scan workhorse is a CLI script, not an importable module:
 *   scripts/scan-justice-matrix.ts
 * It launches a headless Chromium via Playwright and reads provider keys from
 * `.env.local` on disk. Neither works inside Vercel's serverless runtime
 * (no bundled Chromium, no `.env.local` file), so importing it here would break
 * the build / fail at runtime. Rather than invent an import that breaks, this
 * route is a thin, documented, safe no-op that returns 200.
 *
 * The JSON-API sources (CJEU, and the new HUDOC + CourtListener adapters once
 * wired into `scan-json`) ARE serverless-safe and run from the existing
 * weekly `/api/cron/justice-matrix/scan-json` route. This stub exists so the
 * daily-HTML-scan schedule has a stable endpoint and a single place to flip on
 * a real execution path later.
 *
 * The intended bounded invocation, when run from an environment that CAN run
 * Playwright (a machine, GitHub Action, or a dedicated worker — NOT Vercel
 * serverless):
 *   npx tsx scripts/scan-justice-matrix.ts --max-sources 3 --limit 5 --apply
 *
 * TODO(live-api / infra): pick ONE of these to make this cron do real work,
 * then replace the no-op body:
 *   1. Move the HTML scan to a GitHub Action on a daily schedule (recommended:
 *      Playwright runs cleanly there) and let this route stay a heartbeat, or
 *   2. Deploy the scan as a separate long-running worker / container and have
 *      this route POST a bounded job to it (max-sources 3, limit 5), or
 *   3. Refactor scan-justice-matrix.ts into an importable function that does
 *      NOT depend on Playwright (HTML-via-fetch + the LLM extract path) and
 *      call it here. This loses JS-rendered sources but is serverless-safe.
 * Until one is chosen, this route is intentionally inert.
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Bounds documented for whoever wires the real execution path. Kept here so the
// daily schedule and the intended limits live in one file.
const HTML_SCAN_BOUNDS = { maxSources: 3, limit: 5 } as const;

export async function GET(request: Request) {
  // Honour the Vercel cron secret in production; allow no header locally.
  // Same guard shape as the sibling scan-json route.
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const got = request.headers.get('authorization');
    if (got !== `Bearer ${expected}`) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Safe no-op: the HTML scan cannot run inside Vercel serverless (see header).
  // Returns 200 with a status payload so the cron registers as healthy and the
  // dashboard can show that the HTML path is scheduled-but-externalised.
  return NextResponse.json({
    ok: true,
    scanned_at: new Date().toISOString(),
    mode: 'stub',
    ran: false,
    reason:
      'HTML scan runs via Playwright in scripts/scan-justice-matrix.ts, which is not serverless-safe. This endpoint is a scheduled heartbeat; wire a real execution path (see route header TODO).',
    intended_command: `npx tsx scripts/scan-justice-matrix.ts --max-sources ${HTML_SCAN_BOUNDS.maxSources} --limit ${HTML_SCAN_BOUNDS.limit} --apply`,
    bounds: HTML_SCAN_BOUNDS,
  });
}
