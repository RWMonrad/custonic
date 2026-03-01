import { pgTable, text, timestamp, uuid, enum as pgEnum, integer } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { contracts } from './contracts'

export const analysisStatusEnum = pgEnum('analysis_status', [
  'pending',
  'processing',
  'completed',
  'failed'
])

export const analysisTypeEnum = pgEnum('analysis_type', [
  'risk_assessment',
  'compliance_check',
  'clause_extraction',
  'sentiment_analysis'
])

export const analyses = pgTable('analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  org_id: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  contract_id: uuid('contract_id').references(() => contracts.id, { onDelete: 'cascade' }),
  type: analysisTypeEnum('type').notNull(),
  status: analysisStatusEnum('status').default('pending'),
  confidence_score: integer('confidence_score'), // 0-100
  processing_time_ms: integer('processing_time_ms'),
  ai_model_version: text('ai_model_version'),
  results: text('results'), // JSON with analysis results
  error_message: text('error_message'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
})

export type Analysis = typeof analyses.$inferSelect
export type AnalysisInsert = typeof analyses.$inferInsert
