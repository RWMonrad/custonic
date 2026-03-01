import { pgTable, text, timestamp, uuid, vector } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { contracts } from './contracts'

// For pgvector integration - requires pgvector extension
export const contractEmbeddings = pgTable('contract_embeddings', {
  id: uuid('id').primaryKey().defaultRandom(),
  org_id: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  contract_id: uuid('contract_id').notNull().references(() => contracts.id, { onDelete: 'cascade' }),
  chunk_text: text('chunk_text').notNull(),
  chunk_index: integer('chunk_index').notNull(),
  embedding: vector('embedding', { dimensions: 1536 }), // OpenAI ada-002 dimensions
  metadata: text('metadata'), // JSON for chunk metadata
  created_at: timestamp('created_at').defaultNow(),
})

export type ContractEmbedding = typeof contractEmbeddings.$inferSelect
export type ContractEmbeddingInsert = typeof contractEmbeddings.$inferInsert
