/*
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { opportunities, organizations } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const opportunityId = params.id;

    const [opportunity] = await db
      .select({
        id: opportunities.id,
        title: opportunities.title,
        type: opportunities.type,
        description: opportunities.description,
        longDescription: opportunities.longDescription,
        category: opportunities.category,
        skills: opportunities.skills,
        location: opportunities.location,
        commitment: opportunities.commitment,
        applicationDeadline: opportunities.applicationDeadline,
        startDate: opportunities.startDate,
        endDate: opportunities.endDate,
        organization: {
          id: organizations.id,
          name: organizations.name,
          logo: organizations.logo,
          website: organizations.website,
          description: organizations.description,
        },
      })
      .from(opportunities)
      .leftJoin(organizations, eq(opportunities.organizationId, organizations.id))
      .where(eq(opportunities.id, opportunityId))
      .limit(1);

    if (!opportunity) {
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(opportunity);
  } catch (error) {
    console.error('Error fetching opportunity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunity' },
      { status: 500 }
    );
  }
}
*/

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { opportunities, organizations, savedOpportunities, opportunityApplications } from '@/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const opportunityId = params.id;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Get opportunity with organization data
    const [opportunity] = await db
      .select({
        opportunity: opportunities,
        organization: {
          id: organizations.id,
          name: organizations.name,
          logo: organizations.logo,
          website: organizations.website,
          description: organizations.description,
        },
      })
      .from(opportunities)
      .innerJoin(organizations, eq(opportunities.organizationId, organizations.id))
      .where(eq(opportunities.id, opportunityId))
      .limit(1);

    if (!opportunity) {
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      );
    }

    // Check if opportunity is active or user has permission
    const canView = 
      opportunity.opportunity.status === 'active' ||
      (userId && opportunity.opportunity.createdBy === userId) ||
      (userId && session.user.organizationId === opportunity.opportunity.organizationId);

    if (!canView) {
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      );
    }

    // Get user-specific data if logged in
    let saved = false;
    let application = null;

    if (userId) {
      // Check if saved
      const [savedRecord] = await db
        .select()
        .from(savedOpportunities)
        .where(and(
          eq(savedOpportunities.opportunityId, opportunityId),
          eq(savedOpportunities.userId, userId)
        ))
        .limit(1);
      
      saved = !!savedRecord;

      // Check application status
      const [applicationRecord] = await db
        .select()
        .from(opportunityApplications)
        .where(and(
          eq(opportunityApplications.opportunityId, opportunityId),
          eq(opportunityApplications.applicantId, userId)
        ))
        .limit(1);

      if (applicationRecord) {
        application = {
          id: applicationRecord.id,
          status: applicationRecord.status,
          submittedAt: applicationRecord.submittedAt,
        };
      }
    }

    // Increment view count
    await db
      .update(opportunities)
      .set({ 
        viewCount: sql`${opportunities.viewCount} + 1` 
      })
      .where(eq(opportunities.id, opportunityId));

    // Get similar opportunities
    const similarOpportunities = await db
      .select({
        id: opportunities.id,
        title: opportunities.title,
        type: opportunities.type,
        organization: organizations.name,
        location: opportunities.location,
        applicationDeadline: opportunities.applicationDeadline,
      })
      .from(opportunities)
      .innerJoin(organizations, eq(opportunities.organizationId, organizations.id))
      .where(and(
        eq(opportunities.status, 'active'),
        eq(opportunities.type, opportunity.opportunity.type),
        sql`${opportunities.id} != ${opportunityId}`
      ))
      .limit(3);

    return NextResponse.json({
      ...opportunity.opportunity,
      organization: opportunity.organization,
      saved,
      application,
      similarOpportunities,
    });
  } catch (error) {
    console.error('Error fetching opportunity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunity' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const opportunityId = params.id;
    const updates = await request.json();

    // Check if user can edit this opportunity
    const [existingOpportunity] = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.id, opportunityId))
      .limit(1);

    if (!existingOpportunity) {
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      );
    }

    const canEdit = 
      existingOpportunity.createdBy === session.user.id ||
      (session.user.organizationId && 
       session.user.organizationId === existingOpportunity.organizationId);

    if (!canEdit) {
      return NextResponse.json(
        { error: 'Unauthorized to edit this opportunity' },
        { status: 403 }
      );
    }

    // Handle status changes
    if (updates.status === 'active' && existingOpportunity.status !== 'active') {
      updates.publishedAt = new Date();
    }

    // Update opportunity
    const [updatedOpportunity] = await db
      .update(opportunities)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(opportunities.id, opportunityId))
      .returning();

    return NextResponse.json({
      message: 'Opportunity updated successfully',
      opportunity: updatedOpportunity,
    });
  } catch (error) {
    console.error('Error updating opportunity:', error);
    return NextResponse.json(
      { error: 'Failed to update opportunity' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const opportunityId = params.id;

    // Check if user can delete this opportunity
    const [existingOpportunity] = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.id, opportunityId))
      .limit(1);

    if (!existingOpportunity) {
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      );
    }

    const canDelete = 
      existingOpportunity.createdBy === session.user.id ||
      (session.user.organizationId && 
       session.user.organizationId === existingOpportunity.organizationId &&
       session.user.role === 'organization_admin');

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this opportunity' },
        { status: 403 }
      );
    }

    // Soft delete by setting status to cancelled
    await db
      .update(opportunities)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(opportunities.id, opportunityId));

    return NextResponse.json({
      message: 'Opportunity deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting opportunity:', error);
    return NextResponse.json(
      { error: 'Failed to delete opportunity' },
      { status: 500 }
    );
  }
}