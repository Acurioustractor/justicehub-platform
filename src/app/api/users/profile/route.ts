import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth0';
import { db } from '@/server/db';
import { users, youthProfiles, mentors } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth0Id = session.user.sub;

    // Check if user exists in database
    let user = await db.query.users.findFirst({
      where: eq(users.auth0Id, auth0Id),
      with: {
        organization: true,
        youthProfile: true,
        mentor: true,
      },
    });

    // If user doesn't exist, create them
    if (!user) {
      const [newUser] = await db
        .insert(users)
        .values({
          auth0Id,
          email: session.user.email,
          role: 'youth', // Default role
          profile: {
            name: session.user.name || '',
            picture: session.user.picture || '',
          },
          privacySettings: {
            shareStories: true,
            allowMentorContact: true,
            showProfile: true,
          },
        })
        .returning();

      // Create youth profile by default
      if (newUser) {
        await db.insert(youthProfiles).values({
          userId: newUser.id,
          demographics: {},
          journeyTimeline: [],
          skillsInterests: [],
          achievements: [],
          privacyControls: {},
        });

        user = await db.query.users.findFirst({
          where: eq(users.id, newUser.id),
          with: {
            organization: true,
            youthProfile: true,
            mentor: true,
          },
        });
      }
    }

    // Update last login
    if (user) {
      await db
        .update(users)
        .set({ 
          updatedAt: new Date(),
          profile: {
            ...user.profile,
            lastLogin: new Date().toISOString(),
          }
        })
        .where(eq(users.id, user.id));
    }

    return NextResponse.json({
      id: user?.id,
      email: user?.email,
      role: user?.role,
      profile: user?.profile,
      organization: user?.organization,
      youthProfile: user?.youthProfile,
      mentor: user?.mentor,
      createdAt: user?.createdAt,
      updatedAt: user?.updatedAt,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth0Id = session.user.sub;
    const body = await req.json();

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.auth0Id, auth0Id),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user profile
    const updates: any = {};
    
    if (body.profile) {
      updates.profile = {
        ...user.profile,
        ...body.profile,
      };
    }
    
    if (body.privacySettings) {
      updates.privacySettings = {
        ...user.privacySettings,
        ...body.privacySettings,
      };
    }

    updates.updatedAt = new Date();

    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, user.id))
      .returning();

    // If updating youth profile specific fields
    if (body.youthProfile && user.role === 'youth') {
      await db
        .update(youthProfiles)
        .set({
          ...body.youthProfile,
          updatedAt: new Date(),
        })
        .where(eq(youthProfiles.userId, user.id));
    }

    // If updating mentor profile specific fields
    if (body.mentorProfile && user.role === 'mentor') {
      await db
        .update(mentors)
        .set({
          ...body.mentorProfile,
          updatedAt: new Date(),
        })
        .where(eq(mentors.userId, user.id));
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}