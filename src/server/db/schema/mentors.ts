import { pgTable, uuid, jsonb, timestamp, pgEnum, text, integer, decimal, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, youthProfiles } from './users';
import { organizations } from './organizations';

export const mentorStatusEnum = pgEnum('mentor_status', [
  'pending', 
  'approved', 
  'active', 
  'inactive', 
  'suspended'
]);

export const mentors = pgTable('mentors', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id).unique(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  
  // Profile Information
  title: text('title'),
  bio: text('bio'),
  longBio: text('long_bio'),
  profileImage: text('profile_image'),
  
  // Skills and Expertise
  expertise: jsonb('expertise').notNull().default([]), // Array of expertise areas
  skills: jsonb('skills').notNull().default([]), // Array of specific skills
  focusAreas: jsonb('focus_areas').notNull().default([]), // Array of focus areas
  experience: text('experience'), // e.g., "10+ years"
  
  // Education and Certifications
  education: jsonb('education').notNull().default([]), // Array of education objects
  certifications: jsonb('certifications').notNull().default([]), // Array of certification names
  
  // Availability
  availability: jsonb('availability').notNull().default({
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
  }),
  
  // Capacity and Stats
  currentMentees: integer('current_mentees').notNull().default(0),
  maxMentees: integer('max_mentees').notNull().default(5),
  totalMentees: integer('total_mentees').notNull().default(0),
  successStories: integer('success_stories').notNull().default(0),
  
  // Rating and Reviews
  averageRating: decimal('average_rating', { precision: 2, scale: 1 }).default('0.0'),
  reviewCount: integer('review_count').notNull().default(0),
  
  // Communication
  languages: jsonb('languages').notNull().default(['English']),
  mentorshipStyle: text('mentorship_style'),
  responseTime: text('response_time'), // e.g., "Within 24 hours"
  acceptanceRate: integer('acceptance_rate').default(100), // Percentage
  
  // Social Links
  socialLinks: jsonb('social_links').default({}), // { linkedin: '', twitter: '', website: '' }
  
  // Status and Verification
  status: mentorStatusEnum('status').notNull().default('pending'),
  verified: boolean('verified').notNull().default(false),
  backgroundCheck: jsonb('background_check').default({}),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const mentorshipStatusEnum = pgEnum('mentorship_status', [
  'pending', 
  'active', 
  'completed', 
  'cancelled'
]);

export const mentorshipRelationships = pgTable('mentorship_relationships', {
  id: uuid('id').defaultRandom().primaryKey(),
  mentorId: uuid('mentor_id').notNull().references(() => mentors.id),
  youthProfileId: uuid('youth_profile_id').notNull().references(() => youthProfiles.id),
  
  // Status and Lifecycle
  status: mentorshipStatusEnum('status').notNull().default('pending'),
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  respondedAt: timestamp('responded_at'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  lastContactDate: timestamp('last_contact_date'),
  
  // Relationship Details
  requestMessage: text('request_message'),
  responseMessage: text('response_message'),
  goals: jsonb('goals').notNull().default([]),
  meetingFrequency: text('meeting_frequency'),
  communicationPreference: jsonb('communication_preference'),
  notes: text('notes'),
  milestones: jsonb('milestones').default([]),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Mentor Reviews
export const mentorReviews = pgTable('mentor_reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  mentorId: uuid('mentor_id').notNull().references(() => mentors.id),
  reviewerId: uuid('reviewer_id').notNull().references(() => users.id),
  relationshipId: uuid('relationship_id').references(() => mentorshipRelationships.id),
  
  rating: integer('rating').notNull(), // 1-5
  title: text('title'),
  content: text('content').notNull(),
  
  // Review aspects
  aspects: jsonb('aspects').default({}), // { communication: 5, knowledge: 5, supportiveness: 5 }
  
  verified: boolean('verified').notNull().default(false), // If reviewer had actual mentorship
  helpful: integer('helpful').notNull().default(0), // Count of helpful votes
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});