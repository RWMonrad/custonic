// M6 Analysis Worker with Production Observability
// Processes queued analysis jobs with real AI extraction + structured logging

import { createClient } from "@supabase/supabase-js";

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// AI Configuration with Cost Caps
const AI_PROVIDER = process.env.AI_PROVIDER || "mock";
const AI_MODEL = process.env.AI_MODEL;
const MAX_CHUNKS = parseInt(process.env.AI_MAX_CHUNKS || "30");
const MAX_FINDINGS = parseInt(process.env.AI_MAX_FINDINGS || "40");
const MAX_TOKENS = parseInt(process.env.AI_MAX_TOKENS || "100000");

// Observability Configuration
const LOG_LEVEL = process.env.LOG_LEVEL || "info";
const ENABLE_STRUCTURED_LOGS = process.env.ENABLE_STRUCTURED_LOGS !== "false";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing Supabase service role configuration");
  console.error("Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Validate AI configuration
try {
  validateAnalysisConfig({
    provider: AI_PROVIDER,
    model: AI_MODEL,
  });
  console.log(
    `✅ AI Configuration: ${AI_PROVIDER}${AI_MODEL ? ` (${AI_MODEL})` : ""}`,
  );
} catch (error) {
  console.error("❌ Invalid AI configuration:", error.message);
  process.exit(1);
}

// Service role client for worker (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Structured Logging for Observability
function logStructured(level, message, metadata = {}) {
  if (!ENABLE_STRUCTURED_LOGS) {
    console.log(`[${level.toUpperCase()}] ${message}`);
    return;
  }

  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: "analysis-worker",
    version: "1.0.0",
    ...metadata,
  };

  console.log(JSON.stringify(logEntry));
}

function logInfo(message, metadata) {
  if (LOG_LEVEL === "debug" || LOG_LEVEL === "info") {
    logStructured("info", message, metadata);
  }
}

function logError(message, metadata) {
  logStructured("error", message, metadata);
}

function logDebug(message, metadata) {
  if (LOG_LEVEL === "debug") {
    logStructured("debug", message, metadata);
  }
}

