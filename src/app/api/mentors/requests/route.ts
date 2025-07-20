import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { mentors, mentorshipRelationships, youthProfiles, users } from '@/server/db/schema';
import { eq, and, or, desc, sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get mentor profile
    const [mentorProfile] = await db
      .select()
      .from(mentors)
      .where(eq(mentors.userId, session.user.id))
      .limit(1);

    if (!mentorProfile) {
      return NextResponse.json(
        { error: 'Mentor profile not found' },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'pending';

    // Get mentorship requests
    const requests = await db
      .select({
        id: mentorshipRelationships.id,
        status: mentorshipRelationships.status,
        requestMessage: mentorshipRelationships.requestMessage,
        requestedAt: mentorshipRelationships.requestedAt,
        respondedAt: mentorshipRelationships.respondedAt,
        responseMessage: mentorshipRelationships.responseMessage,
        goals: mentorshipRelationships.goals,
        meetingFrequency: mentorshipRelationships.meetingFrequency,
        communicationPreference: mentorshipRelationships.communicationPreference,
        startDate: mentorshipRelationships.startDate,
        youth: {
          id: youthProfiles.id,
          userId: youthProfiles.userId,
          name: users.name,
          email: users.email,
          bio: youthProfiles.bio,
          interests: youthProfiles.interests,
          goals: youthProfiles.goals,
        },
      })
      .from(mentorshipRelationships)
      .innerJoin(youthProfiles, eq(mentorshipRelationships.youthProfileId, youthProfiles.id))
      .innerJoin(users, eq(youthProfiles.userId, users.id))
      .where(and(
        eq(mentorshipRelationships.mentorId, mentorProfile.id),
        status === 'all' ? undefined : eq(mentorshipRelationships.status, status as any)
      ))
      .orderBy(desc(mentorshipRelationships.requestedAt));

    return NextResponse.json({
      requests,
      counts: {
        pending: await db
          .select({ count: sql<number>`count(*)` })
          .from(mentorshipRelationships)
          .where(and(
            eq(mentorshipRelationships.mentorId, mentorProfile.id),
            eq(mentorshipRelationships.status, 'pending')
          ))
          .then(r => r[0].count),
        active: await db
          .select({ count: sql<number>`count(*)` })
          .from(mentorshipRelationships)
          .where(and(
            eq(mentorshipRelationships.mentorId, mentorProfile.id),
            eq(mentorshipRelationships.status, 'active')
          ))
          .then(r => r[0].count),
      },
    });
  } catch (error) {
    console.error('Error fetching mentorship requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { relationshipId, action, responseMessage } = await request.json();

    if (!relationshipId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get mentor profile
    const [mentorProfile] = await db
      .select()
      .from(mentors)
      .where(eq(mentors.userId, session.user.id))
      .limit(1);

    if (!mentorProfile) {
      return NextResponse.json(
        { error: 'Mentor profile not found' },
        { status: 404 }
      );
    }

    // Verify the relationship belongs to this mentor
    const [relationship] = await db
      .select()
      .from(mentorshipRelationships)
      .where(and(
        eq(mentorshipRelationships.id, relationshipId),
        eq(mentorshipRelationships.mentorId, mentorProfile.id)
      ))
      .limit(1);

    if (!relationship) {
      return NextResponse.json(
        { error: 'Relationship not found' },
        { status: 404 }
      );
    }

    if (relationship.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only respond to pending requests' },
        { status: 400 }
      );
    }

    let updateData: any = {
      respondedAt: new Date(),
      responseMessage,
      updatedAt: new Date(),
    };

    if (action === 'accept') {
      // Check capacity
      if (mentorProfile.currentMentees >= mentorProfile.maxMentees) {
        return NextResponse.json(
          { error: 'You are at full capacity' },
          { status: 400 }
        );
      }

      updateData.status = 'active';
      updateData.startDate = new Date();

      // Update mentor's current mentee count
      await db
        .update(mentors)
        .set({
          currentMentees: mentorProfile.currentMentees + 1,
          updatedAt: new Date(),
        })
        .where(eq(mentors.id, mentorProfile.id));
    } else if (action === 'decline') {
      updateData.status = 'cancelled';
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Update relationship
    const [updatedRelationship] = await db
      .update(mentorshipRelationships)
      .set(updateData)
      .where(eq(mentorshipRelationships.id, relationshipId))
      .returning();

    // TODO: Send notification to youth

    return NextResponse.json({
      message: `Request ${action}ed successfully`,
      relationship: updatedRelationship,
    });
  } catch (error) {
    console.error('Error responding to request:', error);
    return NextResponse.json(
      { error: 'Failed to respond to request' },
      { status: 500 }
    );
  }
}