import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { checkOrgAccess } from '@/lib/org-hub/auth';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function getEmpathyLedgerClient() {
  const url = process.env.EMPATHY_LEDGER_URL;
  const key = process.env.EMPATHY_LEDGER_API_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string; profileId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    if (!await checkOrgAccess(supabase, user.id, params.orgId))
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    // Get the EL profile ID from the public profile
    const serviceClient = createServiceClient();
    const { data: profile } = await serviceClient
      .from('public_profiles')
      .select('empathy_ledger_profile_id')
      .eq('id', params.profileId)
      .single();

    if (!profile?.empathy_ledger_profile_id) {
      return NextResponse.json({ data: [], message: 'No Empathy Ledger profile linked' });
    }

    const elClient = getEmpathyLedgerClient();
    if (!elClient) {
      return NextResponse.json({ data: [], message: 'Empathy Ledger not configured' });
    }

    // Fetch stories for this storyteller from EL
    // Stories ARE the interview content in EL (transcripts table is not populated)
    const { data: stories, error } = await elClient
      .from('stories')
      .select('id, title, content, summary, themes, story_type, privacy_level, is_public, is_featured, created_at, published_at')
      .eq('storyteller_id', profile.empathy_ledger_profile_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching EL stories:', error);
      return NextResponse.json({ data: [], error: 'Failed to fetch from Empathy Ledger' });
    }

    // Map stories to a transcript-like format for the UI
    const data = (stories || []).map(s => ({
      id: s.id,
      title: s.title,
      summary: s.summary,
      content_preview: (s.content || '').slice(0, 300) + ((s.content || '').length > 300 ? '...' : ''),
      word_count: (s.content || '').split(/\s+/).filter(Boolean).length,
      themes: s.themes || [],
      story_type: s.story_type,
      privacy_level: s.privacy_level,
      is_public: s.is_public,
      consent_for_story_creation: s.is_public && s.privacy_level === 'public',
      collection_date: s.published_at || s.created_at,
    }));

    return NextResponse.json({ data, source: 'empathy_ledger_stories' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
