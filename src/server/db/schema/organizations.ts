import { pgTable, uuid, varchar, jsonb, timestamp, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 100 }).notNull(),
  contactInfo: jsonb('contact_info').notNull().default({}),
  settings: jsonb('settings').notNull().default({}),
  airtableConfig: jsonb('airtable_config').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  active: boolean('active').notNull().default(true),
});

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
}));