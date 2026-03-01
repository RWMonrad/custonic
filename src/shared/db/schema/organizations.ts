import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core'

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  domain: text('domain').unique(),
  logo_url: text('logo_url'),
  settings: text('settings'), // JSON string for flexible settings
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
})

export type Organization = typeof organizations.$inferSelect
export type OrganizationInsert = typeof organizations.$inferInsert
