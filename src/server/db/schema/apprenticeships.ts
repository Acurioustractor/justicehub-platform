import { pgTable, uuid, jsonb, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { youthProfiles } from './users';
import { organizations } from './organizations';

export const apprenticeshipStatusEnum = pgEnum('apprenticeship_status', [
  'pending', 
  'active', 
  'completed', 
  'terminated', 
  'on_hold'
]);

export const apprenticeships = pgTable('apprenticeships', {
  id: uuid('id').defaultRandom().primaryKey(),
  youthProfileId: uuid('youth_profile_id').notNull().references(() => youthProfiles.id),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  status: apprenticeshipStatusEnum('status').notNull().default('pending'),
  contractDetails: jsonb('contract_details').notNull().default({}),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const apprenticeshipsRelations = relations(apprenticeships, ({ one }) => ({
  youthProfile: one(youthProfiles, {
    fields: [apprenticeships.youthProfileId],
    references: [youthProfiles.id],
  }),
  organization: one(organizations, {
    fields: [apprenticeships.organizationId],
    references: [organizations.id],
  }),
}));