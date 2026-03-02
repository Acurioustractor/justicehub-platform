import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { listSystem0Events, type System0AuditEvent } from '@/lib/funding/system0-audit';

function getServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('Missing service role key');
  }
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  );
}

async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return data?.role === 'admin';
}

function normalizeDateStart(value: string | null): string | undefined {
  const raw = (value || '').trim();
  if (!raw) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return `${raw}T00:00:00.000Z`;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

function normalizeDateEnd(value: string | null): string | undefined {
  const raw = (value || '').trim();
  if (!raw) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return `${raw}T23:59:59.999Z`;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

function toCsvCell(value: unknown): string {
  const safe = String(value ?? '').replace(/"/g, '""');
  return `"${safe}"`;
}

function buildEventsCsv(events: System0AuditEvent[]): string {
  const header = ['id', 'createdAt', 'eventType', 'source', 'runId', 'message', 'actorId', 'payload'];
  const rows = events.map((event) => [
    toCsvCell(event.id),
    toCsvCell(event.createdAt),
    toCsvCell(event.eventType),
    toCsvCell(event.source),
    toCsvCell(event.runId),
    toCsvCell(event.message),
    toCsvCell(event.actorId),
    toCsvCell(JSON.stringify(event.payload || {})),
  ].join(','));
  return [header.join(','), ...rows].join('\n');
}

export async function GET(request: NextRequest) {
  try {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (!await isAdmin(authClient, user.id)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const url = new URL(request.url);
    const limit = Math.max(1, Math.min(500, Number(url.searchParams.get('limit') || 20)));
    const eventType = url.searchParams.get('eventType') || undefined;
    const source = url.searchParams.get('source') || undefined;
    const runId = (url.searchParams.get('runId') || '').trim() || undefined;
    const beforeCreatedAt = (url.searchParams.get('before') || '').trim() || undefined;
    const fromCreatedAt = normalizeDateStart(url.searchParams.get('from'));
    const toCreatedAt = normalizeDateEnd(url.searchParams.get('to'));
    const format = (url.searchParams.get('format') || '').toLowerCase();

    const serviceClient = getServiceClient();
    const events = await listSystem0Events(serviceClient, {
      limit,
      eventType,
      source,
      runId,
      beforeCreatedAt,
      fromCreatedAt,
      toCreatedAt,
    });

    if (format === 'csv') {
      const csv = buildEventsCsv(events);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="system0-events-${timestamp}.csv"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    const nextCursor = events.length === limit ? events[events.length - 1]?.createdAt || null : null;
    return NextResponse.json({
      success: true,
      events,
      pagination: {
        limit,
        nextCursor,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
