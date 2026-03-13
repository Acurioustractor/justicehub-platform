import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/supabase/admin-lite';

/**
 * GET /api/admin/contained/stories
 * Admin: list stories for management.
 * ?source=synced  → all synced_stories (for story editor on contained page)
 * ?status=pending → tour_stories by status (default)
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { supabase } = admin;
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');

    if (source === 'synced') {
      const { data, error } = await supabase
        .from('synced_stories')
        .select('id, title, summary, story_image_url, story_type, story_category, themes, is_featured, project_slugs, source_published_at')
        .order('is_featured', { ascending: false })
        .order('source_published_at', { ascending: false });

      if (error) throw error;
      return NextResponse.json({ stories: data || [] });
    }

    const status = searchParams.get('status') || 'pending';
    const { data, error } = await supabase
      .from('tour_stories')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ stories: data || [] });
  } catch (error) {
    console.error('Admin stories GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 });
  }
}
