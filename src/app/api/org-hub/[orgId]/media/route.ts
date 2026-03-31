import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { checkOrgAccess } from '@/lib/org-hub/auth';

// ─── Types ──────────────────────────────────────────────────────────────────

interface UnifiedMediaItem {
  id: string;
  source: 'media_items' | 'partner_photos' | 'partner_videos' | 'empathy_ledger';
  type: 'photo' | 'video';
  title: string;
  description: string | null;
  url: string;
  thumbnail_url: string | null;
  photographer: string | null;
  platform: string | null;
  is_featured: boolean;
  consent_verified: boolean;
  community_approved: boolean;
  tags: string[] | null;
  created_at: string | null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function detectPlatform(url: string): string | null {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('vimeo.com')) return 'vimeo';
  if (url.includes('descript.com')) return 'descript';
  return null;
}

function extractYouTubeThumbnail(url: string): string | null {
  let videoId: string | undefined;
  if (url.includes('v=')) videoId = url.split('v=')[1]?.split('&')[0];
  else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1]?.split('?')[0];
  else if (url.includes('/embed/')) videoId = url.split('/embed/')[1]?.split('?')[0];
  if (videoId && videoId.length === 11) {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
  return null;
}

function extractVideoId(url: string, platform: string): string | null {
  if (platform === 'youtube') {
    if (url.includes('v=')) return url.split('v=')[1]?.split('&')[0] ?? null;
    if (url.includes('youtu.be/')) return url.split('youtu.be/')[1]?.split('?')[0] ?? null;
    if (url.includes('/embed/')) return url.split('/embed/')[1]?.split('?')[0] ?? null;
  }
  if (platform === 'vimeo') {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match?.[1] ?? null;
  }
  return null;
}

