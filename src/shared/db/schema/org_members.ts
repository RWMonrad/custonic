import { pgTable, text, timestamp, uuid, boolean, enum as pgEnum } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { users } from './users'

export const memberRoleEnum = pgEnum('member_role', ['owner', 'admin', 'member', 'viewer'])

export const orgMembers = pgTable('org_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  org_id: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: memberRoleEnum('role').default('member'),
  is_active: boolean('is_active').default(true),
  invited_by: uuid('invited_by').references(() => users.id),
  joined_at: timestamp('joined_at').defaultNow(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
})

export type OrgMember = typeof orgMembers.$inferSelect
export type OrgMemberInsert = typeof orgMembers.$inferInsert
