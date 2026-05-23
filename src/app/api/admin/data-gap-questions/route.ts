import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { createClient } from '@/lib/supabase/server-lite';

/**
 * CRUD for data gap questions. Admin-only.
 *
 * POST adds a new open question.
 * PATCH updates status / outcome_note / owner on an existing question.
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

const VALID_TOPICS = ['grants', 'foundations', 'government', 'orgs', 'oversight', 'demographics', 'meta'];
const VALID_STATUSES = ['open', 'investigating', 'sourced', 'closed', 'wontfix'];

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'admin only' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const { question, topic, proposed_source_url, priority, owner } = body || {};
  if (!question || typeof question !== 'string' || question.length < 5) {
    return NextResponse.json({ error: 'question (>=5 chars) required' }, { status: 400 });
  }
  if (!VALID_TOPICS.includes(topic)) {
    return NextResponse.json({ error: `topic must be one of: ${VALID_TOPICS.join(', ')}` }, { status: 400 });
  }
  const service = createServiceClient() as any;
  const { data, error } = await service
    .from('data_gap_questions')
    .insert({
      question: question.trim(),
      topic,
      proposed_source_url: proposed_source_url || null,
      priority: priority ? Math.min(5, Math.max(1, Number(priority))) : 3,
      owner: owner || null,
    })
    .select('id')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'admin only' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const { id, status, outcome_note, owner, proposed_source_url } = body || {};
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const patch: any = {};
  if (status) {
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
    }
    patch.status = status;
    if (['sourced', 'closed', 'wontfix'].includes(status)) patch.resolved_at = new Date().toISOString();
  }
  if (typeof outcome_note === 'string') patch.outcome_note = outcome_note;
  if (typeof owner === 'string') patch.owner = owner;
  if (typeof proposed_source_url === 'string') patch.proposed_source_url = proposed_source_url;
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'nothing to update' }, { status: 400 });

  const service = createServiceClient() as any;
  const { error } = await service.from('data_gap_questions').update(patch).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
