import { NextRequest, NextResponse } from 'next/server';
import { runFundingOperatingSystemCycle } from '@/lib/funding/funding-operating-system';

function getCronSecret(): string | null {
  return process.env.FUNDING_OS_CRON_SECRET || process.env.CRON_SECRET || null;
}

function isAuthorizedRequest(request: NextRequest): boolean {
  const secret = getCronSecret();
  if (!secret) return false;

  const authorization = request.headers.get('authorization') || '';
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : '';
  const headerSecret = request.headers.get('x-funding-os-cron-secret') || '';

  return token === secret || headerSecret === secret;
}

function parseStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

async function runCycle(request: NextRequest) {
  const secret = getCronSecret();
  if (!secret) {
    return NextResponse.json(
      { error: 'Funding OS cron secret is not configured' },
      { status: 503 }
    );
  }

  if (!isAuthorizedRequest(request)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const body = request.method === 'POST'
    ? ((await request.json().catch(() => ({}))) as Record<string, unknown>)
    : {};

  const result = await runFundingOperatingSystemCycle(
    {
      opportunityIds: parseStringArray(
        body.opportunityIds ||
          url.searchParams
            .getAll('opportunityId')
            .filter((value) => typeof value === 'string' && value.trim().length > 0)
      ),
      organizationIds: parseStringArray(
        body.organizationIds ||
          url.searchParams
            .getAll('organizationId')
            .filter((value) => typeof value === 'string' && value.trim().length > 0)
      ),
      statuses: parseStringArray(
        body.statuses ||
          url.searchParams
            .getAll('status')
            .filter((value) => typeof value === 'string' && value.trim().length > 0)
      ),
      ingestLimit:
        typeof body.ingestLimit === 'number'
          ? body.ingestLimit
          : url.searchParams.get('ingestLimit')
            ? Number(url.searchParams.get('ingestLimit'))
            : undefined,
      matchLimit:
        typeof body.matchLimit === 'number'
          ? body.matchLimit
          : url.searchParams.get('matchLimit')
            ? Number(url.searchParams.get('matchLimit'))
            : undefined,
      minScore:
        typeof body.minScore === 'number'
          ? body.minScore
          : url.searchParams.get('minScore')
            ? Number(url.searchParams.get('minScore'))
            : undefined,
      notifyOnAlerts:
        typeof body.notifyOnAlerts === 'boolean'
          ? body.notifyOnAlerts
          : url.searchParams.has('notifyOnAlerts')
            ? url.searchParams.get('notifyOnAlerts') === 'true'
            : true,
    },
    null
  );

  return NextResponse.json({
    success: true,
    ...result,
  });
}

export async function GET(request: NextRequest) {
  try {
    return await runCycle(request);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to run Funding OS cycle' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    return await runCycle(request);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to run Funding OS cycle' }, { status: 500 });
  }
}
