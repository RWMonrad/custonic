// M6 Analysis Worker with AI Pipeline
// Processes queued analysis jobs with real AI extraction

import { createClient } from "@supabase/supabase-js";

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// AI Configuration
const AI_PROVIDER = process.env.AI_PROVIDER || "mock";
const AI_MODEL = process.env.AI_MODEL;

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

// Process a single analysis job with AI pipeline
async function processAnalysisJob(analysis) {
  console.log(
    `🔄 Processing analysis ${analysis.analysis_id} for contract ${analysis.contract_id}`,
  );

  const startTime = Date.now();

  try {
    // Step 1: Fetch contract details
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("file_url, mime_type, size_bytes, org_id")
      .eq("id", analysis.contract_id)
      .single();

    if (contractError || !contract) {
      throw new Error(
        `Failed to fetch contract: ${contractError?.message || "Contract not found"}`,
      );
    }

    // Step 2: Download file from storage
    console.log(`📥 Downloading contract file: ${contract.file_url}`);
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("contracts")
      .download(contract.file_url);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    // Convert file to buffer
    const fileBuffer = Buffer.from(await fileData.arrayBuffer());
    const filename = contract.file_url.split("/").pop() || "contract";

    // Step 3: Run AI analysis orchestration
    console.log(`🤖 Starting AI analysis with ${AI_PROVIDER}`);
    const analysisResult = await orchestrateAnalysis(
      {
        id: analysis.analysis_id,
        orgId: analysis.org_id,
        contractId: analysis.contract_id,
        fileUrl: contract.file_url,
        mimeType: contract.mime_type,
        filename,
      },
      fileBuffer,
      {
        provider: AI_PROVIDER,
        model: AI_MODEL,
      },
    );

    if (!analysisResult.success) {
      throw new Error(`AI analysis failed: ${analysisResult.error}`);
    }

    // Step 4: Store findings in database
    console.log(`💾 Storing ${analysisResult.findings.length} risk findings`);
    const findingsToInsert = analysisResult.findings.map((finding) => ({
      id: crypto.randomUUID(),
      org_id: analysis.org_id,
      contract_id: analysis.contract_id,
      analysis_id: analysis.analysis_id,
      title: finding.title,
      description: finding.explanation,
      severity: finding.severity,
      category: "legal", // Default category, could be inferred from risk_type
      confidence_score: Math.round(finding.confidence * 100),
      recommendation: finding.recommended_review,
      // Store citations as JSON in description metadata or create separate table
      citations: finding.citations,
    }));

    // Delete existing findings for this analysis (idempotency)
    await supabase
      .from("risk_findings")
      .delete()
      .eq("analysis_id", analysis.analysis_id);

    // Insert new findings
    const { error: findingsError } = await supabase
      .from("risk_findings")
      .insert(findingsToInsert);

    if (findingsError) {
      throw new Error(`Failed to store findings: ${findingsError.message}`);
    }

    // Step 5: Update analysis status to completed
    const processingTimeMs = Date.now() - startTime;
    const { error: updateError } = await supabase
      .from("analyses")
      .update({
        status: "completed",
        finished_at: new Date().toISOString(),
        processing_time_ms: processingTimeMs,
        confidence_score: Math.round(
          (analysisResult.findings.reduce((sum, f) => sum + f.confidence, 0) /
            analysisResult.findings.length) *
            100,
        ),
        results: JSON.stringify({
          findingsCount: analysisResult.findings.length,
          severityBreakdown: analysisResult.findings.reduce((acc, f) => {
            acc[f.severity] = (acc[f.severity] || 0) + 1;
            return acc;
          }, {}),
          processingTimeMs,
          ...analysisResult.metadata,
        }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", analysis.analysis_id);

    if (updateError) {
      throw new Error(`Failed to update analysis: ${updateError.message}`);
    }

    // Step 6: Update contract status to completed
    const { error: contractError2 } = await supabase
      .from("contracts")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", analysis.contract_id);

    if (contractError2) {
      throw new Error(`Failed to update contract: ${contractError2.message}`);
    }

    // TODO: Add audit log entries
    // await insertAuditLog('ANALYSIS_STARTED', analysis.analysis_id, analysis.org_id)
    // await insertAuditLog('ANALYSIS_COMPLETED', analysis.analysis_id, analysis.org_id)

    console.log(`✅ Analysis ${analysis.analysis_id} completed successfully`);
    console.log(
      `   📊 Generated ${analysisResult.findings.length} risk findings`,
    );
    console.log(`   ⏱️  Total processing time: ${processingTimeMs}ms`);
    console.log(`   🤖 AI Provider: ${analysisResult.metadata.provider}`);
  } catch (error) {
    console.error(`❌ Analysis ${analysis.analysis_id} failed:`, error.message);

    // Mark analysis as failed
    await supabase
      .from("analyses")
      .update({
        status: "failed",
        error_message: error.message,
        finished_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", analysis.analysis_id);

    // Update contract status to failed
    await supabase
      .from("contracts")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", analysis.contract_id);

    // TODO: Add audit log entry
    // await insertAuditLog('ANALYSIS_FAILED', analysis.analysis_id, analysis.org_id, { error: error.message })
  }
}

// Main worker loop
async function workerLoop() {
  console.log("🚀 Analysis Worker Starting...");
  console.log("🔄 Polling for queued analysis jobs...");

  while (true) {
    try {
      // Claim next available job using RPC
      const { data: claimedJob, error: claimError } = await supabase.rpc(
        "claim_next_analysis_job",
      );

      if (claimError) {
        console.error("❌ Failed to claim job:", claimError.message);
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5s on error
        continue;
      }

      if (claimedJob && claimedJob.length > 0) {
        const job = claimedJob[0];
        console.log(
          `📋 Claimed job: ${job.analysis_id} (${job.analysis_type})`,
        );

        // Process the job
        await processAnalysisJob(job);

        // Small delay between jobs
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        // No jobs available, wait before polling again
        await new Promise((resolve) => setTimeout(resolve, 3000)); // 3s poll interval
      }
    } catch (error) {
      console.error("❌ Worker error:", error.message);
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5s on error
    }
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Analysis Worker shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Analysis Worker shutting down gracefully...");
  process.exit(0);
});

// Start worker
workerLoop().catch((error) => {
  console.error("❌ Worker failed to start:", error);
  process.exit(1);
});
