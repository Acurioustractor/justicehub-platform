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

  const { error } = await sc.from('campaign_nominations').update({ is_public: true }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