// ─── GET: Unified media for org ─────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const orgId = params.orgId;
    if (!await checkOrgAccess(supabase, user.id, orgId))
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const serviceClient = createServiceClient();

    // Fetch all 3 sources in parallel
    const [mediaItemsRes, photosRes, videosRes] = await Promise.all([
      serviceClient
        .from('media_items')
        .select('id, file_url, file_type, title, description, alt_text, thumbnail_url, photographer, consent_verified, community_approved, manual_tags, capture_date, created_at')
        .contains('organization_ids', [orgId])
        .order('created_at', { ascending: false }),
      serviceClient
        .from('partner_photos')
        .select('id, title, description, photographer, photo_url, thumbnail_url, photo_type, is_featured, created_at')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false }),
      serviceClient
        .from('partner_videos')
        .select('id, title, description, video_url, thumbnail_url, platform, video_id, is_featured, created_at')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false }),
    ]);

    const unified: UnifiedMediaItem[] = [];

    // Normalize media_items
    for (const m of mediaItemsRes.data || []) {
      unified.push({
        id: m.id,
        source: 'media_items',
        type: m.file_type === 'video' ? 'video' : 'photo',
        title: m.title || 'Untitled',
        description: m.description,
        url: m.file_url,
        thumbnail_url: m.thumbnail_url,
        photographer: m.photographer,
        platform: null,
        is_featured: false,
        consent_verified: m.consent_verified ?? false,
        community_approved: m.community_approved ?? false,
        tags: m.manual_tags,
        created_at: m.created_at,
      });
    }

    // Normalize partner_photos
    for (const p of photosRes.data || []) {
      unified.push({
        id: p.id,
        source: 'partner_photos',
        type: 'photo',
        title: p.title || 'Untitled Photo',
        description: p.description,
        url: p.photo_url,
        thumbnail_url: p.thumbnail_url || p.photo_url,
        photographer: p.photographer,
        platform: null,
        is_featured: p.is_featured ?? false,
        consent_verified: true,
        community_approved: true,
        tags: null,
        created_at: p.created_at,
      });
    }

    // Normalize partner_videos
    for (const v of videosRes.data || []) {
      const platform = v.platform || detectPlatform(v.video_url || '');
      let thumbnail = v.thumbnail_url;
      if (!thumbnail && platform === 'youtube') {
        thumbnail = extractYouTubeThumbnail(v.video_url || '');
      }

      unified.push({
        id: v.id,
        source: 'partner_videos',
        type: 'video',
        title: v.title || 'Untitled Video',
        description: v.description,
        url: v.video_url,
        thumbnail_url: thumbnail,
        photographer: null,
        platform,
        is_featured: v.is_featured ?? false,
        consent_verified: true,
        community_approved: true,
        tags: null,
        created_at: v.created_at,
      });
    }

    // Fetch EL gallery media if org has el_gallery_ids
    let elCount = 0;
    const { data: orgRow } = await serviceClient
      .from('organizations')
      .select('el_gallery_ids')
      .eq('id', orgId)
      .single() as { data: { el_gallery_ids: string[] | null } | null };

    if (orgRow?.el_gallery_ids && orgRow.el_gallery_ids.length > 0) {
      const EL_V2_URL = process.env.EMPATHY_LEDGER_V2_URL || '';
      const EL_V2_KEY = process.env.EMPATHY_LEDGER_V2_KEY || '';

      if (EL_V2_URL && EL_V2_KEY) {
        // Fetch media from each mapped gallery
        const galleryFetches = orgRow.el_gallery_ids.map(async (galleryId: string) => {
          try {
            const url = new URL(`/api/v2/media`, EL_V2_URL);
            url.searchParams.set('galleryId', galleryId);
            url.searchParams.set('limit', '200');
            const res = await fetch(url.toString(), {
              headers: { 'X-API-Key': EL_V2_KEY, 'Accept': 'application/json' },
            });
            if (!res.ok) return [];
            const json = await res.json();
            return json.data || [];
          } catch { return []; }
        });

        const galleryResults = await Promise.all(galleryFetches);
        for (const items of galleryResults) {
          for (const el of items) {
            unified.push({
              id: el.id,
              source: 'empathy_ledger',
              type: el.contentType?.startsWith('video/') ? 'video' : 'photo',
              title: el.title || el.filename || 'EL Photo',
              description: el.description || el.galleryCaption || null,
              url: el.url || '',
              thumbnail_url: el.thumbnailUrl || el.previewUrl || el.url || null,
              photographer: null,
              platform: null,
              is_featured: false,
              consent_verified: true,
              community_approved: true,
              tags: el.culturalTags || null,
              created_at: el.createdAt,
            });
            elCount++;
          }
        }
      }
    }

    // Sort all by date descending
    unified.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

    const counts = {
      media_items: mediaItemsRes.data?.length || 0,
      partner_photos: photosRes.data?.length || 0,
      partner_videos: videosRes.data?.length || 0,
      empathy_ledger: elCount,
      total: unified.length,
    };

    return NextResponse.json({ data: unified, counts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── POST: Upload file OR paste video URL ───────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const orgId = params.orgId;
    if (!await checkOrgAccess(supabase, user.id, orgId))
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const serviceClient = createServiceClient();
    const contentType = request.headers.get('content-type') || '';

    // ── JSON body = video URL paste ──
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const { url, title } = body;

      if (!url || typeof url !== 'string') {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
      }

      const platform = detectPlatform(url);
      if (!platform) {
        return NextResponse.json(
          { error: 'Only YouTube and Vimeo URLs are supported' },
          { status: 400 }
        );
      }

      const videoId = extractVideoId(url, platform);
      let thumbnail: string | null = null;
      if (platform === 'youtube') {
        thumbnail = extractYouTubeThumbnail(url);
      }
      // Vimeo thumbnails need an API call — skip for now, UI will show placeholder

      const { data: record, error: dbError } = await serviceClient
        .from('partner_videos')
        .insert({
          organization_id: orgId,
          video_url: url,
          video_id: videoId,
          platform,
          thumbnail_url: thumbnail,
          title: title || `${platform.charAt(0).toUpperCase() + platform.slice(1)} Video`,
          is_featured: false,
          is_public: true,
        })
        .select()
        .single();

      if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

      return NextResponse.json({ success: true, data: record });
    }

    // ── FormData body = file upload ──
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo)
      return NextResponse.json({ error: 'File must be an image or video' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split('.').pop();
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileName = `${randomStr}-${timestamp}.${ext}`;
    const bucket = isImage ? 'photos' : 'videos';
    const filePath = `orgs/${orgId}/${fileName}`;

    const { error: uploadError } = await serviceClient.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '31536000',
      });

    if (uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 });

    const { data: { publicUrl } } = serviceClient.storage
      .from(bucket)
      .getPublicUrl(filePath);

    const { data: record, error: dbError } = await serviceClient
      .from('media_items')
      .insert({
        file_url: publicUrl,
        file_type: isImage ? 'photo' : 'video',
        title: file.name.split('.')[0].replace(/[-_]/g, ' '),
        organization_ids: [orgId],
        consent_verified: true,
        community_approved: false,
        created_by: user.id,
      })
      .select()
      .single();

    if (dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 });

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── PATCH: Update media item ───────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const orgId = params.orgId;
    if (!await checkOrgAccess(supabase, user.id, orgId))
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const body = await request.json();
    const { id, source, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const serviceClient = createServiceClient();

    // Route update to correct table based on source
    if (source === 'partner_photos') {
      const { data, error } = await serviceClient
        .from('partner_photos')
        .update({ title: updates.title, description: updates.description, is_featured: updates.is_featured })
        .eq('id', id)
        .eq('organization_id', orgId)
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, data });
    }

    if (source === 'partner_videos') {
      const { data, error } = await serviceClient
        .from('partner_videos')
        .update({ title: updates.title, description: updates.description, is_featured: updates.is_featured })
        .eq('id', id)
        .eq('organization_id', orgId)
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, data });
    }

    // Default: media_items
    const { data, error } = await serviceClient
      .from('media_items')
      .update({ title: updates.title, description: updates.description, community_approved: updates.community_approved })
      .eq('id', id)
      .contains('organization_ids', [orgId])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── DELETE: Remove media item ──────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const orgId = params.orgId;
    if (!await checkOrgAccess(supabase, user.id, orgId))
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const source = searchParams.get('source') || 'media_items';
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const serviceClient = createServiceClient();

    if (source === 'partner_photos') {
      const { error } = await serviceClient.from('partner_photos').delete().eq('id', id).eq('organization_id', orgId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else if (source === 'partner_videos') {
      const { error } = await serviceClient.from('partner_videos').delete().eq('id', id).eq('organization_id', orgId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      const { error } = await serviceClient.from('media_items').delete().eq('id', id).contains('organization_ids', [orgId]);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
