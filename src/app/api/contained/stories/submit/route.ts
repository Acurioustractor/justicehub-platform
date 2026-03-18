import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { createServerClient } from '@supabase/ssr';
import {
  empathyLedgerServiceClient,
  isEmpathyLedgerWriteConfigured,
} from '@/lib/supabase/empathy-ledger';

// CONTAINED project constants (same as el-sync.ts)
const JH_ORG_ID = '0e878fa2-0b44-49b7-86d7-ecf169345582';
const JH_TENANT_ID = 'bf17d0a9-2b12-4e4a-982e-09a8b1952ec6';
const CONTAINED_PROJECT_ID = '9b90b47c-2a4c-409c-97d5-3718aaf8c30c';

/**
 * POST /api/contained/stories/submit
 * Submit a visitor story from the CONTAINED experience page.
 * Requires device enrollment (auth session).
 * Writes to Empathy Ledger stories table as a private draft.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isEmpathyLedgerWriteConfigured || !empathyLedgerServiceClient) {
      return NextResponse.json(
        { error: 'Story submission not available' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { title, content, audioUrl } = body;

    // Validate inputs
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Story content is required' }, { status: 400 });
    }
    if (content.length > 2000) {
      return NextResponse.json({ error: 'Story too long (max 2000 chars)' }, { status: 400 });
    }
    if (title && title.length > 200) {
      return NextResponse.json({ error: 'Title too long (max 200 chars)' }, { status: 400 });
    }

    // Authenticate via device session
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
    if (!user) {
      return NextResponse.json({ error: 'Not enrolled' }, { status: 401 });
    }

    // Get device session with EL storyteller ID
    const service = createServiceClient();
    const { data: session } = await service
      .from('device_sessions')
      .select('id, el_storyteller_id, el_profile_id, display_name')
      .eq('auth_user_id', user.id)
      .order('enrolled_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!session?.el_storyteller_id) {
      return NextResponse.json(
        { error: 'Device session missing storyteller link' },
        { status: 400 }
      );
    }

    // Build media_urls array if voice note provided
    const mediaUrls: string[] = [];
    if (audioUrl && typeof audioUrl === 'string') {
      mediaUrls.push(audioUrl);
    }

    // Insert story to Empathy Ledger as private draft
    const { data: story, error } = await empathyLedgerServiceClient
      .from('stories')
      .insert({
        tenant_id: JH_TENANT_ID,
        organization_id: JH_ORG_ID,
        storyteller_id: session.el_storyteller_id,
        project_id: CONTAINED_PROJECT_ID,
        title: title?.trim() || `Visitor story from ${session.display_name || 'Anonymous'}`,
        content: content.trim(),
        story_type: 'community_voice',
        privacy_level: 'private',
        status: 'draft',
        is_public: false,
        tags: ['CONTAINED', 'VISITOR_STORY'],
        media_urls: mediaUrls.length > 0 ? mediaUrls : null,
        language: 'en',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to save story to EL:', error);
      return NextResponse.json({ error: 'Failed to save story' }, { status: 500 });
    }

    return NextResponse.json({ success: true, storyId: story.id });
  } catch (err) {
    console.error('Story submission error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
