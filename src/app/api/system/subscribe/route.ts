import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, states, keywords } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ ok: false, error: 'Valid email required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if already subscribed
    const { data: existing } = await supabase
      .from('alert_preferences')
      .select('id')
      .eq('name', email)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ ok: true, message: 'Already subscribed' });
    }

    // Create subscription
    const { error } = await supabase
      .from('alert_preferences')
      .insert({
        name: email,
        enabled: true,
        frequency: 'daily',
        categories: ['youth_justice', 'ministerial_statement', 'funding_announcement'],
        states: states || ['QLD', 'NSW', 'VIC', 'NT'],
        keywords: keywords || ['youth justice'],
        focus_areas: ['system_terminal'],
      });

    if (error) {
      console.error('[subscribe] Error:', error);
      return NextResponse.json({ ok: false, error: 'Subscription failed' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: 'Subscribed successfully' });
  } catch (err: any) {
    console.error('[subscribe] Error:', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
