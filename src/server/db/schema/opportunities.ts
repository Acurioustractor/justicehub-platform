import { pgTable, uuid, varchar, text, jsonb, timestamp, boolean, pgEnum, real, integer, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organizations';
import { youthProfiles, users } from './users';

export const opportunityTypeEnum = pgEnum('opportunity_type', [
  'job', 
  'internship', 
  'apprenticeship', 
  'volunteer', 
  'education', 
  'workshop',
  'mentorship',
  'scholarship',
  'program'
]);

export const opportunityStatusEnum = pgEnum('opportunity_status', [
  'draft',
  'pending_approval',
  'active',
  'paused',
  'filled',
  'expired',
  'cancelled'
]);

export const opportunities = pgTable('opportunities', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  
  // Basic Information
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description').notNull(),
  shortDescription: text('short_description'),
  type: opportunityTypeEnum('type').notNull(),
  status: opportunityStatusEnum('status').notNull().default('draft'),
  
  // Details
  requirements: jsonb('requirements').notNull().default([]), // Array of requirement strings
  qualifications: jsonb('qualifications').notNull().default([]), // Array of qualification strings
  responsibilities: jsonb('responsibilities').notNull().default([]), // Array of responsibility strings
  benefits: jsonb('benefits').notNull().default([]), // Array of benefit strings
  skills: jsonb('skills').notNull().default([]), // Array of required skills
  tags: jsonb('tags').notNull().default([]), // Array of tags for categorization
  
  // Location
  location: jsonb('location').notNull().default({
    type: 'remote', // remote, onsite, hybrid
    city: null,
    state: null,
    country: null,
    address: null,
    coordinates: null
  }),
  
  // Duration and Schedule
  duration: jsonb('duration').default({
    type: 'fixed', // fixed, ongoing, flexible
    length: null, // in weeks/months
    unit: null, // weeks, months, years
    hoursPerWeek: null,
    schedule: null // full-time, part-time, flexible
  }),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  
  // Application
  applicationDeadline: timestamp('application_deadline'),
  applicationUrl: text('application_url'),
  applicationEmail: varchar('application_email', { length: 255 }),
  applicationInstructions: text('application_instructions'),
  
  // Compensation
  compensation: jsonb('compensation').default({
    type: 'unpaid', // paid, unpaid, stipend
    amount: null,
    currency: 'USD',
    frequency: null // hourly, weekly, monthly, one-time
  }),
  
  // Capacity
  spots: integer('spots').notNull().default(1),
  spotsAvailable: integer('spots_available').notNull().default(1),
  
  // Eligibility
  minAge: integer('min_age'),
  maxAge: integer('max_age'),
  eligibilityCriteria: jsonb('eligibility_criteria').notNull().default([]),
  
  // Visibility
  featured: boolean('featured').notNull().default(false),
  priority: integer('priority').notNull().default(0),
  
  // Contact
  contactName: varchar('contact_name', { length: 255 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 50 }),
  
  // Media
  coverImage: text('cover_image'),
  images: jsonb('images').notNull().default([]),
  documents: jsonb('documents').notNull().default([]),
  
  // Analytics
  viewCount: integer('view_count').notNull().default(0),
  applicationCount: integer('application_count').notNull().default(0),
  shareCount: integer('share_count').notNull().default(0),
  
  // Timestamps
  publishedAt: timestamp('published_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const opportunitiesRelations = relations(opportunities, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [opportunities.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [opportunities.createdBy],
    references: [users.id],
  }),
  matches: many(opportunityMatches),
  applications: many(opportunityApplications),
  savedBy: many(savedOpportunities),
}));

export const applicationStatusEnum = pgEnum('application_status', [
  'draft',
  'submitted',
  'under_review',
  'interviewed',
  'accepted',
  'rejected',
  'withdrawn',
  'waitlisted'
]);

