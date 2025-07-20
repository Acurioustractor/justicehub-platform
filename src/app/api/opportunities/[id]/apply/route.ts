import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { opportunityApplications, opportunities, youthProfiles } from '@/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
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

    // Get existing application
    const [application] = await db
      .select()
      .from(opportunityApplications)
      .where(and(
        eq(opportunityApplications.opportunityId, opportunityId),
        eq(opportunityApplications.applicantId, session.user.id)
      ))
      .limit(1);

    if (!application) {
      return NextResponse.json({ application: null });
    }

    return NextResponse.json({ application });
  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json(
      { error: 'Failed to fetch application' },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const applicationData = await request.json();

    // Check if opportunity exists and is active
    const [opportunity] = await db
      .select()
      .from(opportunities)
      .where(and(
        eq(opportunities.id, opportunityId),
        eq(opportunities.status, 'active')
      ))
      .limit(1);

    if (!opportunity) {
      return NextResponse.json(
        { error: 'Opportunity not found or not accepting applications' },
        { status: 404 }
      );
    }

    // Check application deadline
    if (opportunity.applicationDeadline && new Date() > opportunity.applicationDeadline) {
      return NextResponse.json(
        { error: 'Application deadline has passed' },
        { status: 400 }
      );
    }

    // Check if spots are available
    if (opportunity.spotsAvailable <= 0) {
      return NextResponse.json(
        { error: 'No spots available' },
        { status: 400 }
      );
    }

    // Check if already applied
    const existing = await db
      .select()
      .from(opportunityApplications)
      .where(and(
        eq(opportunityApplications.opportunityId, opportunityId),
        eq(opportunityApplications.applicantId, session.user.id)
      ))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'You have already applied to this opportunity' },
        { status: 400 }
      );
    }

    // Get youth profile if user is youth
    let youthProfileId = null;
    if (session.user.role === 'youth') {
      const [youthProfile] = await db
        .select({ id: youthProfiles.id })
        .from(youthProfiles)
        .where(eq(youthProfiles.userId, session.user.id))
        .limit(1);
      
      youthProfileId = youthProfile?.id;
    }

    // Create application
    const [newApplication] = await db
      .insert(opportunityApplications)
      .values({
        opportunityId,
        applicantId: session.user.id,
        youthProfileId,
        status: applicationData.submitNow ? 'submitted' : 'draft',
        coverLetter: applicationData.coverLetter,
        resume: applicationData.resume,
        portfolio: applicationData.portfolio,
        customResponses: applicationData.customResponses || {},
        references: applicationData.references || [],
        source: applicationData.source || 'direct',
        referredBy: applicationData.referredBy,
        submittedAt: applicationData.submitNow ? new Date() : null,
      })
      .returning();

    // Update opportunity application count
    if (applicationData.submitNow) {
      await db
        .update(opportunities)
        .set({ 
          applicationCount: sql`${opportunities.applicationCount} + 1` 
        })
        .where(eq(opportunities.id, opportunityId));
    }

    // TODO: Send notification to organization

    return NextResponse.json({
      message: applicationData.submitNow ? 
        'Application submitted successfully' : 
        'Application draft saved',
      application: newApplication,
    });
  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' },
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

    // Get existing application
    const [existingApplication] = await db
      .select()
      .from(opportunityApplications)
      .where(and(
        eq(opportunityApplications.opportunityId, opportunityId),
        eq(opportunityApplications.applicantId, session.user.id)
      ))
      .limit(1);

    if (!existingApplication) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Can only update draft applications
    if (existingApplication.status !== 'draft') {
      return NextResponse.json(
        { error: 'Can only update draft applications' },
        { status: 400 }
      );
    }

    // Update application
    const updateData: any = {
      ...updates,
      updatedAt: new Date(),
    };

    // If submitting now
    if (updates.submitNow) {
      updateData.status = 'submitted';
      updateData.submittedAt = new Date();
      delete updateData.submitNow;

      // Update opportunity application count
      await db
        .update(opportunities)
        .set({ 
          applicationCount: sql`${opportunities.applicationCount} + 1` 
        })
        .where(eq(opportunities.id, opportunityId));
    }

    const [updatedApplication] = await db
      .update(opportunityApplications)
      .set(updateData)
      .where(and(
        eq(opportunityApplications.opportunityId, opportunityId),
        eq(opportunityApplications.applicantId, session.user.id)
      ))
      .returning();

    return NextResponse.json({
      message: updates.submitNow ? 
        'Application submitted successfully' : 
        'Application updated successfully',
      application: updatedApplication,
    });
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    );
  }
}