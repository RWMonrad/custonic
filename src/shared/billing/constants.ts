/**
 * M7.1 Billing Constants - USD=1 Contract
 * 
 * Simplified billing where:
 * - currency = USD (fixed)
 * - 1 unit per completed analysis
 * - Revenue comes from plan subscriptions, not per-analysis billing
 */

export const BILLING_CURRENCY = 'USD' as const;

// "USD=1": 1 unit per completed analysis
export const ANALYSIS_UNITS_PER_COMPLETION = 1 as const;

// Safety knobs (can be overridden by env vars if needed)
export const DEFAULT_DAILY_ANALYSIS_LIMIT = 20;
export const DEFAULT_MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

// Default plan limits (fallback if database not available)
export const DEFAULT_PLAN_LIMITS = {
  free: {
    monthly_price_cents: 0,
    included_analyses: 10,
    included_contracts: 50,
    max_file_size_bytes: 10 * 1024 * 1024, // 10MB
    max_queue_depth: 50,
  },
  pro: {
    monthly_price_cents: 2900, // $29
    included_analyses: 200,
    included_contracts: 2000,
    max_file_size_bytes: 20 * 1024 * 1024, // 20MB
    max_queue_depth: 200,
  },
  business: {
    monthly_price_cents: 9900, // $99
    included_analyses: 1000,
    included_contracts: 10000,
    max_file_size_bytes: 50 * 1024 * 1024, // 50MB
    max_queue_depth: 500,
  },
} as const;

// Event types for ledger
export const BILLING_EVENTS = {
  CONTRACT_UPLOADED: 'CONTRACT_UPLOADED',
  ANALYSIS_QUEUED: 'ANALYSIS_QUEUED',
  ANALYSIS_COMPLETED: 'ANALYSIS_COMPLETED',
  ANALYSIS_FAILED: 'ANALYSIS_FAILED',
  SIGNED_DOWNLOAD: 'SIGNED_DOWNLOAD',
} as const;

// Units per event type (USD=1 contract)
export const UNITS_PER_EVENT = {
  [BILLING_EVENTS.CONTRACT_UPLOADED]: 0, // Optional: change to 1 if you want to bill uploads
  [BILLING_EVENTS.ANALYSIS_QUEUED]: 0,
  [BILLING_EVENTS.ANALYSIS_COMPLETED]: 1, // USD=1: 1 unit per completion
  [BILLING_EVENTS.ANALYSIS_FAILED]: 0,
  [BILLING_EVENTS.SIGNED_DOWNLOAD]: 0,
} as const;