// Opportunity Applications
export const opportunityApplications = pgTable('opportunity_applications', {
  id: uuid('id').defaultRandom().primaryKey(),
  opportunityId: uuid('opportunity_id').notNull().references(() => opportunities.id),
  applicantId: uuid('applicant_id').notNull().references(() => users.id),
  youthProfileId: uuid('youth_profile_id').references(() => youthProfiles.id),
  
  // Application Data
  status: applicationStatusEnum('status').notNull().default('draft'),
  coverLetter: text('cover_letter'),
  resume: text('resume_url'),
  portfolio: text('portfolio_url'),
  customResponses: jsonb('custom_responses').notNull().default({}), // Answers to custom questions
  
  // References
  references: jsonb('references').notNull().default([]),
  
  // Internal Notes
  internalNotes: text('internal_notes'),
  reviewerNotes: jsonb('reviewer_notes').notNull().default([]),
  
  // Scoring
  score: decimal('score', { precision: 5, scale: 2 }),
  scoreBreakdown: jsonb('score_breakdown').default({}),
  
  // Timeline
  submittedAt: timestamp('submitted_at'),
  reviewedAt: timestamp('reviewed_at'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  interviewedAt: timestamp('interviewed_at'),
  decidedAt: timestamp('decided_at'),
  
  // Metadata
  source: varchar('source', { length: 50 }), // direct, referral, search, etc.
  referredBy: uuid('referred_by').references(() => users.id),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const opportunityApplicationsRelations = relations(opportunityApplications, ({ one }) => ({
  opportunity: one(opportunities, {
    fields: [opportunityApplications.opportunityId],
    references: [opportunities.id],
  }),
  applicant: one(users, {
    fields: [opportunityApplications.applicantId],
    references: [users.id],
  }),
  youthProfile: one(youthProfiles, {
    fields: [opportunityApplications.youthProfileId],
    references: [youthProfiles.id],
  }),
  reviewer: one(users, {
    fields: [opportunityApplications.reviewedBy],
    references: [users.id],
  }),
  referrer: one(users, {
    fields: [opportunityApplications.referredBy],
    references: [users.id],
  }),
}));

// Saved Opportunities
export const savedOpportunities = pgTable('saved_opportunities', {
  id: uuid('id').defaultRandom().primaryKey(),
  opportunityId: uuid('opportunity_id').notNull().references(() => opportunities.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  savedAt: timestamp('saved_at').defaultNow().notNull(),
  notes: text('notes'),
});

export const savedOpportunitiesRelations = relations(savedOpportunities, ({ one }) => ({
  opportunity: one(opportunities, {
    fields: [savedOpportunities.opportunityId],
    references: [opportunities.id],
  }),
  user: one(users, {
    fields: [savedOpportunities.userId],
    references: [users.id],
  }),
}));

// Opportunity Matches (AI-generated suggestions)
export const opportunityMatches = pgTable('opportunity_matches', {
  id: uuid('id').defaultRandom().primaryKey(),
  opportunityId: uuid('opportunity_id').notNull().references(() => opportunities.id),
  youthProfileId: uuid('youth_profile_id').notNull().references(() => youthProfiles.id),
  
  // Match Details
  matchScore: real('match_score').notNull().default(0),
  matchReasons: jsonb('match_reasons').notNull().default([]),
  matchFactors: jsonb('match_factors').default({}), // skills: 0.8, location: 0.9, etc.
  
  // User Interaction
  viewedAt: timestamp('viewed_at'),
  dismissed: boolean('dismissed').notNull().default(false),
  dismissedAt: timestamp('dismissed_at'),
  dismissReason: text('dismiss_reason'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const opportunityMatchesRelations = relations(opportunityMatches, ({ one }) => ({
  opportunity: one(opportunities, {
    fields: [opportunityMatches.opportunityId],
    references: [opportunities.id],
  }),
  youthProfile: one(youthProfiles, {
    fields: [opportunityMatches.youthProfileId],
    references: [youthProfiles.id],
  }),
}));