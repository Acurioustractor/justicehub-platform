import { pgTable, text, timestamp, jsonb, integer, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { stories } from './stories';

// Content embeddings table for semantic search
export const contentEmbeddings = pgTable('content_embeddings', {
  id: text('id').primaryKey(), // Same as story/opportunity ID
  contentType: text('content_type').notNull(), // 'story', 'opportunity', 'profile'
  contentId: text('content_id').notNull(),
  embedding: text('embedding').notNull(), // JSON encoded vector data
  embeddingModel: text('embedding_model').notNull().default('text-embedding-3-small'),
  content: text('content').notNull(), // Original content for reference
  metadata: jsonb('metadata'), // Additional metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  contentTypeIdx: index('idx_content_type').on(table.contentType),
  contentIdIdx: index('idx_content_id').on(table.contentId),
  embeddingIdx: index('idx_embedding').on(table.embedding),
}));

// Search queries table for analytics and learning
export const searchQueries = pgTable('search_queries', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  query: text('query').notNull(),
  enhancedQuery: text('enhanced_query'),
  results: jsonb('results'), // Array of result IDs and scores
  clickedResults: jsonb('clicked_results'), // Array of clicked result IDs
  filters: jsonb('filters'),
  intent: text('intent'), // 'story', 'opportunity', 'mentor', 'general'
  responseTime: integer('response_time'), // in milliseconds
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// AI-generated content insights
export const contentInsights = pgTable('content_insights', {
  id: text('id').primaryKey(),
  contentType: text('content_type').notNull(),
  contentId: text('content_id').notNull(),
  summary: text('summary'),
  tags: jsonb('tags'), // AI-generated tags
  themes: jsonb('themes'), // Extracted themes
  sentiment: text('sentiment'), // 'positive', 'neutral', 'negative', 'mixed'
  keyInsights: jsonb('key_insights'), // Array of key insights
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  contentIdx: index('idx_content_insights').on(table.contentType, table.contentId),
}));

// Relations
export const contentEmbeddingsRelations = relations(contentEmbeddings, ({ one }) => ({
  story: one(stories, {
    fields: [contentEmbeddings.contentId],
    references: [stories.id],
  }),
}));

export const searchQueriesRelations = relations(searchQueries, ({ one }) => ({
  user: one(stories, {
    fields: [searchQueries.userId],
    references: [stories.userId],
  }),
}));

// Types
export type ContentEmbedding = typeof contentEmbeddings.$inferSelect;
export type NewContentEmbedding = typeof contentEmbeddings.$inferInsert;
export type SearchQuery = typeof searchQueries.$inferSelect;
export type NewSearchQuery = typeof searchQueries.$inferInsert;
export type ContentInsight = typeof contentInsights.$inferSelect;
export type NewContentInsight = typeof contentInsights.$inferInsert;