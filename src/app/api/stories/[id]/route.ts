import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { stories, storyTags, storyMedia } from '@/server/db/schema/stories';
import { eq, and } from 'drizzle-orm';
import { canViewStory, sanitizeStoryForViewer } from '@/lib/privacy';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.auth0Id, session.user.sub))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get story with tags and media
    const [story] = await db
      .select()
      .from(stories)
      .where(eq(stories.id, params.id))
      .limit(1);

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Check if user has permission to view the story
    if (!canViewStory({ story, viewer: user })) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get tags
    const tags = await db
      .select()
      .from(storyTags)
      .where(eq(storyTags.storyId, story.id));

    // Get media
    const media = await db
      .select()
      .from(storyMedia)
      .where(eq(storyMedia.storyId, story.id));

    // Sanitize the story based on privacy settings
    const sanitizedStory = sanitizeStoryForViewer(story, user);

    return NextResponse.json({
      ...sanitizedStory,
      tags: tags.map(t => t.tag),
      media
    });
  } catch (error) {
    console.error('Error fetching story:', error);
    return NextResponse.json(
      { error: 'Failed to fetch story' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Check if user owns the story
    const [existingStory] = await db
      .select()
      .from(stories)
      .where(and(
        eq(stories.id, params.id),
        eq(stories.userId, user.id)
      ))
      .limit(1);

    if (!existingStory) {
      return NextResponse.json({ error: 'Story not found or unauthorized' }, { status: 404 });
    }

    const body = await req.json();
    const { title, content, storyType, visibility, tags = [], published } = body;

    // Update story
    const [updatedStory] = await db
      .update(stories)
      .set({
        title,
        content,
        storyType,
        visibility,
        published,
        publishedAt: published && !existingStory.published ? new Date() : existingStory.publishedAt,
        updatedAt: new Date()
      })
      .where(eq(stories.id, params.id))
      .returning();

    // Update tags
    // First, delete existing tags
    await db.delete(storyTags).where(eq(storyTags.storyId, params.id));

    // Then add new tags
    if (tags.length > 0) {
      const tagValues = tags.map((tag: string) => ({
        id: crypto.randomUUID(),
        storyId: params.id,
        tag,
        createdAt: new Date()
      }));

      await db.insert(storyTags).values(tagValues);
    }

    return NextResponse.json(updatedStory);
  } catch (error) {
    console.error('Error updating story:', error);
    return NextResponse.json(
      { error: 'Failed to update story' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Check if user owns the story
    const [existingStory] = await db
      .select()
      .from(stories)
      .where(and(
        eq(stories.id, params.id),
        eq(stories.userId, user.id)
      ))
      .limit(1);

    if (!existingStory) {
      return NextResponse.json({ error: 'Story not found or unauthorized' }, { status: 404 });
    }

    // Delete story (cascades to tags and media due to foreign keys)
    await db.delete(stories).where(eq(stories.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting story:', error);
    return NextResponse.json(
      { error: 'Failed to delete story' },
      { status: 500 }
    );
  }
}