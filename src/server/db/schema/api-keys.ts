import { pgTable, text, timestamp, jsonb, boolean, integer, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organizations';
import { users } from './users';

// API Keys for external partner access
export const apiKeys = pgTable('api_keys', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  key: text('key').notNull().unique(), // Hashed API key
  keyPrefix: text('key_prefix').notNull(), // First 8 chars for identification
  scopes: jsonb('scopes').notNull().$type<string[]>(), // ['read:stories', 'write:opportunities', etc.]
  rateLimit: integer('rate_limit').default(1000), // Requests per hour
  isActive: boolean('is_active').default(true).notNull(),
  lastUsedAt: timestamp('last_used_at'),
  lastUsedIp: text('last_used_ip'),
  expiresAt: timestamp('expires_at'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('idx_api_key_org').on(table.organizationId),
  keyIdx: index('idx_api_key').on(table.key),
  prefixIdx: index('idx_api_key_prefix').on(table.keyPrefix),
  activeIdx: index('idx_api_key_active').on(table.isActive),
}));

// API Key usage logs
export const apiKeyUsageLogs = pgTable('api_key_usage_logs', {
  id: text('id').primaryKey(),
  apiKeyId: text('api_key_id').notNull().references(() => apiKeys.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull(),
  method: text('method').notNull(),
  statusCode: integer('status_code').notNull(),
  responseTime: integer('response_time'), // in milliseconds
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  requestBody: jsonb('request_body'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  apiKeyIdx: index('idx_usage_api_key').on(table.apiKeyId),
  createdIdx: index('idx_usage_created').on(table.createdAt),
}));

// Webhook configurations for partners
export const webhooks = pgTable('webhooks', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  url: text('url').notNull(),
  events: jsonb('events').notNull().$type<string[]>(), // ['story.created', 'opportunity.matched', etc.]
  headers: jsonb('headers'), // Custom headers to include
  secret: text('secret').notNull(), // For webhook signature validation
  isActive: boolean('is_active').default(true).notNull(),
  lastTriggeredAt: timestamp('last_triggered_at'),
  failureCount: integer('failure_count').default(0),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('idx_webhook_org').on(table.organizationId),
  activeIdx: index('idx_webhook_active').on(table.isActive),
}));

// Webhook delivery logs
export const webhookDeliveries = pgTable('webhook_deliveries', {
  id: text('id').primaryKey(),
  webhookId: text('webhook_id').notNull().references(() => webhooks.id, { onDelete: 'cascade' }),
  event: text('event').notNull(),
  payload: jsonb('payload').notNull(),
  response: jsonb('response'),
  statusCode: integer('status_code'),
  attemptCount: integer('attempt_count').default(1),
  deliveredAt: timestamp('delivered_at'),
  nextRetryAt: timestamp('next_retry_at'),
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  webhookIdx: index('idx_delivery_webhook').on(table.webhookId),
  createdIdx: index('idx_delivery_created').on(table.createdAt),
  retryIdx: index('idx_delivery_retry').on(table.nextRetryAt),
}));

// Relations
export const apiKeysRelations = relations(apiKeys, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [apiKeys.organizationId],
    references: [organizations.id],
  }),
  createdByUser: one(users, {
    fields: [apiKeys.createdBy],
    references: [users.id],
  }),
  usageLogs: many(apiKeyUsageLogs),
}));

export const apiKeyUsageLogsRelations = relations(apiKeyUsageLogs, ({ one }) => ({
  apiKey: one(apiKeys, {
    fields: [apiKeyUsageLogs.apiKeyId],
    references: [apiKeys.id],
  }),
}));

export const webhooksRelations = relations(webhooks, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [webhooks.organizationId],
    references: [organizations.id],
  }),
  createdByUser: one(users, {
    fields: [webhooks.createdBy],
    references: [users.id],
  }),
  deliveries: many(webhookDeliveries),
}));

export const webhookDeliveriesRelations = relations(webhookDeliveries, ({ one }) => ({
  webhook: one(webhooks, {
    fields: [webhookDeliveries.webhookId],
    references: [webhooks.id],
  }),
}));

// Available scopes for API access
export const API_SCOPES = {
  // Read scopes
  'read:stories': 'Read stories',
  'read:opportunities': 'Read opportunities',
  'read:organizations': 'Read organization info',
  'read:users': 'Read user profiles',
  'read:mentors': 'Read mentor profiles',
  'read:matches': 'Read opportunity matches',
  
  // Write scopes
  'write:stories': 'Create and update stories',
  'write:opportunities': 'Create and update opportunities',
  'write:applications': 'Submit applications',
  'write:messages': 'Send messages',
  
  // Admin scopes
  'admin:users': 'Manage users',
  'admin:organizations': 'Manage organizations',
} as const;

export type ApiScope = keyof typeof API_SCOPES;

// Webhook events
export const WEBHOOK_EVENTS = {
  // Story events
  'story.created': 'Story created',
  'story.updated': 'Story updated',
  'story.deleted': 'Story deleted',
  
  // Opportunity events
  'opportunity.created': 'Opportunity created',
  'opportunity.updated': 'Opportunity updated',
  'opportunity.matched': 'Opportunity matched to user',
  'opportunity.expired': 'Opportunity expired',
  
  // Application events
  'application.submitted': 'Application submitted',
  'application.reviewed': 'Application reviewed',
  'application.accepted': 'Application accepted',
  'application.rejected': 'Application rejected',
  
  // User events
  'user.created': 'User created',
  'user.updated': 'User profile updated',
  'user.deactivated': 'User deactivated',
  
  // Organization events
  'organization.member.added': 'Member added to organization',
  'organization.member.removed': 'Member removed from organization',
} as const;

export type WebhookEvent = keyof typeof WEBHOOK_EVENTS;

// Types
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type ApiKeyUsageLog = typeof apiKeyUsageLogs.$inferSelect;
export type NewApiKeyUsageLog = typeof apiKeyUsageLogs.$inferInsert;
export type Webhook = typeof webhooks.$inferSelect;
export type NewWebhook = typeof webhooks.$inferInsert;
export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type NewWebhookDelivery = typeof webhookDeliveries.$inferInsert;