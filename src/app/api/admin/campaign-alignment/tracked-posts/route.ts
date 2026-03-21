import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';

/**
 * GET /api/admin/campaign-alignment/tracked-posts
 * Returns all tracked LinkedIn posts.
 *
 * POST /api/admin/campaign-alignment/tracked-posts
 * Adds a new tracked post URL.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const service = createServiceClient();
    const { data, error } = await service
      .from('campaign_tracked_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ posts: data || [] });
  } catch (error) {
    console.error('Tracked posts GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch tracked posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const postUrl = body.post_url?.trim();

    if (!postUrl || !postUrl.includes('linkedin.com')) {
      return NextResponse.json({ error: 'Invalid LinkedIn URL' }, { status: 400 });
    }

    const service = createServiceClient();
    const { data, error } = await service
      .from('campaign_tracked_posts')
      .upsert({ post_url: postUrl }, { onConflict: 'post_url' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ post: data });
  } catch (error) {
    console.error('Tracked posts POST error:', error);
    return NextResponse.json({ error: 'Failed to add tracked post' }, { status: 500 });
  }
}
