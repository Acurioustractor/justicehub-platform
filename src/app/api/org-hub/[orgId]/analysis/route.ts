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
  { params }: { params: { orgId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    if (!await checkOrgAccess(supabase, user.id, params.orgId))
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const elClient = getEmpathyLedgerClient();
    if (!elClient) {
      return NextResponse.json({ data: null, message: 'Empathy Ledger not configured' });
    }

    // Get the EL org ID from JusticeHub organizations table
    const serviceClient = createServiceClient();
    const { data: org } = await serviceClient
      .from('organizations')
      .select('empathy_ledger_org_id, name')
      .eq('id', params.orgId)
      .single();

    const elOrgId = org?.empathy_ledger_org_id;
    if (!elOrgId) {
      return NextResponse.json({ data: null, message: 'No Empathy Ledger organization linked' });
    }

    // Fetch in parallel: stories, storytellers, projects, and project analyses (may be RLS-limited)
    const [storiesResult, projectsResult, projectAnalysesResult, transcriptsResult] = await Promise.all([
      // Stories with full themes
      elClient
        .from('stories')
        .select('id, title, summary, themes, story_type, privacy_level, is_public, is_featured, storyteller_id, published_at, created_at')
        .eq('organization_id', elOrgId)
        .order('created_at', { ascending: false }),

      // Projects
      elClient
        .from('projects')
        .select('id, name, description, status, start_date, end_date, created_at')
        .eq('organization_id', elOrgId)
        .order('created_at', { ascending: false }),

      // Project analyses (may return empty due to RLS — graceful handling)
      elClient
        .from('project_analyses')
        .select('*')
        .limit(10),

      // Transcripts (may return empty due to RLS — graceful handling)
      elClient
        .from('transcripts')
        .select('id, title, themes, language, duration_minutes, word_count, created_at')
        .limit(50),
    ]);

    // Get storyteller IDs from stories, then fetch their profiles
    const stories = (storiesResult.data || []) as any[];
    const storytellerIds = [...new Set(stories.map(s => s.storyteller_id).filter(Boolean))];

    let storytellers: any[] = [];
    if (storytellerIds.length > 0) {
      const { data } = await elClient
        .from('storytellers')
        .select('id, display_name, bio, cultural_background, is_elder, is_featured, is_justicehub_featured, justicehub_enabled, location, areas_of_expertise, language_skills, storytelling_experience')
        .in('id', storytellerIds);
      storytellers = data || [];
    }

    // Also get all JH-enabled storytellers for this org (via stories link)
    const { data: allJhStorytellers } = await elClient
      .from('storytellers')
      .select('id, display_name, bio, is_elder, is_featured, justicehub_enabled, location, areas_of_expertise')
      .eq('justicehub_enabled', true);

    // Aggregate story themes — themes are {name: string}[] objects
    const themeMap: Record<string, number> = {};
    let publicStories = 0;
    let featuredStories = 0;
    const storyTypes: Record<string, number> = {};

    for (const s of stories) {
      if (s.is_public && s.privacy_level === 'public') publicStories++;
      if (s.is_featured) featuredStories++;
      if (s.story_type) storyTypes[s.story_type] = (storyTypes[s.story_type] || 0) + 1;
      for (const t of (s.themes || [])) {
        const name = typeof t === 'string' ? t : t.name;
        if (name) themeMap[name] = (themeMap[name] || 0) + 1;
      }
    }

    const themes = Object.entries(themeMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    // Process project analyses if accessible
    const projectAnalyses = (projectAnalysesResult.data || []) as any[];
    // Filter to this org's projects
    const orgProjectIds = ((projectsResult.data || []) as any[]).map(p => p.id);
    const relevantAnalyses = projectAnalyses.filter(
      pa => orgProjectIds.includes(pa.project_id) || pa.organization_id === elOrgId
    );

    // Process transcripts if accessible
    const transcripts = (transcriptsResult.data || []) as any[];
    const transcriptThemeMap: Record<string, number> = {};
    for (const t of transcripts) {
      for (const theme of (t.themes || [])) {
        const name = typeof theme === 'string' ? theme : theme.name;
        if (name) transcriptThemeMap[name] = (transcriptThemeMap[name] || 0) + 1;
      }
    }
    const transcriptThemes = Object.entries(transcriptThemeMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    return NextResponse.json({
      data: {
        organization: { id: elOrgId, name: org?.name },
        stories: {
          total: stories.length,
          public: publicStories,
          featured: featuredStories,
          themes,
          types: storyTypes,
          items: stories.map(s => ({
            id: s.id,
            title: s.title,
            summary: s.summary,
            themes: (s.themes || []).map((t: any) => typeof t === 'string' ? t : t.name),
            story_type: s.story_type,
            privacy_level: s.privacy_level,
            is_public: s.is_public,
            is_featured: s.is_featured,
            published_at: s.published_at,
            created_at: s.created_at,
          })),
        },
        storytellers: {
          fromStories: storytellers.map(s => ({
            id: s.id,
            display_name: s.display_name,
            bio: s.bio,
            cultural_background: s.cultural_background,
            is_elder: s.is_elder,
            is_featured: s.is_featured,
            location: s.location,
            areas_of_expertise: s.areas_of_expertise,
            language_skills: s.language_skills,
          })),
          justicehubEnabled: (allJhStorytellers || []).length,
          total: (allJhStorytellers || []).length,
        },
        projects: ((projectsResult.data || []) as any[]).map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          status: p.status,
          start_date: p.start_date,
          end_date: p.end_date,
        })),
        projectAnalyses: relevantAnalyses.map((pa: any) => ({
          id: pa.id,
          project_id: pa.project_id,
          analysis_type: pa.analysis_type,
          created_at: pa.created_at,
          updated_at: pa.updated_at,
          // Extract from analysis_data JSONB
          key_quotes: pa.analysis_data?.key_quotes || pa.analysis_data?.quotes || [],
          storyteller_profiles: pa.analysis_data?.storyteller_profiles || pa.analysis_data?.profiles || [],
          aggregated_impact: pa.analysis_data?.aggregated_impact || pa.analysis_data?.impact || null,
          aggregated_insights: pa.analysis_data?.aggregated_insights || pa.analysis_data?.insights || null,
          themes: pa.analysis_data?.themes || [],
          summary: pa.analysis_data?.summary || pa.analysis_data?.executive_summary || null,
        })),
        transcripts: {
          total: transcripts.length,
          themes: transcriptThemes,
          items: transcripts.slice(0, 10).map((t: any) => ({
            id: t.id,
            title: t.title,
            themes: (t.themes || []).map((th: any) => typeof th === 'string' ? th : th.name),
            language: t.language,
            duration_minutes: t.duration_minutes,
            word_count: t.word_count,
            created_at: t.created_at,
          })),
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching EL analysis:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
