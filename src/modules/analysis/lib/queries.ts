import { db } from "@/shared/db";
import { analyses, riskFindings } from "@/shared/db/schema";
import { and, desc, eq } from "drizzle-orm";

export interface AnalysisWithFindings {
  id: string;
  orgId: string;
  contractId: string;
  type: string;
  status: string;
  confidenceScore?: number;
  processingTimeMs?: number;
  errorMessage?: string;
  retryCount: number;
  startedAt?: Date;
  finishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  results?: string; // JSON metadata
  findings: Array<{
    id: string;
    title: string;
    description: string;
    severity: string;
    category: string;
    confidenceScore: number;
    recommendation: string;
    citations: Array<{
      excerpt: string;
      chunkIndex: number;
      startHint?: string;
      endHint?: string;
    }>;
    createdAt: Date;
  }>;
}

export async function getLatestAnalysisForContract(
  contractId: string,
  orgId: string,
): Promise<AnalysisWithFindings | null> {
  // Get latest analysis for this contract
  const latestAnalysis = await db
    .select({
      id: analyses.id,
      orgId: analyses.org_id,
      contractId: analyses.contract_id,
      type: analyses.type,
      status: analyses.status,
      confidenceScore: analyses.confidence_score,
      processingTimeMs: analyses.processing_time_ms,
      errorMessage: analyses.error_message,
      retryCount: analyses.retry_count,
      startedAt: analyses.started_at,
      finishedAt: analyses.finished_at,
      createdAt: analyses.created_at,
      updatedAt: analyses.updated_at,
      results: analyses.results,
    })
    .from(analyses)
    .where(
      and(eq(analyses.contract_id, contractId), eq(analyses.org_id, orgId)),
    )
    .orderBy(desc(analyses.created_at))
    .limit(1);

  if (latestAnalysis.length === 0) {
    return null;
  }

  const analysis = latestAnalysis[0];

  // Get findings for this analysis
  const findings = await db
    .select({
      id: riskFindings.id,
      title: riskFindings.title,
      description: riskFindings.description,
      severity: riskFindings.severity,
      category: riskFindings.category,
      confidenceScore: riskFindings.confidence_score,
      recommendation: riskFindings.recommendation,
      citations: riskFindings.citations,
      createdAt: riskFindings.created_at,
    })
    .from(riskFindings)
    .where(eq(riskFindings.analysis_id, analysis.id))
    .orderBy(desc(riskFindings.severity), desc(riskFindings.confidence_score));

  return {
    id: analysis.id,
    orgId: analysis.orgId,
    contractId: analysis.contractId || "",
    type: analysis.type,
    status: analysis.status || "",
    confidenceScore: analysis.confidenceScore || undefined,
    processingTimeMs: analysis.processingTimeMs || undefined,
    errorMessage: analysis.errorMessage || undefined,
    retryCount: analysis.retryCount || 0,
    startedAt: analysis.startedAt || undefined,
    finishedAt: analysis.finishedAt || undefined,
    createdAt: analysis.createdAt || new Date(),
    updatedAt: analysis.updatedAt || new Date(),
    results: analysis.results || undefined,
    findings: findings.map((f) => ({
      ...f,
      citations: f.citations ? JSON.parse(f.citations) : [],
      confidenceScore: f.confidenceScore || 0,
      recommendation: f.recommendation || "",
      createdAt: f.createdAt || new Date(),
    })),
  };
}

export interface AnalysisMetadata {
  provider?: string;
  model?: string;
  promptVersion?: string;
  truncated?: boolean;
  charCount?: number;
  chunkCount?: number;
  tokensIn?: number;
  tokensOut?: number;
  costEstimate?: number;
}

export function parseAnalysisMetadata(
  results: string | null,
): AnalysisMetadata {
  if (!results) return {};

  try {
    const parsed = JSON.parse(results);
    return {
      provider: parsed.provider,
      model: parsed.model,
      promptVersion: parsed.promptVersion,
      truncated: parsed.truncated,
      charCount: parsed.charCount,
      chunkCount: parsed.chunksProcessed,
      tokensIn: parsed.totalTokens,
      tokensOut: parsed.tokensOut,
      costEstimate: parsed.costEstimate,
    };
  } catch {
    return {};
  }
}
