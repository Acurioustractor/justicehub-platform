import { pgTable, text, timestamp, jsonb, boolean, unique, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { organizations } from './organizations';

// Organization membership roles
export const organizationRoles = ['owner', 'admin', 'member', 'viewer'] as const;
export type OrganizationRole = typeof organizationRoles[number];

// Organization members table (many-to-many relationship)
export const organizationMembers = pgTable('organization_members', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull().$type<OrganizationRole>().default('member'),
  permissions: jsonb('permissions'), // Custom permissions override
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  invitedAt: timestamp('invited_at'),
  invitedBy: text('invited_by').references(() => users.id),
  isActive: boolean('is_active').default(true).notNull(),
  isPrimary: boolean('is_primary').default(false).notNull(), // Primary organization for the user
  metadata: jsonb('metadata'), // Additional member-specific data
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  uniqueMember: unique().on(table.organizationId, table.userId),
  userIdx: index('idx_org_member_user').on(table.userId),
  orgIdx: index('idx_org_member_org').on(table.organizationId),
  activeIdx: index('idx_org_member_active').on(table.isActive),
}));

// Organization invitations table
export const organizationInvitations = pgTable('organization_invitations', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role').notNull().$type<OrganizationRole>().default('member'),
  invitedBy: text('invited_by').notNull().references(() => users.id),
  token: text('token').notNull().unique(),
  message: text('message'), // Optional invitation message
  expiresAt: timestamp('expires_at').notNull(),
  acceptedAt: timestamp('accepted_at'),
  acceptedBy: text('accepted_by').references(() => users.id),
  rejectedAt: timestamp('rejected_at'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('idx_org_invitation_org').on(table.organizationId),
  emailIdx: index('idx_org_invitation_email').on(table.email),
  tokenIdx: index('idx_org_invitation_token').on(table.token),
}));

// Organization activity log
export const organizationActivityLog = pgTable('organization_activity_log', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(), // 'member_added', 'member_removed', 'role_changed', etc.
  targetType: text('target_type'), // 'user', 'setting', 'invitation', etc.
  targetId: text('target_id'),
  details: jsonb('details'), // Action-specific details
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('idx_org_activity_org').on(table.organizationId),
  userIdx: index('idx_org_activity_user').on(table.userId),
  createdIdx: index('idx_org_activity_created').on(table.createdAt),
}));

// Relations
export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationMembers.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [organizationMembers.userId],
    references: [users.id],
  }),
  invitedByUser: one(users, {
    fields: [organizationMembers.invitedBy],
    references: [users.id],
  }),
}));

export const organizationInvitationsRelations = relations(organizationInvitations, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationInvitations.organizationId],
    references: [organizations.id],
  }),
  invitedByUser: one(users, {
    fields: [organizationInvitations.invitedBy],
    references: [users.id],
  }),
  acceptedByUser: one(users, {
    fields: [organizationInvitations.acceptedBy],
    references: [users.id],
  }),
}));

export const organizationActivityLogRelations = relations(organizationActivityLog, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationActivityLog.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [organizationActivityLog.userId],
    references: [users.id],
  }),
}));

// Update organizations relations
export const organizationsRelationsExtended = relations(organizations, ({ many }) => ({
  members: many(organizationMembers),
  invitations: many(organizationInvitations),
  activityLogs: many(organizationActivityLog),
}));

// Update users relations
export const usersRelationsExtended = relations(users, ({ many }) => ({
  organizationMemberships: many(organizationMembers),
  sentInvitations: many(organizationInvitations),
}));

// Types
export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type NewOrganizationMember = typeof organizationMembers.$inferInsert;
export type OrganizationInvitation = typeof organizationInvitations.$inferSelect;
export type NewOrganizationInvitation = typeof organizationInvitations.$inferInsert;
export type OrganizationActivityLog = typeof organizationActivityLog.$inferSelect;
export type NewOrganizationActivityLog = typeof organizationActivityLog.$inferInsert;