import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { mentorshipRelationships, mentors, youthProfiles, users, messages, mentorshipSessions } from '@/server/db/schema';
import { eq, and, desc, or, sql, gte } from 'drizzle-orm';
import { getSession } from '@auth0/nextjs-auth0';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is youth or mentor
    const [youthProfile] = await db
      .select()
      .from(youthProfiles)
      .where(eq(youthProfiles.userId, session.user.id))
      .limit(1);

    const [mentorProfile] = await db
      .select()
      .from(mentors)
      .where(eq(mentors.userId, session.user.id))
      .limit(1);

    if (!youthProfile && !mentorProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Get connections based on role
    let connections;
    if (youthProfile) {
      // Youth connections
      connections = await db
        .select({
          id: mentorshipRelationships.id,
          status: mentorshipRelationships.status,
          requestedAt: mentorshipRelationships.requestedAt,
          startDate: mentorshipRelationships.startDate,
          lastContactDate: mentorshipRelationships.lastContactDate,
          goals: mentorshipRelationships.goals,
          meetingFrequency: mentorshipRelationships.meetingFrequency,
          mentor: {
            id: mentors.id,
            userId: mentors.userId,
            name: users.name,
            title: mentors.title,
            expertise: mentors.expertise,
            availability: mentors.availability,
            rating: mentors.averageRating,
          },
        })
        .from(mentorshipRelationships)
        .innerJoin(mentors, eq(mentorshipRelationships.mentorId, mentors.id))
        .innerJoin(users, eq(mentors.userId, users.id))
        .where(eq(mentorshipRelationships.youthProfileId, youthProfile.id))
        .orderBy(desc(mentorshipRelationships.updatedAt));
    } else {
      // Mentor connections
      connections = await db
        .select({
          id: mentorshipRelationships.id,
          status: mentorshipRelationships.status,
          requestedAt: mentorshipRelationships.requestedAt,
          startDate: mentorshipRelationships.startDate,
          lastContactDate: mentorshipRelationships.lastContactDate,
          goals: mentorshipRelationships.goals,
          meetingFrequency: mentorshipRelationships.meetingFrequency,
          youth: {
            id: youthProfiles.id,
            userId: youthProfiles.userId,
            name: users.name,
            bio: youthProfiles.bio,
            goals: youthProfiles.goals,
          },
        })
        .from(mentorshipRelationships)
        .innerJoin(youthProfiles, eq(mentorshipRelationships.youthProfileId, youthProfiles.id))
        .innerJoin(users, eq(youthProfiles.userId, users.id))
        .where(eq(mentorshipRelationships.mentorId, mentorProfile!.id))
        .orderBy(desc(mentorshipRelationships.updatedAt));
    }

    // Get additional data for each connection
    const enrichedConnections = await Promise.all(
      connections.map(async (connection) => {
        // Get unread message count
        const [unreadCount] = await db
          .select({
            count: sql<number>`count(*)::int`,
          })
          .from(messages)
          .where(and(
            eq(messages.relationshipId, connection.id),
            eq(messages.read, false),
            sql`${messages.senderId} != ${session.user.id}`
          ));

        // Get upcoming session
        const [upcomingSession] = await db
          .select({
            id: mentorshipSessions.id,
            title: mentorshipSessions.title,
            scheduledAt: mentorshipSessions.scheduledAt,
            meetingType: mentorshipSessions.meetingType,
          })
          .from(mentorshipSessions)
          .where(and(
            eq(mentorshipSessions.relationshipId, connection.id),
            gte(mentorshipSessions.scheduledAt, new Date()),
            or(
              eq(mentorshipSessions.status, 'scheduled'),
              eq(mentorshipSessions.status, 'confirmed')
            )
          ))
          .orderBy(mentorshipSessions.scheduledAt)
          .limit(1);

        return {
          ...connection,
          unreadMessages: unreadCount?.count || 0,
          upcomingSession,
        };
      })
    );

    return NextResponse.json(enrichedConnections);
  } catch (error) {
    console.error('Error fetching connections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
      { status: 500 }
    );
  }
}