// M6 Production Test Hooks - Fixture Analysis Runner
// Tests the complete AI pipeline with synthetic contracts

import { createClient } from "@supabase/supabase-js";
import { spawn } from "child_process";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const AI_PROVIDER = process.env.AI_PROVIDER || "mock";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing Supabase configuration");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Test contract fixtures (synthetic, not real contracts)
const FIXTURES = {
  "sample-contract.pdf": {
    path: "./scripts/fixtures/sample-contract.pdf",
    mimeType: "application/pdf",
    description: "Sample contract with various risk clauses",
  },
  "sample-contract.docx": {
    path: "./scripts/fixtures/sample-contract.docx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    description: "Sample DOCX contract with headings and tables",
  },
  "scanned.pdf": {
    path: "./scripts/fixtures/scanned.pdf",
    mimeType: "application/pdf",
    description: "Scanned PDF with no extractable text (should fail)",
  },
};

// Test organization and user
const TEST_ORG = {
  name: "M6 Test Organization",
  id: null, // Will be set after creation
};

const TEST_USER = {
  email: "m6-test@example.com",
  id: null, // Will be set after creation
};

async function setupTestEnvironment() {
  console.log("🔧 Setting up test environment...");

  try {
    // Create test organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: TEST_ORG.name })
      .select()
      .single();

    if (orgError) throw orgError;
    TEST_ORG.id = org.id;
    console.log(`✅ Created test organization: ${TEST_ORG.id}`);

    // Create or get test user
    const { data: user, error: userError } =
      await supabase.auth.admin.createUser({
        email: TEST_USER.email,
        password: "test-password-123",
        email_confirm: true,
      });

    if (userError && !userError.message.includes("already registered")) {
      throw userError;
    }

    TEST_USER.id = user.user?.id || "existing-user-id";
    console.log(`✅ Test user ready: ${TEST_USER.email}`);

    // Link user to organization
    await supabase.from("org_members").upsert({
      org_id: TEST_ORG.id,
      user_id: TEST_USER.id,
      role: "admin",
    });

    console.log("✅ User linked to organization");
  } catch (error) {
    console.error("❌ Failed to setup test environment:", error.message);
    throw error;
  }
}

async function uploadFixture(fixtureName, fixture) {
  console.log(`📤 Uploading fixture: ${fixtureName}`);

  try {
    const fileBuffer = readFileSync(join(__dirname, fixture.path));
    const storagePath = `${TEST_ORG.id}/${fixtureName}`;

    const { data, error } = await supabase.storage
      .from("contracts")
      .upload(storagePath, fileBuffer, {
        contentType: fixture.mimeType,
        upsert: true,
      });

    if (error) throw error;

    console.log(`✅ Uploaded ${fixtureName} to storage`);

    return {
      storagePath,
      publicUrl: data.path,
    };
  } catch (error) {
    console.error(`❌ Failed to upload ${fixtureName}:`, error.message);
    throw error;
  }
}

