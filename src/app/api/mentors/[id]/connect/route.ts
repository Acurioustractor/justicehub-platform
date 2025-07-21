import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { mentors, mentorshipRelationships, youthProfiles } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@auth0/nextjs-auth0';

export async function POST(
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

    const mentorId = params.id;
    const { message, goals, meetingFrequency, communicationPreference } = await request.json();

    // Get user's youth profile
    const [youthProfile] = await db
      .select()
      .from(youthProfiles)
      .where(eq(youthProfiles.userId, session.user.id))
      .limit(1);

    if (!youthProfile) {
      return NextResponse.json(
        { error: 'Youth profile not found. Only youth members can request mentorship.' },
        { status: 400 }
      );
    }

    // Check if mentor exists and is active
    const [mentor] = await db
      .select()
      .from(mentors)
      .where(and(
        eq(mentors.id, mentorId),
        eq(mentors.status, 'active'),
        eq(mentors.verified, true)
      ))
      .limit(1);

    if (!mentor) {
      return NextResponse.json(
        { error: 'Mentor not found or not available' },
        { status: 404 }
      );
    }

    // Check if mentor has capacity
    if (mentor.currentMentees >= mentor.maxMentees) {
      return NextResponse.json(
        { error: 'Mentor is at full capacity' },
        { status: 400 }
      );
    }

    // Check if there's already a relationship
    const existingRelationship = await db
      .select()
      .from(mentorshipRelationships)
      .where(and(
        eq(mentorshipRelationships.mentorId, mentorId),
        eq(mentorshipRelationships.youthProfileId, youthProfile.id)
      ))
      .limit(1);

    if (existingRelationship.length > 0) {
      const status = existingRelationship[0].status;
      if (status === 'active') {
        return NextResponse.json(
          { error: 'You already have an active mentorship with this mentor' },
          { status: 400 }
        );
      } else if (status === 'pending') {
        return NextResponse.json(
          { error: 'You already have a pending request with this mentor' },
          { status: 400 }
        );
      }
    }

    // Create mentorship request
    const [newRelationship] = await db
      .insert(mentorshipRelationships)
      .values({
        mentorId,
        youthProfileId: youthProfile.id,
        status: 'pending',
        requestMessage: message,
        goals: goals || [],
        meetingFrequency: meetingFrequency || 'Bi-weekly',
        communicationPreference: communicationPreference || ['video', 'chat'],
      })
      .returning();

    // TODO: Send notification to mentor

    return NextResponse.json({
      message: 'Connection request sent successfully',
      relationship: newRelationship,
    });
  } catch (error) {
    console.error('Error creating connection request:', error);
    return NextResponse.json(
      { error: 'Failed to send connection request' },
      { status: 500 }
    );
  }
}

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

    const mentorId = params.id;

    // Get user's youth profile
    const [youthProfile] = await db
      .select()
      .from(youthProfiles)
      .where(eq(youthProfiles.userId, session.user.id))
      .limit(1);

    if (!youthProfile) {
      return NextResponse.json({ status: 'not_youth' });
    }

    // Check existing relationship
    const [relationship] = await db
      .select()
      .from(mentorshipRelationships)
      .where(and(
        eq(mentorshipRelationships.mentorId, mentorId),
        eq(mentorshipRelationships.youthProfileId, youthProfile.id)
      ))
      .limit(1);

    if (!relationship) {
      return NextResponse.json({ status: 'none' });
    }

    return NextResponse.json({
      status: relationship.status,
      relationship: {
        id: relationship.id,
        status: relationship.status,
        requestedAt: relationship.createdAt,
        startDate: relationship.startDate,
        goals: relationship.goals,
      },
    });
  } catch (error) {
    console.error('Error checking connection status:', error);
    return NextResponse.json(
      { error: 'Failed to check connection status' },
      { status: 500 }
    );
  }
}