// Process a single analysis job with AI pipeline + observability
async function processAnalysisJob(analysis) {
  const startTime = Date.now();
  const jobMetadata = {
    analysisId: analysis.analysis_id,
    orgId: analysis.org_id,
    contractId: analysis.contract_id,
    provider: AI_PROVIDER,
    model: AI_MODEL,
    retryCount: analysis.retry_count,
  };

  logInfo("Starting analysis job", jobMetadata);

  try {
    // Step 1: Fetch contract details
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("*")
      .eq("id", analysis.contract_id)
      .single();

    if (contractError || !contract) {
      throw new Error(`Contract not found: ${contractError?.message}`);
    }

    logDebug("Contract fetched", {
      ...jobMetadata,
      contractSize: contract.size_bytes,
    });

    // Step 2: Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("contracts")
      .download(contract.file_url);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    const fileBuffer = Buffer.from(await fileData.arrayBuffer());
    logDebug("File downloaded", {
      ...jobMetadata,
      fileSize: fileBuffer.length,
    });

    // Step 3: Check cost caps before processing
    if (fileBuffer.length > 10 * 1024 * 1024) {
      // 10MB limit
      throw new Error("File too large - exceeds 10MB limit");
    }

    // Step 4: Run AI analysis with cost controls
    const aiConfig = {
      provider: AI_PROVIDER,
      model: AI_MODEL,
      maxChunks: MAX_CHUNKS,
      maxFindings: MAX_FINDINGS,
      maxTokens: MAX_TOKENS,
    };

    const result = await orchestrateAnalysis(
      {
        analysisId: analysis.analysis_id,
        orgId: analysis.org_id,
        contractId: analysis.contract_id,
        mimeType: contract.mime_type,
      },
      fileBuffer,
      aiConfig,
    );

    const durationMs = Date.now() - startTime;

    // Step 5: Store findings with citations
    if (result.findings.length === 0) {
      logInfo("No findings generated - this may be expected", {
        ...jobMetadata,
        durationMs,
        chunkCount: result.chunksProcessed,
        truncated: result.truncated,
      });
    }

    // Delete existing findings (idempotency)
    await supabase
      .from("risk_findings")
      .delete()
      .eq("analysis_id", analysis.analysis_id);

    // Insert new findings
    const findingsToInsert = result.findings.map((finding) => ({
      org_id: analysis.org_id,
      contract_id: analysis.contract_id,
      analysis_id: analysis.analysis_id,
      title: finding.title,
      description: finding.description,
      severity: finding.severity,
      category: finding.category,
      confidence_score: finding.confidence,
      recommendation: finding.recommendation,
      citations: JSON.stringify(finding.citations || []),
    }));

    const { error: findingsError } = await supabase
      .from("risk_findings")
      .insert(findingsToInsert);

    if (findingsError) {
      throw new Error(`Failed to store findings: ${findingsError.message}`);
    }

    // Step 6: Update analysis with comprehensive metadata
    const analysisMetadata = {
      provider: AI_PROVIDER,
      model: AI_MODEL,
      promptVersion: "v1.0",
      truncated: result.truncated,
      charCount: result.charCount || 0,
      chunkCount: result.chunksProcessed,
      tokensIn: result.totalTokens,
      tokensOut: result.totalTokens, // Would need AI provider to return this
      costEstimate: estimateCost(AI_PROVIDER, result.totalTokens),
      durationMs,
      findingsCount: result.findings.length,
    };

    const { error: updateError } = await supabase
      .from("analyses")
      .update({
        status: "completed",
        confidence_score: Math.round(result.averageConfidence || 0),
        processing_time_ms: durationMs,
        finished_at: new Date().toISOString(),
        results: JSON.stringify(analysisMetadata),
        error_message: null,
      })
      .eq("id", analysis.analysis_id);

    if (updateError) {
      throw new Error(`Failed to update analysis: ${updateError.message}`);
    }

    // Step 7: Update contract status
    await supabase
      .from("contracts")
      .update({ status: "analyzed" })
      .eq("id", analysis.contract_id);

    logInfo("Analysis completed successfully", {
      ...jobMetadata,
      durationMs,
      findingsCount: result.findings.length,
      chunkCount: result.chunksProcessed,
      truncated: result.truncated,
      tokensUsed: result.totalTokens,
      costEstimate: analysisMetadata.costEstimate,
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error.message;

    logError("Analysis job failed", {
      ...jobMetadata,
      durationMs,
      error: errorMessage,
      errorType: error.constructor.name,
    });

    // Update analysis with error
    const retryCount = analysis.retry_count + 1;
    const finalStatus = retryCount >= 3 ? "failed" : "queued";

    await supabase
      .from("analyses")
      .update({
        status: finalStatus,
        retry_count: retryCount,
        error_message: errorMessage,
        finished_at: finalStatus === "failed" ? new Date().toISOString() : null,
      })
      .eq("id", analysis.analysis_id);

    // Update contract status if permanently failed
    if (finalStatus === "failed") {
      await supabase
        .from("contracts")
        .update({ status: "analysis_failed" })
        .eq("id", analysis.contract_id);
    }

    throw error; // Re-throw for main loop error handling
  }
}

// Cost estimation function
function estimateCost(provider, tokens) {
  const costs = {
    openai: { input: 0.005, output: 0.015 }, // per 1K tokens
    anthropic: { input: 0.003, output: 0.015 },
    mock: { input: 0, output: 0 },
  };

  const costPerToken = costs[provider] || costs.mock;
  // Assume 70% input, 30% output tokens
  const inputCost = ((tokens * 0.7) / 1000) * costPerToken.input;
  const outputCost = ((tokens * 0.3) / 1000) * costPerToken.output;

  return inputCost + outputCost;
}

// Main worker loop
async function workerLoop() {
  logInfo("Analysis worker starting", {
    provider: AI_PROVIDER,
    model: AI_MODEL,
    maxChunks: MAX_CHUNKS,
    maxFindings: MAX_FINDINGS,
    maxTokens: MAX_TOKENS,
  });

  while (true) {
    try {
      // Claim next available job using RPC
      const { data: claimedJob, error: claimError } = await supabase.rpc(
        "claim_next_analysis_job",
      );

      if (claimError) {
        logError("Failed to claim job", { error: claimError.message });
        await new Promise((resolve) => setTimeout(resolve, 5000));
        continue;
      }

      if (claimedJob && claimedJob.length > 0) {
        const job = claimedJob[0];
        logInfo("Job claimed", {
          analysisId: job.analysis_id,
          analysisType: job.analysis_type,
          retryCount: job.retry_count,
        });

        // Process the job
        await processAnalysisJob(job);

        // Small delay between jobs
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        // No jobs available, wait before polling again
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    } catch (error) {
      logError("Worker loop error", { error: error.message });
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  logInfo("Analysis worker shutting down gracefully", { signal: "SIGINT" });
  process.exit(0);
});

process.on("SIGTERM", () => {
  logInfo("Analysis worker shutting down gracefully", { signal: "SIGTERM" });
  process.exit(0);
});

// Start worker
workerLoop().catch((error) => {
  logError("Worker failed to start", { error: error.message });
  process.exit(1);
});
