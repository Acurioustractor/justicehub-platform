import { db } from './index';
import { organizations, users, youthProfiles, stories, mentors, opportunities } from './schema';
import * as dotenv from 'dotenv';
import { userRoleEnum } from './schema/users';
import { mentorStatusEnum } from './schema/mentors';
import { storyTypeEnum, visibilityEnum } from './schema/stories';
import { opportunityTypeEnum } from './schema/opportunities';

dotenv.config({ path: '.env.local' });

async function seed() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create test organization
    const [testOrg] = await db.insert(organizations).values({
      name: 'Youth Empowerment Foundation',
      type: 'non-profit',
      contactInfo: {
        email: 'info@yef.org',
        phone: '+1 (555) 123-4567',
        address: '123 Main St, Anytown, USA',
      },
      settings: {
        features: ['stories', 'mentorship', 'opportunities'],
        maxUsers: 100,
      },
      airtableConfig: {
        baseId: process.env.AIRTABLE_BASE_ID || '',
        syncEnabled: true,
      },
    }).returning();

    console.log('✅ Created organization:', testOrg.name);

    // Create test users
    const [adminUser] = await db.insert(users).values({
      organizationId: testOrg.id,
      email: 'admin@justicehub.org',
      auth0Id: 'auth0|admin123',
      role: 'platform_admin',
      profile: {
        name: 'Platform Admin',
        picture: 'https://ui-avatars.com/api/?name=Platform+Admin',
      },
      privacySettings: {
        shareStories: true,
        allowMentorContact: true,
        showProfile: true,
      },
    }).returning();

    const [mentorUser] = await db.insert(users).values({
      organizationId: testOrg.id,
      email: 'mentor@justicehub.org',
      auth0Id: 'auth0|mentor123',
      role: 'mentor',
      profile: {
        name: 'Sarah Johnson',
        picture: 'https://ui-avatars.com/api/?name=Sarah+Johnson',
        bio: 'Experienced youth counselor with 10 years in community development.',
      },
      privacySettings: {
        shareStories: true,
        allowMentorContact: true,
        showProfile: true,
      },
    }).returning();

    const [youthUser] = await db.insert(users).values({
      organizationId: testOrg.id,
      email: 'youth@justicehub.org',
      auth0Id: 'auth0|youth123',
      role: 'youth',
      profile: {
        name: 'Alex Rivera',
        picture: 'https://ui-avatars.com/api/?name=Alex+Rivera',
      },
      privacySettings: {
        shareStories: true,
        allowMentorContact: true,
        showProfile: true,
      },
    }).returning();

    console.log('✅ Created users');

    // Create youth profile
    const [youthProfile] = await db.insert(youthProfiles).values({
      userId: youthUser.id,
      demographics: {
        age: 19,
        location: 'New York, NY',
        education: 'High School',
      },
      journeyTimeline: [
        {
          date: '2023-01-15',
          event: 'Joined JusticeHub',
          type: 'milestone',
        },
        {
          date: '2023-03-20',
          event: 'Completed first mentorship session',
          type: 'achievement',
        },
      ],
      skillsInterests: ['writing', 'technology', 'community service'],
      achievements: [
        {
          title: 'Story of the Month',
          date: '2023-06-01',
          description: 'Selected for inspiring story about overcoming challenges',
        },
      ],
      privacyControls: {
        showAge: true,
        showLocation: true,
        showEducation: true,
      },
    }).returning();

    console.log('✅ Created youth profile');

    // Create mentor profile
    const [mentorProfile] = await db.insert(mentors).values({
      userId: mentorUser.id,
      skills: ['career counseling', 'life skills', 'academic support', 'job readiness'],
      availability: {
        days: ['monday', 'wednesday', 'friday'],
        hours: '9:00 AM - 5:00 PM',
        preferredMeetingType: 'video',
      },
      status: 'approved',
      backgroundCheck: {
        completed: true,
        date: '2023-01-10',
        expiresAt: '2025-01-10',
      },
    }).returning();

    console.log('✅ Created mentor profile');

    // Create sample stories
    const storySamples = [
      {
        youthProfileId: youthProfile.id,
        title: 'My Journey to Tech',
        content: 'Growing up, I never imagined I would be interested in technology. But when I got my first computer...',
        storyType: 'reflection' as const,
        visibility: 'public' as const,
        tags: ['technology', 'growth', 'career'],
        published: true,
        metadata: {
          wordCount: 450,
          readingTime: 2,
          themes: ['perseverance', 'discovery', 'ambition'],
        },
      },
      {
        youthProfileId: youthProfile.id,
        title: 'Finding My Voice',
        content: 'Speaking up has always been difficult for me. In my family, children were meant to be seen, not heard...',
        storyType: 'challenge' as const,
        visibility: 'mentors_only' as const,
        tags: ['personal growth', 'family', 'communication'],
        published: true,
        metadata: {
          wordCount: 320,
          readingTime: 2,
          themes: ['courage', 'self-expression', 'family dynamics'],
        },
      },
      {
        youthProfileId: youthProfile.id,
        title: 'First Day at My Internship',
        content: 'Today marked a huge milestone - my first day as a web development intern! The office was buzzing with energy...',
        storyType: 'milestone' as const,
        visibility: 'public' as const,
        tags: ['internship', 'web development', 'new beginnings'],
        published: true,
        metadata: {
          wordCount: 280,
          readingTime: 1,
          themes: ['opportunity', 'growth', 'excitement'],
        },
      },
    ];

    const createdStories = await db.insert(stories).values(storySamples).returning();
    console.log(`✅ Created ${createdStories.length} stories`);

    // Create sample opportunities
    const opportunitySamples = [
      {
        organizationId: testOrg.id,
        createdBy: adminUser.id,
        slug: 'web-development-internship',
        title: 'Web Development Internship',
        description: 'Join our team as a web development intern and gain hands-on experience building real applications.',
        type: 'internship' as const,
        requirements: {
          skills: ['HTML', 'CSS', 'JavaScript basics'],
          education: 'High school or equivalent',
          availability: 'Part-time, 20 hours/week',
        },
        location: {
          type: 'hybrid',
          city: 'New York',
          state: 'NY',
        },
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
      {
        organizationId: testOrg.id,
        createdBy: adminUser.id,
        slug: 'youth-leadership-workshop',
        title: 'Youth Leadership Workshop',
        description: 'Develop your leadership skills in this intensive 2-day workshop designed for emerging young leaders.',
        type: 'workshop' as const,
        requirements: {
          age: '16-24',
          commitment: '2 full days',
        },
        location: {
          type: 'in-person',
          city: 'Brooklyn',
          state: 'NY',
          address: 'Brooklyn Community Center',
        },
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      },
      {
        organizationId: testOrg.id,
        createdBy: adminUser.id,
        slug: 'retail-sales-associate',
        title: 'Retail Sales Associate',
        description: 'Entry-level position at a local retail store. Great opportunity to develop customer service skills.',
        type: 'job' as const,
        requirements: {
          skills: ['customer service', 'communication'],
          availability: 'Full-time or part-time',
          age: '18+',
        },
        location: {
          type: 'in-person',
          city: 'Manhattan',
          state: 'NY',
        },
        expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
      },
    ];

    const createdOpportunities = await db.insert(opportunities).values(opportunitySamples).returning();
    console.log(`✅ Created ${createdOpportunities.length} opportunities`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\nTest accounts created:');
    console.log('- Admin: admin@justicehub.org');
    console.log('- Mentor: mentor@justicehub.org');
    console.log('- Youth: youth@justicehub.org');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run the seed function
seed().catch((error) => {
  console.error('Fatal error during seeding:', error);
  process.exit(1);
});