import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const contractStatusEnum = pgEnum("contract_status", [
  "draft",
  "active",
  "queued",
  "processing",
  "completed",
  "failed",
  "expired",
  "terminated",
  "pending_review",
  "deleted",
]);

export const contracts = pgTable("contracts", {
  id: uuid("id").primaryKey().defaultRandom(),
  org_id: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  contract_number: text("contract_number").unique(),
  counterparty: text("counterparty").notNull(),
  status: contractStatusEnum("status").default("draft"),
  value: integer("value"), // in cents/currency units
  currency: text("currency").default("USD"),
  start_date: timestamp("start_date"),
  end_date: timestamp("end_date"),
  renewal_date: timestamp("renewal_date"),
  file_url: text("file_url"), // URL to stored contract file
  metadata: text("metadata"), // JSON for extracted contract data
  created_by: uuid("created_by"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  deleted_at: timestamp("deleted_at"), // Soft delete for orphan cleanup
});

export type Contract = typeof contracts.$inferSelect;
export type ContractInsert = typeof contracts.$inferInsert;
