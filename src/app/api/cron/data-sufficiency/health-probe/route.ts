import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';

/**
 * Source URL health probe.
 *
 * Monthly: HEAD-checks (with GET fallback) every active source URL in
 * data_sources_inventory. Records the result; any URL returning non-2xx
 * triggers an OPEN gap question so a dead source surfaces in the
 * dashboard within hours, not next time someone happens to click it.
 *
 * Defends against silent rot: data.gov.au sometimes moves resources,
 * federal departments rename pages after machinery-of-government changes,
 * state portals re-platform.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  return token === secret;
}

const PROBE_TIMEOUT_MS = 12_000;
const UA = 'JusticeHub-SourceHealthProbe/1.0 (contact: ben@justicehub.com.au)';

async function probe(url: string): Promise<{ status: number; ok: boolean; reason?: string }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS);
  try {
    // Try HEAD first
    let res = await fetch(url, { method: 'HEAD', signal: ctrl.signal, headers: { 'User-Agent': UA }, redirect: 'follow' });
    if (res.status === 405 || res.status === 403) {
      // Some servers reject HEAD; try GET with no body read
      res = await fetch(url, { method: 'GET', signal: ctrl.signal, headers: { 'User-Agent': UA }, redirect: 'follow' });
    }
    return { status: res.status, ok: res.status >= 200 && res.status < 400 };
  } catch (err: any) {
    if (err?.name === 'AbortError') return { status: 0, ok: false, reason: 'timeout' };
    return { status: 0, ok: false, reason: err?.message || 'fetch error' };
  } finally {
    clearTimeout(t);
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createServiceClient() as any;

  const { data: sources } = await supabase
    .from('data_sources_inventory')
    .select('source_key, display_name, topic, url, status')
    .in('status', ['active', 'planned'])
    .not('url', 'is', null);
  if (!sources || sources.length === 0) {
    return NextResponse.json({ ok: true, probed: 0 });
  }

  const probed: any[] = [];
  const failures: any[] = [];

  for (const s of sources) {
    const result = await probe(s.url);
    probed.push({ source_key: s.source_key, url: s.url, ...result });
    if (!result.ok) failures.push({ ...s, ...result });
    // Small pause between probes to be polite
    await new Promise((r) => setTimeout(r, 200));
  }

  // Auto-create gap questions for failures, dedupe by existing OPEN questions
  let flagsCreated = 0;
  for (const f of failures) {
    const flagText = `Source URL not reachable: "${f.display_name}" (${f.status || 0}${f.reason ? ' ' + f.reason : ''}) — ${f.url}`;
    const { data: existing } = await supabase
      .from('data_gap_questions')
      .select('id')
      .eq('topic', f.topic)
      .eq('status', 'open')
      .ilike('question', `%${f.display_name}%not reachable%`)
      .maybeSingle();
    if (existing) continue;
    await supabase.from('data_gap_questions').insert({
      question: flagText,
      topic: f.topic,
      status: 'open',
      priority: 2,
      proposed_source_url: f.url,
      owner: 'agent:health-probe',
    });
    flagsCreated++;
  }

  return NextResponse.json({
    ok: true,
    probedCount: probed.length,
    failuresCount: failures.length,
    flagsCreated,
    failures: failures.map((f) => ({
      source_key: f.source_key,
      display_name: f.display_name,
      url: f.url,
      status: f.status,
      reason: f.reason,
    })),
  });
}
