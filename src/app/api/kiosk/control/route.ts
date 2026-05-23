import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';

/**
 * PIN-gated sender for kiosk control signals. POST body: { pin, signal_type, payload?, sent_by? }.
 * PIN comes from env var KIOSK_CONTROL_PIN (set per environment).
 *
 * Use case: venue operator opens /admin/kiosk/control on their phone,
 * enters the PIN, taps "Reset kiosk", the running kiosk picks it up on
 * its next 5s poll and navigates back to /kiosk.
 */

export const dynamic = 'force-dynamic';

const VALID_TYPES = new Set(['reset', 'reload', 'note']);

export async function POST(req: NextRequest) {
  const expected = process.env.KIOSK_CONTROL_PIN;
  if (!expected) {
    return NextResponse.json({ error: 'KIOSK_CONTROL_PIN not configured on server.' }, { status: 503 });
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON body required' }, { status: 400 });
  }
  const { pin, signal_type, payload, sent_by } = body || {};
  if (typeof pin !== 'string' || pin !== expected) {
    return NextResponse.json({ error: 'PIN incorrect' }, { status: 401 });
  }
  if (!VALID_TYPES.has(signal_type)) {
    return NextResponse.json({ error: `signal_type must be one of: ${[...VALID_TYPES].join(', ')}` }, { status: 400 });
  }
  const supabase = createServiceClient() as any;
  const { data, error } = await supabase
    .from('kiosk_control_signals')
    .insert({
      signal_type,
      payload: payload || null,
      sent_by: typeof sent_by === 'string' ? sent_by.slice(0, 80) : null,
    })
    .select('id, sent_at')
    .single();
  if (error) {
    console.error('control insert failed', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: data.id, sent_at: data.sent_at });
}
