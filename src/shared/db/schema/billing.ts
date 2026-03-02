import {
    bigint,
    boolean,
    integer,
    jsonb,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";

// Enums
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "trialing",
  "past_due",
  "canceled",
]);

export const ledgerEventTypeEnum = pgEnum("ledger_event_type", [
  "CONTRACT_UPLOADED",
  "ANALYSIS_QUEUED",
  "ANALYSIS_COMPLETED",
  "ANALYSIS_FAILED",
  "SIGNED_DOWNLOAD",
]);

// Organization Plans
export const orgPlans = pgTable("org_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").unique().notNull(),
  name: text("name").notNull(),
  monthlyPriceCents: integer("monthly_price_cents").default(0).notNull(),
  includedAnalyses: integer("included_analyses").default(0).notNull(),
  includedContracts: integer("included_contracts").default(0).notNull(),
  maxFileSizeBytes: bigint("max_file_size_bytes", { mode: "bigint" })
    .default(BigInt(0))
    .notNull(),
  maxQueueDepth: integer("max_queue_depth").default(0).notNull(),
  aiProviderAllowed: text("ai_provider_allowed").array().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Organization Subscriptions
export const orgSubscriptions = pgTable("org_subscriptions", {
  orgId: uuid("org_id")
    .primaryKey()
    .references(() => organizations.id, { onDelete: "cascade" }),
  planKey: text("plan_key")
    .notNull()
    .references(() => orgPlans.key),
  status: subscriptionStatusEnum("status").notNull(),
  currentPeriodStart: timestamp("current_period_start", {
    mode: "date",
  }).notNull(),
  currentPeriodEnd: timestamp("current_period_end", { mode: "date" }).notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  // Stripe-ready fields (nullable until Stripe integration)
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripePriceId: text("stripe_price_id"),
});

// Usage Ledger (append-only)
export const usageLedger = pgTable("usage_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  actorUserId: uuid("actor_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  eventType: ledgerEventTypeEnum("event_type").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  occurredAt: timestamp("occurred_at").defaultNow().notNull(),
  units: integer("units").default(0).notNull(),
  amountCents: integer("amount_cents").default(0).notNull(),
  currency: text("currency").default("USD").notNull(),
  metadata: jsonb("metadata").default({}),
});

// Types
export type OrgPlan = typeof orgPlans.$inferSelect;
export type NewOrgPlan = typeof orgPlans.$inferInsert;

export type OrgSubscription = typeof orgSubscriptions.$inferSelect;
export type NewOrgSubscription = typeof orgSubscriptions.$inferInsert;

export type UsageLedger = typeof usageLedger.$inferSelect;
export type NewUsageLedger = typeof usageLedger.$inferInsert;

// Import required tables
import { organizations } from "./organizations";
import { users } from "./users";
