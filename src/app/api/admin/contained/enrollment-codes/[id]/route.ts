import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase/admin-lite';

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  const { supabase } = await requireAdmin('/admin/contained/enrollment');
  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.is_active === 'boolean') patch.is_active = body.is_active;
  if ('event_name' in body) patch.event_name = body.event_name;
  if ('tour_stop_slug' in body) patch.tour_stop_slug = body.tour_stop_slug;
  if ('max_uses' in body) patch.max_uses = body.max_uses;
  if ('expires_at' in body) patch.expires_at = body.expires_at;
  if ('notes' in body) patch.notes = body.notes;

  const { data, error } = await supabase
    .from('enrollment_codes')
    .update(patch)
    .eq('id', ctx.params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ code: data });
}