async function createContract(fixtureName, fixture, storageInfo) {
  console.log(`📄 Creating contract record for ${fixtureName}`);

  try {
    const { data, error } = await supabase
      .from("contracts")
      .insert({
        org_id: TEST_ORG.id,
        title: `Test Contract - ${fixtureName}`,
        file_url: storageInfo.storagePath,
        mime_type: fixture.mimeType,
        size_bytes: statSync(join(__dirname, fixture.path)).size,
        status: "active",
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Created contract: ${data.id}`);
    return data;
  } catch (error) {
    console.error(`❌ Failed to create contract:`, error.message);
    throw error;
  }
}

async function enqueueAnalysis(contract) {
  console.log(`🚀 Enqueuing analysis for contract ${contract.id}`);

  try {
    const { data, error } = await supabase
      .from("analyses")
      .insert({
        org_id: TEST_ORG.id,
        contract_id: contract.id,
        type: "risk_assessment",
        status: "queued",
        retry_count: 0,
      })
      .select()
      .single();

    if (error) throw error;

    // Update contract status
    await supabase
      .from("contracts")
      .update({ status: "queued" })
      .eq("id", contract.id);

    console.log(`✅ Enqueued analysis: ${data.id}`);
    return data;
  } catch (error) {
    console.error(`❌ Failed to enqueue analysis:`, error.message);
    throw error;
  }
}

async function runWorkerOnce() {
  console.log(`🤖 Running analysis worker (${AI_PROVIDER} provider)...`);

  return new Promise((resolve, reject) => {
    const worker = spawn("node", ["scripts/analysis-worker.mjs"], {
      env: { ...process.env, AI_PROVIDER },
      stdio: "pipe",
    });

    let output = "";
    let errorOutput = "";

    worker.stdout.on("data", (data) => {
      output += data.toString();
      process.stdout.write(data);
    });

    worker.stderr.on("data", (data) => {
      errorOutput += data.toString();
      process.stderr.write(data);
    });

    // Kill worker after it processes one job or times out
    const timeout = setTimeout(() => {
      worker.kill("SIGTERM");
      resolve({ output, errorOutput, timedOut: true });
    }, 30000); // 30 second timeout

    worker.on("close", (code) => {
      clearTimeout(timeout);
      resolve({
        output,
        errorOutput,
        exitCode: code,
        timedOut: false,
      });
    });

    worker.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

async function verifyResults(analysis) {
  console.log(`🔍 Verifying analysis results for ${analysis.id}`);

  try {
    // Wait a moment for database to settle
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Get updated analysis
    const { data: updatedAnalysis, error: analysisError } = await supabase
      .from("analyses")
      .select("*")
      .eq("id", analysis.id)
      .single();

    if (analysisError) throw analysisError;

    console.log(`📊 Analysis status: ${updatedAnalysis.status}`);

    if (updatedAnalysis.status === "failed") {
      console.log(`❌ Analysis failed: ${updatedAnalysis.error_message}`);
      return { success: false, error: updatedAnalysis.error_message };
    }

    if (updatedAnalysis.status !== "completed") {
      console.log(`⏳ Analysis not completed yet: ${updatedAnalysis.status}`);
      return { success: false, error: "Analysis did not complete" };
    }

    // Get findings
    const { data: findings, error: findingsError } = await supabase
      .from("risk_findings")
      .select("*")
      .eq("analysis_id", analysis.id);

    if (findingsError) throw findingsError;

    console.log(`📋 Found ${findings.length} risk findings`);

    if (findings.length === 0) {
      console.log(
        `⚠️ No findings generated - this might be expected for simple contracts`,
      );
    }

    // Verify citations
    let findingsWithCitations = 0;
    for (const finding of findings) {
      const citations = finding.citations || [];
      if (citations.length > 0) {
        findingsWithCitations++;
      }
    }

    console.log(
      `📎 ${findingsWithCitations}/${findings.length} findings have citations`,
    );

    // Verify metadata
    if (updatedAnalysis.results) {
      try {
        const metadata = JSON.parse(updatedAnalysis.results);
        console.log(`📈 Analysis metadata:`, {
          provider: metadata.provider,
          model: metadata.model,
          promptVersion: metadata.promptVersion,
          truncated: metadata.truncated,
          chunksProcessed: metadata.chunksProcessed,
        });
      } catch {
        console.log(`⚠️ Could not parse analysis metadata`);
      }
    }

    return {
      success: true,
      analysis: updatedAnalysis,
      findings,
      findingsWithCitations,
    };
  } catch (error) {
    console.error(`❌ Failed to verify results:`, error.message);
    return { success: false, error: error.message };
  }
}

async function cleanupTestEnvironment() {
  console.log("🧹 Cleaning up test environment...");

  try {
    // Delete findings (cascade will handle this)
    // Delete analyses
    await supabase.from("analyses").delete().eq("org_id", TEST_ORG.id);

    // Delete contracts
    await supabase.from("contracts").delete().eq("org_id", TEST_ORG.id);

    // Delete organization members
    await supabase.from("org_members").delete().eq("org_id", TEST_ORG.id);

    // Delete organization
    await supabase.from("organizations").delete().eq("id", TEST_ORG.id);

    // Delete storage files
    const { data: files } = await supabase.storage
      .from("contracts")
      .list(TEST_ORG.id);

    if (files && files.length > 0) {
      const filePaths = files.map((file) => `${TEST_ORG.id}/${file.name}`);
      await supabase.storage.from("contracts").remove(filePaths);
    }

    console.log("✅ Test environment cleaned up");
  } catch (error) {
    console.error("❌ Cleanup warning:", error.message);
  }
}

async function runFixtureTest(fixtureName, fixture) {
  console.log(`\n🧪 Testing fixture: ${fixtureName}`);
  console.log(`📝 ${fixture.description}`);

  try {
    // Upload fixture
    const storageInfo = await uploadFixture(fixtureName, fixture);

    // Create contract
    const contract = await createContract(fixtureName, fixture, storageInfo);

    // Enqueue analysis
    const analysis = await enqueueAnalysis(contract);

    // Run worker
    await runWorkerOnce();

    // Verify results
    const verification = await verifyResults(analysis);

    // Report results
    console.log(`\n📊 Test Results for ${fixtureName}:`);
    console.log(`   Status: ${verification.success ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`   Analysis: ${verification.analysis?.status || "Unknown"}`);
    console.log(`   Findings: ${verification.findings?.length || 0}`);
    console.log(`   Citations: ${verification.findingsWithCitations || 0}`);

    if (!verification.success) {
      console.log(`   Error: ${verification.error}`);
    }

    return verification;
  } catch (error) {
    console.error(`❌ Test failed for ${fixtureName}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Main test runner
async function main() {
  console.log("🚀 M6 Production Test Runner");
  console.log(`🤖 AI Provider: ${AI_PROVIDER}`);
  console.log("=".repeat(50));

  const results = [];

  try {
    // Setup test environment
    await setupTestEnvironment();

    // Test each fixture
    for (const [fixtureName, fixture] of Object.entries(FIXTURES)) {
      const result = await runFixtureTest(fixtureName, fixture);
      results.push({ fixture: fixtureName, ...result });
    }

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("📊 TEST SUMMARY");
    console.log("=".repeat(50));

    const passed = results.filter((r) => r.success).length;
    const total = results.length;

    console.log(`Overall: ${passed}/${total} tests passed`);

    for (const result of results) {
      const status = result.success ? "✅" : "❌";
      console.log(`${status} ${result.fixture}: ${result.error || "Success"}`);
    }

    if (passed === total) {
      console.log("\n🎉 All tests passed! M6 pipeline is working correctly.");
    } else {
      console.log(
        `\n⚠️ ${total - passed} test(s) failed. Check the logs above.`,
      );
    }
  } catch (error) {
    console.error("❌ Test runner failed:", error.message);
  } finally {
    // Cleanup
    await cleanupTestEnvironment();
    console.log("\n🏁 Test runner finished");
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Test runner interrupted");
  cleanupTestEnvironment().then(() => process.exit(0));
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Test runner terminated");
  cleanupTestEnvironment().then(() => process.exit(0));
});

// Run tests
main().catch((error) => {
  console.error("💥 Fatal error:", error);
  process.exit(1);
});
