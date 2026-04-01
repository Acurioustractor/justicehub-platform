import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-lite';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { code } = await request.json();

  if (!code) {
    return NextResponse.json({ error: 'Code required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: stop } = await supabase
    .from('tour_stops')
    .select('access_code')
    .eq('event_slug', slug)
    .single();

  if (!stop?.access_code) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (code.toLowerCase().trim() === stop.access_code.toLowerCase().trim()) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid code' }, { status: 403 });
}
