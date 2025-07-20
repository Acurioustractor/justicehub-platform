import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { stories, storyMedia, storyTags } from '@/server/db/schema/stories';
import { eq, desc, or, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      title, 
      content, 
      storyType, 
      visibility, 
      tags = [], 
      published = false,
      media = [] // Array of {url: string, key: string, type: string, name: string, size: number}
    } = body;

    // Validate required fields
    if (!title || !content || !storyType) {
      return NextResponse.json(
        { error: 'Title, content, and story type are required' },
        { status: 400 }
      );
    }

    // Get user from database
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.auth0Id, session.user.sub))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create story
    const storyId = uuidv4();
    const [newStory] = await db
      .insert(stories)
      .values({
        id: storyId,
        userId: user.id,
        organizationId: user.organizationId,
        title,
        content,
        storyType,
        visibility,
        published,
        publishedAt: published ? new Date() : null,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    // Add tags if provided
    if (tags.length > 0) {
      const tagValues = tags.map((tag: string) => ({
        id: uuidv4(),
        storyId,
        tag,
        createdAt: new Date()
      }));

      await db.insert(storyTags).values(tagValues);
    }

    // Handle media uploads if provided
    if (media.length > 0) {
      const mediaValues = media.map((file: any) => {
        // Determine media type from MIME type or URL
        let mediaType = 'document';
        if (file.type?.startsWith('image/') || file.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          mediaType = 'image';
        } else if (file.type?.startsWith('video/') || file.url?.match(/\.(mp4|mov|avi|webm)$/i)) {
          mediaType = 'video';
        }

        return {
          id: uuidv4(),
          storyId,
          type: mediaType,
          url: file.url, // Already uploaded to S3
          thumbnailUrl: mediaType === 'image' ? file.url : null, // Use same URL for thumbnail for now
          metadata: {
            originalName: file.name,
            size: file.size,
            mimeType: file.type,
            s3Key: file.key // Store S3 key for future reference
          },
          createdAt: new Date()
        };
      });

      await db.insert(storyMedia).values(mediaValues);
    }

    return NextResponse.json(newStory);
  } catch (error) {
    console.error('Error creating story:', error);
    return NextResponse.json(
      { error: 'Failed to create story' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const [user] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.auth0Id, session.user.sub))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get URL params
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all';
    const visibility = searchParams.get('visibility');
    const storyType = searchParams.get('type');

    // Build query conditions
    let conditions: any[] = [];

    if (filter === 'mine') {
      // Only user's own stories
      conditions = [eq(stories.userId, user.id)];
    } else {
      // Apply privacy rules
      conditions = [
        eq(stories.userId, user.id), // User's own stories
        eq(stories.visibility, 'public'), // Public stories
        and(
          eq(stories.visibility, 'anonymous'),
          eq(stories.published, true)
        ), // Anonymous published stories
      ];

      // Add organization filter if user belongs to one
      if (user.organizationId) {
        conditions.push(
          and(
            eq(stories.visibility, 'organization'),
            eq(stories.organizationId, user.organizationId)
          )
        );
      }

      // TODO: Add mentor connection filter for 'mentors' visibility
    }

    // Apply additional filters
    let query = db
      .select({
        id: stories.id,
        title: stories.title,
        content: stories.content,
        storyType: stories.storyType,
        visibility: stories.visibility,
        published: stories.published,
        publishedAt: stories.publishedAt,
        createdAt: stories.createdAt,
        updatedAt: stories.updatedAt,
        userId: stories.userId,
        organizationId: stories.organizationId,
      })
      .from(stories)
      .where(or(...conditions))
      .orderBy(desc(stories.createdAt));

    const userStories = await query;

    // Sanitize anonymous stories
    const sanitizedStories = userStories.map(story => {
      if (story.visibility === 'anonymous' && story.userId !== user.id) {
        const { userId, ...sanitized } = story;
        return sanitized;
      }
      return story;
    });

    return NextResponse.json(sanitizedStories);
  } catch (error) {
    console.error('Error fetching stories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stories' },
      { status: 500 }
    );
  }
}