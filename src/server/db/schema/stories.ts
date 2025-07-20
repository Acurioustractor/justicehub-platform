import { pgTable, uuid, varchar, text, jsonb, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

// Story type enum
export const storyTypeEnum = pgEnum('story_type', [
  'reflection', 
  'milestone', 
  'challenge', 
  'achievement', 
  'goal', 
  'update'
]);

// Visibility enum
export const visibilityEnum = pgEnum('visibility', [
  'private', 
  'mentors_only', 
  'organization', 
  'public',
  'anonymous'
]);

// Source enum
export const sourceEnum = pgEnum('source', ['local', 'airtable']);

// Main stories table
export const stories = pgTable('stories', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id').references(() => organizations.id),
  airtableRecordId: varchar('airtable_record_id', { length: 255 }),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  storyType: storyTypeEnum('story_type').notNull().default('reflection'),
  visibility: visibilityEnum('visibility').notNull().default('private'),
  source: sourceEnum('source').notNull().default('local'),
  published: boolean('published').notNull().default(false),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Story tags as a separate table for better querying
export const storyTags = pgTable('story_tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  storyId: uuid('story_id').notNull().references(() => stories.id, { onDelete: 'cascade' }),
  tag: varchar('tag', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Story media 
export const storyMedia = pgTable('story_media', {
  id: uuid('id').defaultRandom().primaryKey(),
  storyId: uuid('story_id').notNull().references(() => stories.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(), // 'image', 'video', 'document'
  url: varchar('url', { length: 500 }).notNull(),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  airtableAttachmentId: varchar('airtable_attachment_id', { length: 255 }),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const storiesRelations = relations(stories, ({ one, many }) => ({
  user: one(users, {
    fields: [stories.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [stories.organizationId],
    references: [organizations.id],
  }),
  tags: many(storyTags),
  media: many(storyMedia),
}));

export const storyTagsRelations = relations(storyTags, ({ one }) => ({
  story: one(stories, {
    fields: [storyTags.storyId],
    references: [stories.id],
  }),
}));

export const storyMediaRelations = relations(storyMedia, ({ one }) => ({
  story: one(stories, {
    fields: [storyMedia.storyId],
    references: [stories.id],
  }),
}));

// Import organizations to avoid circular dependency
import { organizations } from './organizations';