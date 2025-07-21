import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { mentors, mentorReviews, mentorshipRelationships, users, organizations } from '@/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getSession } from '@auth0/nextjs-auth0';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const mentorId = params.id;

    // Get mentor with user data
    const [mentor] = await db
      .select({
        id: mentors.id,
        userId: mentors.userId,
        name: users.name,
        email: users.email,
        title: mentors.title,
        bio: mentors.bio,
        longBio: mentors.longBio,
        profileImage: mentors.profileImage,
        organizationId: mentors.organizationId,
        organizationName: organizations.name,
        expertise: mentors.expertise,
        skills: mentors.skills,
        focusAreas: mentors.focusAreas,
        experience: mentors.experience,
        education: mentors.education,
        certifications: mentors.certifications,
        languages: mentors.languages,
        availability: mentors.availability,
        currentMentees: mentors.currentMentees,
        maxMentees: mentors.maxMentees,
        totalMentees: mentors.totalMentees,
        successStories: mentors.successStories,
        rating: mentors.averageRating,
        reviewCount: mentors.reviewCount,
        verified: mentors.verified,
        mentorshipStyle: mentors.mentorshipStyle,
        responseTime: mentors.responseTime,
        acceptanceRate: mentors.acceptanceRate,
        socialLinks: mentors.socialLinks,
        status: mentors.status,
      })
      .from(mentors)
      .innerJoin(users, eq(mentors.userId, users.id))
      .leftJoin(organizations, eq(mentors.organizationId, organizations.id))
      .where(eq(mentors.id, mentorId))
      .limit(1);

    if (!mentor) {
      return NextResponse.json(
        { error: 'Mentor not found' },
        { status: 404 }
      );
    }

    // Only show active and verified mentors publicly
    if (mentor.status !== 'active' || !mentor.verified) {
      const session = await getSession();
      if (!session?.user?.id || session.user.id !== mentor.userId) {
        return NextResponse.json(
          { error: 'Mentor not found' },
          { status: 404 }
        );
      }
    }

    // Get recent reviews
    const reviews = await db
      .select({
        id: mentorReviews.id,
        rating: mentorReviews.rating,
        title: mentorReviews.title,
        content: mentorReviews.content,
        aspects: mentorReviews.aspects,
        verified: mentorReviews.verified,
        helpful: mentorReviews.helpful,
        createdAt: mentorReviews.createdAt,
        reviewerName: users.name,
      })
      .from(mentorReviews)
      .innerJoin(users, eq(mentorReviews.reviewerId, users.id))
      .where(eq(mentorReviews.mentorId, mentorId))
      .orderBy(desc(mentorReviews.createdAt))
      .limit(10);

    // Transform mentor to match the expected format
    const transformedMentor = {
      id: mentor.id,
      name: mentor.name,
      title: mentor.title || 'Mentor',
      organization: mentor.organizationName || 'Independent',
      bio: mentor.bio || '',
      longBio: mentor.longBio || '',
      expertise: mentor.expertise as string[],
      skills: mentor.skills as string[],
      experience: mentor.experience || '',
      education: mentor.education as any[],
      certifications: mentor.certifications as string[],
      availability: mentor.availability as any,
      mentees: {
        current: mentor.currentMentees,
        total: mentor.totalMentees,
        capacity: mentor.maxMentees,
      },
      rating: parseFloat(mentor.rating || '0'),
      reviews: mentor.reviewCount,
      verified: mentor.verified,
      languages: mentor.languages as string[],
      focusAreas: mentor.focusAreas as string[],
      mentorshipStyle: mentor.mentorshipStyle || '',
      successStories: mentor.successStories,
      responseTime: mentor.responseTime || 'Within 48 hours',
      acceptanceRate: mentor.acceptanceRate || 0,
      socialLinks: mentor.socialLinks as any,
      recentReviews: reviews,
    };

    return NextResponse.json(transformedMentor);
  } catch (error) {
    console.error('Error fetching mentor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mentor' },
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

    const mentorId = params.id;
    const data = await request.json();

    // Check if user owns this mentor profile
    const [existingMentor] = await db
      .select()
      .from(mentors)
      .where(and(
        eq(mentors.id, mentorId),
        eq(mentors.userId, session.user.id)
      ))
      .limit(1);

    if (!existingMentor) {
      return NextResponse.json(
        { error: 'Unauthorized to update this profile' },
        { status: 403 }
      );
    }

    // Update mentor profile
    const [updatedMentor] = await db
      .update(mentors)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(mentors.id, mentorId))
      .returning();

    return NextResponse.json({
      message: 'Mentor profile updated successfully',
      mentor: updatedMentor,
    });
  } catch (error) {
    console.error('Error updating mentor profile:', error);
    return NextResponse.json(
      { error: 'Failed to update mentor profile' },
      { status: 500 }
    );
  }
}