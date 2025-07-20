import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { db } from '@/server/db';
import { users, organizations } from '@/server/db/schema';
import { organizationMembers, organizationActivityLog } from '@/server/db/schema/organization-members';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// Check if user has permission for organization
async function checkOrgPermission(
  userId: string,
  organizationId: string,
  requiredRole: string[] = ['owner', 'admin', 'member']
) {
  const [membership] = await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.isActive, true)
      )
    )
    .limit(1);

  return membership && requiredRole.includes(membership.role);
}

// Log organization activity
async function logActivity(
  organizationId: string,
  userId: string,
  action: string,
  details?: any
) {
  await db.insert(organizationActivityLog).values({
    id: uuidv4(),
    organizationId,
    userId,
    action,
    details,
    createdAt: new Date(),
  });
}

// Get organization details
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

    // Check permission
    const hasPermission = await checkOrgPermission(user.id, params.id);
    if (!hasPermission && user.role !== 'platform_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get organization with member count
    const [organization] = await db
      .select({
        organization: organizations,
        memberCount: db.$count(organizationMembers, eq(organizationMembers.organizationId, params.id)),
      })
      .from(organizations)
      .where(eq(organizations.id, params.id))
      .limit(1);

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get user's membership info
    const [membership] = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, user.id),
          eq(organizationMembers.organizationId, params.id)
        )
      )
      .limit(1);

    return NextResponse.json({
      ...organization.organization,
      memberCount: organization.memberCount,
      currentUserRole: membership?.role,
      currentUserPermissions: membership?.permissions,
    });
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    );
  }
}

// Update organization
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

    // Check permission (only owners and admins can update)
    const hasPermission = await checkOrgPermission(user.id, params.id, ['owner', 'admin']);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, website, logo, settings } = body;

    // Update organization
    const [updated] = await db
      .update(organizations)
      .set({
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(website !== undefined && { website }),
        ...(logo !== undefined && { logo }),
        ...(settings !== undefined && { settings }),
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, params.id))
      .returning();

    // Log activity
    await logActivity(params.id, user.id, 'organization_updated', {
      fields: Object.keys(body),
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json(
      { error: 'Failed to update organization' },
      { status: 500 }
    );
  }
}

// Delete organization (owner only)
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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check permission (only owners can delete)
    const hasPermission = await checkOrgPermission(user.id, params.id, ['owner']);
    if (!hasPermission && user.role !== 'platform_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete organization (cascade will handle related records)
    await db
      .delete(organizations)
      .where(eq(organizations.id, params.id));

    // Update users who had this as current organization
    await db
      .update(users)
      .set({ currentOrganizationId: null })
      .where(eq(users.currentOrganizationId, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json(
      { error: 'Failed to delete organization' },
      { status: 500 }
    );
  }
}