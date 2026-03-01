"use server";

import { getCurrentOrgIdOrThrow } from "@/modules/auth/lib/current-org";
import { getContractById } from "@/modules/contracts/lib/contracts";
import { db } from "@/shared/db";
import { contracts } from "@/shared/db/schema";
import { analyses, analysisTypeEnum } from "@/shared/db/schema/analyses";
import { createClient } from "@supabase/supabase-js";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

const ANALYSIS_DISABLED = process.env.ANALYSIS_DISABLED === "true";
const MAX_ANALYSES_PER_ORG_PER_DAY = parseInt(
  process.env.MAX_ANALYSES_PER_ORG_PER_DAY || "10",
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
  if (ANALYSIS_DISABLED) {
    return { allowed: false, reason: "Analysis is currently disabled" };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Count analyses in last 24 hours for this org
  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: recentAnalyses, error } = await supabase
    .from("analyses")
    .select("id")
    .eq("org_id", orgId)
    .gte("created_at", twentyFourHoursAgo);

  if (error) {
    console.error("Rate limit check failed:", error);
    return { allowed: false, reason: "Unable to verify rate limit" };
  }

  const count = recentAnalyses?.length || 0;

  if (count >= MAX_ANALYSES_PER_ORG_PER_DAY) {
    return {
      allowed: false,
      reason: `Daily limit of ${MAX_ANALYSES_PER_ORG_PER_DAY} analyses reached. Try again tomorrow.`,
    };
  }

  return { allowed: true };
}

export async function enqueueAnalysisAction(
  prevState: EnqueueAnalysisState,
  formData: FormData,
): Promise<EnqueueAnalysisState> {
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

    // Get current organization
    const orgId = await getCurrentOrgIdOrThrow();

    // Check rate limits
    const rateLimitCheck = await checkRateLimit(orgId);
    if (!rateLimitCheck.allowed) {
      return {
        status: "error",
        message: rateLimitCheck.reason || "Analysis temporarily unavailable",
      };
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Check if contract exists and belongs to org
    const contract = await getContractById(contractId);

    if (!contract) {
      return {
        status: "error",
        message: "Contract not found",
      };
    }

    // Check if there's already a pending/processing analysis
    const existingAnalysis = await db
      .select({ id: analyses.id })
      .from(analyses)
      .where(
        and(
          eq(analyses.contract_id, validatedFields.data.contractId),
          eq(analyses.org_id, orgId),
          eq(analyses.type, validatedFields.data.analysisType),
          // Only check for active analyses
          eq(analyses.status, "queued"), // or processing
        ),
      )
      .limit(1);

    if (existingAnalysis.length > 0) {
      return {
        status: "error",
        message: "Analysis is already in progress",
      };
    }

    // Create new analysis record
    const analysisId = nanoid();
    await db.insert(analyses).values({
      id: analysisId,
      org_id: orgId,
      contract_id: validatedFields.data.contractId,
      type: validatedFields.data.analysisType,
      status: "queued",
      retry_count: 0,
    });

    // Update contract status to queued
    await db
      .update(contracts)
      .set({
        status: "queued",
        updated_at: new Date(),
      })
      .where(
        and(
          eq(contracts.id, validatedFields.data.contractId),
          eq(contracts.org_id, orgId),
        ),
      );

    // TODO: Add audit log entry
    // await insertAuditLog('ANALYSIS_QUEUED', analysisId, orgId, {
    //   contractId: validatedFields.data.contractId,
    //   analysisType: validatedFields.data.analysisType
    // })

    return {
      status: "success",
      message: "Analysis queued successfully",
      analysisId,
    };
  } catch (error) {
    console.error("Failed to enqueue analysis:", error);
    return {
      status: "error",
      message: "Failed to queue analysis",
    };
  }
}
