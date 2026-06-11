import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createServiceClient } from '@/lib/supabase/service-lite';
import { checkRateLimit } from '@/lib/security';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveProject(supabase: any, slug: string) {
  const { data, error } = await supabase
    .from('art_innovation')
    .select('id, title, slug')
    .eq('slug', slug)
    .single();
  if (error || !data) return null;
  return data;
}

/**
 * POST /api/projects/[slug]/nominations/upvote
 *
 * Public: upvote a nominee on the leaderboard ("walk them through").
 * One vote per nominee per visitor — fingerprint is a salted hash of IP + UA,
 * so no personal data is stored. Idempotent: re-voting returns the same count.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createServiceClient() as any;

    const project = await resolveProject(supabase, slug);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const limit = checkRateLimit(`nomination-upvotes:${ip}`, { limit: 30, windowMs: 60 * 60 * 1000 });
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Too many votes from this connection.' }, { status: 429 });
    }

    const body = await request.json();
    const nomineeName = String(body.nominee_name || '').trim();
    if (!nomineeName || nomineeName.length > 200) {
      return NextResponse.json({ error: 'nominee_name is required' }, { status: 400 });
    }
    const nomineeKey = nomineeName.toLowerCase();

    // Only nominees who actually exist on the public wall can be voted on.
    const { count: exists } = await supabase
      .from('campaign_nominations')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', project.id)
      .eq('is_public', true)
      .ilike('nominee_name', nomineeName);
    if (!exists) {
      return NextResponse.json({ error: 'Nominee not found' }, { status: 404 });
    }

    const userAgent = request.headers.get('user-agent') || '';
    const salt = process.env.CRON_SECRET || 'contained';
    const fingerprint = createHash('sha256').update(`${salt}:${ip}:${userAgent}`).digest('hex');

    // Idempotent insert — unique(project_id, nominee_key, voter_fingerprint)
    await supabase
      .from('campaign_nomination_upvotes')
      .upsert(
        { project_id: project.id, nominee_key: nomineeKey, voter_fingerprint: fingerprint },
        { onConflict: 'project_id,nominee_key,voter_fingerprint', ignoreDuplicates: true }
      );

    const { count } = await supabase
      .from('campaign_nomination_upvotes')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', project.id)
      .eq('nominee_key', nomineeKey);

    return NextResponse.json({ success: true, upvotes: count || 0 });
  } catch (error) {
    console.error('Nomination upvote error:', error);
    return NextResponse.json({ error: 'Failed to upvote' }, { status: 500 });
  }
}
