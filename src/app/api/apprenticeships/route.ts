import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { db } from '@/server/db';
import { users, youthProfiles, organizations } from '@/server/db/schema';
import { apprenticeships } from '@/server/db/schema/apprenticeships';
import { eq, and, or, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { CreateApprenticeshipDto, ApprenticeshipFilters } from '@/types/apprenticeship';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req, new NextResponse());
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and their role
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.auth0Id, session.user.sub))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const filters: ApprenticeshipFilters = {
      status: searchParams.get('status')?.split(',') as any,
      organizationId: searchParams.get('organizationId') || undefined,
      youthProfileId: searchParams.get('youthProfileId') || undefined,
    };

    // Build query based on user role
    let query = db
      .select({
        apprenticeship: apprenticeships,
        youth: {
          id: youthProfiles.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
        organization: {
          id: organizations.id,
          name: organizations.name,
          logo: organizations.logo,
        },
      })
      .from(apprenticeships)
      .leftJoin(youthProfiles, eq(apprenticeships.youthProfileId, youthProfiles.id))
      .leftJoin(users, eq(youthProfiles.userId, users.id))
      .leftJoin(organizations, eq(apprenticeships.organizationId, organizations.id));

    // Apply role-based filtering
    if (user.role === 'youth') {
      // Youth can only see their own apprenticeships
      const [youthProfile] = await db
        .select({ id: youthProfiles.id })
        .from(youthProfiles)
        .where(eq(youthProfiles.userId, user.id))
        .limit(1);

      if (youthProfile) {
        query = query.where(eq(apprenticeships.youthProfileId, youthProfile.id));
      } else {
        return NextResponse.json([]);
      }
    } else if (user.role === 'org_admin' && user.organizationId) {
      // Org admins see their organization's apprenticeships
      query = query.where(eq(apprenticeships.organizationId, user.organizationId));
    }
    // Platform admins see all apprenticeships

    // Apply additional filters
    if (filters.status) {
      const statusConditions = filters.status.map(s => eq(apprenticeships.status, s));
      query = query.where(or(...statusConditions));
    }

    if (filters.organizationId) {
      query = query.where(eq(apprenticeships.organizationId, filters.organizationId));
    }

    if (filters.youthProfileId) {
      query = query.where(eq(apprenticeships.youthProfileId, filters.youthProfileId));
    }

    const results = await query.orderBy(desc(apprenticeships.createdAt));

    // Transform results
    const formattedResults = results.map(({ apprenticeship, youth, organization }) => ({
      ...apprenticeship,
      youth,
      organization,
    }));

    return NextResponse.json(formattedResults);
  } catch (error) {
    console.error('Error fetching apprenticeships:', error);
    return NextResponse.json(
      { error: 'Failed to fetch apprenticeships' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req, new NextResponse());
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and verify permissions
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.auth0Id, session.user.sub))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only org admins and platform admins can create apprenticeships
    if (!['org_admin', 'platform_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body: CreateApprenticeshipDto = await req.json();
    const { youthProfileId, organizationId, opportunityId, contractDetails, startDate, endDate } = body;

    // Validate required fields
    if (!youthProfileId || !organizationId || !contractDetails || !startDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify org admin can only create for their organization
    if (user.role === 'org_admin' && user.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if youth profile exists
    const [youthProfile] = await db
      .select({ id: youthProfiles.id })
      .from(youthProfiles)
      .where(eq(youthProfiles.id, youthProfileId))
      .limit(1);

    if (!youthProfile) {
      return NextResponse.json({ error: 'Youth profile not found' }, { status: 404 });
    }

    // Create apprenticeship
    const apprenticeshipId = uuidv4();
    const [newApprenticeship] = await db
      .insert(apprenticeships)
      .values({
        id: apprenticeshipId,
        youthProfileId,
        organizationId,
        opportunityId,
        status: 'pending',
        contractDetails,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(newApprenticeship);
  } catch (error) {
    console.error('Error creating apprenticeship:', error);
    return NextResponse.json(
      { error: 'Failed to create apprenticeship' },
      { status: 500 }
    );
  }
}