import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { unifiedStoryService } from '@/services/unifiedStoryService';

export async function GET(req: NextRequest) {
  try {
    // Development bypass
    const isDev = process.env.NODE_ENV === 'development';
    let user;
    
    if (isDev) {
      // Use development user
      user = {
        id: 'dev-user-123',
        auth0Id: 'dev-user-123',
        email: 'dev@example.com',
        name: 'Dev User',
        role: 'admin' as const,
        organizationId: 'org_123_dev',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } else {
      const session = await getSession();
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get user from database
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.auth0Id, session.user.sub))
        .limit(1);

      if (!dbUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      user = dbUser;
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    
    const filter = {
      source: (searchParams.get('source') || 'all') as 'local' | 'airtable' | 'all',
      visibility: searchParams.get('visibility')?.split(',').filter(Boolean),
      storyType: searchParams.get('type')?.split(',').filter(Boolean),
      tags: searchParams.get('tags')?.split(',').filter(Boolean),
      search: searchParams.get('search') || undefined,
      published: searchParams.get('published') === 'true' ? true : 
                 searchParams.get('published') === 'false' ? false : undefined,
      organizationId: searchParams.get('organizationId') || undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
      sortBy: (searchParams.get('sortBy') || 'createdAt') as 'createdAt' | 'publishedAt' | 'title',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'
    };

    // Get unified stories
    const result = await unifiedStoryService.getUnifiedStories(filter, user);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching unified stories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stories' },
      { status: 500 }
    );
  }
}

// Search endpoint
export async function POST(req: NextRequest) {
  try {
    // Development bypass
    const isDev = process.env.NODE_ENV === 'development';
    let user;
    
    if (isDev) {
      // Use development user
      user = {
        id: 'dev-user-123',
        auth0Id: 'dev-user-123',
        email: 'dev@example.com',
        name: 'Dev User',
        role: 'admin' as const,
        organizationId: 'org_123_dev',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } else {
      const session = await getSession();
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get user from database
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.auth0Id, session.user.sub))
        .limit(1);

      if (!dbUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      user = dbUser;
    }

    const body = await req.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Search stories
    const stories = await unifiedStoryService.searchStories(query, user);

    return NextResponse.json({ stories });
  } catch (error) {
    console.error('Error searching stories:', error);
    return NextResponse.json(
      { error: 'Failed to search stories' },
      { status: 500 }
    );
  }
}