import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase/admin-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';

/**
 * Nomination moderation queue (admin only).
 * GET: pending nominations (is_public = false)
 * POST: approve one ({ id }) or all ({ all: true }); reject one ({ id, reject: true })
 * Rejection deletes the row — the message never publishes and the count drops.
 */
export async function GET() {
  await requireAdmin('/admin/contained/flow');
  const sc = createServiceClient() as any;
  const { data, error } = await sc
    .from('campaign_nominations')
    .select('id, nominee_name, nominee_title, nominee_org, category, reason, nominator_name, nominator_email, created_at')
    .eq('is_public', false)
    .order('created_at', { ascending: true })
    .limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pending: data || [] });
}

export async function POST(req: NextRequest) {
  await requireAdmin('/admin/contained/flow');
  const sc = createServiceClient() as any;
  const body = await req.json().catch(() => ({}));

  if (body.all === true) {
    const { error } = await sc
      .from('campaign_nominations')
      .update({ is_public: true })
      .eq('is_public', false);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  const id = String(body.id || '');
  if (!/^[0-9a-f-]{36}$/.test(id)) {
    return NextResponse.json({ error: 'id or all:true required' }, { status: 400 });
  }

  if (body.reject === true) {
    const { error } = await sc.from('campaign_nominations').delete().eq('id', id).eq('is_public', false);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, rejected: true });
  }

  // Approve, with optional edits (fix names/titles/reasons before they publish).
  const patch: Record<string, string | boolean | null> = { is_public: true };
  const u = body.updates || {};
  const clean = (v: unknown, max: number) => {
    const s = String(v ?? '').trim().slice(0, max);
    return s || null;
  };
  if (u.nominee_name !== undefined) {
    const name = clean(u.nominee_name, 200);
    if (!name) return NextResponse.json({ error: 'nominee_name cannot be empty' }, { status: 400 });
    patch.nominee_name = name;
  }
  if (u.nominee_title !== undefined) patch.nominee_title = clean(u.nominee_title, 200);
  if (u.nominee_org !== undefined) patch.nominee_org = clean(u.nominee_org, 200);
  if (u.reason !== undefined) {
    const reason = clean(u.reason, 2000);
    if (!reason) return NextResponse.json({ error: 'reason cannot be empty' }, { status: 400 });
    patch.reason = reason;
  }

  const { error } = await sc.from('campaign_nominations').update(patch).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
