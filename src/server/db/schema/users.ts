import { pgTable, uuid, varchar, jsonb, timestamp, boolean, pgEnum, text } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';

export const userRoleEnum = pgEnum('user_role', ['youth', 'mentor', 'org_admin', 'platform_admin']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  name: text('name'),
  email: varchar('email', { length: 255 }).notNull().unique(),
  auth0Id: varchar('auth0_id', { length: 255 }).notNull().unique(),
  role: userRoleEnum('role').notNull().default('youth'),
  profile: jsonb('profile').notNull().default({}),
  privacySettings: jsonb('privacy_settings').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  active: boolean('active').notNull().default(true),
});

export const youthProfiles = pgTable('youth_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id).unique(),
  
  // Profile Information
  bio: text('bio'),
  interests: jsonb('interests').notNull().default([]), // Array of interests
  skills: jsonb('skills').notNull().default([]), // Array of skills
  goals: jsonb('goals').notNull().default([]), // Array of goals
  
  // Experience and Education
  experienceLevel: varchar('experience_level', { length: 50 }), // none, beginner, intermediate, advanced
  education: jsonb('education').default({}), // { level, field, school }
  
  // Availability
  availability: varchar('availability', { length: 50 }), // full-time, part-time, evenings, weekends, flexible
  
  // Location
  location: jsonb('location').default({}), // { city, state, country }
  
  // Languages
  languages: jsonb('languages').notNull().default(['English']),
  
  // Legacy fields
  demographics: jsonb('demographics').notNull().default({}),
  journeyTimeline: jsonb('journey_timeline').notNull().default([]),
  skillsInterests: jsonb('skills_interests').notNull().default([]),
  achievements: jsonb('achievements').notNull().default([]),
  privacyControls: jsonb('privacy_controls').notNull().default({}),
  
  // Status
  active: boolean('active').notNull().default(true),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
