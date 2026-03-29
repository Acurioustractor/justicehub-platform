import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { createServerClient } from '@supabase/ssr';
import { generateEnrollmentCode } from '@/lib/enrollment/code-generator';

async function getAdminUser(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const service = createServiceClient();
  const { data: profile } = await service
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin' ? user : null;
}

// GET: List all codes
export async function GET(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const service = createServiceClient();
  const { data: codes, error } = await service
    .from('enrollment_codes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ codes });
}

// POST: Generate a new code
export async function POST(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await request.json();
  const { event_name, max_uses, expires_at, prefix } = body;

  // Generate unique code (retry up to 5 times on collision)
  const service = createServiceClient();
  let code = '';
  for (let i = 0; i < 5; i++) {
    code = generateEnrollmentCode(prefix || 'CONT');
    const { data: existing } = await service
      .from('enrollment_codes')
      .select('id')
      .eq('code', code)
      .maybeSingle();
    if (!existing) break;
  }

  const { data, error } = await service
    .from('enrollment_codes')
    .insert({
      code,
      event_name: event_name || null,
      max_uses: max_uses || 100,
      expires_at: expires_at || null,
      created_by: admin.id,
      project_slug: 'contained',
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://justicehub.com.au';
  const enrollUrl = `${baseUrl}/contained/enroll?code=${data.code}`;

  return NextResponse.json({
    code: data,
    enrollUrl,
    qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(enrollUrl)}`,
  });
}
