import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase/admin-lite';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { supabase } = await requireAdmin('/admin/contained/enrollment');
  const { data, error } = await supabase
    .from('enrollment_codes')
    .select('id, code, project_slug, event_name, tour_stop_slug, max_uses, current_uses, is_active, expires_at, notes, created_at')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ codes: data ?? [] });
}

export async function POST(req: NextRequest) {
  const { supabase, user } = await requireAdmin('/admin/contained/enrollment');
  const body = await req.json().catch(() => ({}));
  const code = String(body.code ?? '').trim().toUpperCase();
  if (!code || !/^[A-Z0-9-]{4,32}$/.test(code)) {
    return NextResponse.json({ error: 'Code must be 4–32 chars, A–Z 0–9 dash only' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('enrollment_codes')
    .insert({
      code,
      project_slug: 'contained',
      event_name: body.event_name ?? null,
      tour_stop_slug: body.tour_stop_slug ?? null,
      max_uses: body.max_uses ?? null,
      notes: body.notes ?? null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ code: data });
}
