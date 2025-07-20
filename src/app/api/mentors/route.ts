import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { mentors, mentorReviews, mentorshipRelationships, users } from '@/server/db/schema';
import { eq, and, or, like, sql, desc, asc, gte, lte } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = (page - 1) * limit;
    
    const search = searchParams.get('search') || '';
    const expertise = searchParams.getAll('expertise');
    const organization = searchParams.get('organization');
    const minRating = searchParams.has('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined;
    const maxRating = searchParams.has('maxRating') ? parseFloat(searchParams.get('maxRating')!) : undefined;
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    const conditions = [];

    if (organization) {
      conditions.push(eq(mentors.organizationId, organization));
    }

    if (minRating !== undefined) {
      conditions.push(gte(mentors.averageRating, minRating.toString()));
    }
    
    if (maxRating !== undefined) {
      conditions.push(lte(mentors.averageRating, maxRating.toString()));
    }

    if (search) {
      conditions.push(
        or(
          like(users.name, `%${search}%`),
          like(mentors.title, `%${search}%`),
          like(mentors.bio, `%${search}%`)
        )
      );
    }
    
    if (expertise.length > 0) {
      const expertiseConditions = expertise.map(e => 
        sql`(${mentors.expertise} @> ${JSON.stringify([e])})`
      );
      conditions.push(or(...expertiseConditions));
    }

    // Base query for reuse
    const baseQuery = db
      .select()
      .from(mentors)
      .innerJoin(users, eq(mentors.userId, users.id));

    // Apply conditions if they exist
    const conditionalQuery = conditions.length > 0 
      ? baseQuery.where(and(...conditions)) 
      : baseQuery;
      
    // Get total count
    const totalQuery = db.select({ count: sql<number>`count(*)` }).from(conditionalQuery.as('sub'));
    const [total] = await totalQuery;
    
    // Get mentors with user data
    const orderByClause = 
      sortBy === 'name' ? (sortOrder === 'asc' ? asc(users.name) : desc(users.name)) :
      sortBy === 'rating' ? (sortOrder === 'asc' ? asc(mentors.averageRating) : desc(mentors.averageRating)) :
      asc(users.name);

    const mentorList = await db.select({
        id: mentors.id,
        userId: mentors.userId,
        title: mentors.title,
        bio: mentors.bio,
        expertise: mentors.expertise,
        averageRating: mentors.averageRating,
        organizationId: mentors.organizationId,
        userName: users.name,
        userEmail: users.email,
        userRole: users.role,
        userCreatedAt: users.createdAt,
      }).from(conditionalQuery.as('sub'))
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      mentors: mentorList,
      pagination: {
        total: total.count,
        page,
        limit,
        totalPages: Math.ceil(total.count / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching mentors:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { message: 'Internal Server Error', error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user already has a mentor profile
    const existingMentor = await db
      .select()
      .from(mentors)
      .where(eq(mentors.userId, session.user.id))
      .limit(1);

    if (existingMentor.length > 0) {
      return NextResponse.json(
        { error: 'Mentor profile already exists' },
        { status: 400 }
      );
    }

    const data = await request.json();

    // Create mentor profile
    const [newMentor] = await db
      .insert(mentors)
      .values({
        userId: session.user.id,
        title: data.title,
        bio: data.bio,
        longBio: data.longBio,
        expertise: data.expertise || [],
        skills: data.skills || [],
        focusAreas: data.focusAreas || [],
        experience: data.experience,
        education: data.education || [],
        certifications: data.certifications || [],
        availability: data.availability || {
          hours: 0,
          timezone: 'UTC',
          preferredTimes: [],
          schedule: {
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: [],
            saturday: [],
            sunday: []
          }
        },
        languages: data.languages || ['English'],
        mentorshipStyle: data.mentorshipStyle,
        responseTime: data.responseTime || 'Within 48 hours',
        maxMentees: data.maxMentees || 5,
        socialLinks: data.socialLinks || {},
        status: 'pending', // Requires approval
      })
      .returning();

    return NextResponse.json({
      message: 'Mentor profile created successfully',
      mentor: newMentor,
    });
  } catch (error) {
    console.error('Error creating mentor profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to create mentor profile', details: errorMessage },
      { status: 500 }
    );
  }
}