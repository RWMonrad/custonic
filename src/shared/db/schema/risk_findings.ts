import { pgTable, text, timestamp, uuid, enum as pgEnum, integer } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { contracts } from './contracts'
import { analyses } from './analyses'

export const riskSeverityEnum = pgEnum('risk_severity', [
  'low',
  'medium',
  'high',
  'critical'
])

export const riskCategoryEnum = pgEnum('risk_category', [
  'legal',
  'financial',
  'operational',
  'compliance',
  'reputational'
])

export const riskFindings = pgTable('risk_findings', {
  id: uuid('id').primaryKey().defaultRandom(),
  org_id: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  contract_id: uuid('contract_id').references(() => contracts.id, { onDelete: 'cascade' }),
  analysis_id: uuid('analysis_id').references(() => analyses.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  severity: riskSeverityEnum('severity').notNull(),
  category: riskCategoryEnum('category').notNull(),
  confidence_score: integer('confidence_score'), // 0-100
  recommendation: text('recommendation'),
  is_resolved: boolean('is_resolved').default(false),
  resolved_at: timestamp('resolved_at'),
  resolved_by: uuid('resolved_by'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
})

export type RiskFinding = typeof riskFindings.$inferSelect
export type RiskFindingInsert = typeof riskFindings.$inferInsert
