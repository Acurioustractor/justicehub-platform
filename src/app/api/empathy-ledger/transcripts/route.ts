import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createELClient } from '@supabase/supabase-js';

function getELClient() {
  const url = process.env.EMPATHY_LEDGER_SUPABASE_URL || process.env.EMPATHY_LEDGER_URL;
  const key = process.env.EMPATHY_LEDGER_SUPABASE_ANON_KEY || process.env.EMPATHY_LEDGER_API_KEY;

  if (!url || !key) {
    throw new Error('Empathy Ledger env vars not configured');
  }

  return createELClient(url, key);
}

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Admin required' }, { status: 403 });

    const el = getELClient();
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('organization_id');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Fetch stories/transcripts from EL
    // The EL database stores stories with transcripts, privacy levels, etc.
    let query = el
      .from('stories')
      .select('id, title, transcript, privacy_level, is_public, storyteller_id, created_at, updated_at, themes, cultural_sensitivity_level')
      .order('created_at', { ascending: false })
      .limit(limit);

    // If org ID provided, filter by organization
    if (orgId) {
      query = query.eq('organization_id', orgId);
    }

    const { data: stories, error } = await query;

    if (error) {
      console.error('EL query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich with storyteller names
    const storytellerIds = [...new Set((stories || []).map(s => s.storyteller_id).filter(Boolean))];
    let storytellerMap: Record<string, string> = {};

    if (storytellerIds.length > 0) {
      const { data: storytellers } = await el
        .from('profiles')
        .select('id, display_name')
        .in('id', storytellerIds);

      if (storytellers) {
        storytellerMap = Object.fromEntries(storytellers.map(s => [s.id, s.display_name]));
      }
    }

    const enriched = (stories || []).map(story => ({
      ...story,
      storyteller_name: storytellerMap[story.storyteller_id] || 'Unknown',
      has_transcript: !!story.transcript && story.transcript.length > 100,
      transcript_length: story.transcript?.length || 0,
      // Don't send full transcript in list view
      transcript: undefined,
    }));

    return NextResponse.json({
      data: enriched,
      total: enriched.length,
    });
  } catch (error: any) {
    console.error('EL transcripts error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Fetch a single transcript for story creation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Admin required' }, { status: 403 });

    const { storyId } = await request.json();
    if (!storyId) return NextResponse.json({ error: 'storyId required' }, { status: 400 });

    const el = getELClient();

    const { data: story, error } = await el
      .from('stories')
      .select('id, title, transcript, privacy_level, is_public, storyteller_id, themes, cultural_sensitivity_level')
      .eq('id', storyId)
      .single();

    if (error || !story) {
      return NextResponse.json({ error: 'Story not found in Empathy Ledger' }, { status: 404 });
    }

    // Get storyteller name
    let storytellerName = 'Unknown';
    if (story.storyteller_id) {
      const { data: storyteller } = await el
        .from('profiles')
        .select('display_name')
        .eq('id', story.storyteller_id)
        .single();
      if (storyteller) storytellerName = storyteller.display_name;
    }

    return NextResponse.json({
      data: {
        id: story.id,
        title: story.title,
        transcript: story.transcript,
        storyteller_name: storytellerName,
        themes: story.themes,
        privacy_level: story.privacy_level,
        is_public: story.is_public,
        cultural_sensitivity_level: story.cultural_sensitivity_level,
      },
    });
  } catch (error: any) {
    console.error('EL transcript fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
