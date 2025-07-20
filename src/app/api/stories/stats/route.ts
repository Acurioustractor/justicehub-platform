import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { unifiedStoryService } from '@/services/unifiedStoryService';

export async function GET(req: NextRequest) {
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

    // Get story statistics
    const stats = await unifiedStoryService.getStoryStats(user);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching story stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}