import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/empathy-ledger/media-browser
 * Proxy for the EL Media Picker widget.
 * Queries EL Supabase directly for media, storytellers, galleries, stories.
 *
 * Query params:
 *   type: 'media' | 'storytellers' | 'galleries' | 'stories' | 'storage' | 'buckets'
 *   galleryId, projectId, storytellerId — filters
 *   bucket, prefix — for storage browsing
 *   limit, offset — pagination
 *   search — text filter
 */

const EL_URL = process.env.EMPATHY_LEDGER_URL;
const EL_KEY = process.env.EMPATHY_LEDGER_SERVICE_KEY || process.env.EMPATHY_LEDGER_API_KEY;

function getELClient() {
  if (!EL_URL || !EL_KEY) throw new Error('Empathy Ledger not configured');
  return createClient(EL_URL, EL_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'media';
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';
    const galleryId = searchParams.get('galleryId');
    const projectId = searchParams.get('projectId');
    const storytellerId = searchParams.get('storytellerId');
    const bucket = searchParams.get('bucket') || '';
    const prefix = searchParams.get('prefix') || '';

    const el = getELClient();

    switch (type) {
      case 'media': {
        // Actual EL columns: mime_type (not content_type), width/height (not dimensions),
        // collection_id (not gallery_id for filtering), location_name (not location_text)
        let storytellerStoryIds: string[] | null = null;

        if (storytellerId) {
          const { data: storytellerStories, error: storyError } = await el
            .from('stories')
            .select('id')
            .eq('storyteller_id', storytellerId)
            .limit(200);

          if (storyError) throw storyError;

          storytellerStoryIds = (storytellerStories || [])
            .map((story) => story.id)
            .filter(Boolean);

          if (storytellerStoryIds.length === 0) {
            return NextResponse.json({ data: [] });
          }
        }

        let query = el.from('media_assets')
          .select(`
            id, title, description, filename, mime_type, url,
            thumbnail_url, medium_url, large_url, cdn_url,
            width, height, duration, file_size,
            alt_text, cultural_tags, cultural_sensitivity_level,
            location_name, project_id, collection_id, story_id,
            caption, created_at
          `)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (galleryId) query = query.eq('collection_id', galleryId);
        if (projectId) query = query.eq('project_id', projectId);
        if (storytellerStoryIds) query = query.in('story_id', storytellerStoryIds);
        if (search) query = query.or(`title.ilike.%${search}%,filename.ilike.%${search}%,alt_text.ilike.%${search}%`);

        const { data, error } = await query;
        if (error) throw error;
        return NextResponse.json({
          data: (data || []).map(m => ({
            ...m,
            content_type: m.mime_type,
            dimensions: m.width && m.height ? { width: m.width, height: m.height } : null,
          })),
        });
      }

      case 'storytellers': {
        // EL storytellers: keep this query conservative because the column set
        // differs across environments and we only need public identity fields here.
        let query = el.from('storytellers')
          .select(`
            id, display_name, is_active, bio, location,
            public_avatar_url, cultural_background
          `)
          .eq('is_active', true)
          .order('display_name')
          .range(offset, offset + limit - 1);

        if (search) query = query.ilike('display_name', `%${search}%`);

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json({
          data: (data || []).map(s => ({
            id: s.id,
            displayName: s.display_name,
            role: null,
            avatarUrl: s.public_avatar_url || null,
            bio: s.bio || null,
            location: s.location || null,
            profileId: null,
          })),
        });
      }

      case 'galleries': {
        // EL galleries: has photo_count directly (not computed), no gallery_caption
        let query = el.from('galleries')
          .select('id, title, slug, description, visibility, status, cover_image, photo_count, created_at')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (search) query = query.ilike('title', `%${search}%`);

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json({
          data: (data || []).map(g => ({
            id: g.id,
            title: g.title,
            slug: g.slug,
            description: g.description,
            coverImage: g.cover_image,
            mediaCount: g.photo_count || 0,
            createdAt: g.created_at,
          })),
        });
      }

      case 'stories': {
        // EL stories: storyteller FK exists, summary column is 'summary'
        let query = el.from('stories')
          .select(`
            id, title, summary, story_image_url, story_type,
            privacy_level, is_public, status, themes, tags,
            media_urls, published_at, created_at, storyteller_id
          `)
          .eq('is_public', true)
          .eq('privacy_level', 'public')
          .order('published_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (storytellerId) query = query.eq('storyteller_id', storytellerId);
        if (projectId) query = query.eq('project_id', projectId);
        if (search) query = query.ilike('title', `%${search}%`);

        const { data, error } = await query;
        if (error) throw error;

        // Fetch storyteller names for the results
        const storytellerIds = [...new Set((data || []).map(s => s.storyteller_id).filter(Boolean))];
        let storytellerNames: Record<string, string> = {};
        if (storytellerIds.length > 0) {
          const { data: stData } = await el.from('storytellers')
            .select('id, display_name')
            .in('id', storytellerIds);
          for (const st of stData || []) {
            storytellerNames[st.id] = st.display_name;
          }
        }

        return NextResponse.json({
          data: (data || []).map(s => ({
            id: s.id,
            title: s.title,
            excerpt: s.summary,
            imageUrl: s.story_image_url,
            storyType: s.story_type,
            themes: s.themes,
            mediaUrls: s.media_urls,
            storytellerName: storytellerNames[s.storyteller_id] || null,
            publishedAt: s.published_at,
          })),
        });
      }

      case 'storage': {
        // Browse EL Supabase storage directly
        const { data, error } = await el.storage
          .from(bucket || 'media')
          .list(prefix, { limit, sortBy: { column: 'name', order: 'asc' } });

        if (error) throw error;

        return NextResponse.json({
          data: (data || []).map(item => ({
            name: item.name,
            isFolder: !item.metadata,
            size: item.metadata?.size || null,
            contentType: item.metadata?.mimetype || null,
            url: item.metadata
              ? `${EL_URL}/storage/v1/object/public/${bucket || 'media'}/${prefix}${item.name}`
              : null,
          })),
        });
      }

      case 'buckets': {
        const { data, error } = await el.storage.listBuckets();
        if (error) throw error;
        return NextResponse.json({
          data: (data || [])
            .filter(b => b.public)
            .map(b => ({ name: b.name, public: b.public })),
        });
      }

      default:
        return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
    }
  } catch (err: unknown) {
    console.error('Media browser error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}
