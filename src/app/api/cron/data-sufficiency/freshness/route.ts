import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';

/**
 * Freshness watcher.
 *
 * Runs weekly. For each active source whose last_refreshed_at is older than
 * its stated refresh_cadence (or 60 days as default), auto-creates a gap
 * question in 'open' status flagging the stale source. Avoids duplicates
 * by checking for an existing open question that matches the source_key.
 *
 * The goal: when something goes stale, the team is reminded — not by
 * silence, but by a new line item in /admin/data-sufficiency.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  return token === secret;
}

const CADENCE_DAYS: Record<string, number> = {
  daily: 2,
  weekly: 14,
  monthly: 45,
  quarterly: 120,
  biannual: 240,
  annual: 400,
  rolling: 30,
  planned: Infinity,
};

function staleThreshold(cadence: string | null): number {
  if (!cadence) return 60;
  const c = cadence.toLowerCase();
  return CADENCE_DAYS[c] ?? 60;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createServiceClient() as any;
  const { data: sources } = await supabase
    .from('data_sources_inventory')
    .select('source_key, display_name, topic, last_refreshed_at, refresh_cadence, status')
    .eq('status', 'active');

  if (!sources) return NextResponse.json({ ok: true, alerted: 0 });

  const alerts: any[] = [];
  for (const s of sources) {
    if (!s.last_refreshed_at) {
      alerts.push({ ...s, days_overdue: 'never refreshed' });
      continue;
    }
    const days = Math.floor((Date.now() - new Date(s.last_refreshed_at).getTime()) / 86_400_000);
    const threshold = staleThreshold(s.refresh_cadence);
    if (days > threshold) {
      alerts.push({ ...s, days_overdue: days - threshold });
    }
  }

  let created = 0;
  for (const a of alerts) {
    const flagText = `Source "${a.display_name}" is overdue for refresh (${a.days_overdue} days past its ${a.refresh_cadence || 'default'} cadence)`;
    // Skip if there's already an open question for this exact alert
    const { data: existing } = await supabase
      .from('data_gap_questions')
      .select('id')
      .eq('topic', a.topic)
      .eq('status', 'open')
      .ilike('question', `%${a.display_name}%overdue%`)
      .maybeSingle();
    if (existing) continue;
    await supabase.from('data_gap_questions').insert({
      question: flagText,
      topic: a.topic,
      status: 'open',
      priority: 3,
      owner: 'agent:freshness',
    });
    created++;
  }

  return NextResponse.json({
    ok: true,
    activeSources: sources.length,
    overdue: alerts.length,
    flagsCreated: created,
    alerts,
  });
}
