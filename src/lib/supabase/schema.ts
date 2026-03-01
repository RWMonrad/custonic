import { pgTable, text, timestamp, integer, uuid, pgEnum } from 'drizzle-orm/pg-core'

export const contractStatusEnum = pgEnum('contract_status', [
  'draft',
  'active', 
  'expired',
  'terminated'
])

export const roleEnum = pgEnum('role', ['admin', 'user'])

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  full_name: text('full_name'),
  avatar_url: text('avatar_url'),
  company: text('company'),
  role: roleEnum('role').default('user'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
})

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  company: text('company').notNull(),
  phone: text('phone'),
  address: text('address'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
  user_id: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
})

export const contracts = pgTable('contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  status: contractStatusEnum('status').default('draft'),
  value: integer('value'),
  start_date: timestamp('start_date'),
  end_date: timestamp('end_date'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
  client_id: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
})

export type Profile = typeof profiles.$inferSelect
export type Client = typeof clients.$inferSelect  
export type Contract = typeof contracts.$inferSelect
