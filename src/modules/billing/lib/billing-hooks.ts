import {
    BILLING_CURRENCY,
    BILLING_EVENTS,
    UNITS_PER_EVENT
} from "@/shared/billing/constants";
import { NewUsageLedger } from "@/shared/db/schema/billing";
import { createClient } from "@supabase/supabase-js";

// Cost calculation constants (can be moved to env vars later)
export const AI_PROVIDER_RATES = {
  mock: {
    base_cost_cents: 0,
    per_chunk_cents: 0,
    per_1k_tokens_cents: 0,
  },
  openai: {
    base_cost_cents: 50, // $0.50 base per analysis
    per_chunk_cents: 2, // $0.02 per chunk
    per_1k_tokens_cents: 20, // $0.20 per 1k tokens
  },
  anthropic: {
    base_cost_cents: 75, // $0.75 base per analysis
    per_chunk_cents: 3, // $0.03 per chunk
    per_1k_tokens_cents: 25, // $0.25 per 1k tokens
  },
} as const;

export interface BillingMetadata {
  chunk_count?: number;
  tokens_in?: number;
  tokens_out?: number;
  provider?: string;
  model?: string;
  file_size_bytes?: number;
  mime_type?: string;
  truncated?: boolean;
  retry_count?: number;
  error_message?: string;
  processing_time_ms?: number;
  analysis_type?: string;
  contract_id?: string;
}

export class BillingHooks {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  /**
   * Record a usage ledger entry (USD=1 contract)
   */
  async recordUsage(
    orgId: string,
    eventType: (typeof BILLING_EVENTS)[keyof typeof BILLING_EVENTS],
    entityType: string,
    entityId: string,
    metadata: BillingMetadata = {},
    actorUserId?: string,
  ): Promise<void> {
    // USD=1: Use predefined units per event type
    const units = UNITS_PER_EVENT[eventType] || 0;

    const entry: NewUsageLedger = {
      orgId,
      actorUserId,
      eventType,
      entityType,
      entityId,
      units,
      amountCents: 0, // Revenue comes from subscriptions, not per-analysis
      currency: BILLING_CURRENCY,
      metadata,
    };

    const { error } = await this.supabase.from("usage_ledger").insert(entry);

    if (error) {
      console.error("Failed to record usage:", error);
      throw new Error(`Billing record failed: ${error.message}`);
    }
  }

  /**
   * Calculate analysis cost based on usage
   */
  calculateAnalysisCost(metadata: BillingMetadata): {
    units: number;
    amountCents: number;
  } {
    const provider = metadata.provider || "mock";
    const rates =
      AI_PROVIDER_RATES[provider as keyof typeof AI_PROVIDER_RATES] ||
      AI_PROVIDER_RATES.mock;

    // Base units = 1 per analysis
    let units = 1;
    let amountCents = rates.base_cost_cents;

    // Additional units based on chunk count
    if (metadata.chunk_count && metadata.chunk_count > 10) {
      const extraChunks = Math.ceil((metadata.chunk_count - 10) / 10);
      units += extraChunks;
      amountCents += extraChunks * rates.per_chunk_cents;
    }

    // Token-based cost
    const totalTokens = (metadata.tokens_in || 0) + (metadata.tokens_out || 0);
    if (totalTokens > 0) {
      const tokenCost =
        Math.ceil(totalTokens / 1000) * rates.per_1k_tokens_cents;
      amountCents += tokenCost;
    }

    return { units, amountCents };
  }

  /**
   * Check if organization can enqueue analysis
   * Simple enforcement: count ANALYSIS_COMPLETED in current period
   */
  async canEnqueueAnalysis(orgId: string): Promise<{
    allowed: boolean;
    currentUsage: number;
    includedLimit: number;
    remaining: number;
    message: string;
  }> {
    const { data, error } = await this.supabase.rpc("can_enqueue_analysis", {
      p_org_id: orgId,
    });

    if (error) {
      console.error("Failed to check enqueue limits:", error);
      // Fail open - allow but log
      return {
        allowed: true,
        currentUsage: 0,
        includedLimit: 0,
        remaining: 0,
        message: "Unable to verify limits - proceeding",
      };
    }

    const result = data?.[0];
    if (!result) {
      return {
        allowed: false,
        currentUsage: 0,
        includedLimit: 0,
        remaining: 0,
        message: "No subscription found",
      };
    }

    return result;
  }

  /**
   * Get current subscription for organization
   */
  async getCurrentSubscription(orgId: string): Promise<{
    planKey: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    includedAnalyses: number;
    maxFileSizeBytes: number;
  } | null> {
    const { data, error } = await this.supabase.rpc(
      "get_current_subscription",
      {
        p_org_id: orgId,
      },
    );

    if (error) {
      console.error("Failed to get current subscription:", error);
      return null;
    }

    return data?.[0] || null;
  }

  /**
   * Get usage for current period (USD=1: count completed analyses)
   */
  async getCurrentPeriodUsage(
    orgId: string,
    eventType: (typeof BILLING_EVENTS)[keyof typeof BILLING_EVENTS] = BILLING_EVENTS.ANALYSIS_COMPLETED,
  ): Promise<number> {
    const { data, error } = await this.supabase.rpc(
      "get_current_period_usage",
      {
        p_org_id: orgId,
        p_event_type: eventType,
      },
    );

    if (error) {
      console.error("Failed to get current period usage:", error);
      return 0;
    }

    return data || 0;
  }

  /**
   * Check file size against plan limits
   */
  async checkFileSizeLimit(
    orgId: string,
    fileSizeBytes: number,
  ): Promise<{
    allowed: boolean;
    maxSizeBytes: number;
    message: string;
  }> {
    const subscription = await this.getCurrentSubscription(orgId);

    if (!subscription) {
      return {
        allowed: false,
        maxSizeBytes: 0,
        message: "No active subscription found",
      };
    }

    const allowed = fileSizeBytes <= subscription.maxFileSizeBytes;

    return {
      allowed,
      maxSizeBytes: subscription.maxFileSizeBytes,
      message: allowed
        ? "File size within limits"
        : `File size exceeds limit of ${Math.round(subscription.maxFileSizeBytes / 1024 / 1024)}MB`,
    };
  }

  /**
   * Record analysis completion (USD=1: 1 unit)
   */
  async recordAnalysisCompleted(
    orgId: string,
    analysisId: string,
    metadata: BillingMetadata,
  ): Promise<void> {
    await this.recordUsage(
      orgId,
      BILLING_EVENTS.ANALYSIS_COMPLETED,
      "analysis",
      analysisId,
      metadata,
      undefined, // System action, no actor
    );
  }

  /**
   * Record analysis failure
   */
  async recordAnalysisFailed(
    orgId: string,
    analysisId: string,
    metadata: BillingMetadata,
  ): Promise<void> {
    await this.recordUsage(
      orgId,
      BILLING_EVENTS.ANALYSIS_FAILED,
      "analysis",
      analysisId,
      metadata,
      undefined, // System action, no actor
    );
  }
}

// Singleton instance
export const billingHooks = new BillingHooks();
