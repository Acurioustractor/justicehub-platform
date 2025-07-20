import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { db } from '@/server/db';
import { users, youthProfiles } from '@/server/db/schema';
import { apprenticeships } from '@/server/db/schema/apprenticeships';
import { eq, and } from 'drizzle-orm';
import type { UpdateApprenticeshipDto } from '@/types/apprenticeship';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(req, new NextResponse());
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.auth0Id, session.user.sub))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get apprenticeship
    const [apprenticeship] = await db
      .select()
      .from(apprenticeships)
      .where(eq(apprenticeships.id, params.id))
      .limit(1);

    if (!apprenticeship) {
      return NextResponse.json({ error: 'Apprenticeship not found' }, { status: 404 });
    }

    // Check access permissions
    if (user.role === 'youth') {
      const [youthProfile] = await db
        .select({ id: youthProfiles.id })
        .from(youthProfiles)
        .where(eq(youthProfiles.userId, user.id))
        .limit(1);

      if (!youthProfile || apprenticeship.youthProfileId !== youthProfile.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (user.role === 'org_admin' && user.organizationId !== apprenticeship.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(apprenticeship);
  } catch (error) {
    console.error('Error fetching apprenticeship:', error);
    return NextResponse.json(
      { error: 'Failed to fetch apprenticeship' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(req, new NextResponse());
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.auth0Id, session.user.sub))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only org admins and platform admins can update apprenticeships
    if (!['org_admin', 'platform_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get apprenticeship
    const [apprenticeship] = await db
      .select()
      .from(apprenticeships)
      .where(eq(apprenticeships.id, params.id))
      .limit(1);

    if (!apprenticeship) {
      return NextResponse.json({ error: 'Apprenticeship not found' }, { status: 404 });
    }

    // Check org admin permissions
    if (user.role === 'org_admin' && user.organizationId !== apprenticeship.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body: UpdateApprenticeshipDto = await req.json();
    const updateData: any = {
      ...body,
      updatedAt: new Date(),
    };

    // Handle status changes
    if (body.status) {
      if (body.status === 'completed') {
        updateData.completedAt = new Date();
      } else if (body.status === 'terminated') {
        updateData.terminatedAt = new Date();
      }
    }

    // Update apprenticeship
    const [updated] = await db
      .update(apprenticeships)
      .set(updateData)
      .where(eq(apprenticeships.id, params.id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating apprenticeship:', error);
    return NextResponse.json(
      { error: 'Failed to update apprenticeship' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(req, new NextResponse());
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.auth0Id, session.user.sub))
      .limit(1);

    if (!user || user.role !== 'platform_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete apprenticeship
    await db
      .delete(apprenticeships)
      .where(eq(apprenticeships.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting apprenticeship:', error);
    return NextResponse.json(
      { error: 'Failed to delete apprenticeship' },
      { status: 500 }
    );
  }
}