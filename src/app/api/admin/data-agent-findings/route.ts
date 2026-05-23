import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { createClient } from '@/lib/supabase/server-lite';

/**
 * Review surface for agent findings.
 *
 * POST kicks off the agent for a specific gap_id (forwarded to the cron route).
 * PATCH accepts / rejects a finding. On accept, optionally also creates a new
 * row in data_sources_inventory using { source_key, display_name, status }
 * from the request body.
 */

async function requireAdmin(req: NextRequest) {
  const host = req.headers.get('host') || '';
  if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) return true;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return false;
  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single();
  return profile?.role === 'admin';
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'admin only' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const { id, action, source_key, display_name } = body || {};
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  if (!['accept', 'reject', 'duplicate'].includes(action)) {
    return NextResponse.json({ error: 'action must be accept | reject | duplicate' }, { status: 400 });
  }

  const service = createServiceClient() as any;
  const { data: finding } = await service
    .from('data_agent_findings')
    .select('*, data_gap_questions(id, topic, question)')
    .eq('id', id)
    .maybeSingle();
  if (!finding) return NextResponse.json({ error: 'finding not found' }, { status: 404 });

  if (action === 'reject' || action === 'duplicate') {
    await service
      .from('data_agent_findings')
      .update({ status: action === 'reject' ? 'rejected' : 'duplicate', reviewed_at: new Date().toISOString() })
      .eq('id', id);
    return NextResponse.json({ ok: true });
  }

  // Accept: create the source if a key is provided. If not, just mark accepted.
  let resulting_source_key: string | null = null;
  if (source_key) {
    if (!/^[a-z0-9_]+$/.test(source_key)) {
      return NextResponse.json({ error: 'source_key must be lowercase letters / digits / underscores' }, { status: 400 });
    }
    const { error: insErr } = await service
      .from('data_sources_inventory')
      .upsert(
        {
          source_key,
          topic: finding.topic,
          display_name: display_name || finding.candidate_title || finding.candidate_url,
          description: finding.summary,
          url: finding.candidate_url,
          status: 'planned',
          coverage_note: finding.rationale,
        },
        { onConflict: 'source_key' }
      );
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    resulting_source_key = source_key;
  }

  await service
    .from('data_agent_findings')
    .update({ status: 'accepted', reviewed_at: new Date().toISOString(), resulting_source_key })
    .eq('id', id);

  // If the gap question was 'open' or 'investigating', flip to 'sourced' once accepted
  if (finding.gap_question_id) {
    await service
      .from('data_gap_questions')
      .update({ status: 'sourced', resolved_at: new Date().toISOString() })
      .eq('id', finding.gap_question_id)
      .in('status', ['open', 'investigating']);
  }

  return NextResponse.json({ ok: true, resulting_source_key });
}
