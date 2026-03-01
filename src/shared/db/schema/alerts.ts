import { pgTable, text, timestamp, uuid, enum as pgEnum, boolean } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { contracts } from './contracts'
import { riskFindings } from './risk_findings'

export const alertTypeEnum = pgEnum('alert_type', [
  'contract_expiry',
  'risk_detected',
  'compliance_issue',
  'renewal_required',
  'value_change'
])

export const alertStatusEnum = pgEnum('alert_status', [
  'active',
  'acknowledged',
  'resolved',
  'dismissed'
])

export const alerts = pgTable('alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  org_id: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  contract_id: uuid('contract_id').references(() => contracts.id, { onDelete: 'cascade' }),
  risk_finding_id: uuid('risk_finding_id').references(() => riskFindings.id, { onDelete: 'cascade' }),
  type: alertTypeEnum('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  status: alertStatusEnum('status').default('active'),
  priority: enum('priority', ['low', 'medium', 'high', 'urgent']).default('medium'),
  is_read: boolean('is_read').default(false),
  triggered_at: timestamp('triggered_at').defaultNow(),
  acknowledged_at: timestamp('acknowledged_at'),
  acknowledged_by: uuid('acknowledged_by'),
  resolved_at: timestamp('resolved_at'),
  resolved_by: uuid('resolved_by'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
})

export type Alert = typeof alerts.$inferSelect
export type AlertInsert = typeof alerts.$inferInsert
