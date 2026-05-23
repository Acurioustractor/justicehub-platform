import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';

/**
 * Poll endpoint for the kiosk client. Returns the most recent control
 * signal so the kiosk can react if it's newer than its last-seen timestamp.
 *
 * Public read; intentionally lightweight (one row). The signal sender side
 * is /api/kiosk/control which requires the PIN.
 */

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createServiceClient() as any;
  const { data, error } = await supabase
    .from('kiosk_control_signals')
    .select('id, signal_type, payload, sent_at')
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ signal: data || null });
}
