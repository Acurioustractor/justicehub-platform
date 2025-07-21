import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { mentorshipRelationships, mentors, youthProfiles, users } from '@/server/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { getSession } from '@auth0/nextjs-auth0';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const connectionId = params.id;

    // Get connection with full details
    const [connection] = await db
      .select({
        id: mentorshipRelationships.id,
        status: mentorshipRelationships.status,
        requestedAt: mentorshipRelationships.requestedAt,
        startDate: mentorshipRelationships.startDate,
        endDate: mentorshipRelationships.endDate,
        lastContactDate: mentorshipRelationships.lastContactDate,
        goals: mentorshipRelationships.goals,
        meetingFrequency: mentorshipRelationships.meetingFrequency,
        communicationPreference: mentorshipRelationships.communicationPreference,
        notes: mentorshipRelationships.notes,
        milestones: mentorshipRelationships.milestones,
        mentor: {
          id: mentors.id,
          userId: mentors.userId,
          name: users.name,
          email: users.email,
          title: mentors.title,
          bio: mentors.bio,
          profileImage: mentors.profileImage,
          expertise: mentors.expertise,
          skills: mentors.skills,
          availability: mentors.availability,
          rating: mentors.averageRating,
          responseTime: mentors.responseTime,
        },
        mentorId: mentorshipRelationships.mentorId,
      })
      .from(mentorshipRelationships)
      .innerJoin(mentors, eq(mentorshipRelationships.mentorId, mentors.id))
      .innerJoin(users, eq(mentors.userId, users.id))
      .where(eq(mentorshipRelationships.id, connectionId))
      .limit(1);

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    // Get youth details
    const [youthDetails] = await db
      .select({
        id: youthProfiles.id,
        userId: youthProfiles.userId,
        name: users.name,
        email: users.email,
        bio: youthProfiles.bio,
        interests: youthProfiles.interests,
        goals: youthProfiles.goals,
      })
      .from(mentorshipRelationships)
      .innerJoin(youthProfiles, eq(mentorshipRelationships.youthProfileId, youthProfiles.id))
      .innerJoin(users, eq(youthProfiles.userId, users.id))
      .where(eq(mentorshipRelationships.id, connectionId))
      .limit(1);

    // Check if user is part of this connection
    const isAuthorized = 
      session.user.id === connection.mentor.userId ||
      session.user.id === youthDetails?.userId;

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized to view this connection' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ...connection,
      youth: youthDetails,
    });
  } catch (error) {
    console.error('Error fetching connection:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connection' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const connectionId = params.id;
    const updates = await request.json();

    // Get connection to verify authorization
    const [connection] = await db
      .select({
        mentorUserId: users.id,
      })
      .from(mentorshipRelationships)
      .innerJoin(mentors, eq(mentorshipRelationships.mentorId, mentors.id))
      .innerJoin(users, eq(mentors.userId, users.id))
      .where(eq(mentorshipRelationships.id, connectionId))
      .limit(1);

    const [youthConnection] = await db
      .select({
        youthUserId: users.id,
      })
      .from(mentorshipRelationships)
      .innerJoin(youthProfiles, eq(mentorshipRelationships.youthProfileId, youthProfiles.id))
      .innerJoin(users, eq(youthProfiles.userId, users.id))
      .where(eq(mentorshipRelationships.id, connectionId))
      .limit(1);

    if (!connection || !youthConnection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    // Check if user is part of this connection
    const isAuthorized = 
      session.user.id === connection.mentorUserId ||
      session.user.id === youthConnection.youthUserId;

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized to update this connection' },
        { status: 403 }
      );
    }

    // Update connection
    const [updatedConnection] = await db
      .update(mentorshipRelationships)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(mentorshipRelationships.id, connectionId))
      .returning();

    return NextResponse.json({
      connection: updatedConnection,
      message: 'Connection updated successfully',
    });
  } catch (error) {
    console.error('Error updating connection:', error);
    return NextResponse.json(
      { error: 'Failed to update connection' },
      { status: 500 }
    );
  }
}