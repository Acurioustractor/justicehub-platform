import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/supabase/admin-lite';
import { createServiceClient } from '@/lib/supabase/service-lite';

export interface UnifiedStory {
  id: string;
  title: string;
  excerpt: string;
  source_table: 'articles' | 'synced_stories' | 'partner_stories' | 'stories' | 'tour_stories';
  status: string;
  image_url: string | null;
  author_name: string | null;
  organization_id: string | null;
  organization_name: string | null;
  themes: string[];
  project_slugs: string[];
  is_featured: boolean;
  is_contained: boolean;
  created_at: string;
  el_sync_id: string | null;
}

export async function GET() {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createServiceClient();
  const allStories: UnifiedStory[] = [];

  // 1. Articles
  const { data: articles } = await db
    .from('articles')
    .select('id, title, excerpt, status, featured_image_url, category, tags, is_contained, organization_id, created_at, author_id, public_profiles!articles_author_id_fkey(full_name), organizations!articles_organization_id_fkey(name)')
    .order('created_at', { ascending: false });

  for (const a of articles || []) {
    allStories.push({
      id: a.id,
      title: a.title || 'Untitled',
      excerpt: a.excerpt || '',
      source_table: 'articles',
      status: a.status || 'draft',
      image_url: a.featured_image_url,
      author_name: (a as any).public_profiles?.full_name || null,
      organization_id: a.organization_id,
      organization_name: (a as any).organizations?.name || null,
      themes: [...(a.tags || []), ...(a.is_contained ? ['contained'] : [])],
      project_slugs: [],
      is_featured: false,
      is_contained: a.is_contained || false,
      created_at: a.created_at,
      el_sync_id: null,
    });
  }

  // 2. Synced stories (from Empathy Ledger)
  const { data: synced } = await db
    .from('synced_stories')
    .select('id, empathy_ledger_id, title, summary, story_image_url, story_type, themes, is_featured, project_slugs, created_at, source')
    .order('created_at', { ascending: false });

  for (const s of synced || []) {
    const projectSlugs: string[] = s.project_slugs || [];
    allStories.push({
      id: s.id,
      title: s.title || 'Untitled',
      excerpt: s.summary || '',
      source_table: 'synced_stories',
      status: 'synced',
      image_url: s.story_image_url,
      author_name: null,
      organization_id: null,
      organization_name: s.source || null,
      themes: [...(s.themes || []), ...(projectSlugs.includes('the-contained') ? ['contained'] : [])],
      project_slugs: projectSlugs,
      is_featured: s.is_featured || false,
      is_contained: projectSlugs.includes('the-contained'),
      created_at: s.created_at,
      el_sync_id: s.empathy_ledger_id,
    });
  }

  // 3. Partner stories (org-linked EL stories)
  const { data: partner } = await db
    .from('partner_stories')
    .select('id, organization_id, empathy_ledger_story_id, title, excerpt, thumbnail_url, story_type, is_featured, tags, linked_at, organizations!partner_stories_organization_id_fkey(name)')
    .order('linked_at', { ascending: false });

  for (const p of partner || []) {
    allStories.push({
      id: p.id,
      title: p.title || 'Untitled',
      excerpt: p.excerpt || '',
      source_table: 'partner_stories',
      status: 'linked',
      image_url: p.thumbnail_url,
      author_name: null,
      organization_id: p.organization_id,
      organization_name: (p as any).organizations?.name || null,
      themes: p.tags || [],
      project_slugs: [],
      is_featured: p.is_featured || false,
      is_contained: (p.tags || []).includes('contained'),
      created_at: p.linked_at || new Date().toISOString(),
      el_sync_id: p.empathy_ledger_story_id,
    });
  }

  // 4. Stories (interviews, Mounty Yarns etc)
  const { data: interviews } = await db
    .from('stories')
    .select('id, title, excerpt, summary, status, featured_image_url, themes, is_featured, organization_id, participant_name, story_type, created_at, slug, organizations!stories_organization_id_fkey(name)')
    .order('created_at', { ascending: false });

  for (const i of interviews || []) {
    allStories.push({
      id: i.id,
      title: i.title || 'Untitled',
      excerpt: i.excerpt || i.summary || '',
      source_table: 'stories',
      status: i.status || 'draft',
      image_url: i.featured_image_url,
      author_name: i.participant_name || null,
      organization_id: i.organization_id,
      organization_name: (i as any).organizations?.name || null,
      themes: i.themes || [],
      project_slugs: [],
      is_featured: i.is_featured || false,
      is_contained: (i.themes || []).includes('contained') || (i.tags || []).includes('contained'),
      created_at: i.created_at,
      el_sync_id: null,
    });
  }

  // 5. Tour stories (community submissions)
  const { data: tour } = await db
    .from('tour_stories')
    .select('id, name, story, tour_stop, status, is_public, created_at')
    .order('created_at', { ascending: false });

  for (const t of tour || []) {
    allStories.push({
      id: t.id,
      title: `${t.name} — ${t.tour_stop}`,
      excerpt: t.story?.substring(0, 200) || '',
      source_table: 'tour_stories',
      status: t.status || 'pending',
      image_url: null,
      author_name: t.name,
      organization_id: null,
      organization_name: null,
      themes: [],
      project_slugs: [],
      is_featured: false,
      is_contained: true, // tour stories are always Contained campaign
      created_at: t.created_at,
      el_sync_id: null,
    });
  }

  // Sort all by created_at descending
  allStories.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Compute counts per source
  const counts = {
    all: allStories.length,
    articles: allStories.filter(s => s.source_table === 'articles').length,
    synced_stories: allStories.filter(s => s.source_table === 'synced_stories').length,
    partner_stories: allStories.filter(s => s.source_table === 'partner_stories').length,
    stories: allStories.filter(s => s.source_table === 'stories').length,
    tour_stories: allStories.filter(s => s.source_table === 'tour_stories').length,
  };

  return NextResponse.json({ stories: allStories, counts });
}

