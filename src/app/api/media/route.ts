import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/media
 * List media from partner photos and videos with pagination and search
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || 'all'; // 'photos', 'videos', 'all'

    const offset = (page - 1) * limit;

    // Fetch photos
    let photosQuery = supabase
      .from('partner_photos')
      .select('id, title, description, photo_url, thumbnail_url, photo_type, photographer, organization_id, is_featured, created_at, organizations(name, slug)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search) {
      photosQuery = photosQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%,photographer.ilike.%${search}%`);
    }

    // Fetch videos
    let videosQuery = supabase
      .from('partner_videos')
      .select('id, title, description, video_url, thumbnail_url, video_type, platform, organization_id, is_featured, created_at, organizations(name, slug)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search) {
      videosQuery = videosQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const [photosResult, videosResult] = await Promise.all([
      type !== 'videos' ? photosQuery : Promise.resolve({ data: [], count: 0, error: null }),
      type !== 'photos' ? videosQuery : Promise.resolve({ data: [], count: 0, error: null }),
    ]);

    if (photosResult.error) {
      console.error('Error fetching photos:', photosResult.error);
    }
    if (videosResult.error) {
      console.error('Error fetching videos:', videosResult.error);
    }

    // Normalize and combine results
    const photos = (photosResult.data || []).map(p => {
      const org = p.organizations as { name: string; slug: string } | null;
      return {
        id: p.id,
        type: 'photo' as const,
        title: p.title || 'Untitled Photo',
        description: p.description,
        url: p.photo_url,
        thumbnail_url: p.thumbnail_url || p.photo_url,
        media_type: p.photo_type,
        organization_id: p.organization_id,
        organization_name: org?.name,
        organization_slug: org?.slug,
        is_featured: p.is_featured,
        created_at: p.created_at,
        photographer: p.photographer,
      };
    });

    console.log(`[Media API] Processing ${videosResult.data?.length || 0} videos`);

    const videos = (videosResult.data || []).map(v => {
      // Detect platform from URL if stored as 'other'
      let platform = v.platform;
      let thumbnail = v.thumbnail_url;

      if (v.video_url?.includes('descript.com')) {
        platform = 'descript';
        // Only use thumbnails that are verified to NOT be black frames
        // Other Descript videos had failed thumbnail exports
        const workingDescriptThumbnails: Record<string, string> = {
          'yP3pzzo4JLU': 'https://d1d3n03t5zntha.cloudfront.net/yP3pzzo4JLU/media_stream-10d17415387645e0b2a28f5d76318780.png',
          // Other videos have black thumbnails - need re-export from Descript
        };
        const descriptId = v.video_url.split('/view/')[1];
        if (descriptId) {
          thumbnail = workingDescriptThumbnails[descriptId] || null;
        }
      } else if (v.video_url?.includes('youtube.com') || v.video_url?.includes('youtu.be')) {
        platform = 'youtube';
        // Generate YouTube thumbnail if not set
        if (!thumbnail) {
          let videoId: string | undefined;
          if (v.video_url.includes('v=')) {
            videoId = v.video_url.split('v=')[1]?.split('&')[0];
          } else if (v.video_url.includes('youtu.be/')) {
            videoId = v.video_url.split('youtu.be/')[1]?.split('?')[0];
          } else {
            videoId = v.video_url.split('/').pop();
          }
          // Only generate thumbnail if videoId looks real (11 chars, no hyphens - placeholder IDs have hyphens)
          if (videoId && videoId.length === 11 && !videoId.includes('-')) {
            thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            console.log('[Media API] YouTube video:', { title: v.title, videoId, hasThumbnail: true });
          } else {
            console.log('[Media API] YouTube video with invalid ID:', { title: v.title, videoId, length: videoId?.length });
          }
          // Otherwise leave thumbnail as null - UI will show placeholder
        }
      } else if (v.video_url?.includes('vimeo.com')) {
        platform = 'vimeo';
      }

      const org = v.organizations as { name: string; slug: string } | null;
      return {
        id: v.id,
        type: 'video' as const,
        title: v.title,
        description: v.description,
        url: v.video_url,
        thumbnail_url: thumbnail,
        media_type: v.video_type,
        platform,
        organization_id: v.organization_id,
        organization_name: org?.name,
        organization_slug: org?.slug,
        is_featured: v.is_featured,
        created_at: v.created_at,
      };
    });

    // Combine and sort by date
    const allMedia = [...photos, ...videos].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Apply pagination
    const paginatedMedia = allMedia.slice(offset, offset + limit);
    const totalCount = (photosResult.count || 0) + (videosResult.count || 0);

    return NextResponse.json({
      media: paginatedMedia,
      counts: {
        photos: photosResult.count || 0,
        videos: videosResult.count || 0,
      },
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    );
  }
}
