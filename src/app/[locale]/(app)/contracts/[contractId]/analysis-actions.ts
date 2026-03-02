"use server";

import { checkBackpressure } from "@/modules/analysis/lib/backpressure";
import { checkKillSwitch } from "@/modules/analysis/lib/kill-switch";
import { AnalysisLogger } from "@/modules/analysis/lib/safe-logging";
import { getCurrentOrgIdOrThrow } from "@/modules/auth/lib/current-org";
import { billingHooks } from "@/modules/billing/lib/billing-hooks-clean";
import { getContractById } from "@/modules/contracts/lib/contracts";
import { BILLING_EVENTS } from "@/shared/billing/constants";
import { db } from "@/shared/db";
import { analyses, analysisTypeEnum } from "@/shared/db/schema/analyses";
import { createClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";
import { z } from "zod";

const ORG_DAILY_ANALYSIS_LIMIT = parseInt(
  process.env.ORG_DAILY_ANALYSIS_LIMIT || "20",
);

const enqueueAnalysisSchema = z.object({
  contractId: z.string().uuid("Invalid contract ID"),
  analysisType: z.enum(analysisTypeEnum.enumValues).default("risk_assessment"),
});

export type EnqueueAnalysisState = {
  status: "idle" | "error" | "success";
  message?: string;
  analysisId?: string;
};

export const initialEnqueueAnalysisState: EnqueueAnalysisState = {
  status: "idle",
};

// Rate limiting check
async function checkRateLimit(
  orgId: string,
): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Use the new RPC function for atomic rate limiting
  const { data, error } = await supabase.rpc(
    "check_and_increment_daily_usage",
    {
      p_org_id: orgId,
      p_daily_limit: ORG_DAILY_ANALYSIS_LIMIT,
    },
  );

  if (error) {
    console.error("Rate limit check failed:", error);
    return { allowed: false, reason: "Unable to verify rate limit" };
  }

  const result = data?.[0];
  if (!result?.allowed) {
    return { allowed: false, reason: result?.message || "Rate limit exceeded" };
  }

  return { allowed: true };
}

export async function enqueueAnalysisAction(
  prevState: EnqueueAnalysisState,
  formData: FormData,
): Promise<EnqueueAnalysisState> {
  const startTime = Date.now();

  try {
    // Parse and validate form data
    const validatedFields = enqueueAnalysisSchema.safeParse({
      contractId: formData.get("contractId"),
      analysisType: formData.get("analysisType"),
    });

    if (!validatedFields.success) {
      return {
        status: "error",
        message: "Invalid form data",
      };
    }

    const { contractId, analysisType } = validatedFields.data;

    // Get current org and contract
    const orgId = await getCurrentOrgIdOrThrow();
    const contract = await getContractById(contractId);

    if (!contract) {
      return {
        status: "error",
        message: "Contract not found",
      };
    }

    // A) Kill Switch Check
    const killSwitch = checkKillSwitch();
    if (!killSwitch.enabled) {
      AnalysisLogger.log({
        analysisId: "blocked",
        orgId,
        provider: "none",
        duration: Date.now() - startTime,
        chunkCount: 0,
        truncated: false,
        status: "blocked",
        errorMessage: killSwitch.message || undefined,
      });

      return {
        status: "error",
        message: killSwitch.message || undefined,
      };
    }

    // B) Rate Limiting Check
    const rateLimit = await checkRateLimit(orgId);
    if (!rateLimit.allowed) {
      AnalysisLogger.log({
        analysisId: "blocked",
        orgId,
        provider: "none",
        duration: Date.now() - startTime,
        chunkCount: 0,
        truncated: false,
        status: "blocked",
        errorMessage: rateLimit.reason || undefined,
      });

      return {
        status: "error",
        message: rateLimit.reason,
      };
    }

    // D) Billing Plan Limits Check
    const billingCheck = await billingHooks.canEnqueueAnalysis(orgId);
    if (!billingCheck.allowed) {
      AnalysisLogger.log({
        analysisId: "blocked",
        orgId,
        provider: "none",
        duration: Date.now() - startTime,
        chunkCount: 0,
        truncated: false,
        status: "blocked",
        errorMessage: billingCheck.message,
      });

      return {
        status: "error",
        message: billingCheck.message,
      };
    }

    // C) Backpressure Check
    const backpressure = await checkBackpressure(orgId);
    if (!backpressure.allowed) {
      AnalysisLogger.log({
        analysisId: "blocked",
        orgId,
        provider: "none",
        duration: Date.now() - startTime,
        chunkCount: 0,
        truncated: false,
        status: "blocked",
        errorMessage: backpressure.message || undefined,
      });

      return {
        status: "error",
        message: backpressure.message,
      };
    }

    // Create analysis record
    const analysisId = nanoid();
    await db.insert(analyses).values({
      id: analysisId,
      org_id: orgId,
      contract_id: contractId,
      type: analysisType,
      status: "queued",
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Record billing ledger entry for analysis queued (USD=1: units=0 for queue)
    await billingHooks.recordUsage(
      orgId,
      BILLING_EVENTS.ANALYSIS_QUEUED,
      "analysis",
      analysisId,
      {
        analysis_type: analysisType,
        contract_id: contractId,
      },
      undefined, // System action, no actor
    );

    AnalysisLogger.log({
      analysisId,
      orgId,
      provider: "queued",
      duration: Date.now() - startTime,
      chunkCount: 0,
      truncated: false,
      status: "queued",
    });

    return {
      status: "success",
      message: "Analysis queued successfully",
      analysisId,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    AnalysisLogger.log({
      analysisId: "error",
      orgId: "unknown",
      provider: "none",
      duration,
      chunkCount: 0,
      truncated: false,
      status: "error",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    console.error("Failed to enqueue analysis:", error);
    return {
      status: "error",
      message: "Failed to enqueue analysis",
    };
  }
}
