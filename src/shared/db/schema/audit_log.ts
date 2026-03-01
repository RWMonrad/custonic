import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const auditActionEnum = pgEnum("audit_action", [
  "create",
  "update",
  "delete",
  "view",
  "download",
  "share",
  "login",
  "logout",
]);

export const auditResourceTypeEnum = pgEnum("audit_resource_type", [
  "contract",
  "analysis",
  "user",
  "organization",
  "alert",
  "report",
]);

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  org_id: uuid("org_id").references(() => organizations.id, {
    onDelete: "cascade",
  }),
  user_id: uuid("user_id").notNull(),
  action: auditActionEnum("action").notNull(),
  resource_type: auditResourceTypeEnum("resource_type").notNull(),
  resource_id: uuid("resource_id"),
  old_values: text("old_values"), // JSON of previous state
  new_values: text("new_values"), // JSON of new state
  ip_address: text("ip_address"),
  user_agent: text("user_agent"),
  created_at: timestamp("created_at").defaultNow(),
});

export type AuditLog = typeof auditLog.$inferSelect;
export type AuditLogInsert = typeof auditLog.$inferInsert;
