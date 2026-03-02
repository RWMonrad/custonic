import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

// Note: auth.users reference is handled in the actual database
// For Drizzle, we'll use a simple uuid reference
const authUsers = pgTable("auth.users", {
  id: uuid("id").primaryKey(),
});

export const orgInvites = pgTable("org_invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role").notNull().$type<"member" | "admin">(),
  tokenHash: text("token_hash").notNull(),
  status: text("status")
    .notNull()
    .default("pending")
    .$type<"pending" | "accepted" | "revoked" | "expired">(),
  expiresAt: timestamp("expires_at", {
    mode: "date",
    withTimezone: true,
  }).notNull(),
  createdAt: timestamp("created_at", {
    mode: "date",
    withTimezone: true,
  }).defaultNow(),
  acceptedAt: timestamp("accepted_at", { mode: "date", withTimezone: true }),
  revokedAt: timestamp("revoked_at", { mode: "date", withTimezone: true }),
});

export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  windowStart: timestamp("window_start", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
  count: integer("count").notNull().default(1),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id),
  userId: uuid("user_id").references(() => authUsers.id),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: uuid("resource_id"),
  details: text("details").$type<string>(),
  ipAddress: text("ip_address").$type<string>(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", {
    mode: "date",
    withTimezone: true,
  }).defaultNow(),
});

export const orgInvitesRelations = relations(orgInvites, ({ one }) => ({
  organization: one(organizations, {
    fields: [orgInvites.orgId],
    references: [organizations.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [auditLogs.orgId],
    references: [organizations.id],
  }),
}));

// Types
export interface OrgInvite {
  id: string;
  orgId: string;
  email: string;
  role: "member" | "admin";
  tokenHash: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expiresAt: Date;
  createdAt: Date;
  acceptedAt?: Date;
  revokedAt?: Date;
}

export interface InviteAuditLog {
  id: string;
  orgId?: string;
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export const INVITE_ACTIONS = {
  CREATED: "INVITE_CREATED",
  ACCEPTED: "INVITE_ACCEPTED",
  REVOKED: "INVITE_REVOKED",
  EXPIRED: "INVITE_EXPIRED",
} as const;
