import { pgTable, uuid, text, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { mentorshipRelationships } from './mentors';

export const messageTypeEnum = pgEnum('message_type', [
  'text',
  'file',
  'image',
  'video',
  'audio',
  'system'
]);

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  relationshipId: uuid('relationship_id').notNull().references(() => mentorshipRelationships.id),
  senderId: uuid('sender_id').notNull().references(() => users.id),
  
  // Message content
  type: messageTypeEnum('type').notNull().default('text'),
  content: text('content'),
  metadata: text('metadata'), // JSON string for file info, etc.
  
  // Status
  read: boolean('read').notNull().default(false),
  readAt: timestamp('read_at'),
  edited: boolean('edited').notNull().default(false),
  editedAt: timestamp('edited_at'),
  deleted: boolean('deleted').notNull().default(false),
  deletedAt: timestamp('deleted_at'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  relationship: one(mentorshipRelationships, {
    fields: [messages.relationshipId],
    references: [mentorshipRelationships.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

// Scheduled sessions
export const sessionStatusEnum = pgEnum('session_status', [
  'scheduled',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show'
]);

export const mentorshipSessions = pgTable('mentorship_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  relationshipId: uuid('relationship_id').notNull().references(() => mentorshipRelationships.id),
  
  // Session details
  title: text('title').notNull(),
  description: text('description'),
  scheduledAt: timestamp('scheduled_at').notNull(),
  duration: text('duration').notNull().default('60'), // minutes
  
  // Meeting info
  meetingType: text('meeting_type').notNull().default('video'), // video, phone, in-person
  meetingLink: text('meeting_link'),
  meetingLocation: text('meeting_location'),
  
  // Status
  status: sessionStatusEnum('status').notNull().default('scheduled'),
  confirmedByMentor: boolean('confirmed_by_mentor').notNull().default(false),
  confirmedByYouth: boolean('confirmed_by_youth').notNull().default(false),
  
  // Notes
  mentorNotes: text('mentor_notes'),
  youthNotes: text('youth_notes'),
  sessionSummary: text('session_summary'),
  
  // Reminders
  reminderSent: boolean('reminder_sent').notNull().default(false),
  reminderSentAt: timestamp('reminder_sent_at'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  cancelledAt: timestamp('cancelled_at'),
  cancelledBy: uuid('cancelled_by').references(() => users.id),
  cancellationReason: text('cancellation_reason'),
});

export const mentorshipSessionsRelations = relations(mentorshipSessions, ({ one }) => ({
  relationship: one(mentorshipRelationships, {
    fields: [mentorshipSessions.relationshipId],
    references: [mentorshipRelationships.id],
  }),
  cancelledByUser: one(users, {
    fields: [mentorshipSessions.cancelledBy],
    references: [users.id],
  }),
}));

// Session feedback
export const sessionFeedback = pgTable('session_feedback', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').notNull().references(() => mentorshipSessions.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  
  // Ratings
  overallRating: text('overall_rating').notNull(), // 1-5
  preparednessRating: text('preparedness_rating'),
  helpfulnessRating: text('helpfulness_rating'),
  communicationRating: text('communication_rating'),
  
  // Feedback
  whatWentWell: text('what_went_well'),
  whatCouldImprove: text('what_could_improve'),
  additionalComments: text('additional_comments'),
  
  // Follow-up
  wouldRecommend: boolean('would_recommend').notNull().default(true),
  followUpNeeded: boolean('follow_up_needed').notNull().default(false),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sessionFeedbackRelations = relations(sessionFeedback, ({ one }) => ({
  session: one(mentorshipSessions, {
    fields: [sessionFeedback.sessionId],
    references: [mentorshipSessions.id],
  }),
  user: one(users, {
    fields: [sessionFeedback.userId],
    references: [users.id],
  }),
}));