// PATCH — quick actions: update tags, link to org
export async function PATCH(request: Request) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { action, story_id, source_table, organization_id, tags } = await request.json();
  const db = createServiceClient();

  // Update tags on any story source
  if (action === 'update_tags') {
    if (!Array.isArray(tags)) {
      return NextResponse.json({ error: 'tags array required' }, { status: 400 });
    }

    // Each table stores tags differently:
    // articles → tags (text[]) + is_contained (bool)
    // synced_stories → themes (text[]) + project_slugs (text[])
    // partner_stories → tags (text[])
    // stories → tags (text[]) + themes (text[])
    // tour_stories → no tag column (skip)

    if (source_table === 'articles') {
      const isContained = tags.includes('contained');
      const cleanTags = tags.filter((t: string) => t !== 'contained');
      const { error } = await db
        .from('articles')
        .update({ tags: cleanTags, is_contained: isContained })
        .eq('id', story_id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    } else if (source_table === 'synced_stories') {
      // For synced_stories, store in themes + manage 'the-contained' in project_slugs
      const hasContained = tags.includes('contained');
      const cleanTags = tags.filter((t: string) => t !== 'contained');
      const { data: existing } = await db
        .from('synced_stories')
        .select('project_slugs')
        .eq('id', story_id)
        .single();
      let slugs: string[] = (existing?.project_slugs || []).filter((s: string) => s !== 'the-contained');
      if (hasContained) slugs.push('the-contained');
      const { error } = await db
        .from('synced_stories')
        .update({ themes: cleanTags, project_slugs: slugs })
        .eq('id', story_id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    } else if (source_table === 'partner_stories') {
      const { error } = await db
        .from('partner_stories')
        .update({ tags })
        .eq('id', story_id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    } else if (source_table === 'stories') {
      const { error } = await db
        .from('stories')
        .update({ tags })
        .eq('id', story_id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    } else {
      return NextResponse.json({ error: `Cannot update tags on ${source_table}` }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  }

  if (action === 'link_org') {
    if (!organization_id) {
      return NextResponse.json({ error: 'organization_id required' }, { status: 400 });
    }
    if (['articles', 'stories', 'partner_stories'].includes(source_table)) {
      const { error } = await db
        .from(source_table)
        .update({ organization_id })
        .eq('id', story_id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: `Cannot link org to ${source_table}` }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
