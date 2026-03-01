import { pgTable, text, timestamp, uuid, boolean, enum as pgEnum } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'

export const regulationTypeEnum = pgEnum('regulation_type', [
  'gdpr',
  'sox',
  'hipaa',
  'iso27001',
  'custom'
])

export const regulationRules = pgTable('regulation_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  org_id: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull(),
  type: regulationTypeEnum('type').notNull(),
  jurisdiction: text('jurisdiction'), // e.g., 'EU', 'US', 'Global'
  keywords: text('keywords'), // JSON array of keywords
  patterns: text('patterns'), // JSON array of regex patterns
  is_active: boolean('is_active').default(true),
  created_by: uuid('created_by'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
})

export type RegulationRule = typeof regulationRules.$inferSelect
export type RegulationRuleInsert = typeof regulationRules.$inferInsert
