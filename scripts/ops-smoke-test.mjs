#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log("🧪 M7 Operations Smoke Test");
console.log("============================\n");

async function testKillSwitch() {
  console.log("1️⃣ Testing Kill Switch...");

  try {
    // Test with ANALYSIS_DISABLED=true
    const { error } = await supabase.rpc("enqueue_analysis", {
      p_contract_id: "test-contract-id",
      p_org_id: "test-org-id",
    });

    if (error) {
      if (error.message.includes("temporarily disabled")) {
        console.log("✅ Kill switch working - analysis blocked");
      } else {
        console.log("❌ Unexpected error:", error.message);
      }
    } else {
      console.log("❌ Kill switch not working - analysis allowed");
    }
  } catch (error) {
    console.log("❌ Kill switch test failed:", error.message);
  }
}

async function testRateLimit() {
  console.log("\n2️⃣ Testing Rate Limit...");

  try {
    const testOrgId = "test-org-rate-limit";

    // First request should succeed
    const { data: first, error: firstError } = await supabase.rpc(
      "check_and_increment_daily_usage",
      {
        p_org_id: testOrgId,
        p_daily_limit: 1,
      },
    );

    if (firstError) {
      console.log("❌ First rate limit check failed:", firstError.message);
      return;
    }

    console.log("✅ First request allowed:", first[0]?.message);

    // Second request should be blocked
    const { data: second, error: secondError } = await supabase.rpc(
      "check_and_increment_daily_usage",
      {
        p_org_id: testOrgId,
        p_daily_limit: 1,
      },
    );

    if (secondError) {
      console.log("❌ Second rate limit check failed:", secondError.message);
    } else if (second && second[0]?.allowed === false) {
      console.log("✅ Rate limit working - second request blocked");
    } else {
      console.log("❌ Rate limit not working - second request allowed");
    }
  } catch (error) {
    console.log("❌ Rate limit test failed:", error.message);
  }
}

async function testBackpressure() {
  console.log("\n3️⃣ Testing Backpressure...");

  try {
    // Insert test queued analyses to simulate queue depth
    const testOrgId = "test-org-backpressure";

    for (let i = 0; i < 5; i++) {
      await supabase.from("analyses").insert({
        id: `test-analysis-${i}-${Date.now()}`,
        org_id: testOrgId,
        contract_id: `test-contract-${i}`,
        status: "queued",
        created_at: new Date(Date.now() - i * 60000).toISOString(), // Stagger by 1 minute
      });
    }

    // Check queue health
    const { data: analyses, error } = await supabase
      .from("analyses")
      .select("id, created_at")
      .eq("status", "queued")
      .eq("org_id", testOrgId)
      .order("created_at");

    if (error) {
      console.log("❌ Backpressure test failed:", error.message);
    } else {
      const depth = analyses?.length || 0;
      const oldestAge =
        analyses?.length > 0
          ? Math.floor(
              (Date.now() - new Date(analyses[0].created_at).getTime()) / 60000,
            )
          : 0;

      console.log(`✅ Queue depth: ${depth}, oldest age: ${oldestAge}min`);

      // Cleanup test data
      await supabase.from("analyses").delete().eq("org_id", testOrgId);
    }
  } catch (error) {
    console.log("❌ Backpressure test failed:", error.message);
  }
}

async function testCostGuardrails() {
  console.log("\n4️⃣ Testing Cost Guardrails...");

  try {
    const testAnalysisId = "test-analysis-cost-" + Date.now();

    // Test within limits
    const { data: withinLimits, error: limitsError } = await supabase.rpc(
      "validate_analysis_limits",
      {
        p_analysis_id: testAnalysisId,
        p_chunk_count: 10,
        p_char_count: 1000,
        p_tokens_in: 500,
        p_tokens_out: 300,
      },
    );

    if (limitsError) {
      console.log("❌ Cost guardrails test failed:", limitsError.message);
    } else if (withinLimits && withinLimits[0]?.allowed) {
      console.log("✅ Cost guardrails working - within limits");
    } else {
      console.log("❌ Cost guardrails not working:", withinLimits);
    }

    // Test exceeding limits
    const { data: exceededLimits, error: exceededError } = await supabase.rpc(
      "validate_analysis_limits",
      {
        p_analysis_id: testAnalysisId + "-exceeded",
        p_chunk_count: 100, // Exceeds default limit of 50
        p_char_count: 1000,
        p_tokens_in: 500,
        p_tokens_out: 300,
      },
    );

    if (exceededError) {
      console.log(
        "❌ Cost guardrails exceeded test failed:",
        exceededError.message,
      );
    } else if (exceededLimits && exceededLimits[0]?.truncated) {
      console.log("✅ Cost guardrails working - limits exceeded, truncated");
    } else {
      console.log("❌ Cost guardrails not truncating when exceeded");
    }
  } catch (error) {
    console.log("❌ Cost guardrails test failed:", error.message);
  }
}

async function cleanup() {
  console.log("\n🧹 Cleaning up test data...");

  try {
    // Clean up test usage records
    await supabase
      .from("org_usage_daily")
      .delete()
      .like("org_id", "test-org-%");

    // Clean up test analyses
    await supabase.from("analyses").delete().like("org_id", "test-org-%");

    console.log("✅ Cleanup completed");
  } catch (error) {
    console.log("❌ Cleanup failed:", error.message);
  }
}

async function runTests() {
  try {
    await testKillSwitch();
    await testRateLimit();
    await testBackpressure();
    await testCostGuardrails();
    await cleanup();

    console.log("\n🎉 All smoke tests completed!");
  } catch (error) {
    console.error("\n❌ Smoke test suite failed:", error);
    process.exit(1);
  }
}

runTests();
