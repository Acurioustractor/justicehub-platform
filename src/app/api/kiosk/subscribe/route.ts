import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';

/**
 * Email capture for the weekly What Changed digest.
 *
 * Lives behind the kiosk's email-capture footer and is also reusable from the
 * web. Posts insert into whats_new_subscribers with idempotency on lower(email);
 * an existing email returns `duplicate: true` rather than erroring.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  try {
    const { email, source } = await req.json();
    if (!email || typeof email !== 'string' || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }
    const supabase = createServiceClient() as any;
    const normalised = email.trim().toLowerCase();
    const { data: existing } = await supabase
      .from('whats_new_subscribers')
      .select('id, unsubscribed_at')
      .ilike('email', normalised)
      .maybeSingle();
    if (existing) {
      // If they had unsubscribed, re-subscribe them; otherwise just acknowledge.
      if (existing.unsubscribed_at) {
        await supabase
          .from('whats_new_subscribers')
          .update({ unsubscribed_at: null, subscribed_at: new Date().toISOString() })
          .eq('id', existing.id);
      }
      return NextResponse.json({ ok: true, duplicate: true });
    }
    const { error } = await supabase
      .from('whats_new_subscribers')
      .insert({ email: normalised, source: typeof source === 'string' ? source : 'kiosk' });
    if (error) {
      console.error('subscribe insert failed', error);
      return NextResponse.json({ error: 'Could not save your email. Try again.' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('subscribe handler failed', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
