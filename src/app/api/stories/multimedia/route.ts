/**
 * Multimedia Stories API
 * 
 * Handles fetching and filtering of multimedia story content
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/client';
import type { Story, ContentType, StorySortOption } from '@/types/stories';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sortBy = searchParams.get('sort') as StorySortOption || 'newest';
    const types = searchParams.get('types')?.split(',') as ContentType[] || [];
    const category = searchParams.get('filter_category');
    const tag = searchParams.get('filter_tag');
    const author = searchParams.get('filter_author');
    const featured = searchParams.get('featured') === 'true';
    
    // Calculate offset
    const offset = (page - 1) * limit;

    // Build base query
    let query = supabase
      .from('multimedia_stories')
      .select(`
        *,
        authors:story_authors(*),
        media_assets:story_media_assets(*),
        engagement:story_engagement(*),
        comments:story_comments(count)
      `)
      .eq('status', 'published')
      .eq('visibility', 'public');

    // Apply content type filters
    if (types.length > 0) {
      query = query.in('content_type', types);
    }

    // Apply category filter
    if (category) {
      query = query.eq('category', category);
    }

    // Apply tag filter
    if (tag) {
      query = query.contains('tags', [tag]);
    }

    // Apply author filter
    if (author) {
      query = query.eq('author_id', author);
    }

    // Apply featured filter
    if (featured) {
      query = query.eq('featured', true);
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        query = query.order('published_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('published_at', { ascending: true });
        break;
      case 'most_liked':
        query = query.order('total_likes', { ascending: false });
        break;
      case 'most_viewed':
        query = query.order('total_views', { ascending: false });
        break;
      case 'most_commented':
        query = query.order('total_comments', { ascending: false });
        break;
      case 'trending':
        // Calculate trending score based on recent engagement
        query = query.order('trending_score', { ascending: false });
        break;
      case 'featured':
        query = query.order('featured', { ascending: false })
                     .order('published_at', { ascending: false });
        break;
      default:
        query = query.order('published_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: rawStories, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch stories', details: error.message },
        { status: 500 }
      );
    }

    // Transform database results to Story type
    const stories: Story[] = rawStories?.map(transformDatabaseStory) || [];

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('multimedia_stories')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .eq('visibility', 'public');

    const totalPages = Math.ceil((totalCount || 0) / limit);
    const hasMore = page < totalPages;

    return NextResponse.json({
      stories,
      pagination: {
        page,
        per_page: limit,
        total: totalCount || 0,
        total_pages: totalPages,
        has_more: hasMore
      },
      filters_applied: {
        types,
        category,
        tag,
        author,
        featured
      },
      sort_by: sortBy
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const body = await request.json();
    
    // Validate required fields
    const {
      title,
      description,
      content_type,
      category,
      author_id,
      content_data,
      tags = [],
      visibility = 'public'
    } = body;

    if (!title || !description || !content_type || !category || !author_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the story
    const { data: story, error: storyError } = await supabase
      .from('multimedia_stories')
      .insert({
        title,
        description,
        content_type,
        category,
        author_id,
        content_data,
        tags,
        visibility,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (storyError) {
      return NextResponse.json(
        { error: 'Failed to create story', details: storyError.message },
        { status: 500 }
      );
    }

    // Initialize engagement data
    await supabase
      .from('story_engagement')
      .insert({
        story_id: story.id,
        likes: 0,
        comments: 0,
        shares: 0,
        views: 0,
        bookmarks: 0
      });

    return NextResponse.json({
      message: 'Story created successfully',
      story: transformDatabaseStory(story)
    }, { status: 201 });

  } catch (error) {
    console.error('Create story error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Transform database row to Story type
 */
function transformDatabaseStory(dbStory: any): Story {
  const baseStory = {
    id: dbStory.id,
    title: dbStory.title,
    description: dbStory.description,
    author: {
      id: dbStory.authors?.id || dbStory.author_id,
      name: dbStory.authors?.name || 'Anonymous',
      username: dbStory.authors?.username,
      age: dbStory.authors?.age,
      location: dbStory.authors?.location,
      avatar: dbStory.authors?.avatar_url,
      bio: dbStory.authors?.bio,
      verified: dbStory.authors?.verified || false,
      anonymous: dbStory.authors?.anonymous || false
    },
    tags: dbStory.tags || [],
    category: dbStory.category,
    visibility: dbStory.visibility,
    status: dbStory.status,
    created_at: dbStory.created_at,
    updated_at: dbStory.updated_at,
    published_at: dbStory.published_at,
    engagement: {
      likes: dbStory.engagement?.likes || dbStory.total_likes || 0,
      comments: dbStory.engagement?.comments || dbStory.total_comments || 0,
      shares: dbStory.engagement?.shares || dbStory.total_shares || 0,
      views: dbStory.engagement?.views || dbStory.total_views || 0,
      bookmarks: dbStory.engagement?.bookmarks || dbStory.total_bookmarks || 0
    },
    metadata: {
      reading_time: dbStory.reading_time,
      impact_score: dbStory.impact_score,
      featured: dbStory.featured || false,
      editor_pick: dbStory.editor_pick || false,
      community_choice: dbStory.community_choice || false,
      trigger_warnings: dbStory.trigger_warnings,
      age_appropriate: dbStory.age_appropriate !== false,
      content_rating: dbStory.content_rating || 'general'
    }
  };

  // Type-specific transformations
  switch (dbStory.content_type) {
    case 'blog':
      return {
        ...baseStory,
        type: 'blog',
        content: dbStory.content_data?.content || '',
        excerpt: dbStory.content_data?.excerpt || '',
        featured_image: dbStory.content_data?.featured_image,
        gallery: dbStory.content_data?.gallery || [],
        seo_metadata: dbStory.content_data?.seo_metadata
      } as Story;

    case 'video':
      return {
        ...baseStory,
        type: 'video',
        video_file: dbStory.content_data?.video_file,
        thumbnail: dbStory.content_data?.thumbnail,
        duration: dbStory.content_data?.duration,
        captions: dbStory.content_data?.captions || [],
        transcript: dbStory.content_data?.transcript,
        chapters: dbStory.content_data?.chapters || [],
        quality_options: dbStory.content_data?.quality_options || [],
        streaming_urls: dbStory.content_data?.streaming_urls || []
      } as Story;

    case 'photo':
      return {
        ...baseStory,
        type: 'photo',
        photos: dbStory.content_data?.photos || [],
        layout: dbStory.content_data?.layout || 'grid',
        cover_photo: dbStory.content_data?.cover_photo,
        captions_enabled: dbStory.content_data?.captions_enabled !== false,
        photo_count: dbStory.content_data?.photo_count || 0
      } as Story;

    case 'interview':
      return {
        ...baseStory,
        type: 'interview',
        interviewee: dbStory.content_data?.interviewee,
        interviewer: dbStory.content_data?.interviewer,
        format: dbStory.content_data?.format || 'text',
        questions_and_answers: dbStory.content_data?.questions_and_answers || [],
        audio_file: dbStory.content_data?.audio_file,
        video_file: dbStory.content_data?.video_file,
        transcript: dbStory.content_data?.transcript,
        duration: dbStory.content_data?.duration,
        interview_date: dbStory.content_data?.interview_date,
        location: dbStory.content_data?.location,
        themes: dbStory.content_data?.themes || []
      } as Story;

    default:
      return {
        ...baseStory,
        type: 'blog',
        content: dbStory.content_data?.content || '',
        excerpt: dbStory.description
      } as Story;
  }
}