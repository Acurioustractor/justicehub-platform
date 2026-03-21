import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false, error: 'Code required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('enrollment_codes')
      .select('id, code, project_slug, event_name, max_uses, current_uses, expires_at, is_active')
      .eq('code', code.toUpperCase().trim())
      .single();

    if (error || !data) {
      return NextResponse.json({ valid: false, error: 'Invalid code' }, { status: 404 });
    }

    if (!data.is_active) {
      return NextResponse.json({ valid: false, error: 'Code is no longer active' }, { status: 410 });
    }

    if (data.max_uses && data.current_uses >= data.max_uses) {
      return NextResponse.json({ valid: false, error: 'Code has reached maximum uses' }, { status: 410 });
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: 'Code has expired' }, { status: 410 });
    }

    return NextResponse.json({
      valid: true,
      project_slug: data.project_slug,
      event_name: data.event_name,
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
