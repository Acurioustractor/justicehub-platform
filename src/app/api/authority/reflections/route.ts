import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const LIMIT = 20;

// Simple in-memory rate limit: max 5 submissions per IP per hour
const rateLimitMap = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hourAgo = now - 3600000;
  const timestamps = (rateLimitMap.get(ip) || []).filter(t => t > hourAgo);
  rateLimitMap.set(ip, timestamps);
  return timestamps.length >= 5;
}

function recordSubmission(ip: string) {
  const timestamps = rateLimitMap.get(ip) || [];
  timestamps.push(Date.now());
  rateLimitMap.set(ip, timestamps);
}

/**
 * GET /api/authority/reflections?page=1
 * Returns approved community reflections, paginated, newest first
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const offset = (page - 1) * LIMIT;

  const [{ data, error }, { count }] = await Promise.all([
    supabase
      .from('community_reflections')
      .select('id, name, location, reflection, city_nomination, created_at')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + LIMIT - 1),
    supabase
      .from('community_reflections')
      .select('id', { count: 'exact', head: true })
      .eq('is_approved', true),
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    reflections: data || [],
    total: count || 0,
    hasMore: (count || 0) > offset + LIMIT,
    page,
  });
}

/**
 * POST /api/authority/reflections
 * Submit a new community reflection (public, no auth)
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many submissions. Please try again later.' },
      { status: 429 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { name, location, reflection, city_nomination } = body;

  if (!name || typeof name !== 'string' || name.trim().length < 1) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  if (!reflection || typeof reflection !== 'string' || reflection.trim().length < 1) {
    return NextResponse.json({ error: 'Reflection is required' }, { status: 400 });
  }

  if (reflection.length > 500) {
    return NextResponse.json({ error: 'Reflection must be 500 characters or less' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('community_reflections')
    .insert({
      name: name.trim().slice(0, 100),
      location: location ? String(location).trim().slice(0, 100) : null,
      reflection: reflection.trim(),
      city_nomination: city_nomination ? String(city_nomination).trim().slice(0, 100) : null,
      is_approved: false,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Reflection insert error:', error);
    return NextResponse.json({ error: 'Failed to submit reflection' }, { status: 500 });
  }

  recordSubmission(ip);

  return NextResponse.json({ success: true, id: data.id }, { status: 201 });
}
