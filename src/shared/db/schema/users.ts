import { pgTable, text, timestamp, uuid, boolean, enum as pgEnum } from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['admin', 'member', 'viewer'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  full_name: text('full_name'),
  avatar_url: text('avatar_url'),
  role: userRoleEnum('role').default('member'),
  is_active: boolean('is_active').default(true),
  email_verified: boolean('email_verified').default(false),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
})

export type User = typeof users.$inferSelect
export type UserInsert = typeof users.$inferInsert
