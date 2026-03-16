import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTranscripts, getStoryDetail, isV2Configured } from '@/lib/empathy-ledger/v2-client';

/**
 * GET /api/empathy-ledger/transcripts
 * Admin-only: list transcripts with metadata (no full content)
 *
 * POST /api/empathy-ledger/transcripts
 * Admin-only: fetch single story detail by storyId
 */

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') return { error: NextResponse.json({ error: 'Admin required' }, { status: 403 }) };

  return { user };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth && auth.error) return auth.error;

    if (!isV2Configured) {
      return NextResponse.json({ data: [], total: 0, unavailable_reason: 'EMPATHY_LEDGER_NOT_CONFIGURED' });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await getTranscripts({ limit });

    // Map v2 response to legacy format
    const enriched = result.data.map(t => ({
      id: t.id,
      title: t.title,
      storyteller_id: t.storyteller?.id || null,
      storyteller_name: t.storyteller?.displayName || 'Unknown',
      privacy_level: 'public',
      is_public: true,
      created_at: t.createdAt,
      updated_at: t.updatedAt,
      themes: [],
      cultural_sensitivity_level: null,
      has_transcript: !!t.content && t.content.length > 100,
      transcript_length: t.content?.length || 0,
    }));

    return NextResponse.json({
      data: enriched,
      total: result.pagination.total,
    });
  } catch (error: any) {
    console.error('EL transcripts error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth && auth.error) return auth.error;

    if (!isV2Configured) {
      return NextResponse.json({ error: 'Empathy Ledger not configured' }, { status: 503 });
    }

    const { storyId } = await request.json();
    if (!storyId) return NextResponse.json({ error: 'storyId required' }, { status: 400 });

    const story = await getStoryDetail(storyId);
    if (!story) {
      return NextResponse.json({ error: 'Story not found in Empathy Ledger' }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        id: story.id,
        title: story.title,
        transcript: story.content,
        storyteller_name: story.storyteller?.displayName || 'Unknown',
        themes: story.themes,
        privacy_level: 'public',
        is_public: true,
        cultural_sensitivity_level: story.culturalLevel,
      },
    });
  } catch (error: any) {
    console.error('EL transcript fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
