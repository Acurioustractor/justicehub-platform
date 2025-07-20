import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { db } from '@/server/db';
import { users, organizations } from '@/server/db/schema';
import { organizationMembers } from '@/server/db/schema/organization-members';
import { eq, and, or } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { OrganizationRole } from '@/server/db/schema/organization-members';

// Get user's organizations
export async function GET(req: NextRequest) {
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

    // Get all organizations user is a member of
    const memberships = await db
      .select({
        membership: organizationMembers,
        organization: organizations,
      })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
      .where(
        and(
          eq(organizationMembers.userId, user.id),
          eq(organizationMembers.isActive, true)
        )
      );

    // Format response
    const userOrganizations = memberships.map(({ membership, organization }) => ({
      ...organization,
      role: membership.role,
      isPrimary: membership.isPrimary,
      joinedAt: membership.joinedAt,
      permissions: membership.permissions,
    }));

    return NextResponse.json({
      organizations: userOrganizations,
      currentOrganizationId: user.currentOrganizationId,
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}

// Create new organization
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { 
      name, 
      description, 
      type = 'nonprofit',
      website,
      logo,
      settings = {},
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      );
    }

    // Create organization
    const organizationId = uuidv4();
    const [newOrganization] = await db
      .insert(organizations)
      .values({
        id: organizationId,
        name,
        description,
        type,
        website,
        logo,
        settings,
        createdBy: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Add creator as owner
    await db.insert(organizationMembers).values({
      id: uuidv4(),
      organizationId,
      userId: user.id,
      role: 'owner' as OrganizationRole,
      isActive: true,
      isPrimary: !user.currentOrganizationId, // Set as primary if user has no org
      joinedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Update user's current organization if they don't have one
    if (!user.currentOrganizationId) {
      await db
        .update(users)
        .set({ currentOrganizationId: organizationId })
        .where(eq(users.id, user.id));
    }

    return NextResponse.json({
      organization: newOrganization,
      membership: {
        role: 'owner',
        isPrimary: !user.currentOrganizationId,
      },
    });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    );
  }
}