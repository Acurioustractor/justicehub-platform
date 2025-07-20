import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { organizationMembers, organizationActivityLog } from '@/server/db/schema/organization-members';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req, new NextResponse());
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { organizationId } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
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

    // Verify user is a member of the organization
    const [membership] = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, user.id),
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.isActive, true)
        )
      )
      .limit(1);

    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of this organization' },
        { status: 403 }
      );
    }

    // Update user's current organization
    await db
      .update(users)
      .set({ 
        currentOrganizationId: organizationId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Log the switch
    await db.insert(organizationActivityLog).values({
      id: uuidv4(),
      organizationId,
      userId: user.id,
      action: 'organization_switched',
      details: {
        previousOrganizationId: user.currentOrganizationId,
      },
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      organizationId,
      role: membership.role,
      permissions: membership.permissions,
    });
  } catch (error) {
    console.error('Error switching organization:', error);
    return NextResponse.json(
      { error: 'Failed to switch organization' },
      { status: 500 }
    );
  }